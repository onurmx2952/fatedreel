import {explainAnswer} from './feedback.js?v=9';
export {explainAnswer};
import {normalizeAnswer,answerMatches,shuffle} from './activities.js?v=1';
export {answerMatches,normalizeAnswer};
const html=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function buildSentences(book) {
 const pool=new Map();
 for(const u of book.units){
  const seen=new Set();
  for(const [kind,items] of [['examples',u.examples],['dialogue',u.dialogue]])items.forEach((s,i)=>{
   const normalized=normalizeAnswer(s.en);
   // Short replies depend on dialogue context; prefer complete sentences.
   if(seen.has(normalized)||/^(yes|no|of course|because|sorry)\b/i.test(s.en)||normalized.split(' ').length<3)return;
   seen.add(normalized);
   const id=`${u.id}:${kind}:${i}`;
   pool.set(id,{id,unit:u.id,answer:s.en,audio:s.audio,hint:s.tr,glossary:Object.fromEntries(u.words.map(([en,tr])=>[en.toLowerCase(),tr])),why:u.exercises.find(x=>normalizeAnswer(x.en)===normalized)?.why||sentenceRule(s.en,u)});
  });
 }
 return pool;
}
export function tenseOf(text) {
 const s=normalizeAnswer(text);
 if(/\b(was|were)\b(?: not)?\s+\w+ing\b/.test(s))return 'past-continuous';
 if(/\b(was|were)\b/.test(s))return 'past-be';
 if(/\b(am|is|are) going to\b/.test(s)||/\bwill\b/.test(s))return 'future';
 if(/\b(have|has)\b.*\b(been|gone|done|seen|heard|finished|arrived|eaten|lived|got)\b/.test(s))return 'perfect';
 if(/\b(am|is|are)\b(?: not)?\s+\w+ing\b/.test(s))return 'present-continuous';
 if(/\b(did|went|called|watched|arrived|left|saw|forgot|got|told|asked|decided|finished|said|thought|made|stayed|talked)\b/.test(s))return 'past-simple';
 return 'present';
}
function sentenceRule(text,unit) {
 const tense=tenseOf(text),s=normalizeAnswer(text);
 if(tense==='past-continuous')return 'Geçmişte o sırada devam eden hareket: was/were + fiil-ing. I/he/she/it ile was, you/we/they ile were kullanılır. Soruda was/were öznenin önüne gelir.';
 if(tense==='past-be')return 'Geçmişte durum, özellik veya yer: I/he/she/it ile was; you/we/they ile were. Hareket fiilinin geçmiş biçiminden önce ayrıca was/were eklenmez. Wasn’t/weren’t olumsuzluk bildirir.';
 if(tense==='present-continuous'&&!/\bgoing to\b/.test(s))return 'Şu anda veya bu dönemde devam eden hareket için am/is/are + fiil-ing kullanılır. Soruda am/is/are öznenin önüne gelir; olumsuzlukta not eklenir.';
 if(tense==='past-simple')return 'Geçmişte tamamlanan olay: olumlu cümlede fiilin geçmiş biçimi kullanılır. Did/didn’t ile kurulan soru ve olumsuzlarda asıl fiil yalın biçimde kalır.';
 if(tense==='future')return /\bgoing to\b/.test(s)?'Plan veya mevcut belirtiye dayanan gelecek: am/is/are + going to + yalın fiil. Özneye uygun am/is/are biçimini koru.':'Will/won’t sonrasında fiilin yalın biçimi gelir. Will ile anlık karar, teklif veya gelecek hakkında tahmin anlatılabilir.';
 if(tense==='perfect')return 'Have/has + fiilin üçüncü biçimi: geçmişte olanın şimdiyle bağlantısını kurar. He/she/it ile has, diğer öznelerle have kullanılır.';
 return unit.rules[0][1];
}
export function makeRound(pool,unit) {
 const all=[...pool.values()];
 const belongs=q=>unit===17?/\b(was|were|wasn't|weren't)\b/i.test(q.answer):unit===18?tenseOf(q.answer)==='past-continuous':unit===19?/\b(will|won't)\b/i.test(q.answer):unit===20?/\bgoing to\b/i.test(q.answer):true;
 const own=shuffle(all.filter(q=>q.unit===unit&&belongs(q)));
 const ownTexts=new Set(own.map(q=>normalizeAnswer(q.answer)));
 const previous=shuffle(all.filter(q=>q.unit<unit&&!ownTexts.has(normalizeAnswer(q.answer))));
 const ownTenses=new Set(own.map(q=>tenseOf(q.answer)));
 previous.sort((a,b)=>Number(ownTenses.has(tenseOf(a.answer)))-Number(ownTenses.has(tenseOf(b.answer))));
 const review=[],seen=new Set(),units=new Set();
 for(const varied of [true,false])for(const q of previous){
  const text=normalizeAnswer(q.answer);
  if(review.length===3)break;
  if(seen.has(text)||(varied&&units.has(q.unit)))continue;
  review.push(q);seen.add(text);units.add(q.unit);
 }
 return shuffle([...own.slice(0,review.length?7:10),...review]).map(q=>q.id);
}
export function createSentencePractice({book,state,save,update,play,stop=()=>{}}) {
 const pool=buildSentences(book);
 if(!state.sentencePractice||typeof state.sentencePractice!=='object'||Array.isArray(state.sentencePractice))state.sentencePractice={};
 function begin(){const s={version:2,refs:makeRound(pool,state.unit),pos:0,work:{},started:Date.now()};state.sentencePractice[state.unit]=s;save();return s;}
 function session(){let s=state.sentencePractice[state.unit];
  if(!s||s.version!==2||!Array.isArray(s.refs)||!s.refs.length||s.refs.length>10||new Set(s.refs).size!==s.refs.length||!s.refs.every(id=>pool.has(id)&&pool.get(id).unit<=state.unit)||!Number.isInteger(s.pos)||s.pos<0||s.pos>=s.refs.length||!s.work||typeof s.work!=='object'||Array.isArray(s.work))s=begin();
  return s;
 }
 function work(s,q){let w=s.work[q.id];if(!w||typeof w!=='object'||Array.isArray(w))w=s.work[q.id]={text:'',revealed:false,translated:false};if(typeof w.text!=='string')w.text='';return w;}
 function context(){if(state.tab!=='practice')return null;const s=session(),q=pool.get(s.refs[s.pos]);return {s,q,w:work(s,q)};}
 function content(){const s=session(),q=pool.get(s.refs[s.pos]),w=work(s,q);save();return `<div class="section-title"><span class="section-index">03</span><h2>Dinle. Yaz. Karşılaştır.</h2></div><p class="section-note">Duyduğun İngilizce cümleyi yaz. İstersen Türkçesini aç.</p><section class="drill sentence-practice" aria-label="Cümle alıştırması"><div class="progress-label"><span>CÜMLE ALIŞTIRMASI</span><span>${s.pos+1} / ${s.refs.length}</span></div><div class="track"><span style="width:${s.pos/s.refs.length*100}%"></span></div><div class="sentence-practice-tools"><button type="button" class="primary drill-listen" data-act-audio="${q.audio}">◖ Dinle</button><button type="button" class="outline" data-act-translation aria-expanded="${!!w.translated}" aria-controls="practice-translation">Türkçesi</button></div><p id="practice-translation" class="practice-translation" ${w.translated?'':'hidden'}>${html(q.hint)}</p><form id="drill-form"><label class="drill-label" for="drill-input">Senin cümlen</label><textarea id="drill-input" data-act-input autocomplete="off" autocapitalize="sentences" spellcheck="false" maxlength="1000" placeholder="Duyduğun cümleyi buraya yaz…" ${w.revealed?'readonly':''}>${html(w.text)}</textarea><div class="action-row"><button type="submit" class="outline drill-check" aria-expanded="${!!w.revealed}" aria-controls="practice-solution" ${w.revealed?'disabled':''}>Çözüm</button></div>${w.revealed?`<div id="practice-solution" class="drill-feedback" role="status"><p lang="en">${html(q.answer)}</p>${explainAnswer(w.text,q).split('\n').filter(Boolean).map(line=>`<p class="sentence-correction">${html(line)}</p>`).join('')}</div>`:''}<div class="action-row practice-next"><button type="button" class="primary" data-act-next>Sonraki cümle →</button></div></form></section>`;}
 function click(event){const b=event.target.closest('button');if(!b)return;const ctx=context();if(!ctx)return;const {s,q,w}=ctx;
  if(b.dataset.actAudio){play(q.audio,b);return;}
  if(b.hasAttribute('data-act-translation')){w.translated=!w.translated;save();update('translation');return;}
  if(b.hasAttribute('data-act-next')){stop();w.skipped=!w.revealed;w.correct=!!w.text.trim()&&w.revealed&&answerMatches(w.text,q);s.pos++;if(s.pos===s.refs.length){const good=s.refs.every(id=>s.work[id]?.correct),old=state.reviews[state.unit]?.streak||0;state.reviews[state.unit]={due:Date.now()+(good?Math.min(14,2**old):1)*86400000,streak:good?old+1:0,results:s.refs.map(id=>s.work[id]?.correct?'good':'again')};begin();}save();update('next');}
 }
 function input(event){if(!event.target.matches('[data-act-input]'))return;const ctx=context();if(!ctx||ctx.w.revealed)return;ctx.w.text=event.target.value.slice(0,1000);save();}
 function submit(event){if(event.target.id!=='drill-form')return;event.preventDefault();const ctx=context();if(!ctx||ctx.w.revealed)return;ctx.w.revealed=true;save();update('solution');}
 return {content,click,input,submit,pool};
}
