/* Shared Google session and durable learning progress. */
(() => {
  const app = location.pathname.split('/')[1];
  if (!['o11', 'o12'].includes(app)) return;
  const accepts = k => app === 'o11' ? k === 'fatedreel-o11-book-v1' : k === 'word-atlas-o12:settings' || /^word-atlas-o12:v2:[a-zA-Z0-9_-]+$/.test(k);
  const metaKey = `learning-sync:${app}`;
  let user, revision = 0, ready = false, busy = false, last = '', timer, googleReady;
  const snapshot = () => Object.fromEntries(Object.keys(localStorage).filter(accepts).sort().map(k => [k, localStorage.getItem(k)]));
  const same = (a,b) => JSON.stringify(Object.entries(a || {}).sort()) === JSON.stringify(Object.entries(b || {}).sort());
  const api = async (path, options = {}) => {
    const r = await fetch(path, {credentials:'same-origin', ...options});
    const data = await r.json();
    if (!r.ok) { const e = new Error(data.error || 'Oturum bulunamadı. Yeniden giriş yap.'); e.status = r.status; throw e; }
    return data;
  };
  const put = data => {const body=JSON.stringify({...data,userId:user.id});return api(`/api/learning/${app}`,{method:'PUT',keepalive:new TextEncoder().encode(body).length<60000,headers:{'Content-Type':'application/json'},body});};
  const panel = document.createElement('details');
  panel.id = 'learning-account';
  panel.innerHTML = '<summary>☁ Hesabım</summary><div class="learning-body"><button type="button" class="learning-close" aria-label="Hesap panelini kapat">✕</button><strong>İlerlemen seninle gelsin</strong><p role="status" id="learning-status">Hesap kontrol ediliyor…</p><div id="learning-actions"></div><small>Google ile giriş iki uygulamada ortaktır. Çevrimdışı değişiklikler bu cihazda saklanır.</small></div>';
  const style = document.createElement('style');
  style.textContent = '#learning-account{position:fixed;right:12px;bottom:calc(80px + env(safe-area-inset-bottom,0px));z-index:1500;font:14px/1.5 system-ui;color:#202633;background:#fff;border:1px solid #cdd3dc;border-radius:14px;box-shadow:0 5px 24px #0002;max-width:calc(100vw - 24px)}#learning-account summary{cursor:pointer;padding:10px 15px;list-style:none}.learning-body{padding:0 16px 16px;width:290px;max-width:calc(100vw - 58px)}#learning-account button{font:inherit;cursor:pointer;border:1px solid #b9c3cf;background:#f5f7fa;color:#202633;padding:8px 12px;border-radius:8px;margin:4px 4px 4px 0}#learning-account small{display:block;margin-top:12px;color:#586273}#learning-status{margin:10px 0}#learning-account .learning-close{float:right;border:0;background:transparent;font-size:20px;line-height:1;padding:6px;margin:-3px -5px 4px 8px}#learning-account .learning-close:focus-visible{outline:2px solid #4873b9;outline-offset:2px}';
  document.head.append(style); document.body.append(panel);
  const status = text => panel.querySelector('#learning-status').textContent = text;
  const actions = panel.querySelector('#learning-actions');
  const closePanel = () => { panel.open=false; };
  panel.querySelector('.learning-close').addEventListener('click',closePanel);
  document.addEventListener('pointerdown',event=>{if(panel.open && !panel.contains(event.target))closePanel();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && panel.open){closePanel();panel.querySelector('summary').focus();}});

  function button(text, fn) {const b=document.createElement('button'); b.textContent=text; b.onclick=()=>Promise.resolve().then(fn).catch(fail); actions.append(b);}
  function fail(e) {status(e.message || 'Bağlantı kurulamadı. Kayıt bu cihazda duruyor.'); if(e.status===409 || e.status===401){panel.open=true;ready=false;actions.replaceChildren();button('Hesabı yeniden kontrol et',init);}}
  function remember(data) {localStorage.setItem(metaKey,JSON.stringify({user:user.id,revision,data}));last=JSON.stringify(data);}
  function signed() {
    closePanel();
    actions.replaceChildren(); status(`${user.email} · Hesaba kaydedildi`);
    button('Şimdi eşitle', sync);
    button('Çıkış yap', async()=>{ready=false;clearInterval(timer);await api('/api/program/logout',{method:'POST'});window.google?.accounts.id.disableAutoSelect();location.reload();});
  }
  async function sync() {
    if (!ready || busy || !user) return;
    const data=snapshot(); if(JSON.stringify(data)===last) return;
    busy=true;status('Hesabına kaydediliyor…');
    try {const r=await put({revision,data});revision=r.revision;remember(data);status(`${user.email} · Hesaba kaydedildi`);}
    catch(e){fail(e);}finally{busy=false;}
  }
  function backup(data) {
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app,data},null,2)],{type:'application/json'}));a.download=`${app}-yedek-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  async function connect() {
    ready=false;
    const remote=await api(`/api/learning/${app}`);revision=remote.revision;
    if(remote.userId!==user.id)throw Object.assign(new Error('Hesap değişti. Hesabı yeniden kontrol et.'),{status:401});
    const local=snapshot();let meta;
    try{meta=JSON.parse(localStorage.getItem(metaKey));}catch{}
    const start=()=>{ready=true;signed();clearInterval(timer);timer=setInterval(()=>sync(),2000);};
    const useCloud=()=>{
      localStorage.setItem(`learning-backup:${app}:${Date.now()}`,JSON.stringify(local));
      Object.keys(localStorage).filter(accepts).forEach(k=>localStorage.removeItem(k));
      Object.entries(remote.data).forEach(([k,v])=>{if(accepts(k))localStorage.setItem(k,v);});
      remember(remote.data);location.reload();
    };
    if(remote.data && same(local,remote.data)){remember(local);start();return;}
    if(remote.data && (!Object.keys(local).length || (meta?.user===user.id && same(local,meta.data)))) {useCloud();return;}
    if(meta?.user===user.id && meta.revision===revision){last=JSON.stringify(meta.data);start();await sync();return;}
    panel.open=true;actions.replaceChildren();
    status(remote.data ? 'Cihazdaki kayıt ile hesaptaki kayıt farklı. Hangisiyle devam edilsin?' : 'Bu hesaba ilk kayıt. Bu cihazdaki ilerlemeyi hesabına kaydet.');
    if(remote.data)button('Hesaptaki kaydı aç',useCloud);
    button('Cihaz kaydını hesaba kaydet',async()=>{
      if(remote.data) backup(remote.data);
      const data=snapshot();const r=await put({revision,data});revision=r.revision;remember(data);start();
    });
    button('Cihaz yedeğini indir',()=>backup(local));
  }
  async function login() {
    const config=await api('/api/program/config');
    if(!config.googleClientId)throw Error('Google giriş yapılandırması bulunamadı.');
    if(!googleReady)googleReady=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client?hl=tr';s.onload=resolve;s.onerror=()=>{googleReady=null;reject(Error('Google yüklenemedi. İnternet bağlantını kontrol et.'));};document.head.append(s);});
    await googleReady;
    google.accounts.id.initialize({client_id:config.googleClientId,callback:async response=>{
      try{status('Giriş yapılıyor…');const r=await api('/api/program/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:response.credential})});user=r.user;await connect();}catch(e){fail(e);}
    }});
    actions.replaceChildren();const target=document.createElement('div');actions.append(target);
    google.accounts.id.renderButton(target,{theme:'outline',size:'large',locale:'tr'});
    status('Kaldığın yer, notların ve tekrarların hesabında saklansın.');
  }
  async function init(){
    try{const r=await api('/api/program/me');user=r.user;await connect();}
    catch(e){if(e.status===401){ready=false;status('Google ile giriş yaparak ilerlemeni koru.');actions.replaceChildren();button('Google ile giriş yap',login);}else{fail(e);button('Yeniden dene',()=>{actions.replaceChildren();return init();});}}
  }
  window.addEventListener('online',()=>sync());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')queueMicrotask(sync);});
  window.addEventListener('pagehide',()=>queueMicrotask(sync));
  const originalSetItem = Storage.prototype.setItem;
  let changeTimer;
  Storage.prototype.setItem = function(key,value) {
    originalSetItem.call(this,key,value);
    if(this===localStorage && accepts(key)) {clearTimeout(changeTimer);changeTimer=setTimeout(sync,350);}
  };
  setTimeout(init,1000);
})();
