import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {buildSentences} from '../sentences.js';
const {chromium,webkit}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.argv[2]||'http://127.0.0.1:8812/o11/';
const engine=process.argv[3]||'edge';
const pool=buildSentences(JSON.parse(fs.readFileSync(new URL('../book.json',import.meta.url),'utf8')));
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'msedge',headless:true}));
try{
 const page=await browser.newPage({viewport:{width:820,height:1180},serviceWorkers:'block'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/program/me',r=>r.fulfill({status:401,contentType:'application/json',body:'{"user":null}'}));
 await page.goto(base+'#unit-17');await page.locator('.chapter-head').waitFor();
 assert.equal(await page.locator('[role=tab]').count(),4);
 await page.locator('[data-tab="words"]').first().click();assert.equal(await page.locator('.word').count(),6);
 await page.locator('[data-tab="practice"]').first().click();await page.locator('#drill-input').waitFor();
 async function active(){return page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('fatedreel-o11-book-v1'));const s=state.sentencePractice[state.unit];return {state,s,id:s.refs[s.pos]};});}
 let a=await active(),q=pool.get(a.id);
 assert.equal(a.s.refs.filter(id=>pool.get(id).unit===17).length,7);
 assert.equal(await page.locator('#practice-translation').isVisible(),false);
 assert.ok(!(await page.locator('#tab-panel').innerText()).includes(q.answer));
 await page.locator('[data-act-translation]').click();assert.equal(await page.locator('#practice-translation').innerText(),q.hint);
 if(engine==='webkit'){assert.equal((await page.request.get(new URL('audio/'+q.audio+'.mp3',base).href)).status(),200);await page.locator('.drill-listen').click();}
 else{const response=page.waitForResponse(r=>r.url().includes('/audio/'+q.audio+'.mp3')&&[200,206].includes(r.status()));await page.locator('.drill-listen').click();await response;}
 await page.locator('#drill-input').fill(q.answer.toLowerCase());await page.reload();await page.locator('#drill-input').waitFor();assert.equal(await page.locator('#drill-input').inputValue(),q.answer.toLowerCase());assert.equal(await page.locator('#practice-translation').isVisible(),true);
 await page.locator('.drill-check').click();assert.match(await page.locator('.drill-feedback').innerText(),/Doğru yazdın/);assert.equal(await page.locator('.drill-feedback p[lang=en]').innerText(),q.answer);
 await page.reload();await page.locator('.drill-feedback').waitFor();
 await page.locator('[data-act-next]').click();assert.equal((await active()).s.pos,1);assert.equal(await page.locator('.drill-feedback').count(),0);assert.equal(await page.locator('#practice-translation').isVisible(),false);assert.equal(await page.locator('#drill-input').inputValue(),'');
 await page.locator('#drill-input').fill('I was going home');await page.locator('.drill-check').click();assert.match(await page.locator('.drill-feedback').innerText(),/Birlikte karşılaştıralım/);
 for(let i=1;i<10;i++)await page.locator('[data-act-next]').click();assert.equal((await active()).s.pos,0);
 // Empty solution is allowed; there is no forced test or summary after a round.
 await page.locator('.drill-check').click();assert.match(await page.locator('.drill-feedback').innerText(),/Doğru cümle/);
 await page.locator('[data-tab="notes"]').first().click();await page.locator('#note').fill('Notlarım korunuyor.');await page.reload();await page.locator('#note').waitFor();assert.equal(await page.locator('#note').inputValue(),'Notlarım korunuyor.');
 // Migrate old tabs while retaining old notes, answers and activity sessions.
 await page.evaluate(()=>{const k='fatedreel-o11-book-v1',s=JSON.parse(localStorage.getItem(k));s.tab='review';s.drafts.legacy='Eski cevap';s.activities.legacy={kept:true};localStorage.setItem(k,JSON.stringify(s));});
 await page.reload();await page.locator('#drill-input').waitFor();a=await active();assert.equal(a.state.tab,'practice');assert.equal(a.state.drafts.legacy,'Eski cevap');assert.equal(a.state.activities.legacy.kept,true);
 for(const [width,height] of [[320,900],[390,844],[820,1180],[1180,820],[1440,1000]]){
  await page.setViewportSize({width,height});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow '+width);
  if(width===820){await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished)));await page.screenshot({path:process.env.TEMP+'/o11-practice-'+engine+'.png',fullPage:true});}
 }
 assert.deepEqual(errors,[]);console.log(engine+': hidden answer/translation, recorded audio, correct/mismatched/empty solution, draft/solution reload, next round, notes, old-tab migration, 5 viewport sizes passed');
}finally{await browser.close();}
