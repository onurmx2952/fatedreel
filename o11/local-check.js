// Account-free, offline checking. Unknown paraphrases are explicitly ungraded.
import {normalizedTranscript} from './activities.js?v=2';
import {referenceTranslations,meaningFeedback} from './meaning-check.js?v=12';
import {alignWords,explainAnswer} from './feedback.js?v=11';
export function localFeedback(result){if(!result.ungraded)return meaningFeedback(result);return meaningFeedback({...result,notes:[]})+'<p class="section-note">Bu farklı ifadeyi kesin değerlendiremiyorum; yanlış saymadım.</p>'+meaningFeedback({corrected:result.notes[0].split("Örnek çeviri: ")[1]||"",errors:[],notes:[]});}
const norm=s=>normalizedTranscript(s).replace(/\bright now\b/g,'now').replace(/\bpurchased\b/g,'bought').replace(/\bwould you like\b/g,'do you want').replace(/\bat home\b/g,'home').replace(/^(now) (.+)$/,'$2 $1');
const grammatical=new Set('am is are was were be been being have has had do does did will would can could should must a an the to for about at in on of from with by not'.split(' '));
const verbGroups=['go goes went gone going','cook cooks cooked cooking make makes made making prepare prepares prepared preparing','work works worked working','wait waits waited waiting','eat eats ate eaten eating','come comes came coming','buy buys bought buying purchased','see sees saw seen seeing','think thinks thought thinking','read reads reading','write writes wrote written writing','live lives lived living','have has had having','want wants wanted wanting'];
const related=(a,b)=>verbGroups.some(group=>group.split(' ').includes(a)&&group.split(' ').includes(b));
const opposites=[['hot','cold'],['man','woman'],['boy','girl'],['yesterday','now'],['today','yesterday']];
const typo={diner:'dinner',fone:'phone',becaus:'because',tommorow:'tomorrow',yestarday:'yesterday',recieve:'receive',freind:'friend',thier:'their'};
function definite(e,words){
 if(e.kind==='replace')return typo[e.actual]===e.expected||related(e.actual,e.expected)||opposites.some(pair=>pair.includes(e.actual)&&pair.includes(e.expected))||(['am','is','are','was','were','has','have','does','do'].includes(e.actual)&&['am','is','are','was','were','has','have','does','do'].includes(e.expected))||(/s$/.test(e.expected)&&e.expected.slice(0,-1)===e.actual&&words.some(w=>/^(two|three|four|five|many|several)$/.test(w)));
 if(e.kind==='missing')return ['am','is','are','was','were'].includes(e.expected)&&/ing$/.test(words[e.at+1]||'')||(['for','about','to'].includes(e.expected)&&/^(wait\w*|think\w*|talk\w*|listen\w*)$/.test(words[e.at-1]||''));
 return e.kind==='extra'&&e.actual==='to'&&words[e.at]==='home';
}
export async function localMeaningCheck(q,student){
 const turkish=q.turkish||q.hint||'';
 const references=[...new Set((q.accepted||[q.answer,...(q.accept||[])]).flatMap(ref=>referenceTranslations(turkish,ref)))];
 const actual=norm(student);
 if(references.some(ref=>norm(ref)===actual))return {correct:true,errors:[],notes:[],corrected:student};
 const candidates=references.map(answer=>({answer,...alignWords(actual.split(' '),norm(answer).split(' '))})).sort((a,b)=>a.cost-b.cost);
 const best=candidates[0],words=norm(best.answer).split(' '),edits=best.edits;
 // A reference mismatch alone never establishes a grammar error.
 const reorder=actual.split(' ').sort().join(' ')===words.slice().sort().join(' ')&&/\?$/.test(best.answer)&&/^(where|when|what|why|how|do|does|did|is|are|can)\b/.test(actual);
 const certain=reorder||edits.length>0&&edits.every(e=>definite(e,words));
 if(!certain)return {correct:true,errors:[],notes:['Bu farklı ifadeyi kesin değerlendiremiyorum. Örnek çeviri: '+best.answer],corrected:student,ungraded:true};
 const errors=reorder?[{type:'grammar',original:student,fix:best.answer,explanation_tr:'Soruda yardımcı fiil özneden önce gelir: "'+best.answer+'".'}]:edits.map(e=>{
  const type=typo[e.actual]===e.expected?'spelling':opposites.some(pair=>pair.includes(e.actual)&&pair.includes(e.expected))?'wrong_meaning':'grammar';
  let explanation_tr;
  if(e.actual==='diner'&&e.expected==='dinner')explanation_tr='"diner" lokanta demek. Akşam yemeği için "dinner" yazılır.';
  else if(type==='spelling')explanation_tr='"'+e.actual+'" yerine "'+e.expected+'" yazılır.';
  else if(related(e.actual,e.expected)||type==='wrong_meaning')explanation_tr='"'+e.actual+'" burada Türkçe cümlenin anlamını karşılamıyor. "'+turkish+'" için "'+e.expected+'" kullanılır.';
  else {const lines=explainAnswer(student,{...q,answer:best.answer}).split('\n');explanation_tr=lines.find(line=>line.startsWith('“'+(e.actual||e.expected)+'”'))||lines[0];}
  return {type,original:e.actual||'',fix:e.expected||'',explanation_tr};
 });
 return {correct:errors.length===0,errors:[...new Map(errors.map(e=>[e.explanation_tr,e])).values()],notes:[],corrected:best.answer};
}
