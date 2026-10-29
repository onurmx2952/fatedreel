import {checkTranslation,consumeGrammarAllowance,grammarConfiguration,validateInput} from '../../_lib/o11-grammar.js';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
export async function onRequest({request,env}){
 const config=grammarConfiguration(env);
 if(request.method==='GET')return json(config);
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const origin=request.headers.get('Origin');
 if(origin!==new URL(request.url).origin)return json({error:'origin_rejected'},403);
 if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'invalid_content_type'},415);
 if(!config.ready)return json({error:config.reason,message:'Anlam kontrolü henüz bağlanmadı.'},503);
 let input;
 try{
  const raw=await request.text();if(new TextEncoder().encode(raw).length>8192)return json({error:'input_too_large'},413);
  input=validateInput(JSON.parse(raw));
 }catch{return json({error:'invalid_input'},400);}
 try{
  await consumeGrammarAllowance(request,env);
  return json(await checkTranslation(input,env));
 }catch(error){
  if(error.message==='rate_limited')return json({error:'rate_limited',message:'Kısa bir ara verip yeniden dene.'},429);
  return json({error:'check_unavailable',message:'Cümlen kontrol edilemedi. Yeniden deneyebilirsin.'},502);
 }
}
