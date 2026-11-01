// Explain the reference sentence, never grade or compare the learner's draft.
export function sentenceExplanation(q){
 const s=q.answer.toLowerCase().replace(/[’]/g,"'").replace(/\bi'm\b/g,"i am").replace(/\b(he|she|it)'s\b/g,"$1 is").replace(/\b(we|you|they)'re\b/g,"$1 are");
 const intro=`“${q.hint}” anlamında kullanılıyor.`;
 let why=q.why;
 if(/\b(am|is|are|'m|'s|'re)\s+going to\b/.test(s))why='Önceden düşünülen bir plan anlatılıyor. Özneye uygun “am/is/are” ardından “going to” ve fiilin yalın hâli gelir.';
 else if(/\b(was|were)\b.*\w+ing\b/.test(s))why='Geçmişte o sırada devam eden bir iş anlatılıyor. “Was/were” ile fiilin “-ing” hâli birlikte kullanılır; başka bir olay bu işin sırasında olmuş olabilir.';
 else if(/\b(?:am|is|are)\b.*\w+ing\b|\b(?:i'm|he's|she's|it's|we're|you're|they're)\b.*\w+ing\b/.test(s))why='Şu anda veya bu dönemde devam eden, bazen de sadece bugüne özel bir iş anlatılıyor. Bu yüzden özneye uygun “am/is/are” ve fiilin “-ing” hâli birlikte gelir.';
 else if(/\b(did|didn't)\b/.test(s))why='Geçmişte yapılan bir iş soruluyor veya yapılmadığı söyleniyor. Geçmiş anlamını “did/didn’t” taşıdığı için asıl fiil yalın hâlde kalır.';
 else if(/\b(was|were|wasn't|weren't)\b/.test(s))why='Geçmişteki bir durum, duygu veya bulunulan yer anlatılıyor. “I/he/she/it” ile “was”, “you/we/they” ile “were” kullanılır.';
 else if(/\b(will|won't)\b|\w'll\b/.test(s))why='Geleceğe yönelik bir karar, söz veya tahmin anlatılıyor. “Will” ardından fiilin yalın hâli gelir; “won’t”, “will not” demektir.';
 else if(/\b(can|can't|could|couldn't|should|shouldn't|must|mustn't)\b/.test(s))why='“Can” yapabilmeyi veya izin istemeyi, “could” kibar ricayı, “should” tavsiyeyi, “must” gerekliliği anlatabilir. Cümledeki bu yardımcıdan sonra fiil “to” almadan yalın hâlde gelir.';
 else if(/\b(there is|there's|there are)\b/.test(s))why='Bir yerde bir şeyin var olduğu söyleniyor. Tek bir şey için “there is”, birden fazla şey için “there are” kullanılır.';
 else if(q.unit===8||q.unit===9||q.unit===11)why=/\b(do|does|don't|doesn't)\b/.test(s)?'Düzenli yapılan bir iş veya genel durum soruluyor ya da olumsuz söyleniyor. “He/she/it” için “does/doesn’t”, diğer özneler için “do/don’t” kullanılır; asıl fiil yalın kalır.':'Bir alışkanlık, düzenli yapılan iş veya genel durum anlatılıyor. “I/you/we/they” ile fiil yalın kalır; “he/she/it” ile olumlu cümlede fiile genellikle “-s” eklenir.';
 if(/\btak(?:e|es|ing|took) the bus\b/.test(s))why+=' “Take the bus” otobüsle gitmek demektir; burada “take” almak anlamında kullanılmıyor.';
 if(/\b(wait(?:ing|s|ed)? for|listen(?:ing|s|ed)? to|look(?:ing|s|ed)? for|think(?:ing|s)? about)\b/.test(s))why+=' Buradaki fiil ve edat birlikte anlam taşır; edatı Türkçede ayrı bir kelimeyle çevirmek gerekmeyebilir.';
 return `${intro} ${why}`;
}
