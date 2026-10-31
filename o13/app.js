import {STORAGE_KEY,freshState,validateState,loadStoredState,persistState,normalizeWord,tokenize,isWord,lookup,cardId,addWord,dueCards,nextStory,dailyPlan,startReview,rateWord,quizFor,chooseAnswer,checkAnswer,advanceQuiz} from './model.js?v=1';
const $=s=>document.querySelector(s),html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let content,state=freshState(),storageLocked=false,term=null,wordTrigger=null,pendingImport=null,toastTimer;
const player=$('#player'),wordPlayer=new Audio();
const storyById=id=>content.stories.find(s=>s.id===id);
const formatTime=n=>Number.isFinite(n)?`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`:'0:00';
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4400);}
function persist(){if(storageLocked){toast('Eski kayıt korunuyor. Ayarlardan yedek alabilir veya geçerli bir yedek yükleyebilirsin.');return false;}if(persistState(localStorage,state))return true;toast('Kaydedilemedi. Cihaz depolamasını kontrol et; ayarlardan yedeğini indirebilirsin.');return false;}
function route(){const parts=location.hash.replace(/^#/,'').split('/');return {view:parts[0]||'library',id:parts[1]||''};}
function navigate(target){if(location.hash==='#'+target)render();else location.hash=target;}
function stopAudio(){player.pause();wordPlayer.pause();}
function nav(view){const area=['story','questions'].includes(view)?'library':view==='review'?'words':view;document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===area);if(a.dataset.nav===area)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});$('#word-count').textContent=Object.keys(state.cards).length;}
function meta(story){return `<div class="story-meta"><span class="level">${story.level}</span><span>${story.minutes} dk</span><span>${story.topic}</span>${state.progress[story.id]?'<span class="story-complete">✓ Çalışıldı</span>':''}</div>`;}
function storyCard(story){return `<a class="story-card" href="#story/${story.id}"><img src="art/${story.art}.webp" alt="" width="600" height="364" loading="lazy">${meta(story)}<h3 lang="en">${html(story.title)}</h3><p>${html(story.tr)}</p></a>`;}
function library(){
 const featured=nextStory(content,state),done=content.stories.filter(s=>state.progress[s.id]).length,due=dueCards(state).length;
 const list=content.stories.filter(s=>state.settings.filter==='all'||s.level===state.settings.filter);
 return `<section class="hero"><div class="hero-copy"><p class="eyebrow">OKU. DİNLE. YANINDA GÖTÜR.</p><h1>Küçük hikâyeler,<br>gerçek hayat.</h1><p class="description">İngilizceye kısa bir mola. Hikâyeni oku, dinle; merak ettiğin kelimeleri tekrar listene ekle.</p><a class="primary" href="#story/${featured.id}">${state.lastStory===featured.id?'Hikâyene devam et':'Bir hikâyeyle başla'} <span aria-hidden="true">→</span></a></div><a class="hero-art" href="#story/${featured.id}" aria-label="${html(featured.title)} hikâyesini aç"><img src="art/${featured.art}.webp" alt="" width="700" height="420"><div class="hero-caption"><strong lang="en">${html(featured.title)}</strong><span>${html(featured.tr)} · ${featured.level}</span></div></a></section><div class="progress-strip"><span><strong>${done} / ${content.stories.length}</strong> hikâye çalışıldı</span><span><strong>${due}</strong> kelime tekrar bekliyor</span><a href="#today">Bugünkü çalışmanı aç →</a></div><section aria-labelledby="library-title"><div class="section-heading"><h2 id="library-title">Hikâyeler</h2><div class="filters" role="group" aria-label="Hikâye seviyesi">${['all','A1','A2'].map(level=>`<button data-filter="${level}" class="${state.settings.filter===level?'active':''}" aria-pressed="${state.settings.filter===level}">${level==='all'?'Tümü':level}</button>`).join('')}</div></div><div class="story-grid">${list.map(storyCard).join('')}</div></section>`;
}
function renderLine(story,s,index){
 const tokens=tokenize(s.en).map(token=>{
  if(!isWord(token))return html(token);
  const t=lookup(content,story,index,token);if(!t)return html(token);
  const saved=Object.hasOwn(state.cards,cardId(t));
  return `<button type="button" class="word ${saved?'saved':''}" data-word="${html(token)}" data-line="${index}" data-story="${story.id}" title="Türkçe anlamı">${html(token)}</button>`;
 }).join('');
 return `<p class="sentence-line">${tokens}${state.translations[story.id]?`<span class="sentence-tr" lang="tr">${html(s.tr)}</span>`:''}</p>`;
}
function reader(story){
 if(state.lastStory!==story.id){state.lastStory=story.id;persist();}
 return `<article class="reader"><a class="back-link" href="#library">← Hikâyelere dön</a><img class="reader-cover" src="art/${story.art}.webp" alt="" width="780" height="290">${meta(story)}<h1 lang="en">${html(story.title)}</h1><p class="reader-subtitle">${html(story.tr)}</p><div class="reader-toolbar"><button class="primary" id="story-play" aria-pressed="false">◖ Dinle</button><button class="outline" data-translation="${story.id}" aria-pressed="${!!state.translations[story.id]}">${state.translations[story.id]?'Türkçeyi gizle':'Türkçeyi göster'}</button><span class="player-time" id="player-time" aria-live="off">0:00 / 0:00</span></div><label for="audio-seek" class="sr-only">Dinlemede ilerle</label><input class="audio-progress" id="audio-seek" type="range" min="0" max="1" value="0" disabled><p class="read-note">Anlamını görmek için bir kelimeye dokun. Ses: Caro Davy.</p><div class="reading-sheet"><div class="reading-text" lang="en">${story.sentences.map((s,i)=>renderLine(story,s,i)).join('')}</div></div><div class="reading-actions"><a class="primary" href="#questions/${story.id}">Hikâyeyi hatırla · 3 soru <span aria-hidden="true">→</span></a><a class="text-button" href="#words">Kelimelerime git</a></div><div class="related">Bu yapıları O11’de çalışabilirsin: ${story.units.map(unit=>`<a href="/o11/#unit-${unit}">Ünite ${unit} ↗</a>`).join('')}</div></article>`;
}
function questions(story){
 const q=quizFor(state,story);
 if(q.pos===story.questions.length){const score=Object.values(q.answers).filter(a=>a.correct).length;return `<section class="quiz-shell complete-panel"><div class="complete-icon" aria-hidden="true">✓</div><p class="eyebrow">HİKÂYE TAMAMLANDI</p><h1>Bir hikâye daha.</h1><p><span lang="en">${html(story.title)}</span><br>Bu turda ${score} / ${story.questions.length} doğru cevap.</p><p>Seçtiğin kelimeler, tekrar zamanları geldiğinde seni bekliyor.</p><div class="action-row"><a class="primary" href="#today">Bugünkü çalışmana dön</a><a class="outline" href="#story/${story.id}">Metni yeniden oku</a><button class="text-button" data-restart-quiz="${story.id}">Soruları yeniden çöz</button></div></section>`;}
 const item=story.questions[q.pos],a=q.answers[q.pos];
 return `<section class="quiz-shell"><a class="back-link" href="#story/${story.id}">← Metne dön</a><p class="eyebrow" lang="en">${html(story.title)}</p><h1 style="font-size:40px">Neler hatırlıyorsun?</h1><div class="quiz-progress"><span>Kısa bir anlama çalışması</span><span>${q.pos+1} / ${story.questions.length}</span></div><div class="track"><span style="width:${q.pos/story.questions.length*100}%"></span></div><div class="question-panel"><h2 id="question-title">${html(item.prompt)}</h2><div class="answers" role="radiogroup" aria-labelledby="question-title">${item.options.map((option,i)=>`<button type="button" role="radio" aria-checked="${a?.selected===i}" id="option-${i}" class="answer-option ${a?.selected===i?'selected':''} ${a?.checked&&i===item.answer?'is-correct':''} ${a?.checked&&a.selected===i&&!a.correct?'is-wrong':''}" data-choice="${i}" data-story="${story.id}" ${a?.checked?'disabled':''}><span aria-hidden="true">${String.fromCharCode(65+i)}</span><span lang="en">${html(option)}</span></button>`).join('')}</div>${a?.checked?`<div class="feedback" role="status"><b>${a.correct?'Doğru hatırladın.':'Doğru cevap: '+html(item.options[item.answer])}</b><p>${html(item.why)}</p></div><button class="primary" data-next-question="${story.id}">${q.pos===story.questions.length-1?'Hikâyeyi tamamla':'Sonraki soru →'}</button>`:`<button class="primary" data-check-question="${story.id}" ${a?'':'disabled'}>Kontrol et</button>`}</div></section>`;
}
function dateLabel(iso){const date=new Date(iso);return date<=Date.now()?'Tekrar zamanı':date.toLocaleDateString('tr-TR',{day:'numeric',month:'short'});}
function wordsPage(){
 const cards=Object.values(state.cards).sort((a,b)=>b.createdAt-a.createdAt),due=dueCards(state).length;
 return `<section><div class="page-head"><p class="eyebrow">KELİMELERİN, HİKÂYELERİYLE BİRLİKTE</p><h1>Kelimelerim</h1><p>Hikâyelerde seçtiğin kelimeler burada. Önce anlamını hatırla, sonra açıp kendin değerlendir.</p></div>${!cards.length?`<div class="empty-state"><h2>İlk kelimene yer aç.</h2><p>Bir hikâyede merak ettiğin kelimeye dokun ve “Kelimelerime ekle”yi seç. Bu listeyi sen oluşturuyorsun.</p><a class="primary" href="#library">Bir hikâye aç →</a></div>`:`<div class="deck-overview"><div><h2>${due?due+' kelime seni bekliyor.':'Bugünlük yetiştin.'}</h2><p>${cards.length} kayıtlı kelime · ${due?'Zamanı gelenlerden en fazla 10 kelimelik bir tur.':'Yeni tekrarların, zamanı geldiğinde burada görünür.'}</p></div>${due?'<button class="primary" data-start-review>Tekrara başla →</button>':''}</div><div class="word-list">${cards.map(c=>`<div class="word-row"><strong lang="en">${html(c.word)}</strong><span class="word-meaning">${html(c.meaning)}</span><span>${Date.parse(c.due)<=Date.now()?'<span class="due-tag">Tekrar zamanı</span>':`<small>${html(dateLabel(c.due))}</small>`}</span></div>`).join('')}</div>`}</section>`;
}
function reviewPage(){
 const r=state.review;if(!r)return `<section class="review-shell"><div class="empty-state"><h1>Kısa bir hatırlama turu.</h1><p>Zamanı gelen kelimelerini çalışabilirsin.</p><button class="primary" data-start-review>Tekrarı aç →</button></div></section>`;
 if(r.pos===r.ids.length){const due=dueCards(state).length,next=Object.values(state.cards).map(c=>Date.parse(c.due)).filter(t=>t>Date.now()).sort((a,b)=>a-b)[0];return `<section class="review-shell complete-panel"><div class="complete-icon" aria-hidden="true">✓</div><h1>${r.ids.length?'Bu tur tamamlandı.':'Şimdilik tekrar yok.'}</h1><p>${r.ids.length?r.ids.length+' kelimeyi çalıştın. Tekrar takvimin güncellendi.':'Hikâyelerden seçtiğin kelimeler burada birikecek.'}</p>${next?`<p>Sonraki tekrar: ${new Date(next).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>`:''}<div class="action-row">${due?`<button class="primary" data-start-review>Kalan ${due} kelimeyi çalış</button>`:'<a class="primary" href="#library">Bir hikâye aç →</a>'}<a class="outline" href="#today">Bugünkü çalışmana dön</a></div></section>`;}
 const c=state.cards[r.ids[r.pos]];
 return `<section class="review-shell"><a class="back-link" href="#words">← Kelimelerime dön</a><div class="quiz-progress"><span>Önce anlamını hatırla</span><span>${r.pos+1} / ${r.ids.length}</span></div><div class="track"><span style="width:${r.pos/r.ids.length*100}%"></span></div><div class="review-card"><h2 lang="en">${html(c.word)}</h2><button class="text-button" data-word-audio="${c.audio}">◖ Kelimeyi dinle</button>${r.revealed?`<p class="meaning">${html(c.meaning)}</p><blockquote lang="en">${html(c.exampleEn)}</blockquote><p class="translation">${html(c.exampleTr)}</p>`:'<p class="muted" style="margin-top:24px">Türkçesi aklına geliyor mu?</p>'}</div>${r.revealed?`<p class="review-helper">Ne kadar hatırladın? Kendin değerlendir.</p><div class="rating">${[['again','Hatırlamadım'],['hard','Zorlandım'],['good','Hatırladım'],['easy','Çok kolaydı']].map(([id,label])=>`<button data-rating="${id}">${label}</button>`).join('')}</div>`:'<button class="primary" id="reveal-word" style="width:100%">Anlamını göster</button>'}</section>`;
}
function todayPage(){
 const before=JSON.stringify(state.daily),d=dailyPlan(content,state);if(before!==JSON.stringify(d))persist();const story=storyById(d.storyId),vocab=d.vocabIds.length,done=d.storyDone&&(d.reviewDone||!vocab);
 return `<section><div class="page-head"><p class="eyebrow">${new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'}).toLocaleUpperCase('tr-TR')}</p><h1>${done?'Bugünkü küçük adımın tamam.':'Bugün biraz İngilizce.'}</h1><p>${done?'İstersen başka bir hikâye okuyabilirsin. Sonraki kelime tekrarların, zamanı geldiğinde açılır.':'Kısa bir kelime tekrarı, ardından günlük hayattan bir hikâye. Kendi hızında ilerle.'}</p></div><div class="daily-list"><div class="daily-step"><span class="step-number" aria-hidden="true">01</span><div><h2>Kelimelerini hatırla.</h2><p>${!vocab?'Şimdilik zamanı gelen kelimen yok. Hikâyeden yenilerini seçebilirsin.':d.reviewDone?'Bugünkü kelime turunu çalıştın.':vocab+' kelimelik kısa bir hatırlama turu.'}</p></div>${vocab&&!d.reviewDone?'<button class="primary" data-daily-review>Kelimeleri çalış →</button>':`<span class="due-tag">${vocab?'✓ Çalışıldı':'Sıradaki hikâye'}</span>`}</div><div class="daily-step"><span class="step-number" aria-hidden="true">02</span><div><h2 lang="en">${html(story.title)}</h2><p>${html(story.tr)} · ${story.level} · ${story.minutes} dk</p></div>${d.storyDone?'<span class="due-tag">✓ Çalışıldı</span>':`<a class="primary" href="#story/${story.id}">Hikâyeyi çalış →</a>`}</div></div><p class="day-note">Kelimeleri hatırladıkça tekrar aralığı uzar. Zorlandıkların daha erken geri gelir.</p>${done?'<a class="outline" href="#library">Diğer hikâyeleri gör</a>':''}</section>`;
}
function render(){
 if(!content)return;const r=route();nav(r.view);document.documentElement.style.setProperty('--size',state.settings.size+'px');
 let page;
 if(['story','questions'].includes(r.view)){const s=storyById(r.id);if(!s){navigate('library');return;}document.title=s.title+' · Hikâye Atölyesi';page=r.view==='story'?reader(s):questions(s);}
 else{document.title='Hikâye Atölyesi · O13';page=r.view==='words'?wordsPage():r.view==='review'?reviewPage():r.view==='today'?todayPage():library();}
 $('#main').innerHTML=page;
 if(r.view==='story'){
  const story=storyById(r.id);if(player.dataset.story!==story.id){player.pause();player.src=`audio/${story.audio}.mp3`;player.dataset.story=story.id;}player.playbackRate=state.settings.speed;playerUI();
 }
}
function playerUI(){const button=$('#story-play');if(!button)return;button.textContent=player.paused?'◖ Dinle':'Ⅱ Duraklat';button.setAttribute('aria-pressed',String(!player.paused));const seek=$('#audio-seek');if(seek){seek.disabled=!Number.isFinite(player.duration);seek.max=Number.isFinite(player.duration)?Math.floor(player.duration*10):1;seek.value=Math.floor(player.currentTime*10);}$('#player-time').textContent=formatTime(player.currentTime)+' / '+formatTime(player.duration);}
for(const event of ['playing','pause','ended','timeupdate','loadedmetadata','durationchange'])player.addEventListener(event,playerUI);
player.addEventListener('error',()=>{if(route().view==='story')toast('Ses açılamadı. Bağlantını kontrol edip tekrar dene.');playerUI();});
async function playWord(audio){player.pause();wordPlayer.pause();wordPlayer.src=`audio/${audio}.mp3`;wordPlayer.playbackRate=state.settings.speed;try{await wordPlayer.play();}catch{toast('Kelime sesi açılamadı. Bağlantını kontrol et.');}}
function openTerm(story,index,word,trigger){
 const t=lookup(content,story,index,word);if(!t)return;term=t;wordTrigger=trigger;const saved=Object.hasOwn(state.cards,cardId(t));
 $('#word-dialog').innerHTML=`<div class="dialog-head"><h2 id="word-title" lang="en">${html(t.word)}</h2><button class="close" data-close="word-dialog" aria-label="Kelimeyi kapat">×</button></div><p class="term-meaning">${html(t.meaning)}</p>${t.kind!=='name'?`<button class="text-button" data-word-audio="${t.audio}">◖ Kelimeyi dinle</button>`:''}<div class="term-context"><blockquote lang="en">${html(t.exampleEn)}</blockquote><p>${html(t.exampleTr)}</p></div>${t.kind!=='name'?`<div class="term-actions"><button class="primary" id="save-word" ${saved?'disabled':''}>${saved?'✓ Kelimelerinde kayıtlı':'Kelimelerime ekle'}</button></div>`:''}<p class="term-source">${html(story.tr)} hikâyesinden</p>`;
 $('#word-dialog').showModal();
}
$('#word-dialog').addEventListener('close',()=>{wordPlayer.pause();wordTrigger?.focus({preventScroll:true});});
function settings(){
 $('#settings-dialog').innerHTML=`<div class="dialog-head"><h2 id="settings-title">Kendi hızında.</h2><button class="close" data-close="settings-dialog" aria-label="Ayarları kapat">×</button></div><label class="settings-row">Yazı boyutu<select id="font-size">${[[18,'Küçük'],[21,'Standart'],[24,'Büyük']].map(([v,t])=>`<option value="${v}" ${state.settings.size===v?'selected':''}>${t}</option>`).join('')}</select></label><label class="settings-row">Dinleme hızı<select id="audio-speed">${[.75,1,1.15].map(v=>`<option value="${v}" ${state.settings.speed===v?'selected':''}>${v}×</option>`).join('')}</select></label><p class="settings-note">Kelimelerin, cevapların ve tekrarların bu cihazda saklanır. Hesabım üzerinden mevcut Google girişini kullanarak diğer cihazlarınla da eşitleyebilirsin.</p><div class="settings-actions"><button class="outline" id="account-open">Hesabım</button><button class="outline" id="export-data">Yedek indir</button><label class="outline file-label">Yedek yükle<input type="file" id="import-data" accept="application/json,.json" aria-label="Yedek yükle"></label></div><p class="settings-note">Dinlediğin sesler ve açtığın hikâyeler çevrimdışı kullanım için önbelleğe alınır.</p>`;
 $('#settings-dialog').showModal();
}
function about(){ $('#about-dialog').innerHTML='<div class="dialog-head"><h2 id="about-title">Hikâye Atölyesi</h2><button class="close" data-close="about-dialog" aria-label="Kapat">×</button></div><p>Günlük hayattan 12 kısa A1–A2 hikâyesi. Oku, aynı kadın sesiyle dinle, kelimelerini seç ve aralıklı tekrar et.</p><p class="settings-note">English Trainer projesinin tekrar motoru ve okuma çizimleri temel alınarak Türkçeye uyarlanmıştır. İçerikler bu sürüm için kısaltılıp yeniden hazırlanmıştır. Ses: Kyutai Pocket TTS / Caro Davy.</p><p><a class="text-button" href="https://github.com/dripips/english-trainer" target="_blank" rel="noopener">Kaynak proje ↗</a> · <a class="text-button" href="vendor/english-trainer/LICENSE" target="_blank" rel="noopener">MIT lisansı ↗</a></p>';$('#about-dialog').showModal();}
function exportData(){const raw=storageLocked?localStorage.getItem(STORAGE_KEY):JSON.stringify(state,null,2),url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`hikaye-atolyesi-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('click',async event=>{
 const button=event.target.closest('button');if(!button||button.disabled)return;
 try{
  const d=button.dataset;
  if(d.close){$('#'+d.close).close();return;}
  if(d.filter){state.settings.filter=d.filter;persist();render();return;}
  if(d.word){const story=storyById(d.story),index=Number(d.line);if(story&&story.sentences[index])openTerm(story,index,d.word,button);return;}
  if(d.wordAudio){await playWord(d.wordAudio);return;}
  if(button.id==='save-word'&&term){if(addWord(state,term)){const saved=persist();button.disabled=true;button.textContent=saved?'✓ Kelimelerinde kayıtlı':'Bu oturumda eklendi';$('#word-count').textContent=Object.keys(state.cards).length;if(saved)toast('Kelime, hikâyesiyle birlikte eklendi.');}return;}
  if(button.id==='story-play'){if(player.paused){wordPlayer.pause();try{await player.play();}catch{toast('Ses başlatılamadı. Yeniden dokunabilirsin.');}}else player.pause();return;}
  if(d.translation){state.translations[d.translation]=!state.translations[d.translation];persist();render();document.querySelector('[data-translation]')?.focus({preventScroll:true});return;}
  if(d.choice!==undefined){const story=storyById(d.story);if(story&&chooseAnswer(state,story,Number(d.choice))){persist();render();$('#option-'+d.choice)?.focus({preventScroll:true});}return;}
  if(d.checkQuestion){const story=storyById(d.checkQuestion);if(story&&checkAnswer(state,story)){persist();render();document.querySelector('[data-next-question]')?.focus({preventScroll:true});}return;}
  if(d.nextQuestion){const story=storyById(d.nextQuestion);if(story&&advanceQuiz(state,story)){persist();render();$('#main').focus({preventScroll:true});}return;}
  if(d.restartQuiz){const story=storyById(d.restartQuiz);if(story){quizFor(state,story,true);persist();render();}return;}
  if(button.hasAttribute('data-start-review')){startReview(state);persist();navigate('review');return;}
  if(button.hasAttribute('data-daily-review')){startReview(state,Date.now(),dailyPlan(content,state).vocabIds);persist();navigate('review');return;}
  if(button.id==='reveal-word'&&state.review){state.review.revealed=true;persist();render();document.querySelector('[data-rating="good"]')?.focus({preventScroll:true});return;}
  if(d.rating&&rateWord(state,d.rating)){persist();render();$('#main').focus({preventScroll:true});return;}
  if(button.id==='settings-open')settings();
  if(button.id==='about-open')about();
  if(button.id==='account-open'){$('#settings-dialog').close();const panel=$('#learning-account');if(panel)panel.open=true;else toast('Hesap bağlantısı henüz hazır değil. Kayıtların bu cihazda duruyor.');}
  if(button.id==='export-data')exportData();
  if(button.id==='confirm-import'&&pendingImport){
   try{const old=localStorage.getItem(STORAGE_KEY);if(old)localStorage.setItem('fatedreel-o13-backup:'+Date.now(),old);localStorage.setItem(STORAGE_KEY,JSON.stringify(pendingImport));}catch{toast('Yedek yüklenemedi; mevcut kayıt korundu.');return;}
   state=pendingImport;pendingImport=null;storageLocked=false;$('#settings-dialog').close();stopAudio();navigate('library');toast('Yedek yüklendi.');
  }
 }catch{toast('İşlem tamamlanamadı. Kaydın korunuyor; yeniden deneyebilirsin.');}
});
document.addEventListener('input',event=>{if(event.target.id==='audio-seek'&&Number.isFinite(player.duration)){player.currentTime=Math.min(player.duration,Number(event.target.value)/10);playerUI();}});
document.addEventListener('change',async event=>{
 const field=event.target;
 if(field.id==='font-size'){state.settings.size=Number(field.value);document.documentElement.style.setProperty('--size',state.settings.size+'px');persist();}
 if(field.id==='audio-speed'){state.settings.speed=Number(field.value);player.playbackRate=state.settings.speed;wordPlayer.playbackRate=state.settings.speed;persist();}
 if(field.id==='import-data'&&field.files?.[0]){
  try{const file=field.files[0];if(file.size>3500000)throw Error('large');const candidate=validateState(JSON.parse(await file.text()));pendingImport=candidate;$('#settings-dialog').innerHTML=`<div class="dialog-head"><h2 id="settings-title">Yedeği yükle</h2><button class="close" data-close="settings-dialog" aria-label="Kapat">×</button></div><p>${Object.keys(candidate.cards).length} kelime ve ${Object.keys(candidate.progress).length} hikâye kaydı bulundu.</p><p class="settings-note">Bu cihazdaki O13 kaydı yedekteki kayıtla değişecek. Mevcut kayıt ayrıca saklanır.</p><div class="action-row"><button class="outline" id="export-data">Önce mevcut yedeği indir</button><button class="primary" id="confirm-import">Yedeği uygula</button></div>`;}catch{toast('Yedek okunamadı. Geçerli bir O13 JSON yedeği seç.');}
 }
});
window.addEventListener('hashchange',()=>{stopAudio();render();window.scrollTo(0,0);$('#main').focus({preventScroll:true});});
window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY||!event.newValue)return;try{state=validateState(JSON.parse(event.newValue));storageLocked=false;stopAudio();render();toast('Kayıt diğer sekmeden güncellendi.');}catch{toast('Diğer sekmedeki kayıt okunamadı; bu oturum korundu.');}});
async function init(){
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);let response;try{response=await fetch('content.json?v=1',{signal:controller.signal});}finally{clearTimeout(timer);}
  if(!response.ok||!response.headers.get('content-type')?.includes('json'))throw Error('content');content=await response.json();if(content.version!==1||content.stories.length!==12||!content.dictionary)throw Error('content');
  const loaded=loadStoredState(localStorage);state=loaded.state;storageLocked=loaded.locked;if(storageLocked)setTimeout(()=>toast('Kayıt okunamadı; eski veri korunuyor. Ayarlardan yedeğini indirebilirsin.'),500);
  render();window.dispatchEvent(new Event('o13-ready'));
 }catch(error){console.error('O13 initialization',error);window.dispatchEvent(new Event('o13-failed'));}
}
init();
