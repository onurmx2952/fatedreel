const CACHE='o11-book-v9';
const CORE=['./','index.html','boot.js?v=9','style.css?v=1','atelier.css?v=9','app.js?v=9','book.json?v=8','activities.js?v=1','sentences.js?v=9','feedback.js?v=9','icon.svg','manifest.webmanifest','art/atelier-hero.webp',...Array.from({length:6},(_,i)=>`art/chapter-${i+1}.webp`)];
function valid(response,url){
 if(!response?.ok)return false;
 const type=response.headers.get('content-type')||'';
 if(url.pathname.endsWith('.js'))return /javascript/.test(type);
 if(url.pathname.endsWith('.json'))return /json/.test(type);
 return true;
}
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // An unavailable picture or transient request must not block worker replacement.
  await Promise.all(CORE.map(async path=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const url=new URL(path,self.registration.scope),response=await fetch(url,{cache:'reload',signal:controller.signal});if(valid(response,url))await cache.put(url,response);}catch{}finally{clearTimeout(timer);}}));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('o11-book-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/o11/'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),hit=await cache.match(event.request);
  if(url.pathname.includes('/audio/')){
   if(hit)return hit;
   const response=await fetch(event.request);
   // Partial audio must never be cached as a complete recording.
   if(response.status===200&&!event.request.headers.has('range'))event.waitUntil(cache.put(event.request,response.clone()).catch(()=>{}));
   return response;
  }
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch(event.request,{signal:controller.signal,cache:'no-cache'});
   if(!valid(response,url))throw Error('Invalid book response');
   event.waitUntil(cache.put(event.request,response.clone()).catch(()=>{}));
   return response;
  }catch{
   if(valid(hit,url))return hit;
   // Only a navigation may receive HTML. Never substitute HTML for JS or JSON.
   if(event.request.mode==='navigate'){const shell=await cache.match(new URL('./',self.registration.scope));if(shell)return shell;}
   return Response.error();
  }finally{clearTimeout(timeout);}
 })());
});
