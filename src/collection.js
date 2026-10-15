import {validateCandles,INTERVAL_MS as STEP} from './market-validation.js';
import {saveCandles} from './storage.js';
export async function collect(db,now,fetcher=(url,options)=>globalThis.fetch(url,options)){
 const end=Math.floor(now/STEP)*STEP,out=[];
 for(const symbol of ['BTCUSDT','ETHUSDT']){
  const last=await db.prepare('SELECT MAX(open_time) AS latest FROM research_candles WHERE symbol=?').bind(symbol).first();
  const start=last?.latest==null?end-96*STEP:last.latest+STEP;
  if(start>=end){out.push({symbol,saved:0,latest:last.latest,caught_up:true});continue;}
  const url=new URL('https://data-api.binance.vision/api/v3/klines');
  for(const [k,v] of Object.entries({symbol,interval:'30m',startTime:start,endTime:end-1,limit:96}))url.searchParams.set(k,String(v));
  let response;try{response=await fetcher(url.toString(),{redirect:'manual',signal:AbortSignal.timeout(15000)});}catch{throw Error('MARKET_UNAVAILABLE');}
  if(!response.ok||Number(response.headers.get('content-length'))>150000)throw Error('MARKET_UNAVAILABLE');
  const reader=response.body?.getReader();if(!reader)throw Error('INVALID_MARKET_BODY');
  const chunks=[];let size=0;try{while(true){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>150000)throw Error('OVERSIZED_MARKET_BODY');chunks.push(r.value);}}finally{await reader.cancel();}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  let input;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{throw Error('INVALID_MARKET_BODY');}
  const rows=validateCandles(input,now);
  if(rows.length>96||rows[0].openTime!==start||rows.at(-1).openTime>=end)throw Error('MARKET_GAP');
  await saveCandles(db,symbol,rows);
  out.push({symbol,saved:rows.length,latest:rows.at(-1).openTime,caught_up:rows.at(-1).openTime+STEP===end});
 }
 return {source:'Binance spot USDT',observations:out.reduce((n,r)=>n+r.saved,0),markets:out,production_approved:false};
}
