# V1 matematik denetimi — model değiştirilmeden

## Sonuç ve kapsam
Zaman çizgisi **seçilen tek deneyi** gösterir; 100 deney ortalaması değildir. Deneyler bölümündeki rejim grafiği 100 sonucun dağılımıdır. Aynı 2026–2125 tohumlarıyla değişmeden tekrar: **89 demokrasi, 10 otoriter, 1 kırılgan yönetim, 0 hibrit, 0 iç savaş**. Bu, gerçek Fransa'nın geleceğine ilişkin olasılık değildir. Devrimin otoriterlikle sonuçlanacağı yönünde test edilmiş bir başlangıç hipotezim yoktu; önceki metinler böyle bir izlenim veriyorsa bu çıkarım geçersizdir.

İtiraz doğrulandı: **89/100 deneyde** C≤.01, L≥.99, T≥.99 ve I≥.99 birlikte görülüyor. Bu koşulun ilk gerçekleşme ayının medyanı **75**. Bu pay '80. aydan sonra her ay aynı durumda kalan 89 deney' demek değildir; ilk varış ve sonraki kalış payları audit.json dosyasında ayrı ölçülmüştür.

80–240. aylardaki bütün deney/ay gözlemlerinin tam 0 veya 1 sınırındaki payları:

| Endeks | Sınırdaki gözlem |
|---|---:|
| İktidar yoğunlaşması | %92,79 |
| Özgürlükler | %93,55 |
| Siyasal şiddet | %85,66 |
| Refah | %74,37 |
| Güven | %90,14 |
| Bağımsızlık | %94,52 |

V1 kaynak kodu, SHA256 özeti ve eski sonuçları research/v1 altında donduruldu. audit_v1.py yalnızca clip girişlerini gözlüyor; hesaplama kurallarını değiştirmiyor. Tekrar üretilen aylık kayıtlar eski results/monthly.csv ile 1e-13 toleransla doğrulandı.

## 1. Değişkenler neden sınırlara gidiyor?
D=vatandaş/muhalefet özgürlük talebi; A=koalisyon sertliği. I arttığında C azalıyor; C azaldığında I daha da artıyor. L ve T de I ile birlikte artıyor. Bu döngüye karşı kurum eskimesi, hükümet rantı, bağımsız çıkar çatışması veya yüksek refahın azalan getirisi yeterince eklenmemiş.

Bağımsızlık denkleminin beklenen aylık artışı:

`ΔI = .035*r*(.6-C) - .020*C*A`

Bu artış **I değerini hiç içermiyor**. I=.99 iken de I=.3 iken de aynı miktar ekleniyor. Sıfır artış eğrisi `C*=.021*r/(.035*r+.020*A)`; A=.6 ve r=1 için C*=.4468. C bunun altında kaldığında I sürekli yükseliyor. L ve T'de de 1'e yaklaşınca kazancı azaltacak (1-L)/(1-T) çarpanları yok.

Donmuş A=.6, D=.65, S=.2, F=.3, B=.8 ve beklenen olay sıklıkları altında 'iyi köşe' `(C,L,V,W,T,I)=(0,1,0,1,1,1)` için kırpılmadan önce aylık beklenen artışlar:

- C: −.019196
- L: +.022690
- V: −.024470
- W: +.009580
- T: +.021850
- I: +.021000

Hepsi köşeden **dışarı** itiyor. Model dengeli olduğu için değil, clip dışarı taşan değerleri köşeye geri kestiği için orada kalıyor.

## 2. Pozitif/negatif geri besleme dengesi
V'de .90 katsayısı bir sönüm var; refahta .018(.65-W) bir dönüş var. Ancak W için T=1, B=.8, C=V=0 iken kırpılmamış beklenen denge **1.5322**. Yani refahın negatif geri beslemesi bile izin verilen aralığın dışında bir hedef oluşturuyor. B=1 olursa hedef 1.6211.

L'deki olumlu terim .035ID, olumsuz terim .030CA. Başlangıç C=.55, I=.45, D=.6564, A=.5773 kullanıldığında (protesto hariç) yaklaşık +.0008 net özgürlük artışı var; I yükseldikçe bu üstünlük güçleniyor. Varsayılan vatandaş tercihi .65 ve muhalefet .80 olduğu için demokratik talep başlangıçta nötr değil.

T yükselince protesto olasılığı .015 tabanına düşüyor. Bu, daha az protesto → daha çok güven → daha az protesto döngüsü yaratıyor. Refah yüksekken işletme kaynakları her ay ilave pozitif akış alıyor ve 1'e gidiyor. Bağımsız ekonomik çevrim, kaynak tükenmesi ve dağılım çatışması yok.

## 3. Değişkenler bağımsız mı?
Hayır; aralarında geri besleme kurulması zaten amaçlanmıştı. Fakat farklı endekslerin ayrı olması, ayrı mekanizmalarla açıklanabildiği anlamına gelmiyor. 80–240. ay gözlemlerinde C ile L korelasyonu −.9675, C ile I −.9760. Bunlar farklı rejim kümeleri ve zamanla ortak geçişlerden de etkilenir; korelasyon nedensellik/özdeşlik kanıtı değildir.

Yargı, bürokrasi ve işletme davranışları makro kararlarda yetersiz temsil ediliyor. Etmen tercihi değişirken sertlik çoğunlukla ilk değerde kalıyor; yalnızca lider değişimi olayı bunu yeniliyor. 'Fikir değiştirme' ile iktidar stratejisi arasında açık ve tutarlı bağ eksik.

## 4. clip etkisi
clip tek başına uçları zorunlu kılmaz; **dışarı yönlü sürüklenmeyle birleşmesi** esas sorun. Denetim 24.000 gerçek aylık güncellemenin kırpılmadan önceki değerlerini kaydetti. Örneğin L güncellemelerinin %60,26'sı 1'in üstüne, C güncellemelerinin %64,15'i 0'ın altına taşıyor.

Gürültü olduğundan sınırlar matematiksel olarak kesin soğurucu değil; Normal dağılım yeterince büyük karşı yönlü adımlar üretebilir. Ancak I için iyi köşedeki +.021 sürüklenme .006 standart sapmanın 3.5 katıdır; tek adımda içeri dönme olasılığı yaklaşık .00023. Sınırdan ayrılınca sonraki sürüklenme yeniden dışarı iter. 'Neredeyse sabitlenme' doğru ifadedir.

## 5. Krizler neden rejimi değiştirmiyor?
Şoklar yalnızca W/V'ye tek aylık darbe vuruyor. I/L/C üzerinde kalıcı stres, borç, örgütsel hasar veya çıkar koalisyonu değişimi yok. İyi köşede güven/bağımsızlık darbeyi telafi ediyor; kriz refahı düşürse de refahın yukarı sürüklenmesi devam ediyor. Şok olasılığı çarpanı **sıfır** yapıldığında aynı 100 tohumda toplam rejim dağılımı yine **89/10/1**. Bu, her yolun/etmenin aynı olduğu anlamına gelmez. Rastgele olay incelemeleri tanımlayıcıdır; tohum eşleşmesi tek başına nedensellik sağlamaz.

## 6–7. Demokratik ayrıcalık ve otoriter erişilebilirlik
V1 demokrasiyi tek zorunlu sonuç yapmıyor. Önceki sabit eşiklerle parçalanma başlangıcında 94/100 otoriter sonuç; leader_bias +.25 varyantında 83/100 otoriter sonuç var. Fakat bu **eşit olasılık**, ampirik denge veya adalet göstermez. İyi ve kötü köşelerin çekim havzaları seçilen başlangıç ve katsayılara bağlı.

Örtük demokratik avantajlar: varsayılan vatandaş tercihleri .65; kurumlar C<.6 iken kendiliğinden onarılıyor; yüksek güven şiddeti doğrudan negatif terimle sıfırlıyor; kurumlar kusursuzlaştıkça yeni çıkar çatışması üretmiyor. Örtük otoriter avantajlar da var: C=1 iken I'ye sürekli negatif sürüklenme; düşük W kaynakları ve güveni sürekli aşındırıyor. Bu nedenle model büyük ölçüde iki kutuplu uçlara ayrışıyor; gerçekçi rejim çeşitliliği kanıtlanmış değil.

## 8. Sabit noktalar ve kararlılık
Tam stokastik 160 etmenli sistemin zamanla değişmeyen tek bir deterministik haritası yoktur. A,D,S,F,B etmenlerle değişir. Bu yüzden aşağıdaki analiz yalnızca **etmen özetleri donmuşken beklenen altı değişkenli makro kapanışı** inceler; tam ABM için kararlılık kanıtı olarak sunulamaz.

A=.35,.60,.85; D=.65,S=.2,F=.3,B=.8 sabitlenip beklenen şok/protesto terimleriyle [0,1]^6 üzerinde çoklu başlangıç araması yapıldı. Bulunan köşeler:

- İyi köşe `(0,1,0,1,1,1)`: tek taraflı, kısıtlı bölge Jacobian spektral yarıçapı 0. Kırpılan harita bir komşulukta yerel olarak sabit.
- Kötü köşe `(1,0,.21605,0,0,0)`: spektral yarıçap .9. Şiddet boyutu dışında koordinatlar kırpılıyor.

Her üç A değeri için iki çekici bulundu. Bu arama bütün iç sabit noktaları veya bütün parametre uzayını tüketmez. Köşe türevi 0 olması 'çok gerçekçi ve güvenilir denge' değil, clip'in yerel düzleştirme etkisidir. Hangi havzaya girildiği başlangıç, tercih dağılımı ve liderliğe duyarlı. Eski tek etken taraması ve dondurulmuş Jacobian değerleri audit_results/audit.json içinde.

## Güvenilirlik hükmü
Kodun sınır ve tekrar üretim testlerinden geçmesi, toplumsal mekanizmaların geçerli olduğunu göstermiyor. **V1 bu haliyle rejim olasılıklarını araştırma bulgusu olarak yorumlamaya uygun değil.** Gözlenen kusursuz demokrasi, bu denklemler/sınırlandırma altında ortaya çıkan yapısal bir üründür. Daha önce sınır yığılmasını yalnızca sınırlama notuyla belirtmem yeterli değildi; açık bir model kusuru olarak raporlanmalıydı.

Bir sonraki modelde hedef sonuç yüzdeleri seçilmeyecek, eski sınıflandırma sabit tutulacak, uçlara yapay yığılma ile gerçek kararlılık ayrı ölçülecek. Yeni modelin daha dengeli görünmesi ampirik olarak daha doğru olduğunu kanıtlamaz.

## Yöntem kaynakları
Bu kaynaklar siyasi katsayıları doğrulamaz; model dokümantasyonu, validasyon ve duyarlılık yaklaşımı içindir:
- Grimm ve ark. (2020), ODD: https://www.jasss.org/23/2/7.html
- Windrum, Fagiolo ve Moneta (2007), ampirik validasyon: https://www.jasss.org/10/2/8.html
- ten Broeke, van Voorn ve Ligtenberg (2016), duyarlılık yöntemleri: https://www.jasss.org/19/1/5.html

### Kapanışın kesinlik sınırı
Donmuş makro analizinde Bernoulli olayları ortalamalarıyla değiştirilmiş, Gauss yenilikleri sıfırlanmıştır. clip(E[X]) ile E[clip(X)] genel olarak eşit değildir. Bu nedenle verilen köşeler stokastik zincirin tam beklenen geçişinin sabit noktaları olarak da sunulmaz; deterministik ortalama-terimli kapanışın sabit noktalarıdır. V2 için sigmoid(E[u]) ile E[sigmoid(u)] farkı aynı nedenle geçerlidir.
