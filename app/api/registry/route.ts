import { env } from 'cloudflare:workers';
import { campaign } from '@/config/campaign';
import { applicationForSession, beginApplication, claimBadge, deputyForApplication, hash, publicStats, saveOrders, secret } from '@/lib/registry';
import { InputError, parsePostUrl } from '@/lib/validation';

type Runtime = {DB:D1Database; ACTIVE_WARRANT_URL?:string; TURNSTILE_SITE_KEY?:string; TURNSTILE_SECRET_KEY?:string};
const runtime=()=>env as unknown as Runtime;
function cookies(request:Request) { return Object.fromEntries((request.headers.get('cookie')??'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2)); }
function response(data:unknown,status=200,extra:Record<string,string>={}) { return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}}); }
function sessionCookie(request:Request,token:string) { const local=['localhost','127.0.0.1'].includes(new URL(request.url).hostname);return `sheriff_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${local?'':'; Secure'}`; }
function warrant() { const source=runtime().ACTIVE_WARRANT_URL||campaign.activeWarrant.postUrl; if(!source)return {...campaign.activeWarrant,postUrl:''}; const parsed=parsePostUrl(source);if(parsed.handle!==campaign.sheriffHandle)throw new Error('Active Warrant must belong to the configured Sheriff account.');return {...campaign.activeWarrant,postUrl:parsed.url}; }
function publicConfig() { return {...campaign,activeWarrant:warrant(),turnstileSiteKey:runtime().TURNSTILE_SITE_KEY??'',claimReady:!!warrant().postUrl&&!!runtime().TURNSTILE_SITE_KEY&&!!runtime().TURNSTILE_SECRET_KEY}; }
function privateApplication(a:Awaited<ReturnType<typeof applicationForSession>>) { if(!a)return null;return {handle:a.handle,warrantUrl:a.warrant_url??'',warrantNumber:a.warrant_number,follow:!!a.follow,like:!!a.like,spreadMode:a.spread_mode,spreadUrl:a.spread_url,replyUrl:a.reply_url}; }
async function limit(request:Request,action:string) {
  const ip=request.headers.get('cf-connecting-ip')??'local';
  const hour=Math.floor(Date.now()/3600000);
  const key=await hash(`${ip}:${hour}:${action}`);
  const cap=action==='apply'?20:action==='recover'?10:120;
  const result=await runtime().DB.prepare('INSERT INTO rate_limits (bucket_key,hits,expires_at) VALUES (?,1,?) ON CONFLICT(bucket_key) DO UPDATE SET hits=hits+1 RETURNING hits').bind(key,Date.now()+7200000).first<{hits:number}>();
  if((result?.hits??0)>cap)throw new InputError('Too many attempts. Please try again later.',429);
  // Expired anti-abuse records do not accumulate indefinitely.
  await runtime().DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(Date.now()).run();
}
function failure(error:unknown) { if(error instanceof InputError)return response({error:error.message},error.status);console.error('Registry operation failed',error instanceof Error?error.message:'Unknown failure');return response({error:'The Registry is temporarily unavailable. Your saved records have not been replaced. Please try again.'},503); }
export async function GET(request:Request) {
  try {
    if(new URL(request.url).searchParams.get('view')==='public')return response({config:publicConfig(),stats:await publicStats(runtime().DB)});
    const application=await applicationForSession(runtime().DB,cookies(request).sheriff_session??'');
    return response({config:publicConfig(),application:privateApplication(application),deputy:application?await deputyForApplication(runtime().DB,application.id):null});
  }catch(error){return failure(error);}
}
export async function POST(request:Request) {
  try {
    const origin=request.headers.get('origin');
    if(!origin||![new URL(request.url).origin,campaign.siteUrl].includes(origin))throw new InputError('This request must come from the Sheriff’s website.',403);
    if(!request.headers.get('content-type')?.startsWith('application/json'))throw new InputError('Use a JSON request.',415);
    const raw=await request.text();if(raw.length>5000)throw new InputError('Application is too large.',413);
    let data:Record<string,unknown>;try{data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw 0;}catch{throw new InputError('Invalid application.');}
    const action=String(data.action??'');
    if(!['apply','recover','save','claim','recovery-code'].includes(action))throw new InputError('Unknown Registry action.');
    await limit(request,action);
    const old=cookies(request).sheriff_session??'';
    if(action==='apply') {
      const token=/^[a-f0-9]{64}$/.test(old)?old:secret();
      const referral=cookies(request).sheriff_referral;
      const visit=referral&&/^[a-f0-9]{64}$/.test(referral)?await runtime().DB.prepare('SELECT referrer_id FROM referral_visits WHERE token_hash = ? AND expires_at > ?').bind(await hash(referral),Date.now()).first<{referrer_id:number}>():null;
      const ref=visit?.referrer_id??null;
      const application=await beginApplication(runtime().DB,token,data.handle,warrant(),ref);
      return response({application:privateApplication(application),deputy:await deputyForApplication(runtime().DB,application.id)},200,{'Set-Cookie':sessionCookie(request,token)});
    }
    if(action==='recover') {
      if(typeof data.code!=='string'||!/^[a-f0-9]{64}$/.test(data.code.trim()))throw new InputError('Enter your private 64-character recovery code.');
      const a=await runtime().DB.prepare('SELECT id FROM applications WHERE recovery_hash = ?').bind(await hash(data.code.trim())).first<{id:string}>();
      if(!a)throw new InputError('That recovery code was not found.',400);
      const token=secret();await runtime().DB.prepare('UPDATE applications SET session_hash = ? WHERE id = ?').bind(await hash(token),a.id).run();
      return response({ok:true},200,{'Set-Cookie':sessionCookie(request,token)});
    }
    const application=await applicationForSession(runtime().DB,old);
    if(!application)throw new InputError('Start your badge application first.',401);
    if(action==='save') {await saveOrders(runtime().DB,application,data);return response({ok:true});}
    if(action==='claim') {
      const existing=await deputyForApplication(runtime().DB,application.id);if(existing)return response({deputy:existing,recoveryCode:null});
      if(!application.warrant_url)throw new InputError('The Warrant is not published yet. Your application is saved.',409);
      const settings=runtime();if(!settings.TURNSTILE_SECRET_KEY||!settings.TURNSTILE_SITE_KEY)throw new InputError('Badge claims are not open yet. Your application is saved.',409);
      if(typeof data.turnstileToken!=='string'||data.turnstileToken.length>2048)throw new InputError('Complete the security check.');
      const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:settings.TURNSTILE_SECRET_KEY,response:data.turnstileToken})});
      const result=await verification.json() as {success:boolean;hostname?:string;action?:string};
      const hosts=[new URL(campaign.siteUrl).hostname,new URL(request.url).hostname];
      if(!result.success||!result.hostname||!hosts.includes(result.hostname)||result.action!=='claim_badge')throw new InputError('Security check expired. Please complete it again.');
      return response(await claimBadge(runtime().DB,application,data));
    }
    if(action==='recovery-code') {
      const deputy=await deputyForApplication(runtime().DB,application.id);if(!deputy)throw new InputError('Claim a badge first.',409);
      const code=secret();await runtime().DB.prepare('UPDATE applications SET recovery_hash = ? WHERE id = ?').bind(await hash(code),application.id).run();return response({recoveryCode:code});
    }
    throw new InputError('Unknown Registry action.');
  }catch(error){return failure(error);}
}
