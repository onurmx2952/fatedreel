(function(){
  const root=document.documentElement;
  let theme='dark';try{theme=localStorage.getItem('etk-theme')||'dark'}catch{}
  function setTheme(value){root.dataset.theme=value;const b=document.getElementById('theme-toggle');b.textContent=value==='dark'?'Açık tema':'Koyu tema';b.setAttribute('aria-label',value==='dark'?'Açık temaya geç':'Koyu temaya geç');try{localStorage.setItem('etk-theme',value)}catch{}}
  setTheme(theme);
  document.getElementById('theme-toggle').onclick=()=>setTheme(root.dataset.theme==='dark'?'light':'dark');
  function selection(){document.querySelectorAll('#topic button,#tabs button,#pron button,#mode button,#dd button,#fchips button,#exsets button,.cards button').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('on'))))}
  selection();document.addEventListener('click',()=>queueMicrotask(selection));
  let lastSpeech;
  window.speak=function(text,lang){
    const notice=document.getElementById('novoice');
    if(!('speechSynthesis' in window)){notice.hidden=false;notice.textContent='Bu tarayıcı sesli okumayı desteklemiyor.';return}
    speechSynthesis.cancel();
    const speech=new SpeechSynthesisUtterance(text);lastSpeech=speech;
    speech.lang=lang;speech.rate=lang.startsWith('en')?.85:.95;
    const voices=speechSynthesis.getVoices();speech.voice=voices.find(v=>v.lang===lang)||voices.find(v=>v.lang.startsWith(lang.split('-')[0]))||null;
    speech.onerror=e=>{if(!['interrupted','canceled'].includes(e.error)){notice.hidden=false;notice.textContent='Sesli okuma başlatılamadı. Cihazının İngilizce / Türkçe ses ayarlarını kontrol edebilirsin.'}};
    speech.onstart=()=>{notice.hidden=true};speechSynthesis.speak(speech);
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&'speechSynthesis' in window)speechSynthesis.cancel()});
})();
