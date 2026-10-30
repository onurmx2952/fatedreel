// Live Workers AI flow, enabled after the real 20-case evaluation passed.
// Service failures never fall back to reference-word grading.
import {answerForms} from './activities.js?v=2';
const escape=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const thirdToBase={is:'are',was:'were',has:'have',does:'do',cooks:'cook',makes:'make',prepares:'prepare',works:'work',calls:'call',needs:'need',wants:'want',likes:'like',knows:'know',lives:'live',goes:'go',comes:'come',takes:'take',gives:'give',leaves:'leave',uses:'use',drinks:'drink',eats:'eat',buys:'buy',pays:'pay',waits:'wait',looks:'look',hears:'hear',speaks:'speak',sends:'send',says:'say',tells:'tell',plays:'play',reads:'read',studies:'study',watches:'watch'};
const baseToThird=Object.fromEntries(Object.entries(thirdToBase).map(([a,b])=>[b,a]));
export function referenceTranslations(turkish,reference){
 const refs=new Set([reference]);
 const explicit=/kadın|adam|erkek|kız|annem|annesi|babam|babası|abla|ağabey|ayşe|mehmet/i.test(turkish);
 if(!explicit&&!/onlar|onların/i.test(turkish)){
  const [s,d]=answerForms(reference);
  const expanded=reference.replace(/^(he|she)'s\s+/i,`$1 ${s} `).replace(/^(he|she)'d\s+/i,`$1 ${d} `).replace(/^they're\s+/i,'They are ').replace(/^they've\s+/i,'They have ');
  const match=expanded.match(/^(he|she|they)\s+(\S+)(.*)$/i);
  if(match){
   const [,subject,verb,rest]=match;
   for(const target of ['He','She','They']){
    const fromThey=subject.toLowerCase()==='they',toThey=target==='They';
    const form=fromThey===toThey?verb:toThey?(thirdToBase[verb.toLowerCase()]||verb):(baseToThird[verb.toLowerCase()]||verb);
    refs.add(`${target} ${form}${rest}`);
   }
  }
 }
 for(const ref of [...refs]){
  const match=ref.match(/\b(cooking|making|preparing|cooks|makes|prepares|cook|make|prepare) dinner\b/i);
  if(!match)continue;
  const word=match[1].toLowerCase();const variants=word.endsWith('ing')?['cooking','making','preparing']:word.endsWith('s')?['cooks','makes','prepares']:['cook','make','prepare'];
  for(const variant of variants)refs.add(ref.replace(match[0],variant+' dinner'));
 }
 return [...refs].slice(0,12);
}
export function parseMeaningResult(value,student){
 if(!value||typeof value.correct!=='boolean'||!Array.isArray(value.errors)||value.errors.length>20||!Array.isArray(value.notes)||value.notes.some(x=>typeof x!=='string')||typeof value.corrected!=='string'||!value.corrected.trim())throw Error('invalid_response');
 for(const e of value.errors)if(!e||!['spelling','grammar','wrong_meaning'].includes(e.type)||['original','fix','explanation_tr'].some(k=>typeof e[k]!=='string'))throw Error('invalid_response');
 const correct=value.errors.length===0;
 return {correct,errors:value.errors,notes:value.notes,corrected:correct?student:value.corrected};
}
export async function requestMeaningCheck(question,student,{fetcher=fetch,signal}={}){
 const turkish=question.turkish||question.hint;
 const accepted=question.accepted||referenceTranslations(turkish,question.answer);
 const controller=new AbortController();
 const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();
 const timer=setTimeout(abort,28000);
 try{
  const response=await fetcher('/api/o11/check',{method:'POST',signal:controller.signal,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({turkish,accepted,student})});
  if(!response.ok)throw Error(response.status===503?'model_not_configured':response.status===429?'rate_limited':'check_unavailable');
  return parseMeaningResult(await response.json(),student);
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export function meaningFeedback(result){
 return `<p lang="en">${escape(result.corrected)}</p>${result.errors.map(e=>`<p class="sentence-correction">${escape(e.explanation_tr)}</p>`).join('')}${result.notes.length?`<details class="grammar-notes"><summary>Notlar</summary>${result.notes.map(n=>`<p>${escape(n)}</p>`).join('')}</details>`:''}`;
}
