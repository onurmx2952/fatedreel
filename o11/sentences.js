import {explainAnswer} from './feedback.js?v=11';
export {explainAnswer};
import {normalizeAnswer,normalizedTranscript,answerMatches,shuffle} from './activities.js?v=2';
export {answerMatches,normalizeAnswer};
const html=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function buildSentences(book) {
 const pool=new Map();
 for(const u of book.units){
  u.examples.forEach((s,i)=>{
   const id=`${u.id}:examples:${i}`;
   pool.set(id,{id,unit:u.id,answer:s.en,audio:s.audio,hint:s.tr,glossary:Object.fromEntries(u.words.map(([en,tr])=>[en.toLowerCase(),tr])),why:u.rules[0][1]});
  });
 }
 return pool;
}
export function tenseOf(text) {
 const s=normalizedTranscript(text);
 if(/\b(was|were)\b(?: not)?\s+\w+ing\b/.test(s))return 'past-continuous';
 if(/\b(was|were)\b/.test(s))return 'past-be';
 if(/\b(am|is|are) going to\b/.test(s)||/\bwill\b/.test(s))return 'future';
 if(/\b(have|has)\b.*\b(been|gone|done|seen|heard|finished|arrived|eaten|lived|got)\b/.test(s))return 'perfect';
 if(/\b(am|is|are)\b(?: not)?\s+\w+ing\b/.test(s))return 'present-continuous';
 if(/\b(did|went|called|watched|arrived|left|saw|forgot|got|told|asked|decided|finished|said|thought|made|stayed|talked)\b/.test(s))return 'past-simple';
 return 'present';
}
export function makeRound(pool,unit) {
 const all=[...pool.values()];
 const own=shuffle(all.filter(q=>q.unit===unit));
 const ownTexts=new Set(own.map(q=>normalizeAnswer(q.answer)));
 const previous=shuffle(all.filter(q=>q.unit<unit&&!ownTexts.has(normalizeAnswer(q.answer))));
 const ownTenses=new Set(own.map(q=>tenseOf(q.answer)));
 previous.sort((a,b)=>Number(ownTenses.has(tenseOf(a.answer)))-Number(ownTenses.has(tenseOf(b.answer))));
 const review=[],seen=new Set(),units=new Set();
 for(const varied of [true,false])for(const q of previous){
  const text=normalizeAnswer(q.answer);
  if(review.length===5)break;
  if(seen.has(text)||(varied&&units.has(q.unit)))continue;
  review.push(q);seen.add(text);units.add(q.unit);
 }
 return shuffle([...own.slice(0,review.length?10:15),...review]).map(q=>q.id);
}
export function createSentencePractice({book,state,save,update,play,stop=()=>{},check=null,renderResult=null}) {
 if(check&&typeof renderResult!=='function')throw Error('meaning_renderer_required');
 const pool=buildSentences(book);
 let inFlight=null;
 const cancelCheck=()=>{inFlight?.controller.abort();inFlight=null;};
 if(!state.sentencePractice||typeof state.sentencePractice!=='object'||Array.isArray(state.sentencePractice))state.sentencePractice={};
 function begin(){const s={version:3,edition:book.practiceEdition,checker:check?'meaning-v1':'dictation-v1',refs:makeRound(pool,state.unit),pos:0,work:{},started:Date.now()};state.sentencePractice[state.unit]=s;save();return s;}
 function session(){let s=state.sentencePractice[state.unit];
  if(!s||s.version!==3||s.edition!==book.practiceEdition||(check&&s.checker!=='meaning-v1')||!Array.isArray(s.refs)||s.refs.length!==15||new Set(s.refs).size!==s.refs.length||!s.refs.every(id=>pool.has(id)&&pool.get(id).unit<=state.unit)||!Number.isInteger(s.pos)||s.pos<0||s.pos>s.refs.length||!s.work||typeof s.work!=='object'||Array.isArray(s.work)){
   if(s&&(s.version===2||s.edition!==book.practiceEdition||(check&&s.checker!=='meaning-v1'))){if(!state.sentencePracticePrevious||typeof state.sentencePracticePrevious!=='object'||Array.isArray(state.sentencePracticePrevious))state.sentencePracticePrevious={};if(!state.sentencePracticePrevious[state.unit])state.sentencePracticePrevious[state.unit]=s;else{if(!state.sentencePracticeHistory||typeof state.sentencePracticeHistory!=='object'||Array.isArray(state.sentencePracticeHistory))state.sentencePracticeHistory={};state.sentencePracticeHistory[state.unit+':'+(s.edition||'v'+s.version)]=s;}}
   s=begin();
  }
  return s;
 }
 function work(s,q){
  let w=s.work[q.id];if(!w||typeof w!=='object'||Array.isArray(w))w=s.work[q.id]={text:'',revealed:false,translated:false};if(typeof w.text!=='string')w.text='';
  if(check&&w.result){
   if(!Array.isArray(w.result.errors)||!Array.isArray(w.result.notes)||w.result.notes.some(n=>typeof n!=='string')||typeof w.result.corrected!=='string'||w.result.errors.some(e=>!e||!['spelling','grammar','wrong_meaning'].includes(e.type)||['original','fix','explanation_tr'].some(k=>typeof e[k]!=='string'))){delete w.result;w.revealed=false;w.checkError=true;}
   else{w.result.correct=w.result.errors.length===0;if(w.result.correct)w.result.corrected=w.text;}
  }
  if(check&&w.revealed&&w.text.trim()&&!w.result){w.revealed=false;w.checkError=true;}
  return w;
 }
 function context(){if(state.tab!=='practice')return null;const s=session(),q=pool.get(s.refs[s.pos]);return {s,q,w:q?work(s,q):null};}
 function completed(){return `<section class="drill-summary" aria-label="Alıştırma tamamlandı"><div class="progress-label"><span>TAMAMLANDI</span><span>15 / 15</span></div><h2>Alıştırma bitti.</h2><p>15 cümlelik turu tamamladın.</p><div class="action-row"><button type="button" class="primary" data-act-restart>Yeni 15 cümle</button><button type="button" class="outline" data-tab="lesson">Konu anlatımına dön</button></div></section>`;}
 function content(){const s=session();if(s.pos===s.refs.length)return completed();const q=pool.get(s.refs[s.pos]),w=work(s,q),pending=inFlight?.s===s&&inFlight?.id===q.id;save();return `<div class="section-title"><span class="section-index">03</span><h2>Dinle. Yaz. Karşılaştır.</h2></div><p class="section-note">${check?'Dinle veya Türkçesini aç, kendi İngilizce cümleni yaz.':'Duyduğun cümleyi yaz.'} ${state.unit===1?'Bu turda 15 cümle bu konudan gelir.':'10 cümle bu konudan, 5 cümle önceki konulardan gelir.'}</p><section class="drill sentence-practice" aria-label="Cümle alıştırması"><div class="progress-label"><span>CÜMLE ALIŞTIRMASI</span><span>${s.pos+1} / ${s.refs.length}</span></div><div class="track"><span style="width:${s.pos/s.refs.length*100}%"></span></div><div class="sentence-practice-tools"><button type="button" class="primary drill-listen" data-act-audio="${q.audio}">◖ Dinle</button><button type="button" class="outline" data-act-translation aria-expanded="${!!w.translated}" aria-controls="practice-translation">Türkçesi</button></div><p id="practice-translation" class="practice-translation" ${w.translated?'':'hidden'}>${html(q.hint)}</p><form id="drill-form"><label class="drill-label" for="drill-input">Senin cümlen</label><textarea id="drill-input" data-act-input autocomplete="off" autocapitalize="sentences" spellcheck="false" maxlength="1000" placeholder="Duyduğun cümleyi buraya yaz…" ${w.revealed||pending?'readonly':''}>${html(w.text)}</textarea><div class="action-row"><button type="submit" class="outline drill-check" aria-expanded="${!!w.revealed}" aria-controls="practice-solution" ${w.revealed||pending?'disabled':''}>${pending?'Kontrol ediliyor…':w.checkError?'Tekrar dene':'Çözüm'}</button></div>${w.revealed?`<div id="practice-solution" class="drill-feedback" role="status">${check?(w.result&&renderResult?renderResult(w.result):`<p lang="en">${html(q.answer)}</p>`):`<p lang="en">${html(q.answer)}</p>${explainAnswer(w.text,q).split('\n').filter(Boolean).map(line=>`<p class="sentence-correction">${html(line)}</p>`).join('')}`}</div>`:''}${w.checkError?`<p class="section-note" role="alert">Cümlen kontrol edilemedi. Yeniden deneyebilirsin.</p>`:''}<div class="action-row practice-next"><button type="button" class="primary" data-act-next>${s.pos===s.refs.length-1?'Alıştırmayı bitir':'Sonraki cümle →'}</button></div></form></section>`;}
 function click(event){const b=event.target.closest('button');if(!b)return;const ctx=context();if(!ctx)return;const {s,q,w}=ctx;
  if(b.hasAttribute('data-act-restart')){cancelCheck();stop();begin();update('restart');return;}
  if(!q)return;
  if(b.dataset.actAudio){play(q.audio,b);return;}
  if(b.hasAttribute('data-act-translation')){w.translated=!w.translated;save();update('translation');return;}
  if(b.hasAttribute('data-act-next')){cancelCheck();stop();w.skipped=!w.revealed;w.correct=check?(w.result?.correct??null):!!w.text.trim()&&w.revealed&&answerMatches(w.text,q);s.pos++;if(s.pos===s.refs.length){const good=s.refs.every(id=>s.work[id]?.correct),old=state.reviews[state.unit]?.streak||0;state.reviews[state.unit]={due:Date.now()+(good?Math.min(14,2**old):1)*86400000,streak:good?old+1:0,results:s.refs.map(id=>s.work[id]?.correct?'good':s.work[id]?.correct===null?'hard':'again')};s.finished=Date.now();}save();update('next');}
 }
 function input(event){if(!event.target.matches('[data-act-input]'))return;const ctx=context();if(!ctx?.w||ctx.w.revealed||(inFlight?.s===ctx.s&&inFlight?.id===ctx.q.id))return;ctx.w.text=event.target.value.slice(0,1000);save();}
 async function submit(event){
  if(event.target.id!=='drill-form')return;event.preventDefault();const ctx=context();
  if(!ctx?.w||ctx.w.revealed||(inFlight?.s===ctx.s&&inFlight?.id===ctx.q.id))return;
  const {s,q,w}=ctx;
  if(!check||!w.text.trim()){w.revealed=true;save();update('solution');return;}
  cancelCheck();const unit=state.unit,token={s,id:q.id,student:w.text,controller:new AbortController()};inFlight=token;delete w.checkError;update('checking');
  try{
   const result=await check(q,token.student,{signal:token.controller.signal});
   if(inFlight!==token)return;
   if(!result||!Array.isArray(result.errors))throw Error('invalid_result');
   w.result={...result,correct:result.errors.length===0,corrected:result.errors.length?result.corrected:token.student};w.revealed=true;save();
  }catch{if(inFlight!==token)return;w.checkError=true;save();}
  finally{
   if(inFlight===token){inFlight=null;if(state.unit===unit&&state.tab==='practice'&&state.sentencePractice[unit]===s&&s.refs[s.pos]===q.id)update(w.checkError?'check-error':'solution');}
  }
 }
 return {content,click,input,submit,pool};
}
