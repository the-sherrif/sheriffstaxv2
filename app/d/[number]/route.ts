import { env } from 'cloudflare:workers';
import { campaign } from '@/config/campaign';
import { hash, secret } from '@/lib/registry';
export async function GET(request:Request,{params}:{params:Promise<{number:string}>}) {
  const {number}=await params;
  const headers=new Headers({'Location':'/#registry','Cache-Control':'no-store'});
  if(!/^[0-9]{1,10}$/.test(number))return new Response(null,{status:303,headers});
  const db=(env as unknown as {DB:D1Database}).DB;
  const referrer=await db.prepare("SELECT id FROM deputies WHERE id=? AND status='active'").bind(Number(number)).first<{id:number}>();
  // First valid referral wins within the cookie window; claims ignore client-supplied referrers.
  const old=(request.headers.get('cookie')??'').match(/(?:^|;\s*)sheriff_referral=([a-f0-9]{64})(?:;|$)/)?.[1];
  const previous=old?await db.prepare('SELECT referrer_id FROM referral_visits WHERE token_hash=? AND expires_at>?').bind(await hash(old),Date.now()).first():null;
  if(referrer&&!previous) {
    const token=secret();
    await db.prepare('INSERT INTO referral_visits (token_hash,referrer_id,expires_at) VALUES (?,?,?)').bind(await hash(token),referrer.id,Date.now()+campaign.referralDays*86400000).run();
    await db.prepare('DELETE FROM referral_visits WHERE expires_at < ?').bind(Date.now()).run();
    const local=['localhost','127.0.0.1'].includes(new URL(request.url).hostname);
    headers.set('Set-Cookie',`sheriff_referral=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${campaign.referralDays*86400}${local?'':'; Secure'}`);
  }
  return new Response(null,{status:303,headers});
}
