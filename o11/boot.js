// Worker updates must run even if the application module cannot load.
(() => {
 const page=document.querySelector('#page');
 let finished=false;
 function fail(){
  if(finished)return;
  page.innerHTML='<div class="book-page"><h1>Kitap açılamadı.</h1><p>Bağlantıyı kontrol edip tekrar dene. İlerlemen ve notların korunur.</p><button class="primary" id="retry-book">Tekrar aç</button></div>';
  document.querySelector('#retry-book').onclick=async event=>{
   event.target.disabled=true;
   try {
    if('serviceWorker' in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.filter(r=>new URL(r.scope).pathname==='/o11/').map(r=>r.unregister()));}
    if('caches' in window)await Promise.all((await caches.keys()).filter(k=>k.startsWith('o11-book-')).map(k=>caches.delete(k)));
   }catch(error){console.warn('Book cache repair',error);}
   const url=new URL(location.href);url.searchParams.set('refresh',Date.now());location.replace(url.href);
  };
 }
 window.addEventListener('o11-ready',()=>{finished=true;clearTimeout(watchdog);});
 window.addEventListener('o11-failed',fail);
 const watchdog=setTimeout(fail,20000);
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js',{scope:'/o11/',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
 import('./app.js?v=8').catch(error=>{console.error('Book startup',error);fail();});
})();
