import {normalizeAnswer,answerMatches} from './activities.js?v=1';

// Align the learner's words with this recording's transcript. Feedback describes
// only observed edits; lesson summaries and status headings are never appended.
const forms={go:['go','goes','went','gone','going'],come:['come','comes','came','coming'],see:['see','sees','saw','seen','seeing'],get:['get','gets','got','gotten','getting'],take:['take','takes','took','taken','taking'],give:['give','gives','gave','given','giving'],leave:['leave','leaves','left','leaving'],make:['make','makes','made','making'],tell:['tell','tells','told','telling'],say:['say','says','said','saying'],think:['think','thinks','thought','thinking'],know:['know','knows','knew','known','knowing'],hear:['hear','hears','heard','hearing'],eat:['eat','eats','ate','eaten','eating'],drink:['drink','drinks','drank','drunk','drinking'],sleep:['sleep','sleeps','slept','sleeping'],read:['read','reads','reading'],write:['write','writes','wrote','written','writing'],have:['have','has','had','having'],do:['do','does','did','done','doing'],be:['am','is','are','was','were','be','been','being'],buy:['buy','buys','bought','buying'],bring:['bring','brings','brought','bringing'],forget:['forget','forgets','forgot','forgotten','forgetting'],meet:['meet','meets','met','meeting'],speak:['speak','speaks','spoke','spoken','speaking'],run:['run','runs','ran','running']};
const irregular=new Map(Object.entries(forms).flatMap(([base,words])=>words.map(w=>[w,base])));
const verbs=new Set([...Object.keys(forms),'work','call','help','wait','cook','listen','study','live','want','need','like','play','watch','arrive','visit','travel','move','save','park','rest','enjoy','decide','finish','hope','avoid','ask','talk','look','worry','answer','use','open','learn','stay','understand','drive','walk']);
function root(w){if(irregular.has(w))return irregular.get(w);if(w.endsWith('ies'))return w.slice(0,-3)+'y';if(w.endsWith('ied'))return w.slice(0,-3)+'y';if(w.endsWith('ing'))return w.slice(0,-3).replace(/(.)\1$/,'$1').replace(/v$/,'ve');if(w.endsWith('ed'))return w.slice(0,-2);if(w.endsWith('s'))return w.slice(0,-1);return w;}
function sameVerb(a,b){const x=root(a),y=root(b);return x===y||x+'e'===y||y+'e'===x;}
const be=new Set(forms.be),aux=new Set([...forms.be,...forms.do,...forms.have,'will','would','can','could','should','must','shall','cannot']);
const pronouns=new Set(['i','you','he','she','it','we','they','me','him','her','us','them']);
const possessives=new Set(['my','your','his','her','its','our','their','mine','yours','hers','ours','theirs']);
const articles=new Set(['a','an','the']);
const prepositions=new Set(['about','to','for','at','in','on','of','from','with','by','after']);
const quoted=w=>`“${w==='i'?'I':w}”`;
function comparable(a,b){return sameVerb(a,b)||(aux.has(a)&&aux.has(b))||(pronouns.has(a)&&pronouns.has(b))||(possessives.has(a)&&possessives.has(b))||(articles.has(a)&&articles.has(b))||(prepositions.has(a)&&prepositions.has(b));}

export function alignWords(actual,target){
 const rows=actual.length+1,cols=target.length+1;
 const dp=Array.from({length:rows},()=>new Float64Array(cols));
 for(let i=0;i<rows;i++)dp[i][0]=i;for(let j=0;j<cols;j++)dp[0][j]=j;
 const cost=(a,b)=>a===b?0:comparable(a,b)?.75:1.5;
 for(let i=1;i<rows;i++)for(let j=1;j<cols;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+cost(actual[i-1],target[j-1]));
 const edits=[];let i=actual.length,j=target.length;
 while(i||j){
  if(i&&j&&Math.abs(dp[i][j]-dp[i-1][j-1]-cost(actual[i-1],target[j-1]))<.001){if(actual[i-1]!==target[j-1])edits.push({kind:'replace',actual:actual[i-1],expected:target[j-1],at:j-1});i--;j--;}
  else if(j&&Math.abs(dp[i][j]-dp[i][j-1]-1)<.001){edits.push({kind:'missing',expected:target[j-1],at:j-1});j--;}
  else{edits.push({kind:'extra',actual:actual[i-1],at:j});i--;}
 }
 return {edits:edits.reverse(),cost:dp[actual.length][target.length]};
}

function wordReason(word,at,t,q){
 const before=t.slice(0,at).join(' '),after=t.slice(at+1).join(' '),all=t.join(' '),next=t[at+1]||'';
 if(word==='about'){
  if(/\bthink(?:s|ing)?$/.test(before))return 'Bir şey hakkında düşünmek “think about + konu” kalıbıyla söylenir.';
  if(/\b(?:talk(?:s|ed|ing)?|worr(?:y|ied|ying))$/.test(before))return 'Burada “about”, konuşulan veya endişe edilen konuyu belirtir.';
  return '“About” burada “hakkında” anlamını verir.';
 }
 if(word==='for'){
  if(/\bwait(?:s|ed|ing)?$/.test(before))return 'Birini/bir şeyi beklemek için “wait for + beklenen kişi/şey” kullanılır.';
  if(/\blook(?:s|ed|ing)?$/.test(before))return '“Look for” aramak demektir; aranan şey “for”dan sonra gelir.';
  if(/\bask(?:s|ed|ing)?(?:\s+\w+)?$/.test(before))return 'Birinden bir şey istemek “ask someone for something” kalıbıyla kurulur.';
  if(/\b(?:years?|months?|days?|weeks?|hours?)\b/.test(after))return '“For” burada bir şeyin ne kadar süredir devam ettiğini belirtir.';
  return '“For” bu cümlede kimin/ne için olduğunu belirtir.';
 }
 if(word==='to'){
  if(/\blisten(?:s|ed|ing)?$/.test(before))return 'Birini/bir şeyi dinlemek “listen to + dinlenen kişi/şey” kalıbıyla söylenir.';
  if(/\b(?:want|wants|need|needs|decided|hope|hopes|like|told|tell|asked|ask)\b/.test(before)&&!['work','school','paris','london'].includes(next))return 'Bu yapıda ikinci fiil “to + yalın fiil” biçiminde bağlanır.';
  if(/\bgoing$/.test(before))return 'Gelecek planı “be going to + yalın fiil” kalıbıyla kurulur; “to” bu kalıbın parçasıdır.';
  return '“To” burada gidilen yeri veya sözün yöneldiği kişiyi belirtir.';
 }
 if(word==='at'){
  if(/\blook(?:s|ed|ing)?$/.test(before))return 'Bir şeye bakmak “look at + bakılan şey” kalıbıyla söylenir.';
  if(/^(six|seven|eight|nine|ten|\d)/.test(after))return 'Saat belirtirken saatin önüne “at” gelir.';
  if(next==='night')return '“Gece/geceleri” için kullanılan kalıp “at night”tır.';
  return 'Bu cümlede bulunulan yer “at” ile belirtilir: “at home”, “at work” gibi.';
 }
 if(word==='in')return /^(the )?(morning|evening|afternoon)/.test(after)?'Günün bu bölümü “in the morning/afternoon/evening” kalıbıyla söylenir.':'“In” burada bir yerin veya şeyin içinde bulunmayı belirtir.';
 if(word==='on')return /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/.test(after)?'Gün adlarının önünde “on” kullanılır.':'“On” burada bir yüzeyin üzerinde bulunmayı belirtir.';
 if(word==='after'&&/\blook(?:s|ed|ing)?$/.test(before))return '“Look after” birine bakmak veya onunla ilgilenmek demektir.';
 if(word==='of'&&/\b(heard|hear|hearing)$/.test(before))return '“Hear of” bir şeyin adını duymak veya varlığından haberdar olmak demektir.';
 if(word==='from')return '“From” nereden gelindiğini veya bir şeyin kaynağını belirtir.';
 if(word==='with')return '“With” burada “ile/birlikte” anlamını verir.';
 if(word==='by'&&next==='bus')return 'Ulaşım aracını söylerken “by bus” (otobüsle) kalıbı kullanılır.';
 if(['am','is','are','was','were'].includes(word)){
  const subject=at===0?t[at+1]:t[at-1];
  const continuous=/\b\w+ing\b/.test(after)&&!/^going to\b/.test(after);
  const form=['was','were'].includes(word)?'Geçmişte':continuous?'Devam eden zamanda':'Bu cümlede';
  if(continuous)return `${quoted(word)} yardımcı fiili, fiilin -ing biçimiyle birlikte kullanılır${subject&&pronouns.has(subject)?`; ${quoted(subject)} ile ${quoted(word)} gelir`:'.'}`.replace(/([^.!?])$/,'$1.');
  if(/going to\b/.test(after))return `Gelecek planı kurarken “${word} going to” kullanılır; “going to”nun önünde özneye uygun be fiili gerekir.`;
  return `${form} durum veya yer anlatılırken ${quoted(word)} kullanılır${subject&&pronouns.has(subject)?`; ${quoted(subject)} öznesine uygun biçim budur`:''}.`;
 }
 if(['do','does','did'].includes(word))return next==='not'||pronouns.has(next)||(/\?\s*$/.test(q.answer)&&at<3)?`${quoted(word)} bu ${/\?\s*$/.test(q.answer)?'sorunun':'olumsuz cümlenin'} yardımcı fiilidir; asıl fiil yalın biçimde kalır.`:'“Do” burada yapmak anlamındaki asıl fiildir.';
 if(['have','has'].includes(word)&&/\b(been|gone|done|seen|heard|finished|arrived|eaten|lived|got)\b/.test(after))return `Present Perfect, ${quoted(word)} + fiilin üçüncü biçimiyle kurulur.`;
 if(['have','has'].includes(word))return `${quoted(word)} burada sahip olmayı anlatır; he/she/it ile “has”, diğer öznelerle “have” kullanılır.`;
 if(['will','would','can','could','should','must','shall','cannot'].includes(word)){
  const meanings={will:'gelecek veya anlık karar',would:'bu cümledeki istek ya da geçmişten aktarılan gelecek',can:'yapabilme',could:'kibar rica veya yapabilme',should:'öneri',must:'zorunluluk',shall:'teklif',cannot:'yapamama'};
  return `${quoted(word)} ${meanings[word]} anlamı verir; ardından fiilin yalın biçimi gelir.`;
 }
 if(word==='not')return '“Not” cümleyi olumsuz yapar; çıkarıldığında anlam olumluya döner.';
 if(word==='a'||word==='an')return `Tekil sayılabilir bir isimden önce burada ${quoted(word)} gerekir${word==='an'?'; sonraki kelime ünlü sesle başladığı için “an” kullanılır':'; belirsiz bir kişiden veya şeyden söz ediliyor'}.`;
 if(word==='the')return 'Burada belirli olan kişi veya şeyden söz edildiği için önüne “the” gelir.';
 if(word==='her'&&next&&!aux.has(next)&&!['to','for','at','in','on','with','and','but','here','there','yesterday','today'].includes(next))return '“Her” burada kendisinden sonra gelen şeyin bir kadına ait olduğunu belirtir.';
 if(pronouns.has(word)){
  const meaning={i:'ben',you:'sen/siz',he:'o (erkek)',she:'o (kadın)',it:'o (nesne/durum)',we:'biz',they:'onlar',me:'beni/bana',him:'onu/ona (erkek)',her:'onu/ona (kadın)',us:'bizi/bize',them:'onları/onlara'};
  return `${quoted(word)} burada “${meaning[word]}” anlamındaki ${['me','him','her','us','them'].includes(word)?'nesne':'kişi'} zamiridir.`;
 }
 if(possessives.has(word))return `${quoted(word)} bu cümlede kime ait olduğunu belirtir.`;
 const link={because:'Nedeni belirtmek için “because” kullanılır.',so:'Sonucu bağlamak için burada “so” kullanılır.',but:'İki düşünce arasındaki karşıtlığı “but” bağlar.',if:'Koşul bildirmek için “if” kullanılır.',when:'“When” burada olayın gerçekleştiği zamanı bağlar.',while:'“While” iki olayın aynı sırada devam ettiğini belirtir.',until:'“Until”, beklenen olay gerçekleşene kadarki süreyi belirtir.',that:'“That” burada devamındaki cümleyi önceki fiile bağlar.'};
 if(link[word])return link[word];
 if(['say','said','tell','told'].includes(word))return /^(tell|told)$/.test(word)?'Söylenen kişi doğrudan belirtildiğinde burada “tell/told + kişi” kullanılır.':'“Say/said” söylenen söze odaklanır; kime söylendiği eklenecekse “to + kişi” kullanılır.';
 const gloss=q.glossary?.[word];return gloss?`${quoted(word)} burada “${gloss}” anlamını verir.`:'';
}

function replacementReason(edit,t,q){
 const {actual:a,expected:b,at}=edit;
 if(aux.has(b))return wordReason(b,at,t,q);
 if(sameVerb(a,b)&&!be.has(b)&&(verbs.has(root(b))||verbs.has(root(b)+'e'))){
  if(b.endsWith('ing')&&!['thing','something','anything','nothing','morning','evening'].includes(b)){
   if(/\b(?:am|is|are|was|were)\b/.test(t.slice(0,at).join(' ')))return `Devam eden hareket için yardımcı fiilden sonra -ing gerekir: ${quoted(b)}.`;
   return `Bu fiil kalıbında -ing biçimi kullanılır: ${quoted(b)}.`;
  }
  if(at>0&&t[at-1]==='to')return '“To”dan sonra fiilin yalın biçimi gelir.';
  if(['he','she','it'].includes(t[at-1])&&(b.endsWith('s')||b==='has'))return `Geniş zamanda bu özneyle fiil ${quoted(b)} biçimini alır.`;
  if(['have','has'].includes(t[at-1]))return `Have/has sonrasında fiilin üçüncü biçimi gerekir: ${quoted(b)}.`;
  const clause=t.slice(0,at).join(' ').split(/\b(?:when|while|because|if|until|that|where|so|but|and|before|after)\b/).at(-1);
  if(/\b(?:did|does|do|will|would|can|could|should|must|shall)\b/.test(clause))return `Yardımcı fiilden sonra yalın fiil gelir; ${quoted(b)} kullanılır.`;
  if(a.endsWith('ing')&&['know','need','want','believe','like'].includes(root(b)))return `Bu cümlede ${quoted(root(b))} bir durum anlatıyor; -ing yerine ${quoted(b)} kullanılır.`;
  if(b.endsWith('ed')||['went','came','saw','got','took','gave','left','made','told','said','thought','knew','heard','ate','drank','slept','wrote','bought','brought','forgot','met','spoke','ran'].includes(b))return `Geçmişte tamamlanan olay için fiilin geçmiş biçimi ${quoted(b)} kullanılır${a.endsWith('ing')?'; burada -ing gelmez':''}.`;
  if(a.endsWith('ing'))return `Burada -ing kullanılmaz; cümlenin istediği fiil biçimi ${quoted(b)}.`;
  return `Bu cümlede gereken fiil biçimi ${quoted(b)}${forms[root(b)]?.[2]===b||b.endsWith('ed')?'; geçmişte tamamlanan olayı anlatıyor':''}.`;
 }
 if(sameVerb(a,b)&&a.endsWith('s')!==b.endsWith('s'))return `Bu cümlede ismin ${b.endsWith('s')?'çoğul':'tekil'} biçimi ${quoted(b)} kullanılır.`;
 return wordReason(b,at,t,q);
}

export function explainAnswer(input,q){
 if(!input.trim()||answerMatches(input,q))return '';
 // Resolve 's / 'd against the target, without penalizing accepted contractions.
 let best;
 for(const s of ['is','has'])for(const d of ['would','had']){
  const actual=normalizeAnswer(input,s,d).split(' ').filter(Boolean),target=normalizeAnswer(q.answer,s,d).split(' ').filter(Boolean);
  const alignment=alignWords(actual,target);
  if(!best||alignment.cost<best.cost)best={...alignment,actual,target};
 }
 const {actual,target:t,edits}=best;
 // Same words in a different order: report the actual misplaced span.
 if(actual.length===t.length&&[...actual].sort().join(' ')===[...t].sort().join(' ')){
  let start=0,end=t.length-1;while(actual[start]===t[start])start++;while(actual[end]===t[end])end--;
  const reason=/\?\s*$/.test(q.answer)&&t.slice(start,end+1).some(w=>aux.has(w))?'Soruda yardımcı fiil özneden önce gelir.':/^(do you know|i know|i think)/.test(t.join(' '))?'İç cümlede özne fiilden önce gelir.':'Bu cümlede kelimeler bu sırayla kullanılır.';
  return `${quoted(actual.slice(start,end+1).join(' '))} yerine ${quoted(t.slice(start,end+1).join(' '))} sırası gerekir. ${reason}`;
 }
 return edits.map(e=>{
  if(e.kind==='missing'){const why=wordReason(e.expected,e.at,t,q);return `${quoted(e.expected)} koymayı unutmuşsun.${why?' '+why:''}`;}
  if(e.kind==='extra'){
   let why='';
   if(e.actual==='to'&&t[e.at]==='home')why='“Go/come/get home” kalıbında “home”dan önce “to” gelmez.';
   else if(e.actual==='to'&&/\b(let|made|make)\b/.test(t.slice(0,e.at).join(' ')))why='Let/make + kişi sonrasında fiil doğrudan yalın biçimde gelir.';
   else if(be.has(e.actual)&&!t.some(w=>be.has(w)))why='Bu eylem cümlesinde ayrıca be fiili kullanılmaz.';
   else if(['do','does','did'].includes(e.actual)&&/\b(?:know|think|said|told)\b.*\b(?:where|when|why|what|how)\b/.test(t.join(' ')))why='Bu iç cümlede soru düzeni kullanılmaz; özne fiilden önce gelir ve ayrıca do/does/did eklenmez.';
   return `${quoted(e.actual)} burada fazla.${why?' '+why:''}`;
  }
  const why=replacementReason(e,t,q);return `${quoted(e.actual)} yerine ${quoted(e.expected)} kullanmalısın.${why?' '+why:''}`;
 }).join('\n');
}
