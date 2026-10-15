export function configured(env){return typeof env.DASHBOARD_USER==='string'&&/^[A-Za-z0-9_-]{3,64}$/.test(env.DASHBOARD_USER)&&typeof env.DASHBOARD_PASSWORD==='string'&&/^[\x21-\x7e]{20,256}$/.test(env.DASHBOARD_PASSWORD);}
export async function authorized(request,env){
 if(!configured(env))return false;
 const h=request.headers.get('authorization')||'';if(h.length>512||!/^Basic [A-Za-z0-9+/=]+$/.test(h))return false;
 let supplied;try{supplied=atob(h.slice(6));}catch{return false;}
 const digest=async text=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
 const a=await digest(supplied),b=await digest(env.DASHBOARD_USER+':'+env.DASHBOARD_PASSWORD);
 let diff=0;for(let i=0;i<32;i++)diff|=a[i]^b[i];return diff===0;
}
