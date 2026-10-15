// Public market-data validation utilities. No credentials, orders or paid APIs.
// Only completed 30-minute candles are accepted.
export const INTERVAL_MS=30*60*1000;
export function validateCandles(rows,now=Date.now()){
 if(!Number.isSafeInteger(now)||now<INTERVAL_MS)throw Error('invalid now');
 if(!Array.isArray(rows)||!rows.length||rows.length>1000)throw Error("invalid candle count");
 let previous=-1;
 return rows.map((row,index)=>{
  if(!Array.isArray(row)||row.length<7)throw Error("invalid candle shape");
  if(row.slice(0,7).some(x=>!(typeof x==='number'||(typeof x==='string'&&/^[0-9]+(?:\.[0-9]+)?$/.test(x)))))throw Error('invalid numeric value');
  const openTime=Number(row[0]),closeTime=Number(row[6]);
  const [open,high,low,close,volume]=[1,2,3,4,5].map(i=>Number(row[i]));
  if(!Number.isSafeInteger(openTime)||openTime%INTERVAL_MS!==0||openTime<=previous)throw Error("invalid timestamp order");
  if(index&&openTime-previous!==INTERVAL_MS)throw Error("missing candle");
  if(!Number.isSafeInteger(closeTime)||closeTime!==openTime+INTERVAL_MS-1||closeTime>=now)throw Error("unfinished candle");
  if([open,high,low,close,volume].some(v=>!Number.isFinite(v))||low<=0||volume<0||high<Math.max(open,close,low)||low>Math.min(open,close))throw Error("invalid OHLCV");
  previous=openTime;
  return {openTime,closeTime,open,high,low,close,volume};
 });
}
export function latestCompletedOpen(now=Date.now()){
 if(!Number.isSafeInteger(now)||now<INTERVAL_MS)throw Error("invalid now");
 return Math.floor(now/INTERVAL_MS)*INTERVAL_MS-INTERVAL_MS;
}
