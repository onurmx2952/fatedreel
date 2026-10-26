import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const book=JSON.parse(await fs.readFile(new URL('../book.json',import.meta.url),'utf8'));
const bank=JSON.parse(await fs.readFile(new URL('../activities.json',import.meta.url),'utf8'));
const source=await fs.readFile(new URL('../activities.js',import.meta.url),'utf8');
const {buildQuestions,answerMatches,createActivities}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.equal(bank.units.length,32);
const existing=new Set(book.units.flatMap(u=>[...u.examples,...u.exercises,...u.dialogue].map(x=>x.en.toLowerCase())));
const overlap=[];
for(const u of bank.units){
 assert.equal(u.practice.length,4);assert.equal(u.review.length,2);assert.equal(u.dialogue.lines.length,4);
 for(const q of [...u.practice,...u.review]){
  assert.ok(q.answer&&q.why);assert.ok(answerMatches(q.answer,q));
  if(q.type==='choice'){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);}
  if(q.answer.split(' ').length>3 && existing.has(q.answer.toLowerCase()))overlap.push([u.id,q.answer]);
 }
 assert.equal(u.dialogue.lines[2],u.dialogue.answer);
}
assert.deepEqual(overlap,[],'New tasks must not recycle the book sentences');
assert.ok(answerMatches("SHE DOES NOT eat meat!",{answer:"She doesn’t eat meat."}));
assert.ok(answerMatches("He's visited Berlin",{answer:'He has visited Berlin.'}));
assert.ok(answerMatches("I'd like some tea",{answer:'I would like some tea.'}));
assert.ok(answerMatches('have',bank.units[13].practice[0]));
assert.ok(answerMatches("I can't swim",{answer:'I cannot swim.'}));
assert.ok(!answerMatches('She don’t eat meat',{answer:'She doesn’t eat meat.'}));
assert.ok(!answerMatches('I was went home',{answer:'I went home.'}));
const pool=buildQuestions(book,bank);
for(let unit=1;unit<=32;unit++){
 const state={unit,tab:'review',activities:{},reviews:{}};let writes=0;
 const runner=createActivities({book,bank,state,save:()=>{writes++;return true},update:()=>{},play:()=>{}});
 const page=runner.content('review'),s=state.activities[`${unit}:review`];
 assert.ok(page.includes('drill-form'));assert.ok(s.refs.every(id=>pool.get(id).unit<=unit));assert.equal(new Set(s.refs).size,s.refs.length);assert.ok(writes>0);
 const clone=JSON.parse(JSON.stringify(state));const restored=createActivities({book,bank,state:clone,save:()=>true,update:()=>{},play:()=>{}});restored.content('review');assert.deepEqual(clone.activities[`${unit}:review`].refs,s.refs);
}
const legacy={unit:1,tab:'practice',notes:{1:'Koru'},reviews:{},activities:{'1:practice':{version:1,refs:['invalid'],pos:0,results:{},work:{}}}};
createActivities({book,bank,state:legacy,save:()=>true,update:()=>{},play:()=>{}}).content('practice');
assert.equal(legacy.notes[1],'Koru');assert.ok(legacy.activities['1:practice'].refs.every(id=>pool.has(id)));
console.log(`${pool.size} tasks, 32 dialogues, no copied task sentences, answer normalization, review limits and reload state passed`);
