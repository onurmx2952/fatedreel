(()=>{
 let ready=false;const timer=setTimeout(fail,20000);
 function fail(){if(ready)return;document.querySelector('#main').innerHTML='<div class="loading"><h1>Hikâyeler açılamadı.</h1><p>Bağlantını kontrol edip yeniden dene. Kayıtların korunur.</p><button class="primary" id="reload-app">Yeniden aç</button></div>';document.querySelector('#reload-app').onclick=()=>location.reload();}
 window.addEventListener('o13-ready',()=>{ready=true;clearTimeout(timer);});window.addEventListener('o13-failed',fail);
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js',{scope:'/o13/',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
 import('./app.js?v=1').catch(fail);
})();
