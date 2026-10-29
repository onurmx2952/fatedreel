import assert from 'node:assert/strict';
import fs from 'node:fs';
import {explainAnswer} from '../feedback.js';
import {normalizedTranscript} from '../activities.js';
import {buildSentences,normalizeAnswer,answerMatches} from '../sentences.js';
const book=JSON.parse(fs.readFileSync(new URL('../book.json',import.meta.url),'utf8'));
const pool=buildSentences(book);
assert.ok(answerMatches('Let us get a taxi instead', {answer:"Let's get a taxi instead."}));
assert.ok(answerMatches('I think someone is at the door', {answer:"I think someone's at the door."}));
assert.ok(answerMatches('She has been really busy lately', {answer:"She's been really busy lately."}));
assert.ok(!answerMatches('She has looking for her bag', {answer:"She's looking for her bag."}));
assert.match(explainAnswer('She been really busy lately',{answer:"She's been really busy lately."}),/“has” koymayı unutmuşsun/);
assert.match(explainAnswer('You should told me',{answer:'You should have told me.'}),/modal fiilden sonra/);
const example=explainAnswer('I thinking my holiday',{answer:'I am thinking about my holiday.'});
const way=explainAnswer('I get a coffee go for work',{answer:'I grab a coffee on the way to work.'});
assert.match(way,/on the way to work.*işe giderken/);assert.ok(!way.includes('yüzey'));
assert.equal(way.split('\n').length,2,'Treat the expression as a whole, not four unrelated grammar errors');
const onlyOn=explainAnswer('I grab a coffee the way to work',{answer:'I grab a coffee on the way to work.'});
assert.match(onlyOn,/on the way to work/);assert.ok(!onlyOn.includes('yüzey'));
const busOn=explainAnswer('I am the bus',{answer:'I am on the bus.'});assert.match(busOn,/otobüste/);assert.ok(!busOn.includes('yüzey'));
assert.match(explainAnswer("I'm my way",{answer:"I'm on my way."}),/yolda/);
assert.match(explainAnswer('No problem all',{answer:'No problem at all.'}),/at all/);
assert.match(explainAnswer("It's up you",{answer:"It's up to you."}),/sana kalmış/);
assert.equal(example.split('\n').length,2);assert.match(example,/“am” koymayı unutmuşsun/);assert.match(example,/“about” koymayı unutmuşsun/);assert.match(example,/think about/);
const onlyAbout=explainAnswer('I am thinking my holiday',{answer:'I am thinking about my holiday.'});
assert.equal(onlyAbout.split('\n').length,1);assert.ok(!onlyAbout.includes('“am”'));
const cases=[
 ['Let us get a taxi instead',"Let's get a taxi instead.",/^$/],
 ['Me am a student','I am a student.',/“Me”|“me”/],
 ['I is tired','I am tired.',/“is” yerine “am”/],
 ['I tea','I like tea.',/“like” koymayı unutmuşsun/],
 ['It is a apple','It is an apple.',/ünlü ses/],
 ['This is bag','This is my bag.',/kime ait/],
 ['I know he','I know him.',/nesne/],
 ['She have a car','She has a car.',/sahip/],
 ['She work here','She works here.',/Geniş zamanda/],
 ['Does she works here','Does she work here?',/yalın/],
 ['I cooking','I am cooking.',/yardımcı fiili/],
 ['I am knowing the answer','I know the answer.',/durum/],
 ['are you','Where are you?',/“where” koymayı unutmuşsun/],
 ['I work Monday','I work on Monday.',/Gün adlarının/],
 ['I go to work bus','I go to work by bus.',/Ulaşım/],
 ['I go home yesterday','I went home yesterday.',/Geçmişte tamamlanan/],
 ['Did you saw her','Did you see her?',/yalın/],
 ['I were tired','I was tired.',/“I” öznesine uygun/],
 ['I was sleep','I was sleeping.',/-ing/],
 ['I will called you','I will call you.',/yalın/],
 ['I am going visit Emma','I am going to visit Emma.',/going to/],
 ['I am go to visit Emma','I am going to visit Emma.',/Gelecek planı/],
 ['I will call you I get home','I will call you when I get home.',/olayın gerçekleştiği zamanı/],
 ['I can to help you','I can help you.',/“to” burada fazla/],
 ['I would a coffee','I would like a coffee.',/“like” koymayı unutmuşsun/],
 ['I enjoy read','I enjoy reading.',/-ing biçimi/],
 ['Let me to help you','Let me help you.',/Let\/make/],
 ['Say me the truth','Tell me the truth.',/tell\/told \+ kişi/],
 ['I am waiting you','I am waiting for you.',/wait for/],
 ['She stayed home it was raining','She stayed home because it was raining.',/Nedeni/],
 ['Do you know where does she live','Do you know where she lives?',/iç cümlede/],
 ['I have went home','I have gone home.',/üçüncü biçimi/],
 ['That was close','That was close!',/^$/],
 ['I just got back','I have just got back.',/Present Perfect/],
 ['I went to home','I went home.',/home.*önce.*to/],
 ['You are hungry','Are you hungry?',/Soruda yardımcı fiil/],
 ['I have two book','I have two books.',/ismin çoğul/],
 ['I like coffe','I like coffee.',/“coffe” yerine “coffee”/],
];
for(const [input,answer,pattern] of cases){const feedback=explainAnswer(input,{answer});assert.match(feedback,pattern,`${input} -> ${answer}: ${feedback}`);assert.ok(!/Birlikte karşılaştıralım|karşılaştır|eşleşmiyor|Ünite|büyük\/küçük|sonraki cümle/i.test(feedback));}
let count=0;
for(const q of pool.values()){
 assert.equal(explainAnswer(q.answer,q),'');assert.equal(explainAnswer('',q),'');
 const words=normalizedTranscript(q.answer).split(' ');
 for(let i=0;i<words.length;i++){
  const input=words.filter((_,j)=>j!==i).join(' ');
  if(answerMatches(input,q))continue;
  const result=explainAnswer(input,q),word=words[i]==='i'?'I':words[i];
  assert.ok(result.includes(`“${word}”`),`${q.answer}, removed ${words[i]}: ${result}`);
  assert.ok(result.includes('koymayı unutmuşsun'),result);count++;
 }
 assert.match(explainAnswer(normalizedTranscript(q.answer)+' zzzextra',q),/“zzzextra” burada fazla/);
}
console.log(`Feedback: ${cases.length} targeted grammar cases across 32 topics, ${count} word omissions across all ${pool.size} recordings, extra words, blank/correct answers passed`);
