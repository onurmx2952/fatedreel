import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.argv[2]||'http://127.0.0.1:8811/o12/';const engine=process.argv[3]||'edge';
const b=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'msedge',headless:true}));
try{
 const p=await b.newPage({viewport:{width:810,height:1080},serviceWorkers:'block'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/program/me',r=>r.fulfill({status:401,contentType:'application/json',body:'{"user":null}'}));
 await p.addInitScript(()=>{if(!localStorage.getItem('word-atlas-o12:settings'))localStorage.setItem('word-atlas-o12:settings',JSON.stringify({onboarded:true,splash:false,sfx:false,autoplay:false,ambience:'off',dailyNew:5}));});
 const index=await(await p.request.get(base+'atlas/index.json')).json();const byId=new Map(index.words.map(w=>[w[0],w]));const key='word-atlas-o12:v2:'+index.id;
 async function session(){const count=p.locator('.learn-count');if(await count.count()){const pos=Number((await count.innerText()).split('/')[0].trim())-1;await p.waitForFunction(({key,pos})=>JSON.parse(localStorage.getItem(key)||'{}').session?.index===pos,{key,pos});}return p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}').session,key);}
 async function waitScope(scope){await p.locator('.learn-stage').waitFor();await p.waitForFunction(({key,scope})=>JSON.parse(localStorage.getItem(key)||'{}').session?.scope===scope,{key,scope});assert.ok((await session()).steps.every(step=>byId.get(step.id)[4]===index.cefr.indexOf(scope.slice(6))));}
 await p.goto(base);await p.getByRole('button',{name:'A1 çalışmasına başla',exact:true}).click();await waitScope('level:A1');
 while(await p.locator('.intro').count())await p.getByRole('button',{name:/Anladım/}).click();await p.locator('.option,.spell-input').first().waitFor();let s=await session();
 if(s.steps[s.index].kind==='spell'){await p.locator('.spell-input').fill(byId.get(s.steps[s.index].id)[1]);await p.locator('.spell button[type="submit"]').click();}else await p.locator('[data-option="'+s.steps[s.index].id+'"]').click();
 await p.locator('.feedback.is-right').waitFor();await p.getByRole('button',{name:'Devam et',exact:false}).click();
 await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)||'{}').session?.index>5,key);const a1=await session();
 await p.getByRole('button',{name:'duraklat ve geri dön',exact:true}).click();await p.getByRole('button',{name:'A2 çalışmasına başla',exact:true}).click();await waitScope('level:A2');assert.notEqual((await session()).id,a1.id);
 await p.getByRole('button',{name:'Anladım',exact:false}).click();await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)||'{}').session?.index===1,key);const a2=await session();await p.reload();await waitScope('level:A2');assert.equal((await session()).index,1);
 await p.getByRole('button',{name:'duraklat ve geri dön',exact:true}).click();await p.getByRole('button',{name:'A1 çalışmasına başla',exact:true}).click();await waitScope('level:A1');assert.equal((await session()).id,a1.id);assert.equal((await session()).index,a1.index);
 await p.goto(base+'#/atlas?level=A2');await p.getByRole('button',{name:'A2 çalışmasına başla',exact:true}).click();await waitScope('level:A2');assert.equal((await session()).id,a2.id);
 if(engine==='edge'){const audio=p.waitForRequest(r=>r.url().includes('/o12/caro/')&&r.url().endsWith('.mp3'));await p.locator('.intro .speak').first().click();await audio;}
 const fresh = await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const first = await fresh.newPage();
 await first.addInitScript(()=>localStorage.setItem('word-atlas-o12:settings',JSON.stringify({autoplay:false,sfx:false,ambience:'off'})));
 await first.goto(base);await first.locator('.onboard .choice').filter({hasText:'A1'}).click();await first.locator('.onboard .btn-primary').click();await first.locator('.learn-stage').waitFor();
 await first.waitForFunction(k=>JSON.parse(localStorage.getItem(k)||'{}').session?.scope==='level:A1',key);assert.equal(await first.locator('.learn-level').innerText(),'A1');await fresh.close();
 assert.deepEqual(errors,[]);console.log(engine+': A1/A2 direct learning, actual quiz feedback, exact level words, independent resume, reload and Atlas start passed');
}finally{await b.close();}
