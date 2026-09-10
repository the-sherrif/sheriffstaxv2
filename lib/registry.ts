import { InputError, normalizeHandle, validateOrders, deputyNumber } from './validation.ts';
import { campaign } from '../config/campaign.ts';

export type DB = Pick<D1Database, 'prepare' | 'batch'>;
export type Application = { id:string; session_hash:string; handle:string; warrant_url:string|null; warrant_number:string; rules_version:number; referred_by:number|null; follow:number; like:number; spread_mode:'quote'|'repost'; spread_url:string; reply_url:string; created_at:string; recovery_hash:string|null };
export type Warrant = { postUrl:string; number:string; rulesVersion:number };
export type PublicDeputy = { id:number; number:string; handle:string; recruits:number; rank:number|null; founding:boolean; createdAt:string };

export async function hash(value:string):Promise<string> {
  const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(result)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function secret():string { return [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
export async function applicationForSession(db:DB, session:string):Promise<Application|null> {
  if (!/^[a-f0-9]{64}$/.test(session)) return null;
  return db.prepare('SELECT * FROM applications WHERE session_hash = ?').bind(await hash(session)).first<Application>();
}
export async function beginApplication(db:DB, session:string, handleInput:unknown, warrant:Warrant, referralId:number|null):Promise<Application> {
  const handle=normalizeHandle(handleInput);
  const existing=await applicationForSession(db,session);
  if(existing) {
    const deputy=await db.prepare('SELECT id FROM deputies WHERE application_id = ?').bind(existing.id).first();
    if(deputy) return existing;
    await db.prepare('UPDATE applications SET handle = ?, warrant_url = COALESCE(warrant_url, ?), warrant_number = CASE WHEN warrant_url IS NULL THEN ? ELSE warrant_number END, rules_version = CASE WHEN warrant_url IS NULL THEN ? ELSE rules_version END WHERE id = ? AND NOT EXISTS (SELECT 1 FROM deputies WHERE application_id=applications.id)').bind(handle,warrant.postUrl||null,warrant.number,warrant.rulesVersion,existing.id).run();
    return (await applicationForSession(db,session))!;
  }
  const referrer=referralId ? await db.prepare('SELECT id FROM deputies WHERE id = ? AND status = ?').bind(referralId,'active').first<{id:number}>():null;
  const id=crypto.randomUUID();
  await db.prepare('INSERT INTO applications (id,session_hash,handle,warrant_url,warrant_number,rules_version,referred_by,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(session_hash) DO NOTHING').bind(id,await hash(session),handle,warrant.postUrl||null,warrant.number,warrant.rulesVersion,referrer?.id??null,new Date().toISOString()).run();
  return (await applicationForSession(db,session))!;
}
export async function saveOrders(db:DB, application:Application, data:Record<string,unknown>):Promise<void> {
  if(typeof data.spreadUrl!=='string'||typeof data.replyUrl!=='string'||data.spreadUrl.length>600||data.replyUrl.length>600) throw new InputError('Post links must be shorter than 600 characters.');
  await db.prepare('UPDATE applications SET follow = ?, like = ?, spread_mode = ?, spread_url = ?, reply_url = ? WHERE id = ? AND NOT EXISTS (SELECT 1 FROM deputies WHERE application_id = applications.id)').bind(data.follow===true?1:0,data.like===true?1:0,data.spreadMode==='repost'?'repost':'quote',data.spreadUrl.trim(),data.replyUrl.trim(),application.id).run();
}
export async function deputyForApplication(db:DB, applicationId:string):Promise<PublicDeputy|null> {
  const row=await db.prepare("SELECT d.id,d.handle,d.created_at,(SELECT COUNT(*) FROM deputies r WHERE r.referrer_id=d.id AND r.status='active') AS recruits FROM deputies d WHERE d.application_id=? AND d.status='active'").bind(applicationId).first<{id:number;handle:string;created_at:string;recruits:number}>();
  if(!row)return null;
  let rank:null|number=null;
  if(row.recruits>0) {
    const result=await db.prepare("SELECT COUNT(*) + 1 AS rank FROM (SELECT d.id, COUNT(r.id) AS recruits FROM deputies d LEFT JOIN deputies r ON r.referrer_id=d.id AND r.status='active' WHERE d.status='active' GROUP BY d.id) WHERE recruits > ? OR (recruits = ? AND id < ?)").bind(row.recruits,row.recruits,row.id).first<{rank:number}>();
    rank=result?.rank??null;
  }
  return {id:row.id,number:deputyNumber(row.id),handle:row.handle,recruits:row.recruits,rank,founding:row.id<=campaign.foundingLimit,createdAt:row.created_at};
}
export async function claimBadge(db:DB, application:Application, orders:unknown):Promise<{deputy:PublicDeputy;recoveryCode:string|null}> {
  const existing=await deputyForApplication(db,application.id);
  if(existing)return {deputy:existing,recoveryCode:null};
  const valid=validateOrders(orders,application.handle,application.warrant_url??'');
  const recoveryCode=secret();
  const recoveryHash=await hash(recoveryCode);
  try {
    // D1 executes the batch transactionally. Uniqueness makes retries and races safe.
    const result=await db.batch([
      db.prepare('UPDATE applications SET follow=1, like=1, spread_mode=?, spread_url=?, reply_url=?, recovery_hash=? WHERE id=? AND handle=? AND warrant_url=? AND rules_version=? AND session_hash=? AND NOT EXISTS (SELECT 1 FROM deputies WHERE application_id=applications.id)').bind(valid.spreadMode,valid.spreadUrl,valid.replyUrl,recoveryHash,application.id,application.handle,application.warrant_url,application.rules_version,application.session_hash),
      db.prepare("INSERT INTO deputies (application_id,handle,referrer_id,created_at,status) SELECT a.id,a.handle,CASE WHEN r.id IS NOT NULL AND r.handle <> a.handle THEN r.id ELSE NULL END,?,'active' FROM applications a LEFT JOIN deputies r ON r.id=a.referred_by AND r.status='active' WHERE a.id=? AND a.handle=? AND a.warrant_url=? AND a.rules_version=? AND a.session_hash=? AND a.recovery_hash=? AND a.follow=1 AND a.like=1 AND NOT EXISTS (SELECT 1 FROM deputies WHERE application_id=a.id)").bind(new Date().toISOString(),application.id,application.handle,application.warrant_url,application.rules_version,application.session_hash,recoveryHash),
    ]);
    const deputy=await deputyForApplication(db,application.id);
    if(!deputy)throw new InputError('Your application changed. Refresh your Field Orders and try again.',409);
    return {deputy,recoveryCode:result[1].meta.changes?recoveryCode:null};
  } catch(error) {
    if(error instanceof InputError)throw error;
    if(String(error).includes('UNIQUE'))throw new InputError('This username already has a badge. Return using its original browser or private recovery code.',409);
    throw error;
  }
}
export async function publicStats(db:DB) {
  const [count,leaders,treasury]=await Promise.all([
    db.prepare("SELECT COUNT(*) AS total, (SELECT COALESCE(MAX(id),0) FROM deputies) AS lastIssued FROM deputies WHERE status='active'").first<{total:number;lastIssued:number}>(),
    db.prepare("SELECT d.id,d.handle,COUNT(r.id) AS recruits FROM deputies d LEFT JOIN deputies r ON r.referrer_id=d.id AND r.status='active' WHERE d.status='active' GROUP BY d.id HAVING COUNT(r.id)>0 ORDER BY recruits DESC,d.id ASC LIMIT 8").all<{id:number;handle:string;recruits:number}>(),
    db.prepare("SELECT COALESCE(SUM(usd_cents),0) AS totalCents, COALESCE(SUM(CASE WHEN phase='TAX_RICH' THEN usd_cents ELSE 0 END),0) AS richCents, COALESCE(SUM(CASE WHEN phase='TAX_POOR' THEN usd_cents ELSE 0 END),0) AS poorCents FROM verified_contributions WHERE status='verified'").first<{totalCents:number;richCents:number;poorCents:number}>(),
  ]);
  return {count:count?.total??0,foundingRemaining:Math.max(0,campaign.foundingLimit-(count?.lastIssued??0)),leaders:(leaders.results??[]).map((d,index)=>({...d,number:deputyNumber(d.id),rank:index+1})),treasury,updatedAt:new Date().toISOString()};
}
