// Personal practice scheduling. Dates are evidence of practice, not a claim of mastery.
import {normalizedTranscript} from './activities.js?v=2';
const DAY=86400000,INTERVALS=[1,3,7,14,30,60];
const modes=['listening','translation','unknown'];
const prep=new Set('about for to at in on of from with by after before without'.split(' '));
const functional=new Set('i you he she it we they me him her us them my your his its our their a an the am is are was were be been being have has had do does did will would can could should must not'.split(' '));
const words=s=>normalizedTranscript(s||'').split(' ').filter(Boolean);
const key=q=>q.audio||q.id;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const day=now=>{const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function record(v){return object(v)&&Number.isFinite(v.due)&&v.due>=0&&Number.isFinite(v.last)&&v.last>=0&&Number.isFinite(v.streak)&&v.streak>=0&&Number.isFinite(v.lapses)&&v.lapses>=0&&Array.isArray(v.days)&&v.days.every(s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s))?v:null;}
const channels=entry=>object(entry?.channels)?Object.values(entry.channels).map(record).filter(Boolean):[];
const patternCache=new WeakMap();
export function sentencePatterns(q){
 const cached=patternCache.get(q);if(cached?.answer===q.answer&&cached.unit===q.unit)return cached.tags;
 const w=words(q.answer),tags=new Set(['unit:'+q.unit]);
 if(w.some(x=>['am','is','are','was','were'].includes(x))){
  tags.add(w.some(x=>/ing$/.test(x)&&!['morning','evening','something','anything','nothing','thing'].includes(x))?'auxiliary:be-continuous':'auxiliary:be');
 }
 if(w.some(x=>['do','does','did'].includes(x)))tags.add('auxiliary:do');
 if(w.some(x=>['have','has'].includes(x)))tags.add('auxiliary:have');
 if(w.some(x=>['was','were'].includes(x)))tags.add('auxiliary:past-be');
 if([15,16].includes(q.unit))tags.add('verb:past');
 if(w.some(x=>/^(shoes|keys|tickets|bags|friends|parents|messages|glasses|boxes|minutes|days|hours|books|chairs|coins|tables|bottles|sandwiches)$/.test(x)))tags.add('noun:plural');
 for(const x of w){if(prep.has(x))tags.add('preposition:'+x);if(articles.has(x))tags.add('article:'+x);if(!functional.has(x)&&!prep.has(x)&&/^[a-z]+$/.test(x))tags.add('word:'+x);}
 const result=[...tags];patternCache.set(q,{answer:q.answer,unit:q.unit,tags:result});return result;
}
const articles=new Set(['a','an','the']);
export function errorPatterns(q,result){
 const tags=new Set(['unit:'+q.unit]);
 const corrected={...q,answer:result.corrected||q.answer},available=sentencePatterns(corrected);
 for(const error of result.errors||[]){
  const before=words(error.original),after=words(error.fix),changed=after.filter(w=>!before.includes(w));
  for(const word of changed){
   if(prep.has(word))tags.add('preposition:'+word);
   else if(articles.has(word))tags.add('article:'+word);
   else if(['am','is','are','was','were','be','been'].includes(word)){tags.add(available.includes('auxiliary:be-continuous')?'auxiliary:be-continuous':'auxiliary:be');if(['was','were'].includes(word))tags.add('auxiliary:past-be');}
   else if(['do','does','did'].includes(word))tags.add('auxiliary:do');
   else if(['have','has','had'].includes(word))tags.add('auxiliary:have');
   else if(['spelling','wrong_meaning'].includes(error.type)&&!functional.has(word)&&/^[a-z]+$/.test(word))tags.add('word:'+word);
   else if(before.some(w=>word===w+'s'||word===w+'es'))tags.add('noun:plural');
   else if(available.includes('verb:past'))tags.add('verb:past');
  }
 }
 return [...tags];
}
export function ensurePracticeMemory(state){
 if(!object(state.practiceMemory)||state.practiceMemory.version!==1){
  if(state.practiceMemory)state.practiceMemoryPrevious=state.practiceMemory;
  state.practiceMemory={version:1,items:{},patterns:{}};
 }
 const memory=state.practiceMemory;
 for(const name of ['items','patterns'])if(!object(memory[name]))memory[name]={};
 return memory;
}
function advance(previous,correct,now,question){
 const old=record(previous),today=day(now),due=!old||old.due<=now;
 const next={due:now+DAY,last:now,streak:old?.streak||0,lapses:old?.lapses||0,days:(old?.days||[]).filter(x=>typeof x==='string').slice(-5),attempts:(old?.attempts||0)+1,correct,lastQuestion:question};
 if(!correct)return {...next,due:now+10*60000,streak:0,lapses:next.lapses+1,days:[],failedDay:today};
 next.failedDay=old?.failedDay||'';
 // Same-day retries and early extra practice cannot stretch the schedule.
 if(due&&!next.days.includes(today)&&next.failedDay!==today){next.days.push(today);next.streak++;}
 const interval=INTERVALS[Math.min(Math.max(next.streak-1,0),INTERVALS.length-1)];
 next.due=old?.correct&&!due?old.due:now+interval*DAY;
 return next;
}
function update(entries,id,q,mode,correct,now){
 let entry=entries[id];if(!object(entry))entry=entries[id]={unit:q.unit,channels:{}};
 if(!object(entry.channels))entry.channels={};
 entry.channels[mode]=advance(entry.channels[mode],correct,now,key(q));
 if(correct&&mode!=='unknown')delete entry.channels.unknown;
 return entry;
}
export function isPracticeGrade(result){return !!result&&Array.isArray(result.errors)&&!result.ungraded&&!result.notes?.some(n=>/emin değil|kesin değerlendirem|belirsiz/i.test(n));}
export function recordPractice(memory,q,result,mode='unknown',now=Date.now()){
 if(!isPracticeGrade(result))return [];
 if(!modes.includes(mode))mode='unknown';
 const correct=result.errors.length===0;
 update(memory.items,key(q),q,mode,correct,now);
 const tags=correct?sentencePatterns({...q,answer:result.corrected||q.answer}).filter(tag=>!tag.startsWith('word:')||memory.patterns[tag]):errorPatterns(q,result);
 for(const tag of tags){
  update(memory.patterns,tag,q,mode,correct,now);
 }
 return correct?[]:tags;
}
export function seedPracticeMemory(state,pool,edition,now=Date.now()){
 const memory=ensurePracticeMemory(state);if(memory.seeded)return memory;
 const latest=new Map();
 const sessions=[...Object.values(state.sentencePracticeHistory||{}),...Object.values(state.sentencePracticePrevious||{}),...Object.values(state.sentencePractice||{})];
 for(const s of sessions){
  if(s?.edition!==edition||s.checker!=='workers-ai-v1'||!object(s.work))continue;
  for(const [id,w] of Object.entries(s.work)){
   const q=pool.get(id),result=w?.result;
   if(!q||!Array.isArray(result?.errors)||result.errors.length>20||result.errors.some(e=>!object(e)||!['spelling','grammar','wrong_meaning'].includes(e.type)||['original','fix','explanation_tr'].some(k=>typeof e[k]!=='string'))||!Array.isArray(result.notes)||result.notes.some(n=>typeof n!=='string')||typeof result.corrected!=='string')continue;
   const at=Number.isFinite(w.checkedAt)?w.checkedAt:Number.isFinite(s.started)?s.started:now;
   if(at>now||at<(latest.get(id)?.at||0))continue;
   latest.set(id,{q,result:w.result,at});
  }
 }
 // Historic assistance was not recorded. Seed only known errors, never success days.
 for(const {q,result,at} of latest.values())if(result.errors.length)recordPractice(memory,q,result,'unknown',at);
 memory.seeded=now;return memory;
}
export function practicePriority(q,memory,now=Date.now()){
 if(!memory)return 0;
 let score=0;
 const examine=(entry,specific,item=false)=>{
  for(const r of channels(entry)){
   const due=r.due<=now,weak=r.correct===false;
   const value=(due?(item?11000:10000)+Math.min(30,(now-r.due)/DAY)*10:weak?1000:0)+(due||weak?specific:0);
   score=Math.max(score,value+(due||weak?key(q)!==r.lastQuestion?40:0:0));
  }
 };
 examine(memory.items?.[key(q)],100,true);
 for(const tag of sentencePatterns(q))examine(memory.patterns?.[tag],tag.startsWith('unit:')?0:150);
 return score;
}
export function preferredPracticeMode(q,memory,fallback='listening',now=Date.now()){
 const entry=memory?.items?.[key(q)];
 if(!entry)return fallback;
 const value=mode=>{const r=record(entry.channels?.[mode]);return !r?50:r.due<=now?100+Math.min(30,(now-r.due)/DAY):0;};
 const a=value('listening'),b=value('translation');return a===b?fallback:a>b?'listening':'translation';
}
export function practiceMemorySummary(memory,now=Date.now()){
 const units=new Set(),dueByUnit={},scheduledUnits=new Set();
 let dueItems=0,nextDue=Infinity;
 const progress={listening:{practiced:0,spaced:0},translation:{practiced:0,spaced:0}};
 for(const entry of Object.values(memory?.items||{})){
  const rows=channels(entry);if(!rows.length)continue;
  scheduledUnits.add(entry.unit);
  const due=rows.some(r=>r.due<=now);
  if(due){dueItems++;units.add(entry.unit);dueByUnit[entry.unit]=(dueByUnit[entry.unit]||0)+1;}
  for(const r of rows)nextDue=Math.min(nextDue,r.due);
  for(const mode of ['listening','translation']){
   const r=record(entry.channels?.[mode]);if(!r)continue;
   progress[mode].practiced++;
   if(r.correct&&new Set(r.days).size>=3)progress[mode].spaced++;
  }
 }
 return {dueItems,dueUnits:[...units],dueByUnit,scheduledUnits:[...scheduledUnits],nextDue:Number.isFinite(nextDue)?nextDue:null,...progress};
}
