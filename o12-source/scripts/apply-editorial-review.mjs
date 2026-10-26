import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.resolve(root,'../o12');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v));
const plan=read(path.join(root,'editorial-review.json'));
const data=read(path.join(site,'word-atlas.tr.json'));
const idx=read(path.join(site,'atlas/index.json'));
const englishHash=list=>crypto.createHash('sha256').update(JSON.stringify(list.map(e=>({id:e.id,w:e.w,s:e.senses.map(s=>[s.pos,s.en]),ex:e.ex.map(x=>x.en),col:e.col.map(c=>c.split('｜')[0])})))).digest('hex');
const before=englishHash(data);
if(before!==plan.englishContentSha256)throw Error('English content differs from the reviewed baseline');
const key=s=>s.trim().toLowerCase().replace(/’/g,"'");
const phrases=new Map(Object.entries(plan.phrases).map(([a,b])=>[key(a),b]));
const matched=new Set();
const counts={entriesScanned:data.length,collocationsScanned:0,collocationsWithReviewedTranslations:0,reviewedTeachingNotes:0,unreviewedTeachingNotesWithheld:0,usageNotesManuallyRewritten:0};
for(const e of data){
 e.col=e.col.map(c=>{
  counts.collocationsScanned++;
  const [en]=c.split('｜');
  const tr=phrases.get(key(en));
  if(tr===undefined)return c;
  matched.add(key(en));
  counts.collocationsWithReviewedTranslations++;
  return `${en}｜${tr}`;
 });
 if(plan.tips[e.id]!==undefined){
  e.tip=plan.tips[e.id];e.tipReview='reviewed';counts.reviewedTeachingNotes++;
 } else {
  e.tip='';e.tipReview='withheld';counts.unreviewedTeachingNotesWithheld++;
 }
 if(plan.notes[e.id]!==undefined){e.note=plan.notes[e.id];counts.usageNotesManuallyRewritten++;}
}
if(englishHash(data)!==before)throw Error('English learning content changed');
const byId=new Map(data.map(e=>[e.id,e]));
for(const row of idx.words){
 const e=byId.get(row[0]);
 // Search only the visible Turkish definitions and current uses, not obsolete machine glosses.
 row[7]=e.senses.map(s=>s.zh).concat(e.col.map(c=>c.split('｜').slice(1).join('｜'))).join('; ');
}
idx.revision=plan.version;
write(path.join(site,'word-atlas.tr.json'),data);
write(path.join(site,'atlas/index.json'),idx);
const ordered=idx.words.map(r=>byId.get(r[0]));
for(let i=0;i<ordered.length;i+=idx.chunk)write(path.join(site,`atlas/entries/${Math.floor(i/idx.chunk)}.json`),ordered.slice(i,i+idx.chunk));
const sw=path.join(site,'sw.js');fs.writeFileSync(sw,fs.readFileSync(sw,'utf8').replace(/o12-atlas-tr-v\d+/g,`o12-atlas-tr-v${plan.version.match(/v(\d+)$/)[1]}`));
const report={version:plan.version,...counts,uniquePhraseRulesMatched:matched.size,englishContentSha256:before,englishContentPreserved:true,manuallyProofreadEveryEntry:false,method:plan.scope.method};
fs.writeFileSync(path.join(site,'TRANSLATION_REVIEW.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
const unmatched=[...phrases.keys()].filter(k=>!matched.has(k));
if(unmatched.length)console.log('Rules not present in this corpus:',JSON.stringify(unmatched));
