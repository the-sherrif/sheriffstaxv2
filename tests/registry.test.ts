import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { applicationForSession, beginApplication, claimBadge, deputyForApplication, publicStats, saveOrders, secret } from '../lib/registry.ts';
import type { DB } from '../lib/registry.ts';
import { normalizeHandle, parsePostUrl, validateOrders } from '../lib/validation.ts';

// SQLite executes the generated migration and actual production SQL in memory.
function database() {
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../drizzle/0000_gigantic_absorbing_man.sql',import.meta.url),'utf8'));
  function prepare(sql:string) {
    let values:(string|number|null)[]=[];
    const statement={bind(...args:(string|number|null)[]){values=args;return statement;},
      async first(){return sqlite.prepare(sql).get(...values)??null;},
      async all(){return {results:sqlite.prepare(sql).all(...values)};},
      async run(){return execute();}};
    function execute(){const r=sqlite.prepare(sql).run(...values);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
    return Object.assign(statement,{execute});
  }
  const adapter={prepare,async batch(statements:ReturnType<typeof prepare>[]){sqlite.exec('BEGIN');try{const results=statements.map(s=>s.execute());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
  return {db:adapter as unknown as DB,sqlite};
}
const warrant={postUrl:'https://x.com/sheriffstax/status/100',number:'001',rulesVersion:1};
const orders=(handle:string)=>({follow:true,like:true,spreadMode:'quote' as const,spreadUrl:`https://x.com/${handle}/status/201`,replyUrl:`https://x.com/${handle}/status/202`});

test('post parsing rejects disguised hosts and unsupported paths',()=>{
  assert.equal(normalizeHandle(' @ALIce '),'alice');
  assert.deepEqual(parsePostUrl('https://twitter.com/ALICE/status/201?s=20'),{handle:'alice',id:'201',url:'https://x.com/alice/status/201'});
  for(const url of ['https://x.com.evil.test/alice/status/201','https://x.com@evil.test/alice/status/201','https://alice@x.com/alice/status/201','http://x.com/alice/status/201','https://x.com/i/status/201','https://x.com/alice%2fstatus%2f201'])assert.throws(()=>parsePostUrl(url));
});
test('orders enforce matching handles, distinct replies and original plain repost',()=>{
  assert.equal(validateOrders(orders('alice'),'alice',warrant.postUrl).spreadMode,'quote');
  assert.throws(()=>validateOrders(orders('bob'),'alice',warrant.postUrl));
  assert.throws(()=>validateOrders({...orders('alice'),replyUrl:orders('alice').spreadUrl},'alice',warrant.postUrl));
  assert.throws(()=>validateOrders({...orders('alice'),follow:false},'alice',warrant.postUrl));
  assert.throws(()=>validateOrders(orders('alice'),'alice',''));
  assert.doesNotThrow(()=>validateOrders({...orders('alice'),spreadMode:'repost',spreadUrl:warrant.postUrl},'alice',warrant.postUrl));
  assert.throws(()=>validateOrders({...orders('alice'),spreadMode:'repost',spreadUrl:'https://x.com/bob/status/100'},'alice',warrant.postUrl));
});
test('saved applicants receive no badge or referral; warrant attaches once',async()=>{
  const {db,sqlite}=database();const session=secret();
  let a=await beginApplication(db,session,'alice',{...warrant,postUrl:''},null);
  await saveOrders(db,a,orders('alice'));
  assert.equal((await applicationForSession(db,session))?.spread_url,orders('alice').spreadUrl);
  await assert.rejects(claimBadge(db,a,orders('alice')));
  assert.equal((await publicStats(db)).count,0);
  a=await beginApplication(db,session,'alice',warrant,null);
  const pinned=await beginApplication(db,session,'alice',{...warrant,postUrl:'https://x.com/sheriffstax/status/300',rulesVersion:2},null);
  assert.equal(pinned.warrant_url,warrant.postUrl);
  assert.equal((await claimBadge(db,a,orders('alice'))).deputy.number,'0001');sqlite.close();
});
test('concurrent retries issue once and credit the first recruiter once',async()=>{
  const {db,sqlite}=database();const founder=await beginApplication(db,secret(),'founder',warrant,null);
  const first=(await claimBadge(db,founder,orders('founder'))).deputy;
  const session=secret();let recruit=await beginApplication(db,session,'alice',warrant,first.id);
  recruit=await beginApplication(db,session,'alice',warrant,null);
  const result=await Promise.all([claimBadge(db,recruit,orders('alice')),claimBadge(db,recruit,orders('alice'))]);
  assert.equal(result[0].deputy.id,result[1].deputy.id);
  assert.equal(result.filter(r=>r.recoveryCode).length,1);
  assert.equal((await deputyForApplication(db,founder.id))?.recruits,1);
  assert.equal((await publicStats(db)).count,2);
  const duplicate=await beginApplication(db,secret(),'ALICE',warrant,null);
  await assert.rejects(claimBadge(db,duplicate,orders('alice')),/already has a badge/);
  assert.equal((await publicStats(db)).count,2);sqlite.close();
});
test('stale username snapshot cannot issue a different handle badge',async()=>{
  const {db,sqlite}=database();const session=secret();const old=await beginApplication(db,session,'alice',warrant,null);
  await beginApplication(db,session,'bob',warrant,null);
  await assert.rejects(claimBadge(db,old,orders('alice')),/application changed/);
  assert.equal((await publicStats(db)).count,0);sqlite.close();
});
test('issued badge identity is immutable and founding numbers never recycle',async()=>{
  const {db,sqlite}=database();const session=secret();let last;
  for(let i=1;i<=101;i++){const handle=`deputy${i}`;const app=await beginApplication(db,i===1?session:secret(),handle,warrant,null);last=(await claimBadge(db,app,orders(handle))).deputy;}
  assert.equal(last?.number,'0101');assert.equal(last?.founding,false);
  const unchanged=await beginApplication(db,session,'different',warrant,null);assert.equal(unchanged.handle,'deputy1');
  sqlite.exec("UPDATE deputies SET status='revoked' WHERE id=101");
  assert.equal((await publicStats(db)).foundingRemaining,0);
  assert.equal((await publicStats(db)).count,100);sqlite.close();
});
