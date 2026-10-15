import {configured,authorized} from './auth.js';
import {page,script} from './dashboard.js';
import {run} from './scheduler.js';
import {safeReport} from './contract.js';
const HEADERS={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"};
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{...HEADERS,'Content-Type':'application/json; charset=utf-8'}});}
export default {
 async fetch(request,env){
  if(new URL(request.url).protocol!=='https:')return new Response('HTTPS required',{status:400,headers:HEADERS});
  const path=new URL(request.url).pathname;
  if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:HEADERS});
  if(path==='/health')return json({service:'moa-invest-research',state:'INTEGRATION_STAGED',research_enabled:env.RESEARCH_ENABLED==='true',live_trading:false,automatic_adoption:false});
  if(!configured(env))return json({error:'configuration_required'},503);
  if(!await authorized(request,env))return new Response('Authentication required',{status:401,headers:{...HEADERS,'WWW-Authenticate':'Basic realm="MOA Research"'}});
  if(path==='/')return new Response(page,{headers:{...HEADERS,'Content-Type':'text/html; charset=utf-8'}});
  if(path==='/app.js')return new Response(script,{headers:{...HEADERS,'Content-Type':'application/javascript; charset=utf-8'}});
  if(path==='/api/research'){
   try{
    if(!env.DB)throw Error();
    const rows=await env.DB.prepare('SELECT symbol,MAX(open_time) latest,COUNT(*) observations FROM research_candles GROUP BY symbol').all();
    const reports={market:rows.results||[],daily:null,weekly:null,automatic_adoption:false};
    for(const kind of ['daily','weekly']){const r=await env.DB.prepare('SELECT payload_json FROM research_reports WHERE kind=? ORDER BY slot DESC LIMIT 1').bind(kind).first();if(r)reports[kind]=safeReport(JSON.parse(r.payload_json),kind);}
    return json(reports);
   }catch{return json({error:'research_unavailable'},503);}
  }
  return new Response('Not found',{status:404,headers:HEADERS});
 },
 async scheduled(event,env,ctx){const promise=run(env,event.scheduledTime);if(ctx?.waitUntil)ctx.waitUntil(promise);else return await promise;}
};
