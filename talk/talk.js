const $=id=>document.getElementById(id);
let endpoint='',key='',stream,context,recorder,source,sink,active=false,muted=false,speaking=false;
let samples=[],length=0,speechSamples=0,quietSamples=0,pending='',history=[],queue=Promise.resolve(),epoch=0,audio,audioUrl;
let finishQueued=false,starting=false,frames=[],frameLength=0;
let attemptedSpeech=0;
const controllers=new Set();
function state(value,title,hint){$('orb').dataset.state=value;$('status').textContent=title;if(hint!==undefined)$('hint').textContent=hint;}
function error(message=''){$('error').textContent=message;$('error').hidden=!message;}
function listening(){state('listening',muted?'Mikrofon kapalı':'Seni dinliyorum','Doğal konuş. Cümlen tamamlandığında otomatik yanıt vereceğim; düğmeye basman gerekmiyor.');}
function message(who,text){const p=document.createElement('p'),label=document.createElement('strong');label.textContent=who;p.append(label,document.createTextNode(text));$('messages').append(p);$('transcript').querySelector('.empty').hidden=true;$('transcript').scrollTop=$('transcript').scrollHeight;}
function clearSamples(){samples=[];length=0;speechSamples=0;quietSamples=0;attemptedSpeech=0;}
function wav(chunks,count,rate){
 const pcm=new Float32Array(count);let offset=0;for(const chunk of chunks){pcm.set(chunk,offset);offset+=chunk.length;}
 const n=Math.floor(count*16000/rate),buffer=new ArrayBuffer(44+n*2),view=new DataView(buffer);
 const word=(position,text)=>{for(let i=0;i<text.length;i++)view.setUint8(position+i,text.charCodeAt(i));};
 word(0,'RIFF');view.setUint32(4,36+n*2,true);word(8,'WAVE');word(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);word(36,'data');view.setUint32(40,n*2,true);
 for(let i=0;i<n;i++){const at=i*rate/16000,j=Math.floor(at),t=at-j,v=(pcm[j]||0)*(1-t)+(pcm[j+1]||0)*t;view.setInt16(44+i*2,Math.max(-1,Math.min(1,v))*32767,true);}
 let binary='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);
}
async function play(base64,current){
 if(current!==epoch)return;speaking=true;clearSamples();state('speaking','Öğretmen konuşuyor','Söz almak için “Araya gir”e dokun.');$('finish').textContent='Araya gir';
 const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));audioUrl=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));audio.src=audioUrl;
 audio.onended=()=>{if(current!==epoch)return;endAudio();listening();};
 try{await audio.play();}catch{$('audio').hidden=false;state('speaking','Yanıt hazır','Sesi aç düğmesine dokun.');}
}
function endAudio(){audio?.pause();if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=undefined;speaking=false;$('audio').hidden=true;$('finish').textContent='Bitirdim';clearSamples();}
function send(finish=false){
 if(!active||speaking||finishQueued)return;
 if(speechSamples<context.sampleRate*0.2)return;
 const encoded=length?wav(samples,length,context.sampleRate):'';
 const revision=speechSamples;attemptedSpeech=revision;finishQueued=true;
 $('finish').disabled=true;state('thinking','Seni anlıyorum…','Devam etmek istersen konuşabilirsin.');
 const current=epoch;
 queue=queue.then(async()=>{
  if(!active||current!==epoch)return;
  const controller=new AbortController();controllers.add(controller);const timer=setTimeout(()=>controller.abort(),150000);
  try{
   const response=await fetch(endpoint+'/api/turn',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({audio:encoded,pending:'',history:history.slice(-12),finish}),signal:controller.signal});
   const result=await response.json();if(!response.ok)throw Error(result.detail||'Bağlantı kurulamadı.');
   if(!active||current!==epoch||revision!==speechSamples)return;
   if(result.waiting){listening();if(result.empty){clearSamples();}else state('listening','Seni dinliyorum','Düşünmek için zamanın var. Cümlene devam edebilirsin.');return;}
   pending='';history.push({role:'user',content:result.text},{role:'assistant',content:result.reply});history=history.slice(-12);
   message('Sen',result.text);message('Öğretmen',result.reply);await play(result.audio,current);
  }catch(err){if(current===epoch&&active&&revision===speechSamples){error(err.name==='AbortError'?'Yanıt zaman aşımına uğradı. Yeniden dene.':err.message);listening();}}
  finally{clearTimeout(timer);controllers.delete(controller);if(current===epoch){finishQueued=false;$('finish').disabled=false;}}
 });
}
function capture(chunk){
 if(!active||muted||speaking)return;
 let energy=0;for(const value of chunk)energy+=value*value;const voiced=Math.sqrt(energy/chunk.length)>0.012;
 if(!length&&!voiced){frames.push(chunk);frameLength+=chunk.length;while(frameLength>context.sampleRate*0.25&&frames.length>1)frameLength-=frames.shift().length;return;}
 if(!length){samples.push(...frames);length=frameLength;frames=[];frameLength=0;}
 if(voiced&&finishQueued){controllers.forEach(c=>c.abort());listening();}
 // Keep the full utterance across pauses; cap stored trailing silence.
 if(voiced||quietSamples<context.sampleRate*2){samples.push(chunk);length+=chunk.length;}
 if(voiced){speechSamples+=chunk.length;quietSamples=0;}else quietSamples+=chunk.length;
 if(length>context.sampleRate*110){error('Konuşma çok uzadı. Yanıtla düğmesiyle bu bölümü gönderebilirsin.');return;}
 if(quietSamples>context.sampleRate*1.8&&speechSamples>attemptedSpeech)send(false);
}
async function start(){
 if(active||starting)return;starting=true;error();$('start').disabled=true;$('access-form').querySelector('button').disabled=true;
 try{
  if(!window.isSecureContext||!navigator.mediaDevices)throw Error('Mikrofon için HTTPS üzerinden Safari veya Chrome kullan.');
  key=$('access').value.trim();if(!key)throw Error('PN43 erişim kodunu gir.');
  const check=await fetch(endpoint+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(12000)});if(!check.ok)throw Error(check.status===401?'Erişim kodu doğru değil.':'PN43 bağlantısı kurulamadı.');
  audio=new Audio();audio.setAttribute('playsinline','');
  context=new AudioContext();await context.resume();
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
  await context.audioWorklet.addModule('/talk/recorder.js');source=context.createMediaStreamSource(stream);recorder=new AudioWorkletNode(context,'talk-recorder');sink=context.createGain();sink.gain.value=0;source.connect(recorder);recorder.connect(sink);sink.connect(context.destination);
  recorder.port.onmessage=event=>capture(event.data);active=true;epoch++;history=[];pending='';queue=Promise.resolve();clearSamples();frames=[];frameLength=0;
  $('messages').replaceChildren();$('transcript').querySelector('.empty').hidden=false;$('access-form').hidden=true;$('start').hidden=true;$('controls').hidden=false;listening();
 }catch(err){await stop();error(err.name==='NotAllowedError'?'Mikrofon izni verilmedi. Tarayıcıdan izin verip yeniden dene.':err.message);}
 finally{starting=false;$('start').disabled=false;$('access-form').querySelector('button').disabled=false;}
}
async function stop(){
 active=false;epoch++;controllers.forEach(c=>c.abort());controllers.clear();endAudio();stream?.getTracks().forEach(t=>t.stop());recorder?.disconnect();source?.disconnect();sink?.disconnect();if(context&&context.state!=='closed')await context.close();
 clearSamples();frames=[];frameLength=0;pending='';finishQueued=false;muted=false;$('finish').disabled=false;$('mute').textContent='Mikrofonu kapat';$('mute').setAttribute('aria-pressed','false');$('controls').hidden=true;$('start').hidden=false;$('start').disabled=false;$('access-form').hidden=false;state('idle','Acele etme.','Öğretmenin bu bilgisayarda çalışıyor.');
}
$('access-form').onsubmit=event=>{event.preventDefault();void start();};$('start').onclick=()=>void start();$('stop').onclick=()=>void stop();
$('finish').onclick=()=>{if(speaking){endAudio();listening();}else send(true);};
$('mute').onclick=()=>{muted=!muted;stream?.getAudioTracks().forEach(t=>{t.enabled=!muted;});$('mute').textContent=muted?'Mikrofonu aç':'Mikrofonu kapat';$('mute').setAttribute('aria-pressed',String(muted));if(!speaking)listening();};
$('audio').onclick=async()=>{try{await audio.play();$('audio').hidden=true;}catch{error('Ses açılamadı. Yeniden dokun.');}};
$('toggle').onclick=()=>{const visible=$('transcript').hidden;$('transcript').hidden=!visible;$('toggle').textContent=visible?'Yazıyı gizle':'Yazıyı göster';$('toggle').setAttribute('aria-expanded',String(visible));};
window.addEventListener('pagehide',()=>{void stop();});
try{
 const response=await fetch('/talk/local-config.json',{cache:'no-store'});const config=await response.json();endpoint=new URL(config.endpoint).origin;
 if(!endpoint.startsWith('https://')&&endpoint!=='http://127.0.0.1:8173')throw Error();
 const health=await(await fetch(endpoint+'/health',{signal:AbortSignal.timeout(12000)})).json();if(!health.ready)throw Error();
 $('start').disabled=false;$('start').textContent='Konuşmayı başlat';$('access-form').hidden=false;
 const fragment=new URLSearchParams(location.hash.slice(1));if(fragment.has('key')){$('access').value=fragment.get('key');window.history.replaceState(null,'',location.pathname);}
 state('idle','Acele etme.','Ücretsiz, yerel öğretmenin hazır. PN43 açık kaldığı sürece konuşabiliriz.');
}catch{state('idle','PN43 bağlantısı bekleniyor.','Bilgisayarda Talk Başlat dosyasını çalıştırıp bu sayfayı yenile.');$('start').textContent='Bilgisayar çevrimdışı';}
