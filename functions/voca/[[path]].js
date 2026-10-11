const ORIGIN = 'https://www.languageguide.org';
const PREFIX = '/voca';
// Generated from the exact original recording bytes, never from a similarly
// named alternate recording. The page's segment times remain unchanged.
const SOURCE_RECORDINGS = {"/snd/en/africa.opus":{"url":"/voca-media/fd59b5b08b3a639de06b.m4a","originalDuration":30.787688,"aacDuration":30.781188,"sha256":"fd59b5b08b3a639de06be8e4e212e84e3de5d510e3c6fb7d62141dd79b8cb017"},"/snd/en/air_travel.opus":{"url":"/voca-media/8ba4a570f3dd0bc9c99c.m4a","originalDuration":39.615833,"aacDuration":39.609333,"sha256":"8ba4a570f3dd0bc9c99c58375aa55ce040e7e6ee4ba34bf4ff53424c60755385"},"/snd/en/animal-groups.opus":{"url":"/voca-media/d9277bafbdda8c0b615a.m4a","originalDuration":10.811042,"aacDuration":10.804542,"sha256":"d9277bafbdda8c0b615ae8dc1722d8bf6f87dd9be176314057cb83ceafc637fa"},"/snd/en/art.opus":{"url":"/voca-media/dde41450d28d5243d039.m4a","originalDuration":65.483063,"aacDuration":65.476563,"sha256":"dde41450d28d5243d03979b4350bc25b5442ba5020c9fe960e749bf689aad565"},"/snd/en/asia.opus":{"url":"/voca-media/2102e01af131b9088edc.m4a","originalDuration":55.701792,"aacDuration":55.695292,"sha256":"2102e01af131b9088edc5094915b5770199bb2a4a1f79b8ba41a60ae178fd3cd"},"/snd/en/bathroom.opus":{"url":"/voca-media/86466438b37914fe18dc.m4a","originalDuration":45.591771,"aacDuration":45.585271,"sha256":"86466438b37914fe18dcae448784bb5e8d24df3c35226bd919c0c3992b749193"},"/snd/en/bedroom.opus":{"url":"/voca-media/4c34eb3baf8318d4a3c6.m4a","originalDuration":26.625354,"aacDuration":26.618854,"sha256":"4c34eb3baf8318d4a3c657fc5fe43ae227c25a5c49d5a5c2cf395fe1cad77c03"},"/snd/en/breakfast.opus":{"url":"/voca-media/96c7776559f8081b6d7c.m4a","originalDuration":20.567104,"aacDuration":20.560604,"sha256":"96c7776559f8081b6d7c63c043fbba3188199734eeac7fc80a9fc1b2fa53a7b3"},"/snd/en/car.opus":{"url":"/voca-media/c6162b65cbd20f406d32.m4a","originalDuration":58.515521,"aacDuration":58.509021,"sha256":"c6162b65cbd20f406d327190914839a707e71c4ea2840e61e0fdd966909cc51e"},"/snd/en/city.opus":{"url":"/voca-media/0703fdd2804482832eb5.m4a","originalDuration":89.980604,"aacDuration":89.974104,"sha256":"0703fdd2804482832eb5d428e1874a485bd966952cee9bd7cd303a9a2a451dd6"},"/snd/en/clothes.opus":{"url":"/voca-media/a85ec22c03ec37d57267.m4a","originalDuration":35.268521,"aacDuration":35.262021,"sha256":"a85ec22c03ec37d57267deea62585a9d27c98e1fc12d463ff65994a0cb0beb32"},"/snd/en/clothes_formal.opus":{"url":"/voca-media/afd48b7a8e078accc575.m4a","originalDuration":24.919021,"aacDuration":24.912521,"sha256":"afd48b7a8e078accc575f9fb4ca9aece2ff23efff3b357405bd51adc0cf3855a"},"/snd/en/clothes_winter.opus":{"url":"/voca-media/3f86698ec87ccb33dd4c.m4a","originalDuration":16.6435,"aacDuration":16.637,"sha256":"3f86698ec87ccb33dd4cf1fff175e73915def3fc918ec16dddc1af48a45b756c"},"/snd/en/communication.opus":{"url":"/voca-media/8eb6f02a2265bc494622.m4a","originalDuration":51.225667,"aacDuration":51.219167,"sha256":"8eb6f02a2265bc494622a8357664b7beca117c27da390bf0ae838eaa0508e4c4"},"/snd/en/computer.opus":{"url":"/voca-media/5c3526f4b761c1ede737.m4a","originalDuration":77.454042,"aacDuration":77.447542,"sha256":"5c3526f4b761c1ede737672facf38a6de1b7908c6c1c9abae3aa6b4e66409356"},"/snd/en/construction.opus":{"url":"/voca-media/5c75e79aab135aea27ce.m4a","originalDuration":54.383,"aacDuration":54.3765,"sha256":"5c75e79aab135aea27ce5d836240642f258534cf5b813de22d0d9f09e56fe391"},"/snd/en/den.opus":{"url":"/voca-media/6acb12d5099a8f4e6c6f.m4a","originalDuration":22.266063,"aacDuration":22.259563,"sha256":"6acb12d5099a8f4e6c6f858cf35244d9d8413ab8e5ee036759d28a0c3958bf0c"},"/snd/en/door.opus":{"url":"/voca-media/e5c0d1ebf97dac45f61c.m4a","originalDuration":16.913479,"aacDuration":16.906979,"sha256":"e5c0d1ebf97dac45f61cf265a4adeddc4ac768ea53a93c3d9d4ac08edade05a7"},"/snd/en/drinks.opus":{"url":"/voca-media/aeaf43769f98c3a6f273.m4a","originalDuration":20.146646,"aacDuration":20.140146,"sha256":"aeaf43769f98c3a6f273b8c962e40628a3f136f01ecf92a0bf1a1cd68399c582"},"/snd/en/electronics.opus":{"url":"/voca-media/5e21815c4ed1842b0e0b.m4a","originalDuration":30.52575,"aacDuration":30.51925,"sha256":"5e21815c4ed1842b0e0b6465974fdd7be53ef814e183e4f9045206ec6cecd417"},"/snd/en/fair.opus":{"url":"/voca-media/8801553cea09b62495e7.m4a","originalDuration":31.997583,"aacDuration":31.991083,"sha256":"8801553cea09b62495e71a60090e765d94a9f7c028634f615f79f8e9b6beca2d"},"/snd/en/fantasy.opus":{"url":"/voca-media/b90f5271e4f032b017d4.m4a","originalDuration":35.01225,"aacDuration":35.00575,"sha256":"b90f5271e4f032b017d4612506ea105c6e0d290c59d7a69aa758b115a725f5c1"},"/snd/en/farm.opus":{"url":"/voca-media/b2f7bfd410d6c2b6f9a1.m4a","originalDuration":45.495604,"aacDuration":45.489104,"sha256":"b2f7bfd410d6c2b6f9a18aa5fea2848b34b0dfa19a9647141acb54bb0cf76f1f"},"/snd/en/farm_anim.opus":{"url":"/voca-media/d92162963d197f1cfb04.m4a","originalDuration":61.61875,"aacDuration":61.61225,"sha256":"d92162963d197f1cfb04077f9c4cc31f63e61c34c4a739609af716ef2fa576f4"},"/snd/en/food2_new.opus":{"url":"/voca-media/f7b9385fae39c93ddd97.m4a","originalDuration":20.388938,"aacDuration":20.382438,"sha256":"f7b9385fae39c93ddd97df3fe0ad47a836b4581300f004dd994d43fa0e04d5ab"},"/snd/en/food_new.opus":{"url":"/voca-media/c5eca253e014915f36ba.m4a","originalDuration":36.368958,"aacDuration":36.362458,"sha256":"c5eca253e014915f36ba894564e0e717ecccee6ca014ef2d46a8623c176c4cfa"},"/snd/en/games.opus":{"url":"/voca-media/cdb5c5f39ef2f442e532.m4a","originalDuration":72.735729,"aacDuration":72.729229,"sha256":"cdb5c5f39ef2f442e532ce8f9111559be188d71478cee527c13130fdd9f09691"},"/snd/en/garden.opus":{"url":"/voca-media/ad923de29145122cf135.m4a","originalDuration":38.155771,"aacDuration":38.149271,"sha256":"ad923de29145122cf13522e3e4c72f6d0d14502f613a793b963b11854d479218"},"/snd/en/history.opus":{"url":"/voca-media/91eda337525d7021e535.m4a","originalDuration":71.681604,"aacDuration":71.675104,"sha256":"91eda337525d7021e53533a4bede9e34402a9e4e9903e18882a2272265630aaf"},"/snd/en/indoors.opus":{"url":"/voca-media/1e2381e7f4837531a80d.m4a","originalDuration":48.616229,"aacDuration":48.609729,"sha256":"1e2381e7f4837531a80d1a9c5a4aebac74f12ed12ae132957be08e8e396de07e"},"/snd/en/insects.opus":{"url":"/voca-media/2ffcba08eda5c7b5e17b.m4a","originalDuration":54.691979,"aacDuration":54.685479,"sha256":"2ffcba08eda5c7b5e17b4f2dbbf4c035cec57cc785e97c2706d62cb7fc3c4099"},"/snd/en/instruments.opus":{"url":"/voca-media/d7bfba9a9d47e08381c1.m4a","originalDuration":52.45875,"aacDuration":52.45225,"sha256":"d7bfba9a9d47e08381c16fe6e6ee564553453ed6c38f0d660ac4b9b8214ce3bc"},"/snd/en/jewelry.opus":{"url":"/voca-media/f0a30e8001867a58f1a7.m4a","originalDuration":21.292583,"aacDuration":21.286083,"sha256":"f0a30e8001867a58f1a7b47240ab4e9712a542cd127907bca60f30b4ba062972"},"/snd/en/jobs.opus":{"url":"/voca-media/53333956ef97f127cb63.m4a","originalDuration":31.513542,"aacDuration":31.507042,"sha256":"53333956ef97f127cb639c3295c21a51638e7715c4f80e9ef74315b55f656bfd"},"/snd/en/kitchen.opus":{"url":"/voca-media/0ced9b1943a2b86780a8.m4a","originalDuration":24.942958,"aacDuration":24.936458,"sha256":"0ced9b1943a2b86780a8d2dafe754ec976d11cfee10b95b1d6356462ef5a638b"},"/snd/en/kitchen2.opus":{"url":"/voca-media/2f08c95dbfda9bb018b9.m4a","originalDuration":28.748917,"aacDuration":28.742417,"sha256":"2f08c95dbfda9bb018b9540358b4c3d7f8b563245adfea3399dc6d8a9bba9849"},"/snd/en/landscape.opus":{"url":"/voca-media/c1ef3b64342a6a85beeb.m4a","originalDuration":32.096167,"aacDuration":32.089667,"sha256":"c1ef3b64342a6a85beeb3691803df6f3f0c288cff627410ee2f73721e0ae9aa6"},"/snd/en/landtravel.opus":{"url":"/voca-media/c1c105bfd83b41f66343.m4a","originalDuration":69.476708,"aacDuration":69.470208,"sha256":"c1c105bfd83b41f663438851f1af5b8643d7ca9e2fad172ab18775aa8ac8887a"},"/snd/en/law_order.opus":{"url":"/voca-media/a7f34c7b1c7d3fbc461b.m4a","originalDuration":59.639438,"aacDuration":59.632938,"sha256":"a7f34c7b1c7d3fbc461b9b648ea2c1ab35aa43fe4a2394d1f5593d2ca0d92117"},"/snd/en/meat.opus":{"url":"/voca-media/21c7ec0537e2c0622e6c.m4a","originalDuration":12.002375,"aacDuration":11.995875,"sha256":"21c7ec0537e2c0622e6cedf10e4feb04e6cc67a91546812c98cfaf7d7348dc37"},"/snd/en/med.opus":{"url":"/voca-media/1f3a3164ad5b06853548.m4a","originalDuration":40.724958,"aacDuration":40.718458,"sha256":"1f3a3164ad5b068535485f26fd1c73ac6ec89fd74ef1f21c6caa31290b1b1ebb"},"/snd/en/military.opus":{"url":"/voca-media/3d71bf01168d600f99bb.m4a","originalDuration":57.973021,"aacDuration":57.966521,"sha256":"3d71bf01168d600f99bb7f4ee405f674f143c1ffa10eda15017d8e922dd05f4a"},"/snd/en/money.opus":{"url":"/voca-media/a130769a8bca363d9df6.m4a","originalDuration":30.844792,"aacDuration":30.838292,"sha256":"a130769a8bca363d9df6d7e73ebf30bc0a5b5ab8c075997f9e89f81d768c64c2"},"/snd/en/organs.opus":{"url":"/voca-media/41de11bf7b3205fa1b0d.m4a","originalDuration":26.694438,"aacDuration":26.687938,"sha256":"41de11bf7b3205fa1b0d3052b795f35e073c165d95dd3fe1b9368a63ad256712"},"/snd/en/outdoors.opus":{"url":"/voca-media/b6762a9796427b4c66e6.m4a","originalDuration":66.518708,"aacDuration":66.512208,"sha256":"b6762a9796427b4c66e674e5a607aefd698d693aa1d8163a0468a34fd34132ca"},"/snd/en/outside.opus":{"url":"/voca-media/ab74c9b8b5343a54e367.m4a","originalDuration":18.825875,"aacDuration":18.819375,"sha256":"ab74c9b8b5343a54e367ee022f4bfefd1d196d0764b4530a5b51538d4e66e17b"},"/snd/en/pets.opus":{"url":"/voca-media/8c02c2a4adcbaa61a336.m4a","originalDuration":32.196458,"aacDuration":32.189958,"sha256":"8c02c2a4adcbaa61a336d5d0db685d77cc9e25e4041397ff8d093be035437a97"},"/snd/en/plants.opus":{"url":"/voca-media/9974261c8444065b05d8.m4a","originalDuration":48.136875,"aacDuration":48.130375,"sha256":"9974261c8444065b05d8b9b0ae288b89c7a94009aaf0ed5b188371f1fd8dc4d5"},"/snd/en/religion.opus":{"url":"/voca-media/7d1f8d0151cd14c69c96.m4a","originalDuration":69.889021,"aacDuration":69.882521,"sha256":"7d1f8d0151cd14c69c963b5fc588d2409d3061e6ebff3e3420fbb615c94af1d0"},"/snd/en/reptiles.opus":{"url":"/voca-media/60add154985e7197d474.m4a","originalDuration":21.206042,"aacDuration":21.199542,"sha256":"60add154985e7197d474d0a3168f5672ddc0a7eb46529caabffed7110b92590b"},"/snd/en/school-supplies.opus":{"url":"/voca-media/6c04a21a83c7f97ce369.m4a","originalDuration":24.001875,"aacDuration":23.995375,"sha256":"6c04a21a83c7f97ce3693d543f57e7bd647a7106dbd7b46b43bf99b96d0578e8"},"/snd/en/school.opus":{"url":"/voca-media/b9c190027df7acf0d04b.m4a","originalDuration":14.547708,"aacDuration":14.541208,"sha256":"b9c190027df7acf0d04bf0ec2865e69c66ec37211e0182a404a7789aba45ae9a"},"/snd/en/science.opus":{"url":"/voca-media/249074338e6cdca5384a.m4a","originalDuration":70.432625,"aacDuration":70.426125,"sha256":"249074338e6cdca5384a36b3c5f7f58659e9a609ff3389193157e8963180fb40"},"/snd/en/sea.opus":{"url":"/voca-media/e826541149699b68f209.m4a","originalDuration":38.716229,"aacDuration":38.709729,"sha256":"e826541149699b68f209024f82acba0ac329e0458a6dbfef4d577c83d5fd7938"},"/snd/en/sea_travel.opus":{"url":"/voca-media/b8967be44dc4b3838d35.m4a","originalDuration":42.804542,"aacDuration":42.798042,"sha256":"b8967be44dc4b3838d352c253765109165fd78cebc6c78cc8c213da4c143d2eb"},"/snd/en/sleepwear.opus":{"url":"/voca-media/1f9dfb163eaf67b927a0.m4a","originalDuration":13.085479,"aacDuration":13.078979,"sha256":"1f9dfb163eaf67b927a0a9330bc2da782b653719cee49d1a5912038fba947ec2"},"/snd/en/space.opus":{"url":"/voca-media/52a1b2d9afb6885a4a9f.m4a","originalDuration":50.896146,"aacDuration":50.889646,"sha256":"52a1b2d9afb6885a4a9f5fc5f220f55f37918193c479be2c06c8bc60d325c581"},"/snd/en/sports.opus":{"url":"/voca-media/b01a0d6c0f2f00e2d623.m4a","originalDuration":118.598375,"aacDuration":118.591875,"sha256":"b01a0d6c0f2f00e2d623f247a6ee444073eedb323b5bddb30e1b04c29095c685"},"/snd/en/time.opus":{"url":"/voca-media/580f32e2331e848da668.m4a","originalDuration":50.976542,"aacDuration":50.970042,"sha256":"580f32e2331e848da668a1792d63a7717b69f23b8a5a941e26477c483e2c43b9"},"/snd/en/travel.opus":{"url":"/voca-media/88387ae3becf9f020c72.m4a","originalDuration":11.77825,"aacDuration":11.77175,"sha256":"88387ae3becf9f020c72b255e992ad8694f9b8ef885a186c0a7124bd9b164767"},"/snd/en/utility.opus":{"url":"/voca-media/d7e0a1c66f432618adfa.m4a","originalDuration":27.766563,"aacDuration":27.760063,"sha256":"d7e0a1c66f432618adfac2c24214cf64791ccdadfdd62384e4c1e260299c7b0b"},"/snd/en/veg.opus":{"url":"/voca-media/9aee04278255240d8dd3.m4a","originalDuration":32.790667,"aacDuration":32.784167,"sha256":"9aee04278255240d8dd3addb3ba428b4242b926053a61998df9fcc3f36cca092"},"/snd/en/veg2.opus":{"url":"/voca-media/3594b2e451ec4c44207b.m4a","originalDuration":29.639458,"aacDuration":29.632958,"sha256":"3594b2e451ec4c44207b3e232e614468bf217eea5d4cfaa034c848183c203925"},"/snd/en/weather.opus":{"url":"/voca-media/f88b649ab4f59d1826a2.m4a","originalDuration":35.452333,"aacDuration":35.445833,"sha256":"f88b649ab4f59d1826a29d8e715639138a82c60c79f6e13b73b39633432679c8"}};

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
    html=html.replace(/<(source|audio)\b[^>]*\bsrc=["'](\/voca\/snd\/[^"']+\.opus)["'][^>]*>/gi,(tag,kind,src)=>{
      const exact=SOURCE_RECORDINGS[src.slice(PREFIX.length)];
      if(!exact)return tag;
      let rewritten=tag.replace(src,exact.url);
      if(kind.toLowerCase()==='source'){
        rewritten=rewritten.replace(/\s+type=["'][^"']*["']/i,'');
        rewritten=rewritten.replace(/\s*\/?>$/,' type="audio/mp4">');
      }
      return rewritten;
    });
    html=html.replace(/url\(\s*(["']?)(\/[^)'"\s]+)\1\s*\)/g,(_,q,url)=>'url('+q+localUrl(url)+q+')');
    html=html.replace(/<script[^>]*src=["'][^"']*\/analytics\/[^"']*["'][^>]*><\/script>/gi,'');
    html=html.replace(/(src=["']\/voca\/app\/ip[^"']+)(["'])/g,(_,src,q)=>src+(src.includes('?')?'&':'?')+'voca=20261011b'+q);
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
