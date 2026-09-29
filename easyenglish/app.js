const $ = id => document.getElementById(id);
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const audio = new Audio();
audio.preload = 'auto';
audio.setAttribute('playsinline', '');
let sentences = [], bag = [], current, phase = 'loading', recognition, recording = false, timer, session = 0, heard = false;
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
function stopRecognition() {
  session++; clearTimeout(timer); recording = false;
  if (recognition) {
    const previous = recognition; recognition = null;
    previous.onend = () => { if (!recording) setAudioMode('playback'); };
    previous.abort();
  }
  setAudioMode('playback');
  $('answer').classList.remove('recording'); $('answerLabel').textContent = 'Yanıtla'; $('listen').disabled = !current;
}
function nextSentence() {
  stopRecognition(); audio.pause();
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
  if (!current || recording) return;
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
function submit(text) {
  if (phase!=='question'||!heard||!text.trim()) return;
  stopRecognition(); audio.pause(); $('listen').classList.remove('playing'); phase='result';
  error(); for(const id of ['answer','write','form']) $(id).hidden=true;
  const correct=normalize(text)===normalize(current.en);
  $('feedback').textContent=correct?'Doğru!':'Doğru cümle şöyle:';
  $('feedback').classList.toggle('correct',correct);
  $('given').textContent='Yanıtın: '+text.trim();
  $('english').textContent=current.en; $('turkish').textContent=current.tr; $('result').hidden=false;
  $('prompt').textContent=correct?'Güzel!':'Dinle ve karşılaştır.';
  $('status').textContent='Dinle’ye basıp cümleyi tekrar duyabilirsin.';
}
function writeAnswer() {
  stopRecognition(); audio.pause(); error(); $('form').hidden=false;
  $('status').textContent='Duyduğun cümleyi yazıp gönder.'; $('input').focus();
}
function startAnswer() {
  if(recording) { recognition?.stop(); return; }
  if(phase!=='question'||!heard) return;
  if(!SpeechRecognition) { writeAnswer(); error('Bu tarayıcı sesle yanıtlamayı desteklemiyor. Safari veya Chrome ile açabilir ya da yazabilirsin.'); return; }
  audio.pause(); $('listen').classList.remove('playing'); error(); $('form').hidden=true;
  const run=++session; const rec=new SpeechRecognition(); recognition=rec;
  rec.lang='en-GB'; rec.continuous=false; rec.interimResults=true; rec.maxAlternatives=3;
  let transcript='', handled=false;
  const finish=()=>{
    if(run!==session||handled)return;
    handled=true;
    if(transcript.trim()) submit(transcript);
    else {stopRecognition();$('status').textContent='Tekrar yanıtlayabilir veya yazabilirsin.';error('Ses anlaşılamadı. Mikrofonu kontrol edip yeniden dene.');}
  };
  rec.onstart=()=>{if(run!==session)return;recording=true;$('listen').disabled=true;$('answer').classList.add('recording');$('answerLabel').textContent='Bitir';$('status').textContent='İngilizce söyle. Bitince otomatik gönderilir.';};
  rec.onresult=event=>{
    if(run!==session)return;
    transcript=Array.from(event.results).map(result=>result[0].transcript).join(' ');
    if(Array.from(event.results).every(result=>result.isFinal)) finish();
  };
  rec.onerror=event=>{
    if(run!==session||handled)return;handled=true;stopRecognition();
    const messages={'not-allowed':'Mikrofon izni gerekiyor. Tarayıcı ayarlarından izin verebilir veya yazarak yanıtlayabilirsin.','service-not-allowed':'Ses tanıma kullanılamıyor. Yazarak yanıtlayabilirsin.','audio-capture':'Mikrofona ulaşılamadı. Başka bir uygulama kullanıyorsa kapatıp yeniden dene.','network':'Ses tanıma bağlantısı kurulamadı. Yeniden dene veya yaz.','no-speech':'Ses duyamadım. Yanıtla’ya basıp tekrar dene.'};
    error(messages[event.error]||'Ses anlaşılamadı. Yeniden dene veya yazarak yanıtla.');$('status').textContent='Tekrar deneyebilirsin.';
  };
  rec.onend=finish;
  try {
    setAudioMode('play-and-record');
    rec.start();recording=true;$('listen').disabled=true;
    timer=setTimeout(()=>{if(run!==session)return; if(transcript)finish();else{handled=true;stopRecognition();error('Ses tanıma yanıt vermedi. Tekrar dene veya yazarak yanıtla.');$('status').textContent='Yanıtını bekliyorum.';}},20000);
  } catch {stopRecognition();error('Mikrofon başlatılamadı. Yeniden dene veya yaz.');}
}
async function load() {
  $('retry').hidden=true;error();
  try {
    const response=await fetch('./sentences.json',{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error();sentences=await response.json();
    if(!Array.isArray(sentences)||!sentences.length||sentences.some(s=>!s.en||!s.tr||!s.audio))throw Error();
    nextSentence();
  } catch { $('status').textContent='Cümleler yüklenemedi.';error('Bağlantını kontrol edip yeniden dene.');$('retry').hidden=false; }
}
$('listen').onclick=play;$('answer').onclick=startAnswer;$('write').onclick=writeAnswer;
$('form').onsubmit=event=>{event.preventDefault();submit($('input').value);};
$('next').onclick=()=>{nextSentence();play();};$('retry').onclick=load;
window.addEventListener('pagehide',()=>{stopRecognition();audio.pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopRecognition();audio.pause();$('listen').classList.remove('playing');if(phase==='question'&&heard)$('status').textContent='Hazır olduğunda tekrar yanıtla.';}});
load();
