// Controlled-answer exercises. No fuzzy grading or remote model is involved.
export function normalizeAnswer(text, apostropheS='is', apostropheD='would') {
 return String(text).normalize('NFKC').toLowerCase().replace(/[’‘`]/g,"'").replace(/\bcan't\b/g,'cannot').replace(/\bcan not\b/g,'cannot').replace(/\bwon't\b/g,'will not').replace(/\bshan't\b/g,'shall not').replace(/n't\b/g,' not').replace(/\bi'm\b/g,'i am').replace(/\b(you|we|they)'re\b/g,'$1 are').replace(/\b(i|you|we|they)'ve\b/g,'$1 have').replace(/\b(i|you|he|she|it|we|they)'ll\b/g,'$1 will').replace(/\b(i|you|he|she|it|we|they)'d\b/g,`$1 ${apostropheD}`).replace(/\b(he|she|it|that|there)'s\b/g,`$1 ${apostropheS}`).replace(/[.,!?;:]/g,'').replace(/\s+/g,' ').trim();
}
export function answerMatches(input,question) {
 const expected=[question.answer,...(question.accept||[])];
 return expected.some(a=>['is','has'].some(form=>['would','had'].some(d=>normalizeAnswer(input,form,d)===normalizeAnswer(a,form,d))));
}
export function shuffle(items) {const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function buildQuestions(book,bank) {
 const questions=new Map();
 for(const u of book.units){
  u.words.forEach(([en,tr],i)=>{
   const other=u.words.filter(([e,t])=>e!==en&&t!==tr).map(([e])=>e);
   questions.set(`${u.id}:words:${i}`,{id:`${u.id}:words:${i}`,unit:u.id,type:'choice',prompt:`“${tr}” anlamına gelen kelime veya kalıbı seç.`,options:[en,...other.slice(0,3)],answer:en,why:`${en} → ${tr}`});
  });
  u.examples.forEach((s,i)=>questions.set(`${u.id}:examples:${i}`,{id:`${u.id}:examples:${i}`,unit:u.id,type:'dictation',prompt:'Cümleyi dinle ve duyduğunu yaz.',answer:s.en,audio:s.audio,hint:s.tr,why:'Duyduğun cümleyle yazdığını karşılaştır. Kısaltmaların açık biçimleri de kabul edilir.'}));
  const fresh=bank.units.find(x=>x.id===u.id);
  for(const stage of ['practice','review'])fresh[stage].forEach((q,i)=>questions.set(`${u.id}:${stage}:${i}`,{...q,id:`${u.id}:${stage}:${i}`,unit:u.id}));
  questions.set(`${u.id}:dialogue:0`,{...fresh.dialogue,id:`${u.id}:dialogue:0`,unit:u.id,type:'dialogue',prompt:fresh.scene});
 }
 return questions;
}
const html=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={words:['Kelimeyi hatırla.','Anlamı gör, İngilizcesini seç.'],examples:['Dinle, sonra kendin yaz.','İngilizce metin cevabından önce gösterilmez.'],dialogue:['Konuşmayı sen tamamla.','Duruma uygun yanıtı seç; konuşmanın devamını aç.'],practice:['Yeni cümlelerle dene.','Boşluğu doldur, sözcükleri sırala, cümleyi dönüştür.'],review:['Konu adını görmeden hatırla.','Bu ünite ve öncekilerden, ders örneklerinden farklı sorular.']};
export function createActivities({book,bank,state,save,update,play}) {
 const pool=buildQuestions(book,bank);
 // Ignore an incompatible activity session without touching notes or book progress.
 if(!state.activities||typeof state.activities!=='object'||Array.isArray(state.activities))state.activities={};
 function key(stage){return `${state.unit}:${stage}`;}
 function valid(s){return s&&s.version===1&&Array.isArray(s.refs)&&s.refs.length>0&&s.refs.length<=32&&s.refs.every(id=>pool.has(id))&&Number.isInteger(s.pos)&&s.pos>=0&&s.pos<=s.refs.length&&s.results&&typeof s.results==='object'&&!Array.isArray(s.results)&&s.work&&typeof s.work==='object'&&!Array.isArray(s.work);}
 function ids(stage){return [...pool.values()].filter(q=>stage==='review'?q.id.includes(':review:')&&q.unit<=state.unit:q.id.startsWith(`${state.unit}:${stage}:`)).map(q=>q.id);}
 function begin(stage,refs){let list=refs||ids(stage);if(stage==='review'&&!refs){const own=list.filter(id=>pool.get(id).unit===state.unit),previous=list.filter(id=>pool.get(id).unit<state.unit);list=[...own,...shuffle(previous).slice(0,6)];}state.activities[key(stage)]={version:1,refs:stage==='dialogue'?list:shuffle(list),pos:0,results:{},work:{},started:Date.now()};save();}
 function session(stage){let s=state.activities[key(stage)];if(!valid(s)){begin(stage);s=state.activities[key(stage)];}return s;}
 function work(s,q){if(!s.work[q.id]||typeof s.work[q.id]!=='object')s.work[q.id]={text:'',selected:[],tokenOrder:shuffle(q.answer.split(/\s+/).map((_,i)=>i)),optionOrder:shuffle((q.options||[]).map((_,i)=>i))};const w=s.work[q.id];const count=q.answer.split(/\s+/).length;const permutation=(v,n)=>Array.isArray(v)&&v.length===n&&new Set(v).size===n&&v.every(i=>Number.isInteger(i)&&i>=0&&i<n);if(!permutation(w.tokenOrder,count))w.tokenOrder=shuffle(Array.from({length:count},(_,i)=>i));if(!permutation(w.optionOrder,(q.options||[]).length))w.optionOrder=shuffle((q.options||[]).map((_,i)=>i));if(typeof w.text!=='string')w.text='';if(!Array.isArray(w.selected)||new Set(w.selected).size!==w.selected.length||w.selected.some(i=>!Number.isInteger(i)||i<0||i>=count))w.selected=[];return w;}
 function result(s,q){const r=s.results[q.id];return r&&typeof r==='object'?r:null;}
 function heading(stage){const [title,sub]=titles[stage];return `<div class="section-title"><h2>${html(title)}</h2></div><p class="section-note">${html(sub)}</p>`;}
 function formatQuestion(q){return q.type==='rewrite'?`<p class="drill-prompt">${html(q.prompt)}</p><blockquote lang="en">${html(q.source)}</blockquote>`:`<p class="drill-prompt">${html(q.prompt)}</p>`;}
 function exercise(q,w,r){
  if(q.type==='dialogue'){const done=!!r;return `<p class="drill-scene">${html(q.prompt)}</p><div class="drill-dialogue">${q.lines.slice(0,done?4:2).map((line,i)=>`<div class="drill-bubble ${i%2?'speaker-b':''}"><span>${i%2?'B':'A'}</span><p lang="en">${html(line)}</p></div>`).join('')}${done?'':'<div class="drill-bubble"><span>A</span><p>Sıra sende. Nasıl yanıt verirsin?</p></div>'}</div>${choices(q,w,r)}`;}
  if(q.type==='choice')return formatQuestion(q)+choices(q,w,r);
  if(q.type==='order'){const tokens=q.answer.split(/\s+/);return `<p class="drill-prompt">${html(q.prompt)}</p><p class="section-note">Sözcüklere doğru sırayla dokun.</p><div class="drill-order-answer" aria-label="Kurduğun cümle" aria-live="polite">${w.selected.length?w.selected.map(i=>html(tokens[i])).join(' '):'<span>Cümlen burada oluşacak…</span>'}</div><div class="drill-tokens">${w.tokenOrder.map(i=>`<button type="button" data-act-token="${i}" ${r||w.selected.includes(i)?'disabled':''} lang="en">${html(tokens[i])}</button>`).join('')}</div>${r?'':`<button type="button" class="text-btn" data-act-undo ${w.selected.length?'':'disabled'}>Son sözcüğü geri al</button>`}`;}
  if(q.type==='dictation')return `<button type="button" class="outline drill-listen" data-act-audio="${q.audio}">◖ Cümleyi dinle</button><details class="drill-hint"><summary>Türkçe ipucu</summary><p>${html(q.hint)}</p></details>${field(w,r,'Duyduğun cümle')}`;
  return formatQuestion(q)+field(w,r,q.type==='gap'?'Boşluğa gelecek yanıt':'Yeni cümlen');
 }
 function field(w,r,label){return `<label class="drill-label" for="drill-input">${label}</label><input id="drill-input" data-act-input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="500" value="${html(w.text)}" ${r?'readonly':''} placeholder="Yanıtını yaz…">`;}
 function choices(q,w,r){return `<div class="drill-options">${w.optionOrder.map(i=>`<button type="button" data-act-choice="${i}" class="${r&&q.options[i]===q.answer?'is-correct':''} ${r&&!r.correct&&w.text===q.options[i]?'is-wrong':''} ${!r&&w.text===q.options[i]?'is-selected':''}" ${r?'disabled':''} lang="en">${html(q.options[i])}</button>`).join('')}</div>`;}
 function summary(stage,s){const results=s.refs.map(id=>s.results[id]),first=results.filter(r=>r?.firstCorrect).length,wrong=s.refs.filter(id=>!s.results[id]?.firstCorrect);return `${heading(stage)}<section class="drill-summary"><span class="drill-summary-count">${first} / ${s.refs.length}</span><h3>İlk denemede doğru.</h3><p>${wrong.length?'Zorlandığın soruları ayrı bir turda yeniden çözebilirsin.':'Bu turdaki tüm soruları ilk denemede çözdün.'}</p><div class="action-row">${wrong.length?'<button class="primary" data-act-retry>Yanlışlarımı yeniden çalış</button>':''}<button class="outline" data-act-restart>Yeni tur</button>${stage!=='review'?`<button class="outline" data-tab="${{words:'examples',examples:'dialogue',dialogue:'practice',practice:'review'}[stage]}">Sonraki adıma geç →</button>`:''}</div></section><details class="drill-results"><summary>Yanıtlarımı incele</summary>${s.refs.map(id=>{const q=pool.get(id),r=s.results[id];return `<div><b>${r?.firstCorrect?'✓':'↻'} ${html(q.type==='dialogue'?q.prompt:q.prompt)}</b><p>Yanıtın: <span lang="en">${html(r?.input||'')}</span></p><p>Doğrusu: <span lang="en">${html(q.answer)}</span></p><small>${html(q.why)}</small></div>`;}).join('')}</details>`;}
 function content(stage){const s=session(stage);if(s.pos>=s.refs.length)return summary(stage,s);const q=pool.get(s.refs[s.pos]),w=work(s,q),r=result(s,q);save();return `${heading(stage)}<section class="drill" data-drill-stage="${stage}"><div class="progress-label"><span>${{choice:'ANLAMI SEÇ',gap:'BOŞLUĞU DOLDUR',order:'CÜMLE KUR',rewrite:'DÖNÜŞTÜR',dictation:'DİNLE VE YAZ',dialogue:'YANIT VER'}[q.type]}</span><span>${s.pos+1} / ${s.refs.length}</span></div><div class="track"><span style="width:${s.pos/s.refs.length*100}%"></span></div><form id="drill-form">${exercise(q,w,r)}${r?`<div class="drill-feedback ${r.correct?'is-correct':'is-wrong'}" role="status"><b>${r.correct?'✓ Doğru.':'↻ Bu yanıtı yeniden çalış.'}</b><p lang="en">${html(q.answer)}</p><p>${html(q.why)}</p>${stage==='review'?`<small>Ünite ${q.unit} · ${html(book.units[q.unit-1].title)}</small>`:''}</div><div class="action-row"><button type="button" class="primary" data-act-next>${s.pos+1===s.refs.length?'Sonucu gör':'Sonraki soru →'}</button></div>`:`<button type="submit" class="primary drill-check" ${q.type==='order'?!w.selected.length?'disabled':'':!w.text.trim()?'disabled':''}>Yanıtımı kontrol et</button>`}</form></section>${stage==='words'?`<details class="drill-library"><summary>Kelimeleri incele</summary>${book.units[state.unit-1].words.map(([en,tr])=>`<div><p lang="en">${html(en)}</p><p>${html(tr)}</p></div>`).join('')}</details>`:''}${stage==='examples'?`<details class="drill-library"><summary>Sesli örnekleri incele</summary>${book.units[state.unit-1].examples.map((x,i)=>`<div><button type="button" class="text-btn" data-act-audio="${x.audio}">◖ Dinle</button><p lang="en">${html(x.en)}</p><p>${html(x.tr)}</p></div>`).join('')}</details>`:''}`;}
 function current(){const stage=state.tab;if(!titles[stage])return null;const s=session(stage);return {stage,s,q:pool.get(s.refs[s.pos])};}
 function commit(){const ctx=current();if(!ctx?.q)return;const {s,q}=ctx,w=work(s,q);if(result(s,q))return;const input=q.type==='order'?w.selected.map(i=>q.answer.split(/\s+/)[i]).join(' '):w.text;if(!input.trim())return;const correct=answerMatches(input,q);s.results[q.id]={input,correct,firstCorrect:correct,at:Date.now()};save();update();}
 function click(event){const b=event.target.closest('button');if(!b)return;const ctx=current();if(!ctx)return;const {stage,s,q}=ctx;
  if(b.hasAttribute('data-act-restart')){begin(stage);update();return;}
  if(b.hasAttribute('data-act-retry')){const wrong=s.refs.filter(id=>!s.results[id]?.firstCorrect);if(wrong.length){begin(stage,wrong);update();}return;}
  if(b.dataset.actAudio){play(b.dataset.actAudio,b);return;}
  if(!q)return;const w=work(s,q);if(b.dataset.actChoice!==undefined){const i=Number(b.dataset.actChoice);if(result(s,q)||!q.options?.[i])return;w.text=q.options[i];save();update();}
  if(b.dataset.actToken!==undefined){const i=Number(b.dataset.actToken);if(result(s,q)||w.selected.includes(i)||!w.tokenOrder.includes(i))return;w.selected.push(i);save();update();}
  if(b.hasAttribute('data-act-undo')&&!result(s,q)){w.selected.pop();save();update();}
  if(b.hasAttribute('data-act-next')&&result(s,q)){s.pos++;if(s.pos===s.refs.length){s.finished=Date.now();if(stage==='review'){const good=s.refs.every(id=>s.results[id]?.firstCorrect),old=state.reviews[state.unit]?.streak||0;state.reviews[state.unit]={due:Date.now()+(good?Math.min(14,2**old):1)*86400000,streak:good?old+1:0,results:s.refs.map(id=>s.results[id]?.firstCorrect?'good':'again')};}}save();update();}
 }
 function input(event){if(!event.target.matches('[data-act-input]'))return;const ctx=current();if(!ctx?.q||result(ctx.s,ctx.q))return;work(ctx.s,ctx.q).text=event.target.value.slice(0,500);save();const check=document.querySelector('.drill-check');if(check)check.disabled=!event.target.value.trim();}
 function submit(event){if(event.target.id!=='drill-form')return;event.preventDefault();commit();}
 return {content,click,input,submit,pool};
}
