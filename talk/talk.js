const $ = (id) => document.getElementById(id);
let room, sdk, accessCode = '', agent, agentTimer, muted = false, starting = false;
const messages = new Map();
function state(name, title, hint) { $('orb').dataset.state = name; $('status').textContent = title; if (hint !== undefined) $('hint').textContent = hint; }
function error(message = '') { $('error').textContent = message; $('error').hidden = !message; }
async function api(path, body) {
  const response = await fetch(`/api/talk/${path}`, { method: body ? 'POST' : 'GET', headers: body ? {'Content-Type':'application/json'} : {}, body: body ? JSON.stringify(body) : undefined, cache:'no-store', signal:AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Bağlantı kurulamadı. Yeniden dene.');
  return data;
}
function refreshAgent(participant) {
  if (!participant?.isAgent) return;
  agent = participant;
  const value = participant.attributes['lk.agent.state'];
  if (['listening','thinking','speaking'].includes(value)) clearTimeout(agentTimer);
  if (value === 'speaking') state('speaking','Öğretmen konuşuyor','İstersen konuşarak araya girebilirsin.');
  else if (value === 'thinking') state('thinking','Bekliyorum','Cevabını düşünüyorum.');
  else if (value === 'listening') state('listening',muted ? 'Mikrofon kapalı' : 'Seni dinliyorum','Kendi hızında konuş. Bitirince “bitti” diyebilirsin.');
}
async function stop() {
  clearTimeout(agentTimer);
  const previous = room; room = undefined; agent = undefined;
  if (previous) await previous.disconnect();
  $('remote-audio').replaceChildren(); $('controls').hidden = true; $('audio').hidden = true;
  $('start').hidden = false; $('start').disabled = false; $('start').textContent = 'Konuşmayı başlat';
  muted = false; $('mute').textContent = 'Mikrofonu kapat'; $('mute').setAttribute('aria-pressed','false');
  state('idle','Acele etme.','Hazır olduğunda yeniden konuşabiliriz.');
}
async function start() {
  if (starting || room) return;
  starting = true;
  $('access-form').querySelector('button').disabled = true;
  $('start').disabled = true; error(); state('connecting','Bağlanıyor…','Mikrofon izni istediğinde izin ver.');
  try {
    if (!window.isSecureContext || !navigator.mediaDevices) throw new Error('Mikrofon için bu sayfayı HTTPS üzerinden Safari veya Chrome’da aç.');
    sdk ||= await import('/talk/vendor/livekit-client.esm.mjs');
    const connection = await api('session', {accessCode});
    const current = new sdk.Room({adaptiveStream:true, audioCaptureDefaults:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    room = current;
    current.on(sdk.RoomEvent.TrackSubscribed, (track) => { if (track.kind === sdk.Track.Kind.Audio) { const el = track.attach(); el.setAttribute('playsinline',''); $('remote-audio').append(el); } });
    current.on(sdk.RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach(el => el.remove()));
    current.on(sdk.RoomEvent.ParticipantAttributesChanged, (_, participant) => refreshAgent(participant));
    current.on(sdk.RoomEvent.ParticipantConnected, refreshAgent);
    current.on(sdk.RoomEvent.ParticipantDisconnected, (participant) => { if (participant === agent) { void stop(); error('Öğretmen bağlantısı kesildi. Yeniden başlatabilirsin.'); } });
    current.on(sdk.RoomEvent.AudioPlaybackStatusChanged, () => { $('audio').hidden = current.canPlaybackAudio; });
    current.on(sdk.RoomEvent.Reconnecting, () => state('connecting','Yeniden bağlanıyor…','İnternet bağlantısı bekleniyor.'));
    current.on(sdk.RoomEvent.Reconnected, () => refreshAgent(agent));
    current.on(sdk.RoomEvent.Disconnected, () => { if (room === current) { void stop(); error('Sohbet bağlantısı sona erdi. Yeniden başlatabilirsin.'); } });
    current.registerTextStreamHandler('lk.transcription', async (reader, participant) => {
      try {
        const text = await reader.readAll();
        if (room !== current || reader.info.attributes['lk.transcription_final'] === 'false') return;
        const id = reader.info.attributes['lk.segment_id'] || reader.info.id;
        let item = messages.get(id);
        if (!item) { item = document.createElement('p'); messages.set(id,item); $('messages').append(item); }
        const label = document.createElement('strong'); label.textContent = participant.identity === current.localParticipant.identity ? 'Sen' : 'Öğretmen';
        item.replaceChildren(label, document.createTextNode(text));
        $('transcript').querySelector('.empty').hidden = true;
        $('transcript').scrollTop = $('transcript').scrollHeight;
      } catch { error('Konuşma yazısı alınamadı; sesli sohbet devam edebilir.'); }
    });
    await current.startAudio();
    await current.connect(connection.url, connection.token);
    await current.localParticipant.setMicrophoneEnabled(true);
    messages.clear(); $('messages').replaceChildren(); $('transcript').querySelector('.empty').hidden = false;
    $('start').hidden = true; $('controls').hidden = false; $('access-form').hidden = true;
    state('connecting','Öğretmen bekleniyor…','Bağlantı kurulunca konuşmaya başlayabilirsin.');
    agentTimer = setTimeout(async () => { await stop(); error('Öğretmen şu anda çevrimdışı. Ajan çalıştırıldıktan sonra yeniden dene.'); }, 30000);
    current.remoteParticipants.forEach(refreshAgent);
  } catch (err) {
    await stop();
    error(err.name === 'NotAllowedError' ? 'Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verip yeniden dene.' : err.message);
  } finally { starting = false; $('access-form').querySelector('button').disabled = false; }
}
$('start').onclick = () => { if ($('access-form').hidden) void start(); else $('access').focus(); };
$('access-form').onsubmit = (event) => { event.preventDefault(); accessCode = $('access').value; void start(); };
$('stop').onclick = () => void stop();
$('mute').onclick = async () => {
  try { if (!room) return; await room.localParticipant.setMicrophoneEnabled(muted); muted = !muted; $('mute').textContent = muted ? 'Mikrofonu aç' : 'Mikrofonu kapat'; $('mute').setAttribute('aria-pressed',String(muted)); refreshAgent(agent); }
  catch { error('Mikrofon değiştirilemedi. İznini kontrol et.'); }
};
$('finish').onclick = async () => {
  if (!room || !agent) return;
  $('finish').disabled = true;
  try { await room.localParticipant.performRpc({destinationIdentity:agent.identity,method:'finish_turn',payload:'',responseTimeout:5000}); }
  catch { error('Bitiriş işareti iletilemedi. Sesli olarak “bitti” diyebilirsin.'); }
  finally { $('finish').disabled = false; }
};
$('audio').onclick = async () => { try { await room?.startAudio(); } catch { error('Ses açılamadı. Yeniden dene.'); } };
$('toggle').onclick = () => { const visible = $('transcript').hidden; $('transcript').hidden = !visible; $('toggle').textContent = visible ? 'Yazıyı gizle' : 'Yazıyı göster'; $('toggle').setAttribute('aria-expanded',String(visible)); };
window.addEventListener('pagehide', () => { void room?.disconnect(); });
try {
  const config = await api('config');
  if (!config.configured) { state('idle','Öğretmen hazırlanıyor.','Sesli sohbet bağlantısı henüz kurulmadı.'); $('start').textContent = 'Kurulum bekleniyor'; }
  else { $('start').disabled = false; $('start').textContent = 'Konuşmayı başlat'; $('access-form').hidden = !config.requiresAccessCode; }
} catch { state('idle','Bağlantı kurulamadı.','Sayfayı yenileyip yeniden dene.'); $('start').textContent = 'Bağlantı bekleniyor'; }
