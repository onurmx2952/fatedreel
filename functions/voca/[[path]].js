const ORIGIN = 'https://www.languageguide.org';
const PREFIX = '/voca';

export function localUrl(value) {
  if (!value || value.startsWith('//') && !value.includes('languageguide.org')) return value;
  if (/^(?:https?:)?\/\/(?:www\.)?languageguide\.org\//i.test(value)) {
    return value.replace(/^(?:https?:)?\/\/(?:www\.)?languageguide\.org/i, PREFIX);
  }
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/voca/') ? PREFIX + value : value;
}

export function patchPlayer(source) {
  // currentSrc is sometimes empty until Safari selects a <source>. Make the
  // recording explicit before the original player fetches/decodes it.
  source = source.replace('function setPlayerVariable(){', 'function setPlayerVariable(){var vocaAudio=document.querySelector("audio,video");if(vocaAudio&&!vocaAudio.getAttribute("src")){var vocaSource=vocaAudio.querySelector("source");if(vocaSource)vocaAudio.src=vocaSource.src;}');
  source = source.replace(/WEB_AUDIO_SAMPLE_RATE=24E3/g, 'WEB_AUDIO_SAMPLE_RATE=0');
  // Use the same segment player on desktop and touch devices so the explicit
  // start button and timed vocabulary segments follow one tested path.
  source = source.replace('function useWebAudioForMain(){return(isIosDevice()||isDesktopWebKit()||isAndroidDevice())&&mainNeedsWebAudio()}', 'function useWebAudioForMain(){return mainNeedsWebAudio()}');
  return 'window.LG_APP_AUDIO_BASE="/voca/snd/";window.LG_APP_SOUND_ROOT="/voca/snd/";\n' + source;
}

const supportScript = `<script>
(function(){
  function setup(){
    if(!document.querySelector('audio,video'))return;
    var panel=document.createElement('aside');
    panel.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;z-index:2147483647;padding:12px;background:#fff;color:#162334;border:2px solid #2563eb;border-radius:16px;box-shadow:0 4px 24px #0003;font:16px system-ui;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
    var button=document.createElement('button');button.textContent='🔊 Sesi aç';
    button.style.cssText='padding:12px 20px;border:0;border-radius:10px;background:#2563eb;color:white;font:inherit;min-height:48px;cursor:pointer';
    var status=document.createElement('span');status.setAttribute('role','status');status.textContent='Başlamak için Sesi aç düğmesine dokunun.';
    panel.append(button,status);document.body.append(panel);
    var timeout;
    button.onclick=function(){
      clearTimeout(timeout);
      try{
        if(navigator.audioSession)navigator.audioSession.type='playback';
        if(window.webAudioCtx){
          // resume is called synchronously in the click gesture, every time.
          var resume=webAudioCtx.resume();
          if(typeof unlockWebAudio==='function')unlockWebAudio();
          Promise.resolve(resume).then(function(){
            if(webAudioCtx.state!=='running')throw new Error('Ses izni açılamadı');
            status.textContent=window.webAudioBuffer?'Hazır. Resimlere dokunarak dinleyin.':'Ses yükleniyor…';
            button.textContent='🔊 Sesi tekrar aç';
            if(window.webAudioBuffer&&typeof playSound==='function')playSound(-1);
          }).catch(failed);
        }else{
          var audio=document.querySelector('audio,video');
          Promise.resolve(audio.play()).then(function(){audio.pause();status.textContent='Hazır. Resimlere dokunarak dinleyin.';}).catch(failed);
        }
        timeout=setTimeout(function(){if(window.useWebAudioSegments&&!window.webAudioBuffer)failed();},20000);
      }catch(e){failed();}
    };
    function failed(){status.textContent='Ses açılamadı. Yeniden deneyin; iPad ses düzeyini ve Safari bağlantısını kontrol edin.';button.textContent='🔊 Yeniden dene';}
    var check=setInterval(function(){
      if(window.webAudioBuffer&&window.webAudioCtx&&webAudioCtx.state==='running'){
        if(status.textContent==='Ses yükleniyor…')status.textContent='Hazır. Resimlere dokunarak dinleyin.';
      }
    },500);
    window.addEventListener('pagehide',function(){clearInterval(check);clearTimeout(timeout);});
    document.body.style.paddingBottom='100px';
  }
  if(document.readyState==='complete')setup();else window.addEventListener('load',setup);
})();
</script>`;

export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  if (!['GET', 'HEAD'].includes(context.request.method)) return new Response('Method not allowed', {status:405});
  let path = incoming.pathname.slice(PREFIX.length);
  if (!path || path === '/') path = '/english/vocabulary/';
  if (path.includes('..') || path.startsWith('//')) return new Response('Invalid path', {status:400});
  if (path.startsWith('/analytics/') || /login|logout|account/i.test(path)) return new Response('Unavailable in personal vocabulary view', {status:404});
  const upstream = new URL(ORIGIN + path);
  upstream.search = incoming.search;
  const headers = new Headers();
  for (const name of ['range']) {
    const value=context.request.headers.get(name);if(value)headers.set(name,value);
  }
  let response;
  try { response = await fetch(upstream, {method:context.request.method,headers,redirect:'manual'}); }
  catch {return new Response('Kaynak siteye ulaşılamadı. Lütfen yeniden deneyin.',{status:502});}
  const out = new Headers(response.headers);
  for (const name of ['set-cookie','content-security-policy','content-length','content-encoding','x-frame-options']) out.delete(name);
  out.set('X-Robots-Tag','noindex, nofollow');
  out.set('X-Content-Type-Options','nosniff');
  out.set('Cache-Control','public, max-age=300');
  if(response.status>=300&&response.status<400){
    const next=new URL(response.headers.get('location')||'/',upstream);
    if(next.origin!==ORIGIN)return new Response('External redirect blocked',{status:502});
    out.set('Location',PREFIX+next.pathname+next.search);
    return new Response(null,{status:response.status,headers:out});
  }
  if(context.request.method==='HEAD')return new Response(null,{status:response.status,headers:out});
  const type=out.get('content-type')||'';
  if(type.includes('text/html')||type.includes('image/svg+xml')){
    out.set('Cache-Control','no-store');out.delete('ETag');out.delete('Last-Modified');
    let html=await response.text();
    html=html.replace(/\b(href|src|action|poster|data|data-src(?:-[a-z])?|xlink:href)\s*=\s*(["'])(.*?)\2/gi,(_,attr,q,value)=>attr+'='+q+localUrl(value)+q);
    html=html.replace(/url\(\s*(["']?)(\/[^)'"\s]+)\1\s*\)/g,(_,q,url)=>'url('+q+localUrl(url)+q+')');
    html=html.replace(/<script[^>]*src=["'][^"']*\/analytics\/[^"']*["'][^>]*><\/script>/gi,'');
    html=html.replace(/(src=["']\/voca\/app\/ip[^"']+)(["'])/g,'$1&voca=20261011a$2');
    if(type.includes('text/html'))html=html.replace(/<\/body>/i,supportScript+'<footer style="padding:20px;text-align:center;font:14px system-ui">İçerik: <a href="https://www.languageguide.org/english/vocabulary/">LanguageGuide.org</a> · Kişisel kullanım için iPad ses uyarlaması</footer></body>');
    return new Response(html,{status:response.status,headers:out});
  }
  if(type.includes('text/css')){
    const css=(await response.text()).replace(/url\(\s*(["']?)(\/[^)'"\s]+)\1\s*\)/g,(_,q,url)=>'url('+q+localUrl(url)+q+')');
    return new Response(css,{status:response.status,headers:out});
  }
  if(path.startsWith('/app/ip')&&path.endsWith('.js')){
    out.set('Cache-Control','no-store');out.delete('ETag');out.delete('Last-Modified');
    return new Response(patchPlayer(await response.text()),{status:response.status,headers:out});
  }
  return new Response(response.body,{status:response.status,headers:out});
}
