# V2 deney öncesi model önerisi ve sabit deney planı

Bu belge ilk V2 deneyinden **önce** yazıldı. Hiçbir hedef rejim payı belirlenmedi. Tüm siyasi katsayılar hâlâ varsayımdır; yöntem kaynakları bunları ampirik olarak doğrulamaz. Eski model/sınıflandırma arşivlenir ve sonuçları silinmez. Yeni sürüm araştırma adayıdır, doğrulanmış toplumsal model değildir.

## Yapısal düzeltmeler
1. Makro endeksler clip ile toplanmaz. Her x için kazanım/kayıp akışları kullanılır:
   `a=k*sigmoid(u+e); b=k*(1-sigmoid(u+e)); x'=(1-a-b)*x+a`.
   k∈(0,1); dolayısıyla [0,1] ileriye değişmezdir. x=0 iken artış a>0; x=1 iken azalış b>0. Sonlu itki altında iki sınır da içeri yönelir. Donmuş itki için tek denge sigmoid(u), özdeğer 1-k. u durumlara bağlıyken çoklu denge ve kararsızlık mümkündür; ayrıca incelenir. Sigmoid tek başına 'düzeltme' sayılmaz; yüksek itki yine sınıra yakın durumlar yaratabilir. Tam ve yaklaşık sınır payları ayrıca raporlanacak.
2. İdealler Beta(2,2) ile türlerin tümünde .5 merkezli, heterojendir. Güvenlik birimleri doğuştan otoriter, vatandaşlar doğuştan demokrat varsayılmaz. Türler kaynak, kurumsal norm, eylem ve çıkar ağırlıklarıyla ayrışır. Bu değişiklik demokrasi/otoriterlik için eşit sonuç olasılığı garantisi değildir.
3. Mikro kaynaklar sınırsız pozitif ekleme yerine k=.06 hızında türün gelir/güç/özerklik koşullarına bağlı sigmoid hedefe döner. Etmen sertliği k=.025 ile kişisel ideal, kariyer rantı ve protesto geri beslemesine tepki verir. Değişen tercih/sertlik makro karara yansır.
4. Ekonomi, çatışma ve kurumsal meşruiyet için üç ayrı, işaretli baskı süreci: H'=.94H+olay+.06N. Yarı ömür ln(.5)/ln(.94)=11.20 ay. Krizler yalnızca bir ay değil sonraki aylar da hedefleri etkiler. Her gösterge ayrıca bağımsız N(0,.18) itki yeniliği alır. Özgürlük/bağımsızlık/güven birbirine eşitlenmez.
5. Olaylar, liderlik, mikro etkileşim ve makro yenilikler ayrı sabit tohum akışları kullanır. Şok kapatma karşılaştırmasında aynı ayların olay çekilişleri ve bağımsız makro yenilikleri korunur; gerçekleşen durumlar farklılaşabilir. Ana tohum 2026+i; diğer akışlar +10000019, +20000033 ve +30000047.

## Endojen özetler
A=.7 seçili lider sertliği + .3 kaynak/ittifak ağırlıklı elit sertliği.
D=vatandaş/muhalefet ortalama özgürlük tercihi.
F=fraksiyon tercihlerinin standart sapmasının iki katı.
B=işletme kaynak ortalaması; J=yargı normu; Q=yargı kaynağı; S=ordu/polis kaynak ortalaması.
G=(1-W)*(.4+.6*(1-L)) mahrumiyet.
P=sigmoid(-2+2.5G+F+.8H_p) protesto basıncı; her ay Bernoulli(P) olay olarak kaydedilir, beklenen basınç kurallarda kullanılır.
R=A*C*S baskı kapasitesi/kullanımı; E=F*(1-T) elit rekabeti; K=L*I*(1-C) hesap verebilirlik.
Dönemsel ekonomik etki sin(2πt/period+phase); period~U(48,96), phase~U(0,2π). Bunlar veri kalibrasyonu değildir.

## Altı ayrı itki denklemi
Sıra C,L,V,W,T,I; H_e ekonomik, H_v çatışma, H_p siyasi baskı.

u_C = 3(2C−1)+2.2(2A−1)−1.8*r(2I−1)−.8(2D−1)+1.1H_p+.9V+.7(E−.3)−K
u_L = 2.5(2L−1)−2.2(2C−1)+1.2(2I−1)+.8(2D−1)−1.2R−.6H_p
u_I = 2.4(2I−1)−2(2C−1)+1.2*r(2J−1)+.6K−.8CA+.5(2Q−1)−.5H_p
u_V = −3+1.5G+1.5F(1−I)+2.8H_v+1.7RP+3V−1.5*conflict_resolution*I*T−S
u_W = .4+(2B−1)+.5I−.4V−.4CA−1.4H_e+.5cycle
u_T = .2+1.2(2W−1)+(2L−1)−1.5V−.8R−.5F+.25(2ort_etmen_güveni−1)

k=(.055,.060,.140,.060,.050,.045). Endekslerin farklı uyum hızları yöntem varsayımıdır. self_feedback parametresi C,L,I'nin ilk terimlerini çarpar (varsayılan 1). conflict_resolution varsayılan 1. leader_bias başlangıç sertlik logitine 4*bias ekler (eski bias'ın sayısal etkisiyle doğrudan eşdeğer değildir). resilience=r varsayılan 1.

## Olaylar ve mikro kurallar
Aylık ekonomik kriz .012: H_e+.9. Kıtlık .006: H_e+.8, H_v+.3. Dış müdahale .004: H_e+.3, H_v+.9. Elit bölünmesi .008: H_p+.8. İlk üç olay olasılığı shock_scale ile çarpılır. Lider değişimi .008+.012K; aday seçiminde kaynak, ittifak ve D'ye mesafe kullanılır; yeni görevli strateji ideali yeniden Beta(2,2) çekilir. Dağılımlar gerçek Fransa sıklıkları değildir.

Her ay etmenler rastgele sırada bir eşle görüşür. Mesafe <.25 ittifak; >.55 kopuş (simetrik). Tercih güncellemesi (.975p+.025peer) yakın eşte; uzak eşte (.995p+.005peer); bunun ardından .01 ile kişisel ideal ve refah/özgürlük deneyimine bağlı hedefe uyum. Bütün güncellemeler konveks karışım olduğu için ek clip gerekmez. Güven hedefi sigmoid(.4+1.3(2T−1)+.5(2W−1)−1.2V+.15N), hız .04. Sertlik hedefi sigmoid(logit(kişisel sertlik ideali)+.8(C−.5)(1−norm)−.8P*norm), hız .025. Kaynak hedefi aşağıdaki rol getirilerinin sigmoididir, hız .06: vatandaş 1.2(W−.5)+.3(L−.5)−.5V; işletme 1.6(W−.5)−.7V; ordu/polis (C−.5)−.4V; yargı 1.4(I−.5); bürokrasi (W−.5)+.6(I−.5); muhalefet 1.2(L−.5); lider/fraksiyon 1.2(C−.5)+.8(1−norm)C. Bütün rollere başlangıç kaynak ortalamasının logiti ve N(0,.10) eklenir.

## Önceden sabitlenen deneyler
- İlk dört başlangıç vektörü V1 ile aynı. Her senaryo için 100 bağımsız tohum, 240 geçiş. Aynı tohumlar senaryolar arasında eşleştirilir.
- Rejim eşikleri V1 ile birebir aynı; sınıflara eşit pay dayatılmaz. Sıfır sayılı sınıflar grafikte korunur. Son 12 ay ortalaması ve ay 240 değerleri ayrı gösterilir.
- Ana 100 deney için medyan ve %10–90 yolları, 240. ay rejim dağılımı ve Wilson Monte Carlo aralıkları; her yörünge ayrıca seçilebilir.
- Tek etkenli tarama: resilience .5/1.5, shock_scale 0/1.5, leader_bias −.25/+.25, self_feedback .5/1.5, conflict_resolution .5/1.5. Her varyant 100 tohum. Tek etkenli analiz etkileşimleri tüketmez.
- Ayrı stres deneyi: Parçalanma, shock_scale=3, conflict_resolution=.5; 100 tohum. Bu senaryo daha çok çatışma varsayar; ürettiği çatışma ampirik bulgu değildir.
- Donmuş mikro özetlerle beklenen makro haritanın çoklu başlangıçlardan sabit noktaları; kısıtlı Jacobian spektral yarıçapı. Bu sonuç tam ABM kararlılık ispatı değildir. Tam sistem için son 60 ay oynaklığı, yaklaşık/tam sınır payları ve tohumlar arası yayılım raporlanır.
- Ana eşiklere ±.05 otoriterlik eşik duyarlılığı; temel sınıflandırma değiştirilmez. 20 yıl uzun dönem limitine eşitlenmez.

## Başarı ve başarısızlık ölçütleri
Yazılım açısından tekrarlanabilirlik, [0,1] değişmezliği, sınırdan içeri hareket, şokların kalıcılığı, ayrı rastgelelik akışları ve sınıflandırma doğrulanacak. Hangi rejimin kaç kez çıktığı test başarı ölçütü değildir. Yeni model yalnızca tek sınıf üretirse o sonuç olduğu gibi raporlanacak. Çeşitlilik elde etmek için yeniden katsayı seçilmeyecek. Ampirik kalibrasyon, yapı belirsizliği ve gerçek veriyle validasyon yapılmadığından V2 için de gerçek dünya güvenilirliği iddia edilemez.
