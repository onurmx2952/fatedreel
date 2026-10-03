const $ = id => document.getElementById(id);
const audio = new Audio();
audio.preload = 'auto';
audio.setAttribute('playsinline', '');
let sentences = [], bag = [], current, phase = 'loading', heard = false;
// iOS can retain the quieter microphone audio route after recognition ends.
function setAudioMode(type) {
  try { if (typeof navigator !== 'undefined' && navigator.audioSession) navigator.audioSession.type = type; } catch {}
}
function error(text = '') { $('error').textContent = text; $('error').hidden = !text; }
function normalize(text) {
  return text.toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\b633\b/g,'six hundred and thirty three').replace(/\b112\b/g,'one hundred and twelve')
    .replace(/\b100\b/g,'a hundred').replace(/\b50\b/g,'fifty').replace(/\b3\b/g,'three')
    .replace(/\b(i'm)\b/g,'i am').replace(/\b(can't)\b/g,'cannot').replace(/\b(can not)\b/g,'cannot')
    .replace(/\b(won't)\b/g,'will not').replace(/\b(let's)\b/g,'let us')
    .replace(/\b(it|he|she|that|what|who|where|there)'s\b/g,'$1 is')
    .replace(/\b(i|you|we|they)'re\b/g,'$1 are').replace(/\b(i|you|we|they)'ve\b/g,'$1 have')
    .replace(/\b(i|you|he|she|it|we|they)'ll\b/g,'$1 will').replace(/n't\b/g,' not')
    .replace(/\bokay\b/g,'ok').replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ').trim();
}
function nextSentence() {
  audio.pause();
  if (!bag.length) {
    bag = [...sentences];
    for (let i=bag.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [bag[i],bag[j]]=[bag[j],bag[i]]; }
    if (bag.length>1 && bag.at(-1)?.id===current?.id) [bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
  }
  current = bag.pop(); heard=false; phase='question'; audio.src=current.audio;
  $('listen').disabled=false; $('listen').classList.remove('playing'); $('listenLabel').textContent='Dinle';
  $('prompt').textContent='Bir cümle dinle.'; $('status').textContent='Hazır olduğunda dokun.';
  for (const id of ['answer','write','form','result']) $(id).hidden=true;
  $('input').value=''; error();
}
function play() {
  if (!current) return;
  error(); audio.pause(); audio.currentTime=0;
  setAudioMode('playback');
  audio.play().then(() => {
    heard=true; $('listen').classList.add('playing'); $('listenLabel').textContent='Tekrar dinle';
    if (phase==='question') {
      $('answer').hidden=false; $('write').hidden=false;
      $('prompt').textContent='Ne duydun?'; $('status').textContent='İstediğin kadar tekrar dinle.';
    }
  }).catch(() => error('Ses açılamadı. İnternet bağlantını kontrol edip Dinle’ye tekrar dokun.'));
}
audio.onended=()=>{ $('listen').classList.remove('playing'); };
audio.onerror=()=>{ if(current) error('Ses yüklenemedi. Bağlantını kontrol edip yeniden dene.'); };
function submit(text = '') {
  if (phase!=='question'||!current) return;
  const hasAnswer = Boolean(text.trim());
  audio.pause(); $('listen').classList.remove('playing'); phase='result';
  error(); for(const id of ['answer','write','form']) $(id).hidden=true;
  const correct=hasAnswer && normalize(text)===normalize(current.en);
  $('feedback').textContent=correct?'Doğru!':'Doğru cümle şöyle:';
  $('feedback').classList.toggle('correct',correct);
  $('given').hidden=!hasAnswer;
  $('given').textContent=hasAnswer?'Yanıtın: '+text.trim():'';
  $('english').textContent=current.en; $('turkish').textContent=current.tr; $('result').hidden=false;
  $('prompt').textContent=correct?'Güzel!':'Dinle ve karşılaştır.';
  $('status').textContent='Dinle’ye basıp cümleyi tekrar duyabilirsin.';
}
function writeAnswer() {
  audio.pause(); error(); $('form').hidden=false;
  $('status').textContent='Duyduğun cümleyi yazıp gönder.'; $('input').focus();
}
async function load() {
  $('retry').hidden=true;error();
  try {
    const response=await fetch('./sentences.json?v=4-full-library',{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error();sentences=await response.json();
    if(!Array.isArray(sentences)||!sentences.length||sentences.some(s=>!s.en||!s.tr||!s.audio))throw Error();
    nextSentence();
  } catch { $('status').textContent='Cümleler yüklenemedi.';error('Bağlantını kontrol edip yeniden dene.');$('retry').hidden=false; }
}
$('listen').onclick=play;$('answer').onclick=()=>submit();$('write').onclick=writeAnswer;
$('form').onsubmit=event=>{event.preventDefault();submit($('input').value);};
$('next').onclick=()=>{nextSentence();play();};$('retry').onclick=load;
window.addEventListener('pagehide',()=>{stopRecognition();audio.pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopRecognition();audio.pause();$('listen').classList.remove('playing');if(phase==='question'&&heard)$('status').textContent='Hazır olduğunda tekrar dinle.';}});
load();
