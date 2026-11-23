const EXPECTED_HASH='f26f7d3862854ff89a2c9ae0d6f0422bca695ac11b7e441d886b418d17fd903c';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function pocketEndpoint({request,env}){
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';
 if(token.length<32||token.length>200)return reply({error:'unauthorized'},401);
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(hash!==EXPECTED_HASH)return reply({error:'unauthorized'},401);
 if(!env.PROGRAM_DB)return reply({error:'unavailable'},503);
 await env.PROGRAM_DB.prepare('CREATE TABLE IF NOT EXISTS pocket_tts_endpoint (id INTEGER PRIMARY KEY CHECK(id=1), url TEXT NOT NULL, updated_at INTEGER NOT NULL)').run();
 if(request.method==='POST'){
  if(Number(request.headers.get('Content-Length')||0)>2048)return reply({error:'too_large'},413);
  let body;try{body=await request.json();}catch{return reply({error:'invalid'},400);}
  let u;try{u=new URL(body.url);}catch{return reply({error:'invalid_url'},400);}
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.pathname!=='/'||u.search||u.hash||!/(?:^|\.)(?:ngrok-free\.app|ngrok\.app|ngrok-free\.dev|ngrok\.dev|trycloudflare\.com)$/.test(u.hostname))return reply({error:'invalid_url'},400);
  await env.PROGRAM_DB.prepare('INSERT INTO pocket_tts_endpoint(id,url,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET url=excluded.url,updated_at=excluded.updated_at').bind(u.origin,Date.now()).run();
  return reply({ok:true});
 }
 if(request.method==='GET'){
  const row=await env.PROGRAM_DB.prepare('SELECT url,updated_at FROM pocket_tts_endpoint WHERE id=1').first();
  if(!row||Date.now()-row.updated_at>90000)return reply({error:'offline'},503);
  return reply(row);
 }
 return reply({error:'method'},405);
}
