import fs from 'node:fs/promises';
import {checkTranslation,normalizeVerdict} from '../../functions/_lib/o11-grammar.js';
const cases=JSON.parse(await fs.readFile(new URL('./grammar-cases.json',import.meta.url),'utf8'));
const endpoint=process.argv[2];
const results=[];
for(const c of cases){
 const input={turkish:c.turkish,accepted:c.accepted,student:c.student};
 try{
  let verdict;
  if(endpoint){const response=await fetch(endpoint,{method:'POST',headers:{Origin:new URL(endpoint).origin,'Content-Type':'application/json'},body:JSON.stringify(input)});if(!response.ok)throw Error(`HTTP ${response.status}: ${JSON.stringify(await response.json())}`);verdict=normalizeVerdict(await response.json(),input);}
  else verdict=await checkTranslation(input,process.env);
  const passed=verdict.correct===c.correct&&(!c.errorType||verdict.errors.some(e=>e.type===c.errorType))&&(!c.fix||verdict.errors.some(e=>e.fix.toLowerCase()===c.fix));
  results.push({id:c.id,passed,expected:c.correct,verdict});console.log(`${passed?'PASS':'FAIL'} ${c.id}`);
 }catch(error){
  console.error(`NOT EVALUATED ${c.id}: ${error.message}`);
  console.error(`${results.length}/${cases.length} sentences evaluated; no model success claimed.`);
  process.exitCode=2;break;
 }
}
const falsePositives=results.filter(r=>r.expected&&!r.verdict.correct).length;
console.log(JSON.stringify({evaluated:results.length,total:cases.length,passed:results.filter(r=>r.passed).length,falsePositives},null,2));
if(process.env.O11_EVAL_REPORT)await fs.writeFile(process.env.O11_EVAL_REPORT,JSON.stringify({at:new Date().toISOString(),results},null,2));
if(results.length!==cases.length||results.some(r=>!r.passed))process.exitCode=process.exitCode||1;
