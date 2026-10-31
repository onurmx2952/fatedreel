const CACHE='o13-v1';
const CORE=['./','index.html','boot.js?v=1','app.js?v=1','model.js?v=1','style.css?v=1','content.json?v=1','vendor/english-trainer/srs.js?v=1','icon.svg','manifest.webmanifest',...['coffee','my-day','new-job','family-picnic','rainy-day','london-weekend'].map(x=>'art/'+x+'.webp')];
function valid(response,url){const type=response?.headers.get('Content-Type')||'';return response?.ok&&response.status!==206&&(/\.js$/.test(url.pathname)?/javascript/.test(type):/\.json$/.test(url.pathname)?/json/.test(type):true);}
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.all(CORE.map(async path=>{try{const url=new URL(path,self.registration.scope),r=await fetch(url);if(valid(r,url))await cache.put(url,r);}catch{}}));await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('o13-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname)||event.request.headers.has('range'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),isMedia=/\.(mp3|webp|svg|png)$/.test(url.pathname);
  if(isMedia){const found=await cache.match(event.request);if(found)return found;}
  try{const r=await fetch(event.request);if(valid(r,url)){await cache.put(event.request,r.clone());return r;}const cached=await cache.match(event.request);return cached||r;}
  catch{const cached=await cache.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return await cache.match(scope.href)||await cache.match(new URL('index.html',scope))||Response.error();return Response.error();}
 })());
});
