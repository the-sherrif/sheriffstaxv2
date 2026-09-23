'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, Badge, Check, Copy, LockKeyhole, RotateCcw, ShieldCheck } from 'lucide-react';
import { Checklist } from '@/components/Checklist';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { campaign } from '@/config/campaign';
import { normalizeHandle, parsePostUrl, validateOrders } from '@/lib/validation';
import type { Orders } from '@/lib/validation';
import type { PublicDeputy } from '@/lib/registry';

type App={handle:string;warrantUrl:string;warrantNumber:string}&Orders;
type Config=typeof campaign & {turnstileSiteKey:string;claimReady:boolean};
type Me={config:Config;application:App|null;deputy:PublicDeputy|null};
const blank:Orders={follow:false,like:false,spreadMode:'quote',spreadUrl:'',replyUrl:''};
async function request(data:Record<string,unknown>) {
  const response=await fetch('/api/registry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const body=await response.json() as {error?:string;recoveryCode?:string};if(!response.ok)throw new Error(body.error||'The Registry is unavailable. Try again.');return body;
}
function LinkStatus({value,handle,repost,warrantUrl}:{value:string;handle:string;repost?:boolean;warrantUrl:string}) {
  if(!value)return null;
  try {
    const post=parsePostUrl(value);
    if(repost) {if(warrantUrl&&post.id!==parsePostUrl(warrantUrl).id)throw new Error('Use the original Warrant link after reposting.');}
    else {if(post.handle!==handle)throw new Error('This link contains a different username. Submit your own link.');if(warrantUrl&&post.id===parsePostUrl(warrantUrl).id)throw new Error('Use your own post link, not the original Warrant.');}
    return <p className="field-feedback valid"><Check size={14}/> Link format accepted.</p>;
  }catch(error){return <p className="field-feedback invalid">{(error as Error).message}</p>;}
}
type TurnstileApi={render:(el:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void};
function SecurityCheck({siteKey,onToken}:{siteKey:string;onToken:(token:string)=>void}) {
  const holder=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let widget:string|undefined;let cancelled=false;
    const get=()=> (window as unknown as {turnstile?:TurnstileApi}).turnstile;
    const mount=()=>{if(!cancelled&&holder.current&&get()&&widget===undefined)widget=get()!.render(holder.current,{sitekey:siteKey,action:'claim_badge',theme:'dark',callback:onToken,'expired-callback':()=>onToken(''),'error-callback':()=>onToken('')});};
    const script=document.querySelector<HTMLScriptElement>('script[data-sheriff-turnstile]')??document.createElement('script');
    script.addEventListener('load',mount);if(!script.src){script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.dataset.sheriffTurnstile='true';document.head.appendChild(script);}mount();
    return()=>{cancelled=true;script.removeEventListener('load',mount);if(widget!==undefined)get()?.remove(widget);};
  },[siteKey,onToken]);
  return <div ref={holder} className="security-check"/>;
}
export function RegistryPanel() {
  const [me,setMe]=useState<Me|null>(null),[handle,setHandle]=useState(''),[orders,setOrders]=useState<Orders>(blank);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[loaded,setLoaded]=useState(false);
  const [recovery,setRecovery]=useState(''),[recoverOpen,setRecoverOpen]=useState(false),[recoveryInput,setRecoveryInput]=useState('');
  const [token,setToken]=useState(''),[securityKey,setSecurityKey]=useState(0),[issued,setIssued]=useState(false);
  const refresh=useCallback(async()=>{const r=await fetch('/api/registry',{cache:'no-store'});const data=await r.json() as Me & {error?:string};if(!r.ok)throw new Error(data.error);setMe(data);if(data.application){setHandle(data.application.handle);setOrders(data.application);}setLoaded(true);return data as Me;},[]);
  useEffect(()=>{refresh().catch(e=>{setError(e.message);setLoaded(true);});},[refresh]);
  const apply=useCallback(async(name:string)=>{const normalized=normalizeHandle(name);await request({action:'apply',handle:normalized});await refresh();setError('');setNotice('Application saved. Complete your Field Orders.');return {status:'applicant',handle:normalized};},[refresh]);
  useEffect(()=>{
    type Context={registerTool:(tool:Record<string,unknown>,options:{signal:AbortSignal})=>void|Promise<void>};
    const context=(document as unknown as {modelContext?:Context}).modelContext;if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const tools=[{name:'get_registry_status',description:'Read the current Sheriff campaign and the signed-in browser’s application status.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:async()=>{const r=await fetch('/api/registry',{cache:'no-store'});if(!r.ok)throw new Error('Registry unavailable');return r.json();}},
    {name:'start_deputy_application',description:'Create or update a Deputy application using an X handle and show Field Orders. Does not issue a badge or perform X actions.',inputSchema:{type:'object',properties:{handle:{type:'string'}},required:['handle'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(input:unknown)=>{if(!input||typeof input!=='object'||typeof (input as {handle?:unknown}).handle!=='string')throw new Error('Provide an X handle.');const result=await apply((input as {handle:string}).handle);document.getElementById('registry')?.scrollIntoView();return result;}}];
    for(const tool of tools)try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Unsupported browser integrations do not affect the app. */}
    return()=>lifecycle.abort();
  },[apply]);
  async function run(fn:()=>Promise<void>) {setBusy(true);setError('');setNotice('');try{await fn();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function copy(value:string,label:string) {try{await navigator.clipboard.writeText(value);setNotice(`${label} copied.`);}catch{setNotice('Select the link below and copy it from your browser.');}}
  const deputy=me?.deputy;
  const app=me?.application;
  const shareUrl=deputy?`${me!.config.siteUrl}/d/${deputy.number}`:'';
  const shareText=deputy?(deputy.founding?`The Sheriff gave me a badge. Founding Deputy #${deputy.number}. Jurisdiction: The Entire Timeline. Your orders are waiting.`:deputy.recruits?`Deputy #${deputy.number}. ${deputy.recruits} recruits and counting. The Sheriff is still hiring. Report for duty.`:`I’ve been deputized. Deputy #${deputy.number}. Apparently the rich are about to have a very interesting tax season.`):'';
  // Use the existing qualification validator for the derived link ticks too.
  // Neither checklist clicks nor animation can qualify an invalid URL.
  let spreadComplete = false, replyComplete = false;
  if (app?.warrantUrl) {
    const check = (value: string, repost = false) => {
      try {
        const post = parsePostUrl(value), warrant = parsePostUrl(app.warrantUrl);
        return repost ? post.id === warrant.id && post.handle === warrant.handle
          : post.handle === app.handle && post.id !== warrant.id;
      } catch { return false; }
    };
    spreadComplete = check(orders.spreadUrl, orders.spreadMode === 'repost');
    replyComplete = check(orders.replyUrl);
    if (spreadComplete && replyComplete && parsePostUrl(orders.spreadUrl).id === parsePostUrl(orders.replyUrl).id) replyComplete = false;
  }
  const completed = Number(orders.follow) + Number(orders.like) + Number(spreadComplete) + Number(replyComplete);
  const ready=(()=>{if(!app)return false;try{validateOrders(orders,app.handle,app.warrantUrl);return true;}catch{return false;}})();
  return <div className={`application-card ${app&&!deputy?'has-application':''}`}>
    {loaded&&me&&<ol className="hq-progress" aria-label="Application progress">{["Apply","Field Orders","Badge"].map((label,i)=><li key={label} aria-current={i===(deputy?2:app?1:0)?"step":undefined}><span>{i+1}</span>{label}</li>)}</ol>}
    {!loaded&&<p role="status" className="mono">OPENING THE REGISTRY…</p>}
    {loaded&&!app&&!deputy&&<><p className="eyebrow">YOUR FIRST ASSIGNMENT</p><h3>Apply for a badge.</h3><p>Join the Deputy waitlist with your X username. You’ll complete Field Orders before your badge can be issued.</p><form onSubmit={e=>{e.preventDefault();void run(async()=>{await apply(handle);});}}><label className="field-label" htmlFor="applicant-handle">YOUR X USERNAME</label><div className="handle-field"><span>@</span><input id="applicant-handle" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={16} placeholder="yourusername" value={handle} onChange={e=>setHandle(e.target.value)} required/></div><button className="button primary full" disabled={busy||!handle.trim()} type="submit">{busy?'SAVING APPLICATION…':'RECEIVE YOUR FIELD ORDERS'}<ArrowRight size={18}/></button></form><p className="form-footnote">Free to apply. No wallet required.</p><button className="text-link" type="button" onClick={()=>setRecoverOpen(true)}>ALREADY HAVE A BADGE? RECOVER IT <RotateCcw size={13}/></button></>}
    {app&&!deputy&&<><div className="orders-top"><p className="eyebrow">WARRANT #{app.warrantNumber} / DEPUTY RECRUITMENT</p><span className="applicant-label">APPLICANT</span></div><h3 className="orders-title">Sheriff’s Field Orders.</h3><p className="applicant-name">@{app.handle}</p><p>A badge has to be earned. Complete your orders before the Sheriff deputizes you.</p>
      {!app.warrantUrl&&<div className="pending-notice"><LockKeyhole size={18}/><span>WARRANT PENDING PUBLICATION<small>Your application is saved. Badge claims open when the official post is published.</small></span></div>}
      <form onSubmit={e=>{e.preventDefault();void run(async()=>{try{const result=await request({action:'claim',...orders,turnstileToken:token});await refresh();setRecovery(result.recoveryCode??'');setIssued(true);window.dispatchEvent(new Event('sheriff-registry-updated'));}finally{setToken('');setSecurityKey(x=>x+1);}});}}>
      <Checklist corner={18} box={18} bounce={50} tasks={[
        {id: '1', text: 'FOLLOW THE SHERIFF', done: orders.follow, disabled: busy, onToggle: () => setOrders(v => ({...v, follow: !v.follow})), details: <><a className="order-action" href={`https://x.com/${campaign.sheriffHandle}`} target="_blank" rel="noreferrer">Follow @{campaign.sheriffHandle}<ArrowUpRight size={15}/></a><p className="order-help">Tap the checklist row after completing this on X.</p></>},
        {id: '2', text: 'LIKE THE WARRANT', done: orders.like, disabled: busy || !app.warrantUrl, onToggle: () => setOrders(v => ({...v, like: !v.like})), details: <>{app.warrantUrl?<a className="order-action" href={app.warrantUrl} target="_blank" rel="noreferrer">Open the official Warrant<ArrowUpRight size={15}/></a>:<span className="order-unavailable">Official post coming soon</span>}<p className="order-help">Tap the checklist row after completing this on X.</p></>},
        {id: '3', text: 'SPREAD THE WARRANT', done: spreadComplete, readOnly: true, onToggle: () => document.getElementById('spread-url')?.focus(), details: <><p className="order-help">Repost it, or add your own words in a quote.</p><RadioGroup value={orders.spreadMode} onValueChange={v=>setOrders({...orders,spreadMode:v as 'quote'|'repost',spreadUrl:''})} className="spread-options" aria-label="Choose how to spread the Warrant"><label><RadioGroupItem value="quote"/>QUOTE POST</label><label><RadioGroupItem value="repost"/>REPOST</label></RadioGroup>{app.warrantUrl&&<a className="order-action" href={app.warrantUrl} target="_blank" rel="noreferrer">Open Warrant on X<ArrowUpRight size={15}/></a>}<label className="field-label" htmlFor="spread-url">{orders.spreadMode==='quote'?'YOUR QUOTE POST LINK':'REPOSTED WARRANT LINK'}</label><input id="spread-url" type="url" inputMode="url" placeholder={orders.spreadMode==='quote'?`https://x.com/${app.handle}/status/…`:'Paste the original Warrant link'} value={orders.spreadUrl} onChange={e=>setOrders({...orders,spreadUrl:e.target.value})}/>{orders.spreadMode==='repost'&&<p className="order-help">A plain repost keeps the Sheriff’s original link. Paste that link after reposting.</p>}<LinkStatus value={orders.spreadUrl} handle={app.handle} repost={orders.spreadMode==='repost'} warrantUrl={app.warrantUrl}/><p className="order-help">This order checks off when your link passes validation.</p></>},
        {id: '4', text: 'REPORT FOR DUTY', done: replyComplete, readOnly: true, onToggle: () => document.getElementById('reply-url')?.focus(), details: <><p className="reply-prompt">“Tell the Sheriff why you deserve a badge.”</p>{app.warrantUrl&&<a className="order-action" href={app.warrantUrl} target="_blank" rel="noreferrer">Reply underneath the Warrant<ArrowUpRight size={15}/></a>}<label className="field-label" htmlFor="reply-url">YOUR COMMENT LINK</label><input id="reply-url" type="url" inputMode="url" placeholder={`https://x.com/${app.handle}/status/…`} value={orders.replyUrl} onChange={e=>setOrders({...orders,replyUrl:e.target.value})}/><LinkStatus value={orders.replyUrl} handle={app.handle} warrantUrl={app.warrantUrl}/><p className="order-help">This order checks off when your link passes validation.</p></>}
      ]}/>
      <div className="optional-order"><span>OPTIONAL</span><div><h4>NOMINATE FUTURE DEPUTIES</h4><p>Know someone who deserves a badge? Tag up to three people in your reply.</p></div></div>
      <div className="orders-progress"><span>ORDERS COMPLETED</span><strong>{completed}/4</strong><Progress value={completed*25} aria-label={`${completed} of 4 Field Orders completed`}/></div>
      {me?.config.claimReady&&app.warrantUrl&&<SecurityCheck key={securityKey} siteKey={me.config.turnstileSiteKey} onToken={setToken}/>}
      <button type="submit" className="button primary full" disabled={busy||!ready||!me?.config.claimReady||!token}>{busy?'UPDATING REGISTRY…':ready&&me?.config.claimReady?'CLAIM BADGE':'BADGE LOCKED'}{ready&&me?.config.claimReady?<Badge size={19}/>:<LockKeyhole size={17}/>}</button>
      <button type="button" className="text-link save-progress" disabled={busy} onClick={()=>void run(async()=>{await request({action:'save',...orders});setNotice('Progress saved. Return in this browser to continue.');})}>SAVE MY PROGRESS</button>
      {!app.warrantUrl&&<button type="button" className="text-link save-progress" disabled={busy} onClick={()=>void run(async()=>{await apply(app.handle);})}>CHECK FOR THE WARRANT <RotateCcw size={13}/></button>}
      </form></>}
    {deputy&&<><div className={`deputy-badge ${issued?'just-issued':''}`}><p className="eyebrow"><Badge size={18}/> BADGE ISSUED</p><span className="badge-mark"><img className="sheriff-seal" src="/brand/sheriff-icon.png" width="110" height="110" alt="Sheriff’s Deputy seal"/></span><span className="deputy-prefix">DEPUTY</span><h3>#{deputy.number}</h3><p className="badge-handle">@{deputy.handle}</p>{deputy.founding&&<span className="founding-label">FOUNDING DEPUTY / FIRST {campaign.foundingLimit}</span>}<div className="paper-rule"/><p className="mono">JURISDICTION: THE ENTIRE TIMELINE.</p><p className="badge-authority">You are now authorized to recruit.</p></div><div className="deputy-stats"><div><strong>{deputy.recruits}</strong><span>RECRUITS</span></div><div><strong>{deputy.rank?`#${deputy.rank}`:'—'}</strong><span>RECRUITMENT RANK</span></div></div><label className="field-label" htmlFor="referral-link">YOUR DEPUTY LINK</label><input id="referral-link" readOnly value={shareUrl} onFocus={e=>e.target.select()}/><div className="deputy-actions"><button className="button primary" type="button" onClick={()=>void copy(shareUrl,'Deputy link')}>COPY LINK<Copy size={17}/></button><a className="button outline" href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">RECRUIT ON 𝕏<ArrowUpRight size={17}/></a></div><button className="text-link" onClick={()=>void copy(`${shareText}\n${shareUrl}`,'Warrant')}>COPY WARRANT</button><div className="recovery-area"><button className="text-link" type="button" onClick={()=>void run(async()=>{const data=await request({action:'recovery-code'});setRecovery(data.recoveryCode??'');})}>GENERATE A PRIVATE RECOVERY CODE</button>{recovery&&<><p>Save this privately to recover your badge on another device. Generating a new code replaces the previous one.</p><input aria-label="Private recovery code" readOnly value={recovery} onFocus={e=>e.target.select()}/><button className="text-link" onClick={()=>void copy(recovery,'Recovery code')}>COPY RECOVERY CODE</button></>}</div></>}
    {error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="form-notice" role="status">{notice}</p>}
    {loaded&&!me&&<button className="text-link" onClick={()=>void run(async()=>{await refresh();})}>TRY AGAIN</button>}
    <Dialog open={recoverOpen} onOpenChange={setRecoverOpen}><DialogContent className="recovery-dialog"><DialogTitle>Back on duty.</DialogTitle><DialogDescription>Enter the private recovery code saved with your badge. Your Deputy number alone cannot restore access.</DialogDescription><form onSubmit={e=>{e.preventDefault();void run(async()=>{await request({action:'recover',code:recoveryInput});await refresh();setRecoverOpen(false);setRecoveryInput('');});}}><label className="field-label" htmlFor="recover-code">PRIVATE RECOVERY CODE</label><input id="recover-code" autoComplete="off" value={recoveryInput} onChange={e=>setRecoveryInput(e.target.value)} required/><button className="button primary full" disabled={busy}>RESTORE MY BADGE<ShieldCheck size={17}/></button>{error&&<p role="alert" className="form-error">{error}</p>}</form></DialogContent></Dialog>
  </div>;
}
