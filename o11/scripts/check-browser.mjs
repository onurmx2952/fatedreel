import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium,webkit}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.argv[2]||'http://127.0.0.1:8811/o11/';
const engine=process.argv[3]||'edge';
const book=JSON.parse(await fs.readFile(new URL('../book.json',import.meta.url),'utf8'));
const bank=JSON.parse(await fs.readFile(new URL('../activities.json',import.meta.url),'utf8'));
const source=await fs.readFile(new URL('../activities.js',import.meta.url),'utf8');
const {buildQuestions}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const pool=buildQuestions(book,bank);
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({channel:'msedge',headless:true}));
try{
 const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/program/me',r=>r.fulfill({status:401,contentType:'application/json',body:'{"user":null}'}));
 await page.goto(base+'#unit-8');await page.locator('.chapter-head').waitFor();
 async function tab(id){await page.locator('[data-tab="'+id+'"]').first().click();await page.locator('.drill,.drill-summary').waitFor();}
 async function active(){return page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('fatedreel-o11-book-v1'));const s=state.activities[state.unit+':'+state.tab];return {state,s,id:s.refs[s.pos]};});}
 async function submit(wrong=false){const a=await active(),q=pool.get(a.id);if(q.type==='choice'||q.type==='dialogue'){const i=q.options.findIndex(t=>wrong?t!==q.answer:t===q.answer);await page.locator(`[data-act-choice="${i}"]`).click();}else if(q.type==='order'){for(const i of a.s.work[a.id].tokenOrder.map((_,i)=>i))await page.locator(`[data-act-token="${i}"]`).click();}else await page.locator('#drill-input').fill(wrong?'incorrect response':q.answer);
 await page.locator('.drill-check').click();await page.locator('.drill-feedback').waitFor();assert.equal(await page.locator('.drill-feedback').evaluate(el=>el.classList.contains('is-correct')),!wrong);await page.locator('[data-act-next]').click();}
 await tab('words');await submit(true);while(await page.locator('.drill').count())await submit();assert.match(await page.locator('.drill-summary-count').innerText(),/5 \/ 6/);
 await page.locator('[data-act-retry]').click();assert.equal((await active()).s.refs.length,1);await submit();assert.equal(await page.locator('.drill-summary-count').innerText(),'1 / 1');
 await tab('examples');let a=await active(),q=pool.get(a.id);if(engine==='webkit'){const audio=await page.request.get(new URL('audio/'+q.audio+'.mp3',base).href);assert.equal(audio.status(),200);await page.locator('.drill-listen').click();}else{const audio=page.waitForResponse(r=>r.url().includes('/audio/'+q.audio+'.mp3')&&[200,206].includes(r.status()));await page.locator('.drill-listen').click();await audio;}await page.locator('#drill-input').fill(q.answer.toLowerCase());await page.reload();await page.locator('#drill-input').waitFor();assert.equal(await page.locator('#drill-input').inputValue(),q.answer.toLowerCase());await page.locator('.drill-check').click();await page.locator('.drill-feedback.is-correct').waitFor();
 await tab('dialogue');assert.equal(await page.locator('.drill-bubble').count(),3);await submit();assert.equal(await page.locator('.drill-summary').count(),1);
 await tab('practice');const seen=new Set();while(await page.locator('.drill').count()){a=await active();q=pool.get(a.id);seen.add(q.type);if(q.type==='order'){await page.locator(`[data-act-token="0"]`).click();await page.reload();await page.locator('.drill').waitFor();assert.equal((await active()).s.work[a.id].selected[0],0);await page.locator('[data-act-undo]').click();}await submit();}assert.equal(seen.size,4);assert.equal(await page.locator('.drill-summary-count').innerText(),'4 / 4');
 await tab('review');a=await active();assert.ok(a.s.refs.every(id=>pool.get(id).unit<=8&&id.includes(':review:')));while(await page.locator('.drill').count())await submit();assert.ok((await active()).state.reviews[8].due>Date.now());
 await page.locator('[data-tab="notes"]').first().click();await page.locator('#note').fill('Notlarım korunuyor.');await page.reload();await page.locator('#note').waitFor();assert.equal(await page.locator('#note').inputValue(),'Notlarım korunuyor.');
 await tab('practice');await page.locator('[data-act-restart]').click();for(const width of [320,810,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow '+width);}
 assert.deepEqual(errors,[]);console.log(engine+': all five activity stages, real feedback, wrong-answer retry, dictation audio, draft/token reload, all four exercise types, mixed review, notes and responsive widths passed');
}finally{await browser.close();}
