import {schedule} from './vendor/english-trainer/srs.js?v=1';
export const STORAGE_KEY='fatedreel-o13-v1';
export const localDay=now=>{const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const normalizeWord=word=>String(word).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'");
export const tokenize=text=>String(text).match(/[A-Za-z]+(?:['’][A-Za-z]+)?|[^A-Za-z]+/g)||[];
export const isWord=text=>/^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(text);
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function freshState(){return {version:1,cards:{},progress:{},quizzes:{},translations:{},lastStory:null,review:null,daily:null,settings:{filter:'all',size:21,speed:1}};}
export function validateState(value){
 if(!object(value)||value.version!==1||!object(value.cards)||!object(value.progress)||!object(value.quizzes)||!object(value.translations)||!object(value.settings))throw Error('invalid_backup');
 if(Object.keys(value.cards).length>1500||Object.keys(value.progress).length>1000||!['all','A1','A2'].includes(value.settings.filter)||![18,21,24].includes(value.settings.size)||![.75,1,1.15].includes(value.settings.speed))throw Error('invalid_backup');
 for(const [id,c] of Object.entries(value.cards)){
  if(!object(c)||c.id!==id||!['word','meaning','exampleEn','exampleTr','storyId','wordKey','audio'].every(k=>typeof c[k]==='string')||c.word.length>60||c.meaning.length>250||c.exampleEn.length>1000||c.exampleTr.length>1000||!/^[a-f0-9]{16}$/.test(c.audio)||!['new','learning','review'].includes(c.state)||!Number.isFinite(Date.parse(c.due))||!Number.isFinite(c.ease)||c.ease<1.3||!Number.isFinite(c.interval)||c.interval<0||c.interval>365||!Number.isInteger(c.reps)||c.reps<0||!Number.isInteger(c.lapses)||c.lapses<0)throw Error('invalid_backup');
 }
 for(const p of Object.values(value.progress))if(!object(p)||!Number.isInteger(p.attempts)||p.attempts<1||!Number.isInteger(p.bestScore)||p.bestScore<0||p.bestScore>3||!Number.isInteger(p.lastScore)||p.lastScore<0||p.lastScore>3||!Number.isFinite(p.completedAt))throw Error('invalid_backup');
 for(const q of Object.values(value.quizzes))if(!object(q)||!Number.isInteger(q.pos)||q.pos<0||q.pos>3||!object(q.answers)||Object.keys(q.answers).some(k=>!['0','1','2'].includes(k)||Number(k)>q.pos)||Object.values(q.answers).some(a=>!object(a)||!Number.isInteger(a.selected)||a.selected<0||a.selected>2||typeof a.checked!=='boolean'||a.checked&&typeof a.correct!=='boolean')||typeof q.recorded!=='boolean'||q.recorded!==(q.pos===3)||Array.from({length:q.pos},(_,i)=>i).some(i=>!q.answers[i]?.checked))throw Error('invalid_backup');
 for(const t of Object.values(value.translations))if(typeof t!=='boolean')throw Error('invalid_backup');
 if(value.review!==null){const r=value.review;if(!object(r)||!Array.isArray(r.ids)||r.ids.length>20||new Set(r.ids).size!==r.ids.length||r.ids.some(id=>typeof id!=='string'||!Object.hasOwn(value.cards,id))||!Number.isInteger(r.pos)||r.pos<0||r.pos>r.ids.length||typeof r.revealed!=='boolean'||!Array.isArray(r.done)||r.done.length!==r.pos||r.done.some((id,i)=>id!==r.ids[i]))throw Error('invalid_backup');}
 if(value.daily!==null){const d=value.daily;if(!object(d)||!/^\d{4}-\d{2}-\d{2}$/.test(d.day)||typeof d.storyId!=='string'||!Array.isArray(d.vocabIds)||d.vocabIds.length>5||new Set(d.vocabIds).size!==d.vocabIds.length||d.vocabIds.some(id=>typeof id!=='string'||!Object.hasOwn(value.cards,id))||typeof d.storyDone!=='boolean'||typeof d.reviewDone!=='boolean')throw Error('invalid_backup');}
 if(value.lastStory!==null&&typeof value.lastStory!=='string')throw Error('invalid_backup');
 return value;
}
export function loadStoredState(storage){try{const raw=storage.getItem(STORAGE_KEY);return {state:raw?validateState(JSON.parse(raw)):freshState(),locked:false};}catch{return {state:freshState(),locked:true};}}
export function persistState(storage,state,locked=false){if(locked)return false;try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function lookup(content,story,index,word){
 const wordKey=normalizeWord(word);if(!Object.hasOwn(content.dictionary,wordKey))return null;
 const entry=content.dictionary[wordKey];
 const overrides={
  'coffee-stop':{has:'vakti var'},'first-day':{called:'adında'},
  'quiet-evening':{right:'tam da uygun'},'saturday-plan':{had:'geçirdiler (have a good time)'},
  'rainy-walk':{got:'oldu; get heavier: şiddetlenmek'}
 };
 return {word,wordKey,meaning:overrides[story.id]?.[wordKey]||entry.tr,audio:entry.audio,kind:entry.kind||'word',storyId:story.id,exampleEn:story.sentences[index].en,exampleTr:story.sentences[index].tr};
}
export function cardId(term){let hash=2166136261;for(const c of term.meaning)hash=Math.imul(hash^c.charCodeAt(0),16777619);return `${term.wordKey}-${(hash>>>0).toString(16)}`;}
export function addWord(state,term,now=Date.now()){
 if(!term||term.kind==='name')return false;
 const id=cardId(term);if(Object.hasOwn(state.cards,id))return false;
 state.cards[id]={...term,id,ease:2.5,interval:0,reps:0,lapses:0,state:'new',due:new Date(now).toISOString(),createdAt:now};return true;
}
export function dueCards(state,now=Date.now()){return Object.values(state.cards).filter(c=>Date.parse(c.due)<=now).sort((a,b)=>Date.parse(a.due)-Date.parse(b.due)||a.createdAt-b.createdAt);}
export function nextStory(content,state){
 const list=state.settings.filter==='all'?content.stories:content.stories.filter(s=>s.level===state.settings.filter);
 return list.find(s=>s.id===state.lastStory&&!state.progress[s.id])||list.find(s=>!state.progress[s.id])||[...list].sort((a,b)=>(state.progress[a.id]?.completedAt||0)-(state.progress[b.id]?.completedAt||0))[0]||content.stories[0];
}
export function dailyPlan(content,state,now=Date.now()){
 const day=localDay(now);
 if(!state.daily||state.daily.day!==day||!content.stories.some(s=>s.id===state.daily.storyId))state.daily={day,storyId:nextStory(content,state).id,vocabIds:dueCards(state,now).slice(0,5).map(c=>c.id),storyDone:false,reviewDone:false};
 if(!state.daily.vocabIds.length&&!state.daily.reviewDone)state.daily.vocabIds=dueCards(state,now).slice(0,5).map(c=>c.id);
 return state.daily;
}
export function startReview(state,now=Date.now(),ids=null){
 if(state.review&&state.review.pos<state.review.ids.length)return state.review;
 const due=new Set(dueCards(state,now).map(c=>c.id)),queue=(ids||[...due]).filter(id=>due.has(id)).slice(0,10);
 state.review={ids:[...new Set(queue)],pos:0,done:[],revealed:false};return state.review;
}
export function rateWord(state,rating,now=Date.now()){
 const r=state.review;if(!r||!r.revealed||r.pos>=r.ids.length)return false;
 const id=r.ids[r.pos],card=state.cards[id];if(!card)return false;
 Object.assign(card,schedule(card,rating,now));r.done.push(id);r.pos++;r.revealed=false;
 if(state.daily?.day===localDay(now)&&state.daily.vocabIds.length&&state.daily.vocabIds.every(id=>r.done.includes(id)))state.daily.reviewDone=true;
 return true;
}
export function quizFor(state,story,restart=false){
 let q=state.quizzes[story.id];if(!q||restart||q.pos>story.questions.length)q=state.quizzes[story.id]={pos:0,answers:{},recorded:false};return q;
}
export function chooseAnswer(state,story,selected){const q=quizFor(state,story);if(q.pos>=story.questions.length||q.answers[q.pos]?.checked||!Number.isInteger(selected)||selected<0||selected>=story.questions[q.pos].options.length)return false;q.answers[q.pos]={selected,checked:false};return true;}
export function checkAnswer(state,story){const q=quizFor(state,story),a=q.answers[q.pos];if(!a||a.checked||q.pos>=story.questions.length)return false;a.checked=true;a.correct=a.selected===story.questions[q.pos].answer;return true;}
export function advanceQuiz(state,story,now=Date.now()){
 const q=quizFor(state,story);if(!q.answers[q.pos]?.checked||q.pos>=story.questions.length)return false;q.pos++;
 if(q.pos===story.questions.length&&!q.recorded){
  const score=Object.values(q.answers).filter(a=>a.correct).length,old=state.progress[story.id];
  state.progress[story.id]={attempts:(old?.attempts||0)+1,bestScore:Math.max(old?.bestScore||0,score),lastScore:score,completedAt:now};q.recorded=true;
  if(state.daily?.day===localDay(now)&&state.daily.storyId===story.id)state.daily.storyDone=true;
 }
 return true;
}
