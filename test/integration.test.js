import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {database} from '../support/d1.js';
import {saveCandles,claim,finish} from '../src/storage.js';
import {safeReport} from '../src/contract.js';
import {collect} from '../src/collection.js';
import {slots,run} from '../src/scheduler.js';
import {validateCandles} from '../src/market-validation.js';
import worker from '../src/index.js';
const sql=readFileSync(new URL('../migrations/0001_research.sql',import.meta.url),'utf8');
const STEP=1800000,now=Date.UTC(2026,9,15),start=now-96*STEP;
const row=t=>[t,'100','102','99','101','1',t+STEP-1];
const env=db=>({DB:db,DASHBOARD_USER:'fixture',DASHBOARD_PASSWORD:'fixture-'.repeat(4)});
const auth=()=>({authorization:'Basic '+btoa('fixture:'+'fixture-'.repeat(4))});
const report=()=>({kind:'daily',status:'RETRAINED',production_approved:false,window_start:start,window_end:now,observations:192,candidate_count:0,pass_count:0,model_version:'a'.repeat(64)});
test('migration is additive and reapplicable',()=>{const db=database(sql);db.raw.exec(sql);assert.equal(db.raw.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table'").get().n,3);db.raw.close();});
test('real SQLite stores both symbols and rejects revision atomically',async()=>{
 const db=database(sql),rows=validateCandles([row(start)],now);
 await saveCandles(db,'BTCUSDT',rows);await saveCandles(db,'BTCUSDT',rows);
 await assert.rejects(saveCandles(db,'BTCUSDT',[{...rows[0],openTime:start+STEP},{...rows[0],close:100}]));
 assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM research_candles').get().n,1);db.raw.close();
});
test('public market acquisition is bounded, contiguous and idempotent',async()=>{
 const db=database(sql);let calls=0;
 const fetcher=async u=>{calls++;const a=Number(new URL(u).searchParams.get('startTime'));return Response.json(Array.from({length:96},(_,i)=>row(a+i*STEP)));};
 const r=await collect(db,now,fetcher);assert.equal(r.observations,192);await collect(db,now,fetcher);assert.equal(calls,2);db.raw.close();
});
test('gapped provider data cannot be saved',async()=>{
 const db=database(sql);await assert.rejects(collect(db,now,async()=>Response.json([row(start+STEP)])));
 assert.equal(db.raw.prepare('SELECT COUNT(*) n FROM research_candles').get().n,0);db.raw.close();
});
test('job leasing prevents duplicate and stale-owner results',async()=>{
 const db=database(sql);assert.equal(await claim(db,'daily',now,now,'first'),true);
 assert.equal(await claim(db,'daily',now,now,'other'),false);
 assert.equal(await claim(db,'daily',now,now+3600001,'next'),true);
 await assert.rejects(finish(db,'daily',now,'first',report()));
 await finish(db,'daily',now,'next',report());assert.equal(await claim(db,'daily',now,now+7200000,'later'),false);db.raw.close();
});
test('private model and arbitrary keys are stripped from service results',()=>{
 const result=safeReport({...report(),models:{hidden:'not_public'},private_trades:[{}]},'daily');
 assert.equal('models' in result,false);assert.equal('private_trades' in result,false);
 assert.throws(()=>safeReport({...report(),production_approved:true},'daily'));
 assert.throws(()=>safeReport({...report(),observations:NaN},'daily'));
});
test('unauthenticated UI and API fail closed, configured phone page is read-only',async()=>{
 const db=database(sql),settings=env(db);
 for(const path of ['/','/app.js','/api/research'])assert.equal((await worker.fetch(new Request('https://example.test'+path),settings)).status,401);
 const page=await worker.fetch(new Request('https://example.test/',{headers:auth()}),settings);
 assert.equal(page.status,200);assert.match(await page.text(),/width=device-width/);
 assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.equal((await worker.fetch(new Request('https://example.test/',{method:'POST',headers:auth()}),settings)).status,405);db.raw.close();
});
test('API returns only approved aggregate schema even if database payload is contaminated',async()=>{
 const db=database(sql);await claim(db,'daily',now,now,'test');await finish(db,'daily',now,'test',{...report(),private_model:'fixture_private'});
 const response=await worker.fetch(new Request('https://example.test/api/research',{headers:auth()}),env(db));
 assert.equal(response.status,200);assert.equal((await response.text()).includes('fixture_private'),false);db.raw.close();
});
test('disabled scheduler performs no reads, writes or fetches',async()=>assert.deepEqual(await run({},now),{status:'DISABLED'}));
test('weekly slot is UTC Monday and missed Monday is recoverable',()=>assert.equal(slots(now)[2][1],Date.UTC(2026,9,12)));
test('plain HTTP is rejected before authentication or database access',async()=>{
 assert.equal((await worker.fetch(new Request('http://example.test/'),{})).status,400);
});
test('malformed numeric market values are rejected',()=>{
 for(const value of [null,true,'',' ']){const r=row(start);r[5]=value;assert.throws(()=>validateCandles([r],now));}
});
