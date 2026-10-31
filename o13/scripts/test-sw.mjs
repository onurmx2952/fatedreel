import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const handlers={},deleted=[],items=new Map();
let offline=false,html=false,fetches=0;
const key=x=>typeof x==='string'?x:x.url||x.href;
const cache={put:async(k,v)=>items.set(key(k),v),match:async k=>items.get(key(k))};
const scope='https://fatedreel.com/o13/';
const context={URL,Response,console,self:{registration:{scope},addEventListener:(n,f)=>handlers[n]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>['o11-v10','o12-v3','o13-old','o13-v1'],delete:async n=>deleted.push(n)},fetch:async()=>{fetches++;if(offline)throw Error('offline');return new Response(html?'<html>oops</html>':'asset',{headers:{'Content-Type':html?'text/html':'text/javascript'}});}};
vm.runInNewContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
let work;handlers.activate({waitUntil:p=>work=p});await work;assert.deepEqual(deleted,['o13-old']);
async function request(path,{method='GET',range=false,mode='cors'}={}){let result;handlers.fetch({request:{url:new URL(path,scope).href,method,mode,headers:new Headers(range?{range:'bytes=0-100'}:{})},respondWith:p=>result=p});return result?await result:undefined;}
assert.equal(await request('/o11/app.js'),undefined);assert.equal(await request('/api/learning/o13'),undefined);assert.equal(await request('app.js',{method:'POST'}),undefined);assert.equal(await request('audio/test.mp3',{range:true}),undefined);
await request('app.js?v=1');const original=items.get(scope+'app.js?v=1');assert.ok(original);
html=true;await request('app.js?v=1');assert.equal(items.get(scope+'app.js?v=1'),original,'HTML must never poison JS cache');html=false;
await request('audio/test.mp3');const before=fetches;await request('audio/test.mp3');assert.equal(fetches,before,'Media cache first');
items.set(scope,new Response('offline shell'));offline=true;const shell=await request('reader',{mode:'navigate'});assert.equal(await shell.text(),'offline shell');assert.equal((await request('missing.mp3')).type,'error');
console.log('PASS: O13 cache scope, old-cache isolation, range exclusion, HTML poisoning prevention, media cache and offline shell.');
