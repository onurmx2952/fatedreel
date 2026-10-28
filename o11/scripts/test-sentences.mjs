import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildSentences,makeRound,explainAnswer,answerMatches,createSentencePractice} from '../sentences.js';
const book=JSON.parse(fs.readFileSync(new URL('../book.json',import.meta.url),'utf8'));
const pool=buildSentences(book);
for(let unit=1;unit<=32;unit++)for(let repeat=0;repeat<50;repeat++){
 const refs=makeRound(pool,unit),items=refs.map(id=>pool.get(id));
 assert.equal(items.length,10);assert.equal(new Set(refs).size,10);
 assert.equal(new Set(items.map(q=>q.answer.toLowerCase())).size,10);
 assert.ok(items.every(q=>q.unit<=unit));
 assert.equal(items.filter(q=>q.unit===unit).length,unit===1?10:7);
 if(unit===17)assert.ok(items.filter(q=>q.unit===17).every(q=>/\b(was|were|wasn't|weren't)\b/i.test(q.answer)));
}
for(const q of pool.values()){
 assert.ok(q.hint&&q.why&&q.audio);
 assert.ok(fs.existsSync(new URL(`../audio/${q.audio}.mp3`,import.meta.url)));
 assert.ok(answerMatches(q.answer,q));
}
assert.match(explainAnswer('I was going home',{answer:'I went home.'}),/tamamlanan/);
assert.match(explainAnswer('I was go home',{answer:'I was going home.'}),/-ing/);
assert.match(explainAnswer('I was going home',{answer:'I was at home.'}),/bulunulan yer/);
assert.match(explainAnswer('I was went home',{answer:'I went home.'}),/fazla/);
assert.match(explainAnswer('Does she works here',{answer:'Does she work here?'}),/yalın/);
assert.ok(answerMatches("SHE ISN’T sleeping!",{answer:'She is not sleeping.'}));
const state={unit:17,tab:'practice',notes:{17:'Korunsun'},activities:{old:true},reviews:{}};
let runner;const render=()=>runner.content();runner=createSentencePractice({book,state,save:()=>true,update:render,play:()=>{}});
const page=render();let s=state.sentencePractice[17],q=pool.get(s.refs[s.pos]);
assert.ok(page.includes('Dinle'));assert.ok(!page.includes(q.answer));
const event=attr=>({target:{closest:()=>({dataset:{},hasAttribute:k=>k===attr})}});
runner.submit({target:{id:'drill-form'},preventDefault(){}});
assert.ok(render().includes(q.answer.replace(/'/g,"&#39;").replace(/"/g,"&quot;")));
runner.click(event('data-act-next'));assert.equal(s.pos,1);
for(let i=1;i<10;i++)runner.click(event('data-act-next'));
assert.equal(state.sentencePractice[17].pos,0);assert.ok(state.reviews[17].due>Date.now());
assert.equal(state.notes[17],'Korunsun');assert.deepEqual(state.activities,{old:true});
const copy=JSON.parse(JSON.stringify(state));createSentencePractice({book,state:copy,save:()=>true,update:()=>{},play:()=>{}}).content();assert.deepEqual(copy.sentencePractice,state.sentencePractice);
console.log(`32 units × 50 rounds: 7/3 mix, no future units/duplicates, ${pool.size} recorded sentences, grammar feedback, reveal/skip/next/reload and legacy data passed`);
