import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSentencePractice} from '../sentences.js';
import {sentenceExplanation} from '../sentence-explanation.js';
const book=JSON.parse(fs.readFileSync(new URL('../book.json',import.meta.url)));
let calls=0;const state={unit:10,tab:'practice',reviews:{},notes:{10:'keep'}};
const runner=createSentencePractice({book,state,save(){},update(){},play(){},explanationOnly:true,check(){calls++;throw Error('Should not call');},renderResult(){return 'OLD GRADE';}});
const event=a=>({target:{closest:()=>({dataset:{},hasAttribute:k=>k===a})}});
let page=runner.content(),s=state.sentencePractice[10],id=s.refs[0];
assert.match(page,/id="practice-translation"[^>]*hidden/);
runner.click(event('data-act-translation'));assert.equal(s.work[id].translated,true);
runner.input({target:{matches:()=>true,value:'Completely different draft'}});
await runner.submit({target:{id:'drill-form'},preventDefault(){}});
page=runner.content();assert.ok(page.includes('sentence-correction'));assert.ok(!page.includes('OLD GRADE'));assert.equal(calls,0);
runner.click(event('data-act-next'));assert.equal(s.work[id].correct,null);assert.deepEqual(state.reviews,{});assert.match(runner.content(),/id="practice-translation"[^>]*hidden/);
// Legacy open translations close once without erasing drafts or old results.
const current=s.refs[s.pos];s.work[current]={text:'saved draft',translated:true,result:{correct:false},revealed:true};
runner.content();assert.equal(s.work[current].translated,false);assert.equal(s.work[current].text,'saved draft');assert.equal(s.work[current].revealed,true);
for(const u of book.units)for(const e of u.examples){let text=sentenceExplanation({answer:e.en,hint:e.tr,unit:u.id,why:u.rules[0][1]});assert.ok(text.length>60);assert.ok(!text.includes('undefined'));}
assert.match(sentenceExplanation({answer:'I am taking the bus today.',hint:'Bugün otobüsle gidiyorum.',unit:10}),/Take the bus/);
assert.match(sentenceExplanation({answer:"I'm going to buy milk.",hint:'Süt alacağım.',unit:20}),/plan/);
console.log('PASS: hidden Turkish, explicit toggle, no grading/API, reference explanation, neutral progress, preserved legacy drafts, 480 explanations.');
