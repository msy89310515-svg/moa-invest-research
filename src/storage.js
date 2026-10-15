export async function saveCandles(db,symbol,rows){
 if(!['BTCUSDT','ETHUSDT'].includes(symbol)||rows.length>96)throw Error('INVALID_BATCH');
 const statements=[];
 for(let i=0;i<rows.length;i+=8){
  const part=rows.slice(i,i+8),args=part.flatMap(r=>[symbol,r.openTime,r.open,r.high,r.low,r.close,r.volume,'public_market_data']);
  statements.push(db.prepare(`INSERT OR IGNORE INTO research_candles VALUES ${part.map(()=>'(?,?,?,?,?,?,?,?)').join(',')}`).bind(...args));
 }
 if(statements.length){const results=await db.batch(statements);if(results.some(r=>r.success===false))throw Error('D1_WRITE_FAILED');}
}
export async function claim(db,kind,slot,now,owner){
 const result=await db.prepare(`INSERT INTO research_jobs VALUES (?,?, 'running',1,?,?,NULL)
 ON CONFLICT(kind,slot) DO UPDATE SET status='running',attempt=attempt+1,owner=excluded.owner,
 lease_until=excluded.lease_until,error_code=NULL WHERE research_jobs.status!='done' AND research_jobs.attempt<3
 AND (research_jobs.status='error' OR research_jobs.lease_until<=?)`).bind(kind,slot,owner,now+3600000,now).run();
 return result.meta?.changes===1;
}
export async function finish(db,kind,slot,owner,payload,error=null){
 const statements=[];
 if(!error)statements.push(db.prepare(`INSERT OR IGNORE INTO research_reports SELECT ?,?,?
 WHERE EXISTS(SELECT 1 FROM research_jobs WHERE kind=? AND slot=? AND owner=? AND status='running')`)
 .bind(kind,slot,JSON.stringify(payload),kind,slot,owner));
 statements.push(db.prepare("UPDATE research_jobs SET status=?,error_code=? WHERE kind=? AND slot=? AND owner=? AND status='running'")
 .bind(error?'error':'done',error,kind,slot,owner));
 const result=await db.batch(statements);if(result.at(-1).meta?.changes!==1)throw Error('STALE_JOB_OWNER');
}
