"""Curated, short daily-life reading for Turkish-speaking A1/A2 learners."""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
STORIES=[
dict(id='coffee-stop',title='A Small Coffee',tr='Küçük bir kahve molası',level='A1',topic='Kafe',art='coffee',units=[4,9],lines=[
"Mina is on her way to work.|Mina işe gidiyor.",
"She has ten minutes before her bus comes.|Otobüsü gelene kadar on dakikası var.",
"There is a small cafe near the stop.|Durağın yakınında küçük bir kafe var.",
"She asks for a small coffee.|Küçük bir kahve istiyor.",
"The man at the counter smiles.|Tezgâhtaki adam gülümsüyor.",
"Do you want milk with that?|Süt ister misiniz?",
"Just a little, please, says Mina.|Azıcık olsun, lütfen, diyor Mina.",
"She pays by card and takes her coffee.|Kartla ödüyor ve kahvesini alıyor.",
"The bus is here, and she is ready.|Otobüs geldi; Mina da hazır."],questions=[
('Mina nereye gidiyor?',['To work','To the park','To a friend'],0,'İlk cümlede işe gittiği söyleniyor.'),
('Kahvesinde ne kadar süt istiyor?',['No milk','A little milk','A lot of milk'],1,'“Just a little” azıcık demek.'),
('Nasıl ödeme yapıyor?',['By card','With coins','She does not pay'],0,'“She pays by card” kartla ödediğini söylüyor.')]),
dict(id='spare-key',title='The Spare Key',tr='Yedek anahtar',level='A1',topic='Ev',art='my-day',units=[5,7],lines=[
"Ali is at his front door.|Ali evinin kapısında.",
"His keys are not in his bag.|Anahtarları çantasında değil.",
"He looks in his coat, but they are not there.|Montuna bakıyor ama orada da yoklar.",
"His sister lives next door.|Kız kardeşi yan dairede oturuyor.",
"She has a spare key to his flat.|Ali'nin evinin yedek anahtarı onda.",
"Ali calls her and waits outside.|Ali onu arayıp dışarıda bekliyor.",
"Two minutes later, she opens the door.|İki dakika sonra kardeşi kapıyı açıyor.",
"His keys are on the kitchen table.|Anahtarları mutfak masasının üzerinde.",
"Ali laughs and puts them in his bag.|Ali gülüyor ve anahtarları çantasına koyuyor."],questions=[
('Yedek anahtar kimde?',['His sister','His boss','His friend'],0,'Kız kardeşinin evin yedek anahtarı var.'),
('Kız kardeşi nerede oturuyor?',['In another city','Next door','Above a shop'],1,'“Next door” yan dairede anlamına geliyor.'),
('Ali anahtarlarını nerede buluyor?',['In his coat','On the kitchen table','At work'],1,'Anahtarlar mutfak masasının üzerinde.')]),
dict(id='corner-shop',title='At the Corner Shop',tr='Köşedeki markette',level='A1',topic='Alışveriş',art='new-job',units=[4,7],lines=[
"Deniz needs some bread and milk.|Deniz'in ekmek ve süt alması gerekiyor.",
"The shop on her street is still open.|Sokağındaki market hâlâ açık.",
"She takes a bag from the kitchen.|Mutfaktan bir çanta alıyor.",
"At the shop, she finds the bread.|Markette ekmeği buluyor.",
"There is no milk in the fridge.|Dolapta süt yok.",
"The woman in the shop brings a new box.|Marketteki kadın yeni bir kutu getiriyor.",
"Here you are, she says.|Buyurun, diyor.",
"Deniz buys two bottles and goes home.|Deniz iki şişe alıp eve gidiyor.",
"Now she can make breakfast.|Artık kahvaltı hazırlayabilir."],questions=[
('Deniz ilk başta ne almak istiyor?',['Bread and milk','Rice and tea','Coffee and cake'],0,'İlk cümlede ekmek ve süt gerektiği söyleniyor.'),
('Sütü kim getiriyor?',['Deniz','The woman in the shop','Her sister'],1,'Marketteki kadın yeni bir kutu getiriyor.'),
('Deniz kaç şişe süt alıyor?',['One','Two','Three'],1,'“Two bottles” iki şişe demek.')]),
dict(id='new-neighbor',title='A New Neighbor',tr='Yeni komşu',level='A1',topic='Tanışma',art='my-day',units=[1,6],lines=[
"Someone is at the door.|Kapıda biri var.",
"It is a new neighbor with a big box.|Büyük bir kutu taşıyan yeni komşu gelmiş.",
"Hi, I am Alex. I live upstairs.|Merhaba, ben Alex. Üst katta oturuyorum.",
"Mina smiles and says her name.|Mina gülümsüyor ve adını söylüyor.",
"Alex asks her about the nearest shop.|Alex ona en yakın marketi soruyor.",
"It is next to the cafe, she says.|Kafenin yanında, diyor Mina.",
"She offers him a glass of water.|Ona bir bardak su ikram ediyor.",
"They talk for a few minutes.|Birkaç dakika sohbet ediyorlar.",
"Alex thanks her and carries his box upstairs.|Alex teşekkür edip kutusunu üst kata taşıyor."],questions=[
('Alex nerede oturuyor?',['Upstairs','Across the city','At the cafe'],0,'“I live upstairs” üst katta oturuyorum demek.'),
('Alex neyin yerini soruyor?',['The nearest shop','The bus station','The kitchen'],0,'Alex en yakın marketi soruyor.'),
('Mina ona ne ikram ediyor?',['Coffee','A glass of water','Some bread'],1,'Mina bir bardak su ikram ediyor.')]),
dict(id='lunch-break',title='Lunch in the Park',tr='Parkta öğle molası',level='A1',topic='İş ve mola',art='family-picnic',units=[8,10],lines=[
"It is one o'clock, and Ali is hungry.|Saat bir; Ali acıkmış.",
"He takes his lunch to the park.|Öğle yemeğini parka götürüyor.",
"His friend Sam is sitting on a bench.|Arkadaşı Sam bir bankta oturuyor.",
"There is a place next to him.|Yanında boş bir yer var.",
"Ali sits down and opens his bag.|Ali oturup çantasını açıyor.",
"He has a cheese sandwich and an apple.|Peynirli bir sandviçi ve bir elması var.",
"Sam has some soup in a cup.|Sam'in bardağında çorba var.",
"They eat and talk about their day.|Yemek yiyip günlerinin nasıl geçtiğini konuşuyorlar.",
"Then they walk back to work together.|Sonra birlikte işe geri dönüyorlar."],questions=[
('Ali yemeğini nereye götürüyor?',['To the park','To a shop','To Sam’s house'],0,'Ali öğle yemeğini parka götürüyor.'),
('Ali ne yiyor?',['Soup','A cheese sandwich and an apple','Bread and milk'],1,'Çantasından peynirli sandviç ve elma çıkarıyor.'),
('Moladan sonra nereye gidiyorlar?',['Back to work','To a cafe','Home'],0,'“Back to work” işe geri dönmek demek.')]),
dict(id='quiet-evening',title='A Quiet Evening',tr='Sakin bir akşam',level='A1',topic='Ev',art='rainy-day',units=[8,10],lines=[
"It is raining outside.|Dışarıda yağmur yağıyor.",
"Deniz is at home with her brother.|Deniz erkek kardeşiyle evde.",
"He is making tea in the kitchen.|Kardeşi mutfakta çay hazırlıyor.",
"She is looking for a good film.|Deniz güzel bir film arıyor.",
"They do not want to go out tonight.|Bu akşam dışarı çıkmak istemiyorlar.",
"Her brother brings two cups of tea.|Kardeşi iki fincan çay getiriyor.",
"Deniz finds a short, funny film.|Deniz kısa ve komik bir film buluyor.",
"They sit on the sofa and watch it.|Kanepeye oturup filmi izliyorlar.",
"Sometimes a quiet evening is just right.|Bazen sakin bir akşam tam da ihtiyacın olan şeydir."],questions=[
('Dışarıda hava nasıl?',['It is raining','It is sunny','It is snowing'],0,'İlk cümlede yağmur yağdığı söyleniyor.'),
('Deniz’in kardeşi ne hazırlıyor?',['Coffee','Tea','Dinner'],1,'Kardeşi mutfakta çay hazırlıyor.'),
('Nasıl bir film seçiyorlar?',['A long film','A scary film','A short, funny film'],2,'Deniz kısa ve komik bir film buluyor.')]),
dict(id='missed-bus',title='The Bus I Missed',tr='Kaçan otobüs',level='A2',topic='Yolda',art='london-weekend',units=[15,16],lines=[
"Yesterday, Mina left home a little late.|Dün Mina evden biraz geç çıktı.",
"She ran to the bus stop, but the bus was gone.|Durağa koştu ama otobüs gitmişti.",
"The next one was in twenty minutes.|Sonraki otobüse yirmi dakika vardı.",
"She sent a message to her boss.|Patronuna mesaj gönderdi.",
"I am sorry. I missed the bus, she wrote.|Kusura bakmayın, otobüsü kaçırdım, diye yazdı.",
"Then she saw a small bakery across the street.|Sonra sokağın karşısındaki küçük fırını gördü.",
"She bought a warm roll and a bottle of water.|Küçük, sıcak bir ekmek ve bir şişe su aldı.",
"An older woman was also waiting for the bus.|Yaşlı bir kadın da otobüs bekliyordu.",
"They talked, and the time passed quickly.|Sohbet ettiler; zaman çabucak geçti.",
"Mina got to work late, but she was not upset.|Mina işe geç vardı ama canı sıkkın değildi."],questions=[
('Mina neden işe geç kalıyor?',['She missed the bus','She lost her phone','She was ill'],0,'Patronuna otobüsü kaçırdığını yazıyor.'),
('Sonraki otobüse ne kadar var?',['Ten minutes','Twenty minutes','An hour'],1,'“In twenty minutes” yirmi dakika sonra demek.'),
('Beklerken kiminle sohbet ediyor?',['Her boss','An older woman','The driver'],1,'Durağa gelen yaşlı kadınla sohbet ediyor.')]),
dict(id='first-day',title='My First Day',tr='Yeni işte ilk gün',level='A2',topic='İş ve mola',art='new-job',units=[15,17],lines=[
"Ali started a new job on Monday.|Ali pazartesi yeni bir işe başladı.",
"He was nervous when he walked into the office.|Ofise girerken heyecanlı ve biraz gergindi.",
"A woman called Sara showed him his desk.|Sara adında bir kadın ona masasını gösterdi.",
"There was a small plant next to the computer.|Bilgisayarın yanında küçük bir bitki vardı.",
"Sara explained the work slowly and answered his questions.|Sara işi yavaşça anlattı ve sorularını cevapladı.",
"At lunchtime, she invited him to eat with the team.|Öğle molasında onu ekiple yemek yemeye çağırdı.",
"Ali did not know anyone, but everyone was friendly.|Ali kimseyi tanımıyordu ama herkes sıcak davrandı.",
"In the afternoon, he finished his first small task.|Öğleden sonra ilk küçük işini bitirdi.",
"He still had a lot to learn.|Daha öğreneceği çok şey vardı.",
"But on the way home, he felt much better.|Ama eve dönerken kendini çok daha iyi hissediyordu."],questions=[
('Ali yeni işine ne zaman başlıyor?',['On Monday','On Friday','At the weekend'],0,'İlk cümlede pazartesi başladığı söyleniyor.'),
('Sara ona nasıl yardımcı oluyor?',['She explains the work','She drives him home','She gives him a phone'],0,'Sara işi anlatıp Ali’nin sorularını cevaplıyor.'),
('Ali günün sonunda nasıl hissediyor?',['Much better','Very angry','More nervous'],0,'Son cümlede kendini çok daha iyi hissettiği söyleniyor.')]),
dict(id='rainy-walk',title='One Umbrella',tr='Bir şemsiye, iki kişi',level='A2',topic='Yolda',art='rainy-day',units=[15,18],lines=[
"Deniz was walking home when it started to rain.|Yağmur başladığında Deniz eve yürüyordu.",
"She looked in her bag for her umbrella.|Şemsiyesini bulmak için çantasına baktı.",
"It was still at home, next to the door.|Şemsiye evde, kapının yanında kalmıştı.",
"A neighbor was standing outside the little bookshop.|Bir komşusu küçük kitapçının önünde duruyordu.",
"He had a large umbrella and saw Deniz in the rain.|Büyük bir şemsiyesi vardı; Deniz’i yağmurun altında gördü.",
"We are going the same way, he said.|Aynı yöne gidiyoruz, dedi.",
"They walked together and talked about the neighborhood.|Birlikte yürüyüp mahalle hakkında sohbet ettiler.",
"Deniz learned that he had a new puppy.|Deniz onun yeni bir yavru köpeği olduğunu öğrendi.",
"They reached their building before the rain got heavier.|Yağmur şiddetlenmeden binalarına vardılar.",
"The next day, Deniz put the umbrella in her bag.|Ertesi gün Deniz şemsiyesini çantasına koydu."],questions=[
('Deniz’in şemsiyesi nerede?',['At home','At work','In her coat'],0,'Şemsiye evde, kapının yanında kalmış.'),
('Komşusu nerede duruyor?',['Outside a bookshop','At the bus stop','In the park'],0,'Komşusu küçük kitapçının önünde duruyor.'),
('Komşusunun yeni neyi var?',['A new car','A puppy','A bicycle'],1,'“A new puppy” yeni bir yavru köpek demek.')]),
dict(id='wrong-order',title='That Is Not My Lunch',tr='Siparişte küçük bir karışıklık',level='A2',topic='Kafe',art='coffee',units=[16,23],lines=[
"Sam ordered a chicken sandwich at a busy cafe.|Sam kalabalık bir kafede tavuklu sandviç söyledi.",
"When his food arrived, it was a cheese sandwich.|Yemek geldiğinde peynirli sandviç olduğunu gördü.",
"He checked the menu and then called the waiter.|Menüye bakıp garsonu çağırdı.",
"Excuse me, I ordered the chicken sandwich, he said.|Affedersiniz, tavuklu sandviç söylemiştim, dedi.",
"The waiter looked at the plate and apologized.|Garson tabağa baktı ve özür diledi.",
"He took it back and brought the right sandwich.|Onu geri götürüp doğru sandviçi getirdi.",
"He also brought a glass of water.|Bir bardak su da getirdi.",
"Sam thanked him and enjoyed his lunch.|Sam teşekkür edip yemeğini yedi.",
"Sam felt better after the conversation.|Sam konuşmadan sonra kendini daha iyi hissetti.",
"It was a small mistake, and his food was good.|Küçük bir hataydı; yemeği de güzeldi."],questions=[
('Sam ne sipariş ediyor?',['A cheese sandwich','A chicken sandwich','A bowl of soup'],1,'Sam tavuklu sandviç sipariş ediyor.'),
('Karışıklığı nasıl çözüyor?',['He asks politely','He leaves the cafe','He calls a friend'],0,'Sam garsona nazikçe durumu anlatıyor.'),
('Garson sandviç dışında ne getiriyor?',['A cup of tea','A glass of water','A piece of cake'],1,'Garson bir bardak su da getiriyor.')]),
dict(id='saturday-plan',title='A Different Saturday',tr='Cumartesi planı değişince',level='A2',topic='Hafta sonu',art='family-picnic',units=[15,17,28],lines=[
"Mina and Ali planned to have a picnic on Saturday.|Mina ve Ali cumartesi piknik yapmayı planladı.",
"They bought bread, cheese, tomatoes, and some fruit.|Ekmek, peynir, domates ve biraz meyve aldılar.",
"On Saturday morning, the sky was dark.|Cumartesi sabahı gökyüzü kapalıydı.",
"Then it started to rain, so they changed their plan.|Sonra yağmur başladı; onlar da planı değiştirdi.",
"We can have our picnic here, said Ali.|Pikniğimizi burada yapabiliriz, dedi Ali.",
"They put a blanket on the living room floor.|Salonun zeminine bir örtü serdiler.",
"Mina opened the window to hear the rain.|Mina yağmurun sesini duymak için pencereyi açtı.",
"They ate their food and played a simple game.|Yemeklerini yiyip basit bir oyun oynadılar.",
"The day was different, but it was still fun.|Gün farklı geçti ama yine de eğlenceliydi.",
"But they had a good time anyway.|Ama yine de güzel vakit geçirdiler."],questions=[
('İlk planları ne?',['A picnic','A film at the cinema','A trip to the city'],0,'Cumartesi piknik yapmayı planlıyorlar.'),
('Planlarını neden değiştiriyorlar?',['Ali is ill','It starts to rain','The shop is closed'],1,'Yağmur başladığı için plan değişiyor.'),
('Sonunda nerede yemek yiyorlar?',['In the living room','At a cafe','In the park'],0,'Örtüyü salonun zeminine serip orada yemek yiyorlar.')]),
dict(id='phone-call',title='A Call Before Dinner',tr='Yemekten önce bir telefon',level='A2',topic='Arkadaşlar',art='london-weekend',units=[15,23,27],lines=[
"Deniz called her friend before she started cooking.|Deniz yemek yapmaya başlamadan arkadaşını aradı.",
"They last met a few weeks ago.|En son birkaç hafta önce görüşmüşlerdi.",
"Her friend was moving to a new flat nearby.|Arkadaşı yakındaki yeni bir eve taşınıyordu.",
"The kitchen was full of boxes, so she could not cook.|Mutfak kutularla doluydu; yemek yapamıyordu.",
"Come over for dinner, said Deniz.|Akşam yemeğine gelsene, dedi Deniz.",
"I am making soup, and there is enough for two.|Çorba yapıyorum; ikimize de yeter.",
"Her friend arrived with some bread from the bakery.|Arkadaşı fırından aldığı ekmekle geldi.",
"They ate at the small kitchen table.|Küçük mutfak masasında yemek yediler.",
"After dinner, they made a plan to move the boxes.|Yemekten sonra kutuları taşımak için plan yaptılar.",
"Sometimes helping a friend starts with a simple phone call.|Bazen bir arkadaşına yardım etmek basit bir telefonla başlar."],questions=[
('Deniz arkadaşını ne zaman arıyor?',['Before cooking','After dinner','At midnight'],0,'Yemek yapmaya başlamadan arıyor.'),
('Arkadaşı neden yemek yapamıyor?',['Her kitchen is full of boxes','She has no bread','She is at work'],0,'Taşındığı için mutfağı kutularla dolu.'),
('Arkadaşı gelirken ne getiriyor?',['Some bread','Some soup','A cake'],0,'Fırından ekmek alıp geliyor.')])]

# The dictionary is supplied separately so every visible word can be checked.
def main():
 dictionary=json.loads((ROOT/'scripts/dictionary.json').read_text(encoding='utf-8'))
 stories=[];missing=set()
 for i,src in enumerate(STORIES):
  s={k:v for k,v in src.items() if k not in ['lines','questions']}
  s['order']=i+1;s['sentences']=[]
  for line in src['lines']:
   en,tr=line.split('|');s['sentences'].append({'en':en,'tr':tr})
   for w in re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)?",en):
    if w.lower() not in dictionary:missing.add(w.lower())
  s['text']=' '.join(x['en'] for x in s['sentences']);s['audio']=hashlib.sha256(s['text'].encode()).hexdigest()[:16]
  s['wordCount']=len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?",s['text']))
  s['minutes']=max(4,round(s['wordCount']/35)+2)
  s['questions']=[{'id':f'{s["id"]}-q{n+1}','prompt':q[0],'options':q[1],'answer':q[2],'why':q[3]} for n,q in enumerate(src['questions'])]
  stories.append(s)
 if missing:raise SystemExit('Missing dictionary: '+', '.join(sorted(missing)))
 for word,value in dictionary.items():value['audio']=hashlib.sha256(value.get('en',word).encode()).hexdigest()[:16]
 data={'version':1,'voice':'Caro Davy · Pocket TTS','stories':stories,'dictionary':dictionary}
 (ROOT/'content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(f'{len(stories)} stories; {sum(s["wordCount"] for s in stories)} words; {len(dictionary)} dictionary entries')
if __name__=='__main__':main()
