import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ensurePracticeMemory,recordPractice,seedPracticeMemory,sentencePatterns,errorPatterns,practicePriority,preferredPracticeMode,practiceMemorySummary} from '../practice-memory.js';
import {buildSentences,makeRound,createSentencePractice} from '../sentences.js';
const book=JSON.parse(fs.readFileSync(new URL('../book.json',import.meta.url)));
const pool=buildSentences(book),q=pool.get('27:examples:2'),DAY=86400000,start=new Date(2026,0,1,12).getTime();
const correct={correct:true,errors:[],notes:[],corrected:'I am thinking about dinner.'};
const wrong={correct:false,errors:[{type:'grammar',original:'I thinking',fix:'I am thinking',explanation_tr:'"I" ile "thinking" arasında "am" gerekir.'},{type:'grammar',original:'dinner',fix:'about dinner',explanation_tr:'Düşünülen konunun önüne "about" gelir.'}],notes:[],corrected:'I am thinking about dinner.'};
assert.ok(errorPatterns(q,wrong).includes('preposition:about'));
const state={},memory=ensurePracticeMemory(state);
recordPractice(memory,q,correct,'listening',start);
let r=memory.items[q.audio].channels.listening;
assert.equal(r.due,start+DAY);assert.equal(r.days.length,1);assert.equal(practiceMemorySummary(memory,start).listening.spaced,0);
for(let i=1;i<=5;i++)recordPractice(memory,q,correct,'listening',start+i*60000);
assert.equal(r.due,start+DAY);r=memory.items[q.audio].channels.listening;assert.equal(r.due,start+DAY);assert.equal(r.days.length,1);
assert.equal(preferredPracticeMode(q,memory,'listening',start+600000), 'translation');
recordPractice(memory,q,correct,'listening',start+12*3600000);assert.equal(memory.items[q.audio].channels.listening.days.length,1,'Early extra practice cannot count as a spaced success');
recordPractice(memory,q,correct,'listening',start+DAY);r=memory.items[q.audio].channels.listening;assert.equal(r.due,start+4*DAY);assert.equal(r.days.length,2);
recordPractice(memory,q,correct,'listening',start+4*DAY);r=memory.items[q.audio].channels.listening;assert.equal(r.due,start+11*DAY);assert.equal(practiceMemorySummary(memory,start+4*DAY).listening.spaced,1);
assert.equal(practiceMemorySummary(memory,start+4*DAY).translation.spaced,0,'Hearing does not establish independent production');
recordPractice(memory,q,correct,'translation',start+4*DAY);assert.equal(practiceMemorySummary(memory,start+4*DAY).translation.spaced,0);
recordPractice(memory,q,wrong,'listening',start+5*DAY);r=memory.items[q.audio].channels.listening;assert.equal(r.due,start+5*DAY+600000);assert.equal(r.days.length,0);assert.equal(practiceMemorySummary(memory,start+5*DAY).listening.spaced,0);
recordPractice(memory,q,correct,'listening',start+5*DAY+1200000);assert.equal(memory.items[q.audio].channels.listening.days.length,0,'Immediate repair is not a successful spaced day');
const before=JSON.stringify(memory);
recordPractice(memory,q,{...correct,ungraded:true},'translation',start+6*DAY);
recordPractice(memory,q,{...correct,notes:['Bu ifadeden emin değilim.']},'translation',start+6*DAY);
assert.equal(JSON.stringify(memory),before,'Uncertain verdicts must not change learning history');
// An overdue item outranks unrelated fresh content. Sessions remain 10 + 5.
const m=ensurePracticeMemory({});recordPractice(m,q,wrong,'translation',start);
const due=start+DAY;
assert.ok(practicePriority(q,m,due)>practicePriority(pool.get('3:examples:0'),m,due));
for(let i=0;i<80;i++){
 const refs=makeRound(pool,28,{memory:m,now:due}),items=refs.map(id=>pool.get(id));
 assert.equal(refs.length,15);assert.equal(new Set(refs).size,15);assert.equal(new Set(items.map(x=>x.answer.toLowerCase())).size,15);
 assert.equal(items.filter(x=>x.unit===28).length,10);assert.ok(items.every(x=>x.unit<=28));assert.ok(refs.includes(q.id),'An overdue known mistake must be selected');
}
for(let unit=2;unit<=32;unit++){
 const ownTexts=new Set([...pool.values()].filter(x=>x.unit===unit).map(x=>x.answer.toLowerCase()));
 const previous=[...pool.values()].find(x=>x.unit===unit-1&&!ownTexts.has(x.answer.toLowerCase()));
 const personal=ensurePracticeMemory({});recordPractice(personal,previous,{...wrong,corrected:previous.answer},'listening',start);
 const refs=makeRound(pool,unit,{memory:personal,now:due});
 assert.ok(refs.includes(previous.id));assert.equal(refs.filter(id=>pool.get(id).unit===unit).length,10);assert.ok(refs.every(id=>pool.get(id).unit<=unit));
}
// Migrate only known model errors; old listening/typing assistance was not recorded.
const prior={notes:{27:'Koru'},sentencePractice:{27:{version:3,edition:book.practiceEdition,checker:'workers-ai-v1',started:start,work:{[q.id]:{result:wrong}}}}};
seedPracticeMemory(prior,pool,book.practiceEdition,due);
assert.equal(prior.notes[27],'Koru');assert.equal(prior.practiceMemory.items[q.audio].channels.unknown.days.length,0);
const seeded=JSON.stringify(prior.practiceMemory);seedPracticeMemory(prior,pool,book.practiceEdition,due+1);assert.equal(JSON.stringify(prior.practiceMemory),seeded);
recordPractice(prior.practiceMemory,q,correct,'translation',due);assert.ok(!prior.practiceMemory.items[q.audio].channels.unknown,'An observed success retires the unclassified seed');
const legacy={sentencePractice:{27:{...prior.sentencePractice[27],checker:'dictation-v1'}}};seedPracticeMemory(legacy,pool,book.practiceEdition,due);assert.equal(Object.keys(legacy.practiceMemory.items).length,0);
const broken={sentencePractice:{27:{...prior.sentencePractice[27],work:{[q.id]:{result:{errors:[null],notes:[],corrected:q.answer}}}}}};seedPracticeMemory(broken,pool,book.practiceEdition,due);assert.equal(Object.keys(broken.practiceMemory.items).length,0,'Malformed old feedback must not stop startup');
// Repair malformed memory without dropping notes or the rest of the backup.
const damaged={notes:{1:'Sakla'},practiceMemory:[]};ensurePracticeMemory(damaged);assert.equal(damaged.notes[1],'Sakla');assert.equal(damaged.practiceMemory.version,1);
// Full practice integration: source attribution, delayed different example, no double recording.
let clock=start,result=wrong,runner;
const appState={unit:27,tab:'practice',reviews:{},notes:{27:'Notum'},marks:{27:'important'}};
const setup=()=>createSentencePractice({book,state:appState,save:()=>true,update:()=>{},play:()=>{},now:()=>clock,check:async()=>{if(result instanceof Error)throw result;return result;},renderResult:r=>'<p>'+r.corrected+'</p>',checkerId:'workers-ai-v1'});
runner=setup();runner.content();let s=appState.sentencePractice[27];
const own=[q,...[...pool.values()].filter(x=>x.unit===27&&x.id!==q.id).slice(0,9)];
const previous=[...pool.values()].filter(x=>x.unit===1).slice(0,5);
s.refs=[...own,...previous].map(x=>x.id);s.modes=Object.fromEntries(s.refs.map(id=>[id,'listening']));s.pos=0;s.work={};
const click=(attribute,dataset={})=>runner.click({target:{closest:()=>({dataset,hasAttribute:k=>k===attribute})}});
const input=text=>runner.input({target:{matches:()=>true,value:text}});
const submit=()=>runner.submit({target:{id:'drill-form'},preventDefault(){}});
runner.content();click('',{actAudio:q.audio});input('I thinking dinner');await submit();
assert.equal(s.work[q.id].practiceMode,'listening');assert.equal(appState.practiceMemory.items[q.audio].channels.listening.attempts,1);
assert.notEqual(s.refs[4],q.id);assert.ok(sentencePatterns(pool.get(s.refs[4])).includes('preposition:about'),'An error returns after three intervening questions using a different example');
assert.equal(s.modes[s.refs[4]],'translation');assert.equal(s.refs.filter(id=>pool.get(id).unit===27).length,10);assert.equal(new Set(s.refs).size,15);
runner=setup();runner.content();assert.equal(appState.practiceMemory.items[q.audio].channels.listening.attempts,1,'Reload does not repeat a recorded attempt');
click('data-act-next');assert.equal(appState.practiceMemory.items[q.audio].channels.listening.attempts,1);
runner.content();const second=pool.get(s.refs[s.pos]);result={...correct,corrected:second.answer};click('data-act-translation');input(second.answer);clock+=60000;await submit();
assert.equal(s.work[second.id].practiceMode,'translation');assert.ok(appState.practiceMemory.items[second.audio].channels.translation);assert.ok(!appState.practiceMemory.items[second.audio].channels.listening);
click('data-act-next');runner.content();const third=pool.get(s.refs[s.pos]);s.work[third.id].translated=true;s.work[third.id].seenTranslation=true;click('',{actAudio:third.audio});input(third.answer);result={...correct,corrected:third.answer};clock+=60000;await submit();assert.equal(s.work[third.id].practiceMode,'listening','Playing audio before submitting removes independent-production credit');
click('data-act-next');runner.content();const snapshot=JSON.stringify(appState.practiceMemory);input('A draft');result=new Error('offline');await submit();assert.equal(JSON.stringify(appState.practiceMemory),snapshot);click('data-act-next');assert.equal(JSON.stringify(appState.practiceMemory),snapshot);
for(let i=s.pos;i<15;i++)click('data-act-next');assert.ok(runner.content().includes('Alıştırma bitti.'));assert.equal(appState.notes[27],'Notum');assert.equal(appState.marks[27],'important');
const restored=JSON.parse(JSON.stringify(appState));assert.deepEqual(restored.practiceMemory,appState.practiceMemory);assert.equal(runner.startDueRound(),true);assert.equal(appState.sentencePractice[27].refs.length,15);
console.log('PASS: spaced days and intervals, mode separation, uncertain/offline/blank neutrality, overdue selection, 10+5 preservation, different-example follow-up, migration, persistence and exactly-once recording.');
