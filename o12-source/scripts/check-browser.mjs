import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const {chromium, webkit} = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');

// Run against a static preview or production. Each run uses isolated device storage.
const base = process.argv[2] || 'http://127.0.0.1:8811/o12/';
const engine = process.argv[3] || 'webkit';
const browser = await (engine === 'webkit' ? webkit.launch({headless:true}) : chromium.launch({channel:'msedge',headless:true}));
try {
 for (const width of [810,390]) {
  const context = await browser.newContext({viewport:{width,height:1080},hasTouch:true,serviceWorkers:'block'});
  const page = await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('word-atlas-o12:settings',JSON.stringify({onboarded:true,splash:false,sfx:false,autoplay:false,ambience:'off',startLevel:1,dailyNew:5})));
  await page.route('**/api/program/me',r=>r.fulfill({status:401,contentType:'application/json',body:'{"user":null}'}));
  await page.goto(base+'#/atlas?level=A2');
  await page.locator('.tile .illo.is-loaded').first().waitFor();
  async function squareArt() {
   const rect=await page.locator('.tile .illo').first().evaluate(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}));
   assert.ok(rect.h>100 && Math.abs(rect.h-rect.w)<2,JSON.stringify(rect));
  }
  await squareArt();
  await page.addStyleTag({content:'.tile .illo{aspect-ratio:auto!important}'});
  await page.evaluate(()=>{document.startViewTransition=()=>{throw Error('Optional transition must not control navigation');};});
  await page.locator('.tile').first().click();await page.locator('.sheet').waitFor();
  await page.locator('.sheet-close').click();await page.locator('.sheet').waitFor({state:'detached'});
  await squareArt(); // Reproduces the zero-height square on older iPad Safari before the fix.
  await page.locator('a[href="#/practice"]:visible').first().click();
  await page.locator('.practice').waitFor();assert.equal(await page.evaluate(()=>location.hash),'#/practice');
  await page.getByRole('button',{name:'Alıştırmaya başla',exact:true}).click();
  await page.locator('.typing-input').waitFor();await page.locator('.typing-input').fill('test');
  await page.getByRole('button',{name:'Bitir',exact:true}).click();await page.locator('.practice').waitFor();
  await page.locator('a[href="#/"]:visible').first().click();await page.locator('.today').waitFor();
  await page.getByRole('button',{name:/Bugünün çalışmasına başla/}).click();await page.locator('.learn-stage .intro').waitFor();
  await page.getByRole('button',{name:'Anladım',exact:false}).click();
  // Flush is debounced; wait for the saved session instead of using a fixed delay.
  await page.waitForFunction(()=>Object.keys(localStorage).filter(k=>k.startsWith('word-atlas-o12:v2:')).some(k=>JSON.parse(localStorage.getItem(k)||'null')?.session?.index>0));
  await page.reload();await page.locator('.learn-stage').waitFor();
  await page.getByRole('button',{name:'duraklat ve geri dön',exact:true}).click();await page.locator('.today').waitFor();
  await page.getByRole('button',{name:/Çalışmaya devam et/}).click();await page.locator('.learn-stage').waitFor();
  assert.deepEqual(errors,[]);
  console.log(`${engine} ${width}: square images without aspect-ratio, Atlas → Practice, typing, Today → Learn and session reload/resume passed`);
  await context.close();
 }
} finally {await browser.close();}
