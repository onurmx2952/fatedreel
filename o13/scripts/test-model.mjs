import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {STORAGE_KEY,freshState,validateState,loadStoredState,persistState,tokenize,isWord,lookup,cardId,addWord,dueCards,nextStory,dailyPlan,startReview,rateWord,quizFor,chooseAnswer,checkAnswer,advanceQuiz} from '../model.js';
import {schedule} from '../vendor/english-trainer/srs.js';
import {isLearningApp,acceptsLearningKey} from '../../functions/_lib/learning-apps.js';
const content=JSON.parse(fs.readFileSync(new URL('../content.json',import.meta.url)));
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,16),now=new Date(2026,9,31,12).getTime(),DAY=86400000;
assert.equal(content.stories.length,12);assert.equal(content.stories.filter(s=>s.level==='A1').length,6);assert.equal(new Set(content.stories.map(s=>s.id)).size,12);
for(const story of content.stories){
 assert.equal(story.questions.length,3);assert.equal(hash(story.text),story.audio);assert.ok(story.wordCount>=50&&story.wordCount<=110);
 assert.ok(fs.existsSync(new URL('../art/'+story.art+'.webp',import.meta.url)));
 for(const [i,s]of story.sentences.entries()){
  assert.equal(tokenize(s.en).join(''),s.en);assert.ok(s.tr.length>5&&!/[А-Яа-яЁё]/.test(s.tr));
  for(const word of tokenize(s.en).filter(isWord)){const term=lookup(content,story,i,word);assert.ok(term,story.id+': '+word);assert.ok(term.meaning);if(term.kind!=='name')assert.ok(fs.existsSync(new URL('../audio/'+term.audio+'.mp3',import.meta.url)),word);}
 }
 for(const q of story.questions){assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<3);assert.ok(q.why&&q.prompt);}
}
const story=content.stories[0],term=lookup(content,story,0,'work'),state=freshState();
assert.ok(addWord(state,term,now));assert.equal(addWord(state,term,now+1),false);assert.equal(Object.keys(state.cards).length,1);assert.equal(state.cards[cardId(term)].exampleEn,story.sentences[0].en);
const name=lookup(content,story,0,'Mina');assert.equal(addWord(state,name,now),false);
assert.equal(dueCards(state,now).length,1);let review=startReview(state,now);assert.equal(review.ids.length,1);assert.equal(rateWord(state,'good',now),false,'Cannot grade a hidden answer');
review.revealed=true;assert.equal(rateWord(state,'good',now),true);assert.equal(state.cards[cardId(term)].due,new Date(now+DAY).toISOString());assert.equal(rateWord(state,'easy',now),false,'Cannot grade a card twice');assert.equal(dueCards(state,now).length,0);
review=startReview(state,now+DAY);review.revealed=true;rateWord(state,'good',now+DAY);assert.ok(Date.parse(state.cards[cardId(term)].due)>=now+3*DAY);
review=startReview(state,now+10*DAY);review.revealed=true;rateWord(state,'again',now+10*DAY);assert.equal(state.cards[cardId(term)].state,'learning');assert.equal(Date.parse(state.cards[cardId(term)].due),now+10*DAY+10*60000);
assert.throws(()=>schedule({},'invalid',now));assert.equal(schedule({},'hard',now).due,new Date(now+6*60000).toISOString());
// Unfinished review and quiz survive a real JSON roundtrip.
review=startReview(state,now+11*DAY);review.revealed=true;let restored=validateState(JSON.parse(JSON.stringify(state)));assert.equal(restored.review.revealed,true);assert.deepEqual(restored.cards,state.cards);
assert.equal(advanceQuiz(state,story,now),false);assert.equal(chooseAnswer(state,story,99),false);
chooseAnswer(state,story,story.questions[0].answer);assert.equal(checkAnswer(state,story),true);assert.equal(chooseAnswer(state,story,2),false);assert.equal(checkAnswer(state,story),false);
restored=validateState(JSON.parse(JSON.stringify(state)));assert.equal(restored.quizzes[story.id].answers[0].checked,true);
advanceQuiz(state,story,now);chooseAnswer(state,story,(story.questions[1].answer+1)%3);checkAnswer(state,story);advanceQuiz(state,story,now);
chooseAnswer(state,story,story.questions[2].answer);checkAnswer(state,story);advanceQuiz(state,story,now);assert.equal(state.progress[story.id].lastScore,2);assert.equal(state.progress[story.id].attempts,1);assert.equal(advanceQuiz(state,story,now),false);
quizFor(state,story,true);for(const q of story.questions){chooseAnswer(state,story,q.answer);checkAnswer(state,story);advanceQuiz(state,story,now+1);}assert.equal(state.progress[story.id].bestScore,3);assert.equal(state.progress[story.id].attempts,2);
const dstate=freshState();addWord(dstate,term,now);const plan=dailyPlan(content,dstate,now),first=plan.storyId;assert.equal(plan.vocabIds.length,1);dstate.settings.filter='A2';assert.equal(dailyPlan(content,dstate,now).storyId,first,'The daily story stays stable while working');
const dr=startReview(dstate,now,plan.vocabIds);dr.revealed=true;rateWord(dstate,'good',now);assert.equal(dstate.daily.reviewDone,true);assert.equal(dailyPlan(content,dstate,now+DAY).day===plan.day,false);
assert.equal(nextStory(content,{...freshState(),settings:{filter:'A2'}}).level,'A2');
const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
assert.ok(persistState(storage,state));assert.deepEqual(loadStoredState(storage).state,state);store.set(STORAGE_KEY,'{broken');const broken=loadStoredState(storage);assert.equal(broken.locked,true);assert.equal(persistState(storage,freshState(),broken.locked),false);assert.equal(store.get(STORAGE_KEY),'{broken','Broken stored data must not be overwritten');
assert.equal(persistState({setItem(){throw Error('quota');}},state),false);assert.throws(()=>validateState({...freshState(),review:{ids:['missing'],pos:0,revealed:false,done:[]}}));assert.throws(()=>validateState({...freshState(),quizzes:{x:{pos:3,answers:{},recorded:true}}}));
for(const app of ['o11','o12','o13'])assert.equal(isLearningApp(app),true);assert.equal(isLearningApp('o14'),false);assert.equal(acceptsLearningKey('o13',STORAGE_KEY),true);assert.equal(acceptsLearningKey('o13','fatedreel-o11-book-v1'),false);assert.equal(acceptsLearningKey('o11',STORAGE_KEY),false);assert.equal(acceptsLearningKey('o11','fatedreel-o11-book-v1'),true);assert.equal(acceptsLearningKey('o12','word-atlas-o12:v2:my-deck'),true);assert.equal(acceptsLearningKey('o12',STORAGE_KEY),false);
console.log('PASS: 12 stories, 36 questions, complete word lookup/audio coverage, real SM-2 scheduling, hidden-answer guard, persistence, quiz scoring, daily stability, backup validation, storage failure and app isolation.');
