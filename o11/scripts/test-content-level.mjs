import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizedTranscript} from '../activities.js';
const book=JSON.parse(fs.readFileSync(new URL('../book.json',import.meta.url),'utf8'));
assert.equal(book.practiceEdition,'everyday-v11');
for(const u of book.units){
 assert.equal(u.examples.length,15);
 for(const s of u.examples){
  const t=normalizedTranscript(s.en),words=s.en.split(/\s+/).length;
  assert.ok(words<=(u.id<=20?8:10),`Too long for unit ${u.id}: ${s.en}`);
  assert.ok(!/whatever|as soon as|keep an eye|might as well|sort (?:it )?out|run out of|running out of|would have|could have|should have|been trying|needs charging/i.test(t),`Unnecessary extra pattern: ${s.en}`);
  if(u.id<9)assert.ok(!/\b(do not|does not|did)\b/.test(t),s.en);
  if(u.id<10)assert.ok(!/\b(?:am|is|are) (?:not )?\w+ing\b/.test(t),s.en);
  if(u.id<15)assert.ok(!/\b(?:was|were|did|went|bought|slept|called|forgot|missed|sent|ate)\b/.test(t),s.en);
  if(u.id<19)assert.ok(!/\bwill\b/.test(t),s.en);
  if(u.id<20)assert.ok(!/\bgoing to (?:buy|eat|stay|drive|cook|call|charge|walk|take|be|sleep|snow|visit|order|book)\b/.test(t),s.en);
  if(u.id<22)assert.ok(!/\b(?:can|cannot|could|should|must|shall)\b/.test(t),s.en);
  if(u.id<30)assert.ok(!/\b(?:have|has) (?:not |just |already |never )?(?:been|lost|seen|tried|eaten|finished|sent|paid|bought|left)\b/.test(t),s.en);
  if(u.id===10){
   assert.ok(/\b(?:am|is|are)\b(?:\s+(?:not|i|you|he|she|it|we|they))*\s+\w+ing\b/.test(t),`Present Continuous should actually practise it: ${s.en}`);
   assert.ok(!/\b(?:because|while|when|trying|heading|running)\b/.test(t),s.en);
  }
 }
}
assert.ok(!book.units.flatMap(u=>u.examples).some(s=>/grab a coffee on the way/.test(s.en)));
console.log('480 sentence level review: short lengths, prerequisite tense limits, no extra advanced idioms, all 15 Present Continuous sentences use the target pattern.');
