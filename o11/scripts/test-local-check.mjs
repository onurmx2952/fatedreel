import assert from 'node:assert/strict';
import fs from 'node:fs';
import {localMeaningCheck,localFeedback} from '../local-check.js';
const cases=JSON.parse(fs.readFileSync(new URL('grammar-cases.json',import.meta.url)));
for(const c of cases){
 const r=await localMeaningCheck({...c,answer:c.accepted[0]},c.student);
 assert.equal(r.ungraded,undefined,c.id+' must really be evaluated');
 assert.equal(r.correct,c.correct,c.id);
 assert.equal(r.correct,r.errors.length===0);
 if(c.errorType)assert.ok(r.errors.some(e=>e.type===c.errorType),c.id);
 if(c.fix)assert.ok(r.errors.some(e=>e.fix===c.fix),c.id);
 if(c.corrected)assert.equal(r.corrected,c.corrected,c.id);
 assert.ok(!/present continuous|simple past|geniş zaman/i.test(r.errors.map(e=>e.explanation_tr).join(' ')));
}
for(const [answer,student] of [['I grab a coffee.','I get a coffee.'],['I am reading a book.','I am reading the book.'],['I am tired.','I feel exhausted.'],['I am at home.','<img src=x onerror=alert(1)>']]){
 const r=await localMeaningCheck({answer,hint:'Örnek.'},student);
 assert.equal(r.ungraded,true);assert.equal(r.errors.length,0);assert.match(localFeedback(r),/kesin değerlendiremiyorum/);assert.ok(!localFeedback(r).includes('<img'));
}
const r=await localMeaningCheck({answer:'I am thinking about my holiday.',hint:'Tatilimi düşünüyorum.'},'I thinking my holiday');
assert.equal(r.errors.length,2);assert.ok(r.errors.some(e=>e.fix==='about'));
const book=JSON.parse(fs.readFileSync(new URL('../book.json',import.meta.url)));
for(const unit of book.units)for(const s of unit.examples){const r=await localMeaningCheck({answer:s.en,hint:s.tr},s.en);assert.equal(r.correct,true);assert.ok(!r.ungraded);}
console.log('PASS: 20 evaluated cases, 4 explicitly ungraded alternatives, am/about omissions, 480 corpus answers; no network or model mocks.');
