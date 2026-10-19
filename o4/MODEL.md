# Devrimden Sonra 20 Yıl — önceden tanımlanan model v1

## Kapsam ve mimari
2026 başlangıç etiketi gerçek bir olay veya tahmin değildir. Varsayımsal Fransa'da merkezi iktidar devrimci koalisyona geçmiştir. Bölgesel coğrafya, AB/NATO kararları ve gerçek nüfus temsil edilmez. Bütün başlangıç değerleri, katsayılar ve olay olasılıkları **varsayımdır**, ampirik tahmin değildir. Model açıklayıcı bir düşünce deneyi olarak kullanılmalıdır.

Katmanlar: Mesa Model/Agent -> aylık mikro etkileşim -> makro geri besleme -> aylık kayıt -> bağımsız tohumlu deneyler -> sınıflandırma/duyarlılık -> Streamlit. Başlangıç gözlemi ay 0, ardından 240 geçiş; deney başına 241 kayıt. 100 bağımsız tohum: base_seed + deney_no. Senaryolar arası karşılaştırmalar aynı tohumları kullanır; bu eşleştirme farklı senaryoları bağımsız örneklem yapmaz.

## Etmenler
120 vatandaş, 5 fraksiyon, 3 lider, 2 ordu, 3 polis, 6 bürokrasi, 4 yargı, 12 işletme, 5 muhalefet etmeni. Her etmenin [0,1] aralığında kaynak, güven, özgürlük tercihi ve sertlik eğilimi vardır. Türler farklı tercih/kaynak dağılımlarından çekilir. Vatandaşlar refah ve özgürlüğe; işletmeler kaynak ve istikrara; güvenlik birimleri düzen ve güce; yargı kurumsal özerkliğe; muhalefet katılıma; lider/fraksiyonlar koalisyon nüfuzuna tepki verir. Bu eğilimler özcü veya ampirik iddialar değildir.

Her ay rassal sırada her etmen rastgele bir eşle görüşür. Tercih mesafesi < .25 ise karşılıklı ittifak kurar, > .55 ise mevcut ittifak kopar. Yakın görüşler .04, uzak görüşler -.01 hızında yakınsar/uzaklaşır. Güven, genel güvene .03 hızında; şiddete -.025 tepki verir. Kaynak değişimi .025(refah-.5)-.02 şiddet + U(-.008,.008). İşletmeler refaha .015, güvenlik iktidar yoğunlaşmasına .012, yargı bağımsızlığa .012, muhalefet özgürlüğe .012 ek kaynak tepkisi verir. Liderler 12 ayda bir koalisyon ağırlığına göre seçilir. Dışsal lider değişimi ayrıca mümkündür.

## Aylık denklemler
clip tüm sonuçları [0,1]'e sınırlar. C yoğunlaşma, L özgürlük, V şiddet, W refah, T güven, I bağımsızlık. A kaynak ağırlıklı lider/ittifak destekli sertlik, D vatandaş/muhalefet özgürlük tercihi, S ordu/polis güven ve kaynak çarpımının ortalaması, P protesto, F fraksiyon kutuplaşmasıdır.

C' = clip(C + .035(A-.5) + .025 V + .018 P S - .035 I D + N(0,.008))
L' = clip(L + .035 I D - .030 C A - .020 P S + N(0,.008))
I' = clip(I + resilience*(.6-C)*.035 - .020 C A + N(0,.006))
V' = clip(.90 V + .045 P(1-L) + .035 F(1-T) + şok_şiddeti - .025 T I)
W' = clip(W + .018(.65-W) + .012 T + .008 işletme_kaynağı - .025 V - .012 C(1-I) + şok_refahı + N(0,.006))
T' = clip(T + .020(W-.5) + .012 L I - .025 V - .010 P + N(0,.006))
P ~ Bernoulli(clip(.015 + protest_scale*(1-W)*(1-T)*.22)).

Olaylar bağımsız aylık Bernoulli: ekonomik kriz .012 (W -.14); kıtlık .006 (W -.10, V +.035); dış müdahale .004 (W -.06, V +.08); lider değişimi .008 (liderin sertliği yeniden U[0,1]). shock_scale ilk üç olasılığı çarpar. Bunlar gözlenen sıklıklar değildir. Şoklar aynı ay birleşebilir. Denklemler güncelleme öncesi durumu kullanır.

## Başlangıç senaryoları (C,L,V,W,T,I)
Devrim: (.55,.50,.15,.55,.42,.45).
Uzlaşma: (.35,.65,.08,.60,.60,.65).
Parçalanma: (.65,.35,.28,.42,.28,.25).
Kurumların devamı kontrolü: (.30,.75,.04,.65,.60,.75).
Kontrol karşı-olgusalı bütün diğer mekanizmaları korur; devrim etkisinin nedensel tahmini değildir.

## Önceden kayıtlı sınıflandırma
Son 12 ayın ortalamalarıyla, sırayla: iç savaş V>=.60; otoriter C>=.70 ve L<=.35 ve I<=.35; demokrasi C<=.45 ve L>=.65 ve I>=.60 ve V<.20; kırılgan yönetim I<.30; aksi halde hibrit. Sınıflar gerçek rejim indekslerine eşlenmemiştir. Otoriterlik sınırlarında ±.05 alternatif eşikler ayrıca araştırılabilir; ana sınıflama sonuca göre değiştirilmez.

## Deney ve doğrulama
Varsayılan 100 x 240 ay. Monte Carlo sınıf payı için Wilson %95 aralığı; bu aralık model belirsizliği değil tohum değişkenliğidir. Duyarlılık: resilience, shock_scale, protest_scale, leader_bias için tek-etken düşük/yüksek değişimler, aynı tohumlarla eşleştirilmiş otoriterlik payı farkı; etkileşimleri veya nedenselliği ölçmez. Alternatif başlangıç ve kontrol deneyleri de 100 tohumla yapılabilir. Model doğrulama: sınır/sonluluk, kayıt sayısı, deterministik tekrar, tohum farkı, ittifak simetrisi, sınıf eşikleri ve sıfır şok testi. Ampirik validasyon yapılmamıştır; gelecek çalışma: veri kalibrasyonu, global duyarlılık, yapı belirsizliği, nüfus büyüklüğü yakınsaması.

## Uygulama ayrıntıları ve sayısal sınırlamalar
A, kaynak*(1+ittifak sayısı)+.01 ağırlıklı lider/fraksiyon sertlik ortalaması ile seçili liderin sertliğinin yarı yarıya karışımıdır. F bu grubun tercih standart sapmasının iki katıdır (clip). S güvenlik etmenlerinin bireysel güven*kaynak ortalamasıdır. B işletmelerin ortalama kaynağıdır. Lider değişimi olayı mevcut lider makamının yeni kişinin sertliğiyle temsil edilmesidir; kimlik yenileme modeli değildir. Diğer liderler koalisyonda kalır.

Bütün makro endeksler clip nedeniyle 0/1 sınırında yığılabilir. Bu, gerçek toplumda kesin demokrasi veya kesin çöküş anlamına gelmez; pozitif geri besleme ve sınırlandırma yapısının ürünüdür. Sınırdaki gözlem payı doğrulama raporunda gösterilir. Şiddet endeksi ölüm sayısına çevrilemez. Aylık geçişlerin takvim etiketi ilk ay Ocak 2026, son ay Aralık 2045'tir; ay 0 iktidarın ele geçirildiği başlangıç anıdır.

Başlangıç kaynakları ve tercihleri ROLES tablosundaki tür ortalamaları etrafında sırasıyla N(ortalama,.14) ve N(ortalama,.17) dağılımlarından clip ile üretilir. Güven N(başlangıç toplumsal güveni,.15), sertlik clip(1-tercih+N(0,.12)+lider_bias) şeklindedir; bias yalnızca lider ve fraksiyonlara uygulanır. Kodda ROLES ikinci ve üçüncü değerleri bu ortalamaları içerir. Başlangıç ittifakları boştur. Mikro güncellemeler sıralı olduğundan aynı ay daha sonra etkinleşen etmen önceki güncellemeleri görebilir. Makro güncellemeler ise eşzamanlıdır. Her etmen kimliği kalıcıdır; doğum, ölüm ve göç modellenmez. Türler PoliticalAgent sınıfında rol kurallarıyla temsil edilir.
