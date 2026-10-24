import {chapters, phrases, projects} from './curriculum.js';
export const KEY='elsewhere-o9-v1';
export const fresh=()=>({version:1,name:'Gezgin',started:false,completed:{},exams:{},final:null,xp:0,coins:0,repairs:[],reviews:{},speaking:{},journal:{},days:[],session:null,settings:{sound:true,rate:.8}});
function cleanResult(r){if(!r||typeof r.score!=='number'||r.score<80||r.score>100||!r.skills||typeof r.skills!=='object')return null;const skills={};for(const [key,v] of Object.entries(r.skills)){if(!['reading','writing','listening','grammar','dialogue'].includes(key)||!v||!Number.isInteger(v.ok)||!Number.isInteger(v.total)||v.total<1||v.total>500||v.ok<0||v.ok>v.total)return null;skills[key]={ok:v.ok,total:v.total};}if(!Object.keys(skills).length)return null;return {score:r.score,skills,passed:true,at:Number(r.at)||Date.now(),audioAssisted:!!r.audioAssisted};}
export function normalize(s){
 if(!s||s.version!==1||typeof s.completed!=='object'||!s.completed) throw Error('Bu dosya bir Elsewhere yedeği değil.');
 const n=fresh(); n.name=String(s.name||'Gezgin').slice(0,24); n.started=!!s.started;
 const validIds=new Set(chapters.flatMap(c=>c.lessons.map(l=>l.id)));
 for(const [id,v] of Object.entries(s.completed))if(validIds.has(id)&&v&&Number.isFinite(v.score)&&v.score>=80&&v.score<=100)n.completed[id]={score:v.score,at:Number(v.at)||Date.now()};
 for(const c of chapters){const result=cleanResult(s.exams?.[c.id]);if(result)n.exams[c.id]=result;}
 n.final=cleanResult(s.final);
 n.xp=Math.max(0,Math.min(100000,Number(s.xp)||0)); n.coins=Math.max(0,Math.min(100000,Number(s.coins)||0));
 n.repairs=Array.isArray(s.repairs)?s.repairs.filter(id=>projects.some(p=>p.id===id)):[];
 for(const p of phrases){const r=s.reviews?.[p.id];if(r&&Number.isFinite(r.due))n.reviews[p.id]={due:r.due,box:Math.max(0,Math.min(5,Number(r.box)||0)),misses:Number(r.misses)||0};}
 for(const c of chapters){if(s.speaking?.[c.id])n.speaking[c.id]=s.speaking[c.id];if(typeof s.journal?.[c.id]==='string')n.journal[c.id]=s.journal[c.id].slice(0,2000);}
 n.days=Array.isArray(s.days)?s.days.filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-365):[];
 n.settings={sound:s.settings?.sound!==false,rate:[.65,.8,1].includes(s.settings?.rate)?s.settings.rate:.8};
 const x=s.session;if(x&&Array.isArray(x.tasks)&&x.tasks.length<=200&&x.tasks.length>0&&Number.isInteger(x.index)&&x.index>=0&&x.index<=x.tasks.length&&Number.isInteger(x.teach)&&x.teach>=0&&x.teach<=4&&Array.isArray(x.records)&&x.records.length<=200&&x.records.every(r=>r&&typeof r.correct==='boolean'&&typeof r.given==='string'&&typeof r.type==='string')&&['lesson','exam','final','review'].includes(x.kind)&&Number.isInteger(x.chapter)&&x.chapter>=0&&x.chapter<16&&x.tasks.every(t=>t&&['choice','build','type','listen','read','dialogue','grammar'].includes(t.type)&&(!t.pid||phrases.some(p=>p.id===t.pid))&&(!['read','dialogue','grammar'].includes(t.type)||Number.isInteger(t.chapter)&&t.chapter>=0&&t.chapter<16)&&(!t.options||Array.isArray(t.options)&&t.options.length<=10&&t.options.every(o=>typeof o==='string'))&&(t.type!=='build'||Array.isArray(t.tokens)&&t.tokens.length<=50&&t.tokens.every(v=>v&&typeof v.w==='string'&&Number.isInteger(v.i))))) {
  if(x.draft){const ids=x.tasks[x.index]?.tokens?.map(v=>v.i)||[];x.draft={answer:typeof x.draft.answer==='string'?x.draft.answer.slice(0,2000):'',chosen:Array.isArray(x.draft.chosen)?x.draft.chosen.filter(id=>ids.includes(id)):[]};}
  n.session=x;
 }
 return n;
}
export function load(storage=localStorage){try{const data=storage.getItem(KEY);return data?{state:normalize(JSON.parse(data)),error:null}:{state:fresh(),error:null};}catch(e){return {state:fresh(),error:'Kayıt okunamadı. Yeni ilerleme başladı; varsa JSON yedeğini içe aktarabilirsin.'};}}
export function save(s,storage=localStorage){try{storage.setItem(KEY,JSON.stringify(s));return true;}catch{return false;}}
export function shuffle(arr,rng=Math.random){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function norm(x){return String(x).toLowerCase().replace(/[’‘]/g,"'").replace(/\bi'm\b/g,'i am').replace(/\byou're\b/g,'you are').replace(/\bwe're\b/g,'we are').replace(/\bthey're\b/g,'they are').replace(/\bhe's\b/g,'he is').replace(/\bshe's\b/g,'she is').replace(/\bit's\b/g,'it is').replace(/\bisn't\b/g,'is not').replace(/\baren't\b/g,'are not').replace(/\bdon't\b/g,'do not').replace(/\bdoesn't\b/g,'does not').replace(/\bcan't\b/g,'cannot').replace(/\bcan not\b/g,'cannot').replace(/\bwasn't\b/g,'was not').replace(/\bweren't\b/g,'were not').replace(/\bi'd like\b/g,'i would like').replace(/\blet's\b/g,'let us').replace(/\bgot\b/g,'got').replace(/[.,!?;:"“”]/g,'').replace(/\s+/g,' ').trim();}
const alternatives={
 'Hello!':['Hi!','Hello there!'],
 'My name is Alex.':["My name's Alex.",'I am Alex.'],
 'I am from Turkey.':['I am Turkish.','I come from Turkey.'],
 'Nice to meet you.':['Pleased to meet you.'],
 'What is your name?':["What’s your name?"],
 'How are you?':['How are you doing?'],
 'I am fine, thank you.':['I am well, thank you.','I am good, thanks.','I am fine, thanks.'],
 'Can you repeat that, please?':['Could you repeat that, please?','Please repeat that.','Can you say that again, please?'],
 'Please speak slowly.':['Speak slowly, please.','Can you speak slowly, please?'],
 'I am twenty years old.':['I am twenty.','I am 20 years old.','I am 20.'],
 'My number is fifteen.':['My number is 15.'],
 'There are thirty people.':['There are 30 people.'],
 'I have two bags.':['I have 2 bags.','I have got two bags.'],
 'What is your phone number?':["What’s your telephone number?"],
 'My surname is Green.':['My last name is Green.','My family name is Green.'],
 'There are two windows.':['There are 2 windows.'],
 'The keys are in the box.':['The keys are inside the box.'],
 'I would like a coffee, please.':['I would like a cup of coffee, please.','A coffee, please.'],
 'Can I have some water?':['Could I have some water?','May I have some water?'],
 'I like cheese.':['I love cheese.'],
 'How much is it?':['How much does it cost?','What is the price?'],
 'It is five pounds.':['It is 5 pounds.','It costs five pounds.'],
 'The bill, please.':['Can I have the bill, please?','The check, please.'],
 'No, thank you. That is all.':['No, thanks. That is all.'],
 'I have a sister.':['I have one sister.','I have got a sister.'],
 'She has two brothers.':['She has 2 brothers.','She has got two brothers.'],
 'She has brown eyes.':['She has got brown eyes.'],
 'My grandmother is very kind.':['My grandma is very kind.'],
 'I get up at seven.':['I get up at 7.','I get up at seven o’clock.'],
 'It is half past six.':['It is six thirty.','It is 6:30.'],
 'The shop opens at nine.':['The shop opens at 9.','The shop opens at nine o’clock.'],
 'I do not work on Sunday.':['I do not work on Sundays.'],
 'Go straight ahead.':['Go straight.','Walk straight ahead.'],
 'Excuse me, can you help me?':['Excuse me, could you help me?'],
 'Thank you for your help.':['Thanks for your help.'],
 'Have you got any eggs?':['Do you have any eggs?'],
 'I would like a kilo of tomatoes.':['I would like one kilo of tomatoes.','I would like a kilogram of tomatoes.'],
 'Can I pay by card?':['Can I pay with a card?','Could I pay by card?'],
 'Can I try it on?':['Could I try it on?','May I try it on?'],
 'What size are you?':['What is your size?'],
 'Do you have a large size?':['Have you got a large size?'],
 'I cannot drive.':['I do not know how to drive.'],
 'My favourite sport is tennis.':['My favorite sport is tennis.'],
 'That is a good idea.':['That is a great idea.'],
 'The train leaves at ten.':['The train leaves at 10.','The train leaves at ten o’clock.'],
 'It is sunny today.':['Today is sunny.'],
 'It is raining.':['It is rainy.'],
 'What is the date today?':['What is today’s date?'],
 'It is the first of May.':['It is May first.','It is the 1st of May.'],
 'I do not feel well.':['I feel unwell.','I feel ill.'],
 'What do you do?':['What is your job?'],
 'He is an engineer.':['He works as an engineer.'],
 'A room for two nights, please.':['A room for 2 nights, please.'],
 'Can I have the key, please?':['Could I have the key, please?'],
 'We are going to meet at six.':['We are going to meet at 6.'],
 'The party starts at seven.':['The party starts at 7.','The party starts at seven o’clock.'],
 'Thank you for everything.':['Thanks for everything.']
};
export const matches=(given,answer,alts=[])=>[answer,...(alternatives[answer]||[]),...alts].some(a=>norm(given)===norm(a));
export const allLessons=c=>c.lessons.map(l=>l.id);
export function unlocked(s,id){return id===0||!!s.exams[id-1];}
export function lessonOpen(s,ci,li){return unlocked(s,ci)&&(li===0||!!s.completed[`${ci}-${li-1}`]);}
export const nextChapter=s=>chapters.find(c=>!s.exams[c.id])||chapters.at(-1);
export const dueReviews=s=>phrases.filter(p=>s.reviews[p.id]&&s.reviews[p.id].due<=Date.now());
const distract=(p)=>shuffle(phrases.filter(q=>q.id!==p.id&&q.tr!==p.tr)).slice(0,3).map(q=>q.tr);
function task(p,type){return {type,pid:p.id,options:type==='choice'?shuffle([p.tr,...distract(p)]):undefined,tokens:type==='build'?shuffle(p.en.split(' ').map((w,i)=>({w,i}))):undefined};}
export function lessonTasks(ci,li){const ps=chapters[ci].lessons[li].phrases; return shuffle(ps.flatMap((p,i)=>[task(p,'choice'),task(p,i%2?'listen':'build'),task(p,'type')]));}
export const grammarChecks=[
['I ___ from Turkey.','am',['am','is','are'],'I ile am kullanılır.'],
['She ___ a student.','is',['are','am','is'],'She ile is kullanılır.'],
['There ___ two windows.','are',['is','are','am'],'Çoğul two windows ile are kullanılır.'],
['She ___ orange juice.','likes',['like','likes','liking'],'Geniş zamanda she ile fiil -s alır.'],
['He ___ two sisters.','has',['have','has','is'],'He ile has kullanılır.'],
['Does she ___ here?','live',['lives','living','live'],'Does sonrasında fiil yalın kalır.'],
['The bank is ___ the park. (karşısında)','opposite',['under','opposite','in'],'Opposite karşısında demektir.'],
['How ___ apples do you need?','many',['much','many','any'],'Sayılabilen çoğul isimle how many kullanılır.'],
['She is ___ a yellow hat.','wearing',['wear','wears','wearing'],'Şu anda: is + fiil-ing.'],
['She can ___ the guitar.','play',['plays','play','playing'],'Can’den sonra fiil yalın kalır.'],
['You ___ not run here. (yasak)','must',['do','must','are'],'Must not yasak belirtir.'],
['My birthday is ___ June.','in',['on','at','in'],'Aylarla in kullanılır.'],
['I ___ thirsty.','am',['have','am','do'],'Bir hâli anlatırken be kullanılır: I am thirsty.'],
['He ___ every day.','cooks',['is cooking','cook','cooks'],'Every day alışkanlık: he cooks.'],
['We ___ at the station yesterday.','were',['was','are','were'],'We için geçmişte were kullanılır.'],
['I am going to ___ you.','help',['helping','help','helps'],'Be going to sonrasında yalın fiil gelir.']
];
export function examTasks(ci){const c=chapters[ci];const ps=c.lessons.flatMap(l=>l.phrases);const g=grammarChecks[ci];return shuffle([...shuffle(ps).slice(0,4).map(p=>task(p,'type')),...shuffle(ps).slice(0,3).map(p=>task(p,'listen')),...shuffle(ps).slice(0,2).map(p=>task(p,'build')),{type:'read',chapter:ci},{type:'dialogue',chapter:ci},{type:'grammar',chapter:ci,options:shuffle(g[2])}]);}
export function finalTasks(){return shuffle(chapters.flatMap(c=>{const ps=shuffle(c.lessons.flatMap(l=>l.phrases));const type=['grammar','read','dialogue'][c.id%3];return [task(ps[0],'type'),task(ps[1],'listen'),{type,chapter:c.id,options:type==='grammar'?shuffle(grammarChecks[c.id][2]):undefined}];}));}
export function reviewTasks(s){let ps=dueReviews(s);if(!ps.length)ps=phrases.filter(p=>s.completed[`${p.chapter}-${p.lesson}`]);return shuffle(ps).slice(0,12).map((p,i)=>task(p,i%3===0?'listen':i%3===1?'type':'build'));}
export function resolve(t){if(t.pid){const p=phrases.find(p=>p.id===t.pid);return {...p,answer:t.type==='choice'?p.tr:p.en};}const c=chapters[t.chapter];if(t.type==='read')return {...c.reading,en:c.reading.text,tr:'Metni okuyup soruyu cevapla.'};if(t.type==='dialogue')return {...c.dialogue,en:c.dialogue.text,tr:'Konuşmaya uygun yanıtı seç.'};const g=grammarChecks[t.chapter];return {en:g[0],tr:g[3],answer:g[1],options:t.options};}
export const skillOf=t=>t.type==='type'?'writing':t.type==='listen'?'listening':t.type==='dialogue'?'dialogue':t.type==='build'||t.type==='grammar'?'grammar':'reading';
export function resultOf(session){const records=session.records||[];const first=records.filter(r=>!r.retry);const skills={};for(const r of first){const k=skillOf(r);skills[k]??={ok:0,total:0};skills[k].total++;if(r.correct)skills[k].ok++;}const score=Math.round(first.filter(r=>r.correct).length/Math.max(1,first.length)*100);return {score,skills,passed:score>=80&&Object.values(skills).every(s=>s.ok/s.total>=.6)};}
export function registerReview(s,pid,correct){if(!pid)return;const old=s.reviews[pid]||{box:0,misses:0};const box=correct?Math.min(5,old.box+1):0;s.reviews[pid]={box,misses:old.misses+(correct?0:1),due:Date.now()+(correct?[0,600000,86400000,259200000,604800000,1209600000][box]:0)};}
export function reward(s,session,result){if(session.rewarded)return;session.rewarded=true;const d=new Date().toLocaleDateString('en-CA');if(!s.days.includes(d))s.days.push(d);
 if(result.passed&&session.kind==='lesson'){const id=`${session.chapter}-${session.lesson}`;if(!s.completed[id]){s.xp+=100;s.coins+=30;}s.completed[id]={score:Math.max(result.score,s.completed[id]?.score||0),at:Date.now()};}
 if(result.passed&&session.kind==='exam'&&!s.exams[session.chapter]){s.exams[session.chapter]={...result,at:Date.now()};s.xp+=200;s.coins+=50;}
 if(result.passed&&session.kind==='final'){if(!s.final){s.xp+=500;s.coins+=100;}s.final={...result,at:Date.now(),audioAssisted:!!session.audioAssisted};}
 if(session.kind==='review'&&!session.reviewReward){s.xp+=Math.min(30,session.records.filter(r=>r.correct).length*3);session.reviewReward=true;}
}
