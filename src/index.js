// Public, read-only deployment shell. No trading, database writes or model execution.
const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(request.method!=="GET")return new Response("Method not allowed",{status:405});
  if(path!=="/health")return new Response("Not found",{status:404});
  return new Response(JSON.stringify({
   service:"moa-invest-research",
   state:"DEPLOYMENT_SHELL_ONLY",
   research_enabled:false,
   data_collection:false,
   retraining:false,
   strategy_discovery:false,
   live_trading:false
  }),{headers});
 },
 async scheduled(_event,_env,_ctx){
  // Deliberately disabled. Never trade or fetch paid APIs.
  return;
 }
};
