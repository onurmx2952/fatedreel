import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.resolve(root,'../o12');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const entries=read(path.join(site,'word-atlas.tr.json'));
const idx=read(path.join(site,'atlas/index.json'));
const plan=read(path.join(root,'editorial-review.json'));
const byId=new Map(entries.map(e=>[e.id,e]));
const phrase=(id,en)=>byId.get(id).col.find(c=>c.split('｜')[0]===en)?.split('｜')[1];
test('idioms retain their contextual meanings, not misleading literal translations',()=>{
 for(const [id,en,tr] of [
  ['minute','take the minutes','toplantı tutanağını tutmak'],
  ['match','strike a match','kibrit yakmak'],
  ['lift','give someone a lift','birini aracıyla gideceği yere bırakmak'],
  ['coin','coin a term','yeni bir terim türetmek'],
  ['train','train staff','personeli eğitmek'],
  ['jerk','jerk away','ani bir hareketle geri çekilmek'],
  ['polish','polish shoes','ayakkabı parlatmak'],
  ['rifle','rifle through drawers','çekmeceleri aceleyle ve karıştırarak aramak'],
  ['easily','easily the best','açık ara en iyisi'],
 ])assert.equal(phrase(id,en),tr,`${id}: ${en}`);
});
test('literal uses of the same words remain valid',()=>{
 assert.equal(phrase('lift','take the lift'),'asansöre bin');
 assert.equal(phrase('bank','bank account'),'banka hesabı');
 assert.equal(phrase('match','win a match'),'maç kazanmak');
 assert.equal(phrase('polish','furniture polish'),'mobilya cilası');
});
test('grammar notes keep the English forms and distinguish confusable rules',()=>{
 assert.match(byId.get('lie').tip,/lie – lay – lain/);
 assert.match(byId.get('lie').tip,/lie – lied – lied/);
 assert.match(byId.get('mean').tip,/niyet/);
 assert.match(byId.get('hard').tip,/neredeyse hiç/);
 assert.match(byId.get('right').tip,/hak bildirir/);
 assert.match(byId.get('anchor').tip,/demir alıp/);
 assert.match(byId.get('objective').tip,/nesnel/);
});
test('unreviewed generated notes cannot enter the learner-facing dataset',()=>{
 for(const e of entries){
  if(Object.hasOwn(plan.tips,e.id)){
   assert.equal(e.tipReview,'reviewed',e.id);assert.equal(e.tip,plan.tips[e.id],e.id);
  }else{assert.equal(e.tip,'',e.id);assert.equal(e.tipReview,'withheld',e.id);}
 }
});
test('all chunks and the download contain the same 7298 canonical entries',()=>{
 assert.equal(entries.length,7298);assert.equal(byId.size,7298);assert.equal(idx.words.length,7298);
 let n=0;
 for(let i=0;i<Math.ceil(idx.count/idx.chunk);i++){
  for(const e of read(path.join(site,`atlas/entries/${i}.json`))){assert.equal(e.id,idx.words[n++][0]);assert.deepEqual(e,byId.get(e.id));}
 }
 assert.equal(n,7298);
});
test('English source content is preserved across the editorial pass',()=>{
 const text=JSON.stringify(entries.map(e=>({id:e.id,w:e.w,s:e.senses.map(s=>[s.pos,s.en]),ex:e.ex.map(x=>x.en),col:e.col.map(c=>c.split('｜')[0])})));
 assert.equal(crypto.createHash('sha256').update(text).digest('hex'),'68f3a42c0e528e706838bbc969916821fa717a5da083e7089e44e0e7b6e471ce');
});
test('Turkish text has no Chinese fragments, translation placeholders or stale known errors',()=>{
 for(const e of entries){
  const fields=[...e.senses.map(s=>s.zh),...e.ex.map(x=>x.zh),...e.col.map(c=>c.split('｜')[1]),e.tip,e.note??''];
  for(const text of fields)assert.doesNotMatch(text,/[\u4e00-\u9fff]|ZXQ\d+ZX/i,e.id);
 }
 for(const row of idx.words)assert.doesNotMatch(row[7],/kolayca en iyisi|lehçe ayakkabı|tüfekle geçmek|otuzbir çekmek/i,row[0]);
 assert.equal(idx.revision,plan.version);
});
