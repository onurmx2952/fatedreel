import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const code=await fs.readFile(new URL('../sw.js',import.meta.url),'utf8');
const origin='https://fatedreel.com',scope=origin+'/o11/';
const store=new Map(),listeners={},deleted=[];
const key=x=>new URL(typeof x==='string'?x:x.url||x.href,scope).href;
const cache={match:async x=>store.get(key(x))?.clone(),put:async(x,r)=>store.set(key(x),r.clone())};
let network=async()=>{throw Error('offline');};
const context={URL,Response,AbortController,setTimeout,clearTimeout,fetch:(...args)=>network(...args),caches:{open:async()=>cache,keys:async()=>['o11-book-v6','o11-book-v10','o12-atlas'],delete:async k=>deleted.push(k)},self:{registration:{scope},location:{origin},skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(name,fn)=>listeners[name]=fn}};
vm.runInNewContext(code,context);
async function request(path,mode='cors',headers={}){const tasks=[];let result;listeners.fetch({request:{url:origin+path,method:'GET',mode,headers:new Headers(headers)},respondWith:p=>result=p,waitUntil:p=>tasks.push(p)});const r=await result;await Promise.all(tasks);return r;}
store.set(scope,new Response('<html>book</html>',{headers:{'Content-Type':'text/html'}}));
assert.equal((await request('/o11/missing.js')).type,'error','Missing JS must never get HTML');
assert.equal((await request('/o11/missing.json')).type,'error','Missing JSON must never get HTML');
assert.match(await(await request('/o11/?refresh=1','navigate')).text(),/book/);
store.set(scope+'app.js?v=10',new Response('cached JS',{headers:{'Content-Type':'application/javascript'}}));
assert.equal(await(await request('/o11/app.js?v=10')).text(),'cached JS');
network=async()=>new Response('<html>wrong type</html>',{headers:{'Content-Type':'text/html'}});
assert.equal(await(await request('/o11/app.js?v=10')).text(),'cached JS','Bad online response must not poison cache');
network=async()=>new Response('new JS',{headers:{'Content-Type':'application/javascript'}});
assert.equal(await(await request('/o11/app.js?v=10')).text(),'new JS');
network=async()=>new Response('partial',{status:206});
await request('/o11/audio/a.mp3','cors',{range:'bytes=0-5'});assert.ok(!store.has(scope+'audio/a.mp3'));
// A failed install request must not keep a broken old worker in control.
network=async()=>{throw Error('offline');};
let task;listeners.install({waitUntil:p=>task=p});await task;
listeners.activate({waitUntil:p=>task=p});await task;
assert.deepEqual(deleted,['o11-book-v6']);
// Startup recovery must be independent of the module import and leave records alone.
const boot=await fs.readFile(new URL('../boot.js',import.meta.url),'utf8');
const page={innerHTML:''},button={},events={},timers=[];let reload,unregistered=0;
const removed=[];
const bootContext={URL,Date,console,document:{querySelector:s=>s==='#page'?page:button},navigator:{serviceWorker:{register:async()=>({update:async()=>{}}),getRegistrations:async()=>[{scope,unregister:async()=>unregistered++},{scope:origin+'/o12/',unregister:async()=>assert.fail('Other app unregistered')}]}},window:{addEventListener:(n,fn)=>events[n]=fn},caches:{keys:async()=>['o11-book-v6','o12-atlas'],delete:async k=>removed.push(k)},location:{href:scope+'#unit-8',replace:u=>reload=u},setTimeout:fn=>(timers.push(fn),timers.length),clearTimeout:()=>{}};
// Replace only the import expression to simulate module download rejection in VM.
bootContext.window.caches=bootContext.caches;
vm.runInNewContext(boot.replace("import('./app.js?v=10')","Promise.reject(new Error('module offline'))"),bootContext);
await new Promise(r=>setImmediate(r));assert.match(page.innerHTML,/Tekrar aç/);
await button.onclick({target:button});assert.equal(unregistered,1);assert.deepEqual(removed,['o11-book-v6']);assert.equal(new URL(reload).hash,'#unit-8');
assert.ok(!/localStorage|indexedDB/.test(boot),'Recovery must not mutate progress');
console.log('Startup failure recovery, offline shell, cached scripts, missing JS/JSON, bad MIME, worker replacement and partial audio passed');
