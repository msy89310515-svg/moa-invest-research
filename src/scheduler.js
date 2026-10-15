import {collect} from './collection.js';
import {claim,finish} from './storage.js';
import {safeReport} from './contract.js';
const DAY=86400000;
export function slots(now){
 if(!Number.isSafeInteger(now)||now<DAY)throw Error('INVALID_CLOCK');
 const day=Math.floor(now/DAY)*DAY,weekday=new Date(day).getUTCDay();
 return [['collect',Math.floor(now/1800000)*1800000],['daily',day],['weekly',day-((weekday+6)%7)*DAY]];
}
export async function run(env,now){
 if(env.RESEARCH_ENABLED!=='true')return {status:'DISABLED'};
 if(!env.DB)throw Error('RESEARCH_DB_REQUIRED');
 const outcomes=[];
 for(const [kind,slot] of slots(now)){
  const owner=crypto.randomUUID();if(!await claim(env.DB,kind,slot,now,owner)){outcomes.push({kind,status:'ALREADY_CLAIMED'});continue;}
  try{
   let report;
   if(kind==='collect')report=await collect(env.DB,now);
   else{
    if(!env.RESEARCH_ENGINE)throw Error('PRIVATE_ENGINE_REQUIRED');
    const response=await env.RESEARCH_ENGINE.fetch(new Request('https://private-research.internal/research',{
     method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,as_of:slot})}));
    if(!response.ok)throw Error('PRIVATE_ENGINE_UNAVAILABLE');
    const text=await response.text();if(text.length>16000)throw Error('INVALID_ENGINE_CONTRACT');
    report=safeReport(JSON.parse(text),kind);
   }
   await finish(env.DB,kind,slot,owner,report);outcomes.push({kind,status:'DONE'});
  }catch{
   await finish(env.DB,kind,slot,owner,null,'RESEARCH_JOB_FAILED');outcomes.push({kind,status:'ERROR'});
  }
 }
 return {outcomes};
}
