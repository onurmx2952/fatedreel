import dataset from '../../../o14/scenes.json';
import {consumeGrammarAllowance} from '../../_lib/o11-grammar.js';
import {checkScenario} from '../../_lib/o14-practice.js';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers});
export async function onRequest({request,env}){
 const ready=typeof env.AI?.run==='function'&&Boolean(env.PROGRAM_DB);
 if(request.method==='GET')return json({ready,contextual:true});
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'origin_rejected'},403);
 if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'invalid_content_type'},415);
 if(!ready)return json({error:'model_not_configured'},503);
 let turn,scene,student;
 try{const raw=await request.text();if(new TextEncoder().encode(raw).length>4096)return json({error:'input_too_large'},413);const v=JSON.parse(raw);if(typeof v.turnId!=='string'||typeof v.student!=='string'||!v.student.trim()||v.student.length>600)throw Error('invalid');scene=dataset.scenes.find(s=>s.turns.some(t=>t.id===v.turnId));turn=scene?.turns.find(t=>t.id===v.turnId);student=v.student.trim();if(!turn)throw Error('invalid');}catch{return json({error:'invalid_input'},400);}
 try{await consumeGrammarAllowance(request,env);return json(await checkScenario(turn,scene,student,env));}catch(error){return json({error:error.message==='rate_limited'?'rate_limited':'check_unavailable'},error.message==='rate_limited'?429:502);}
}
