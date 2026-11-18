# Niksar–Çamiçi sürekli 3D yol

11.412,331 m güzergâh; 1.107 tam panoramadan çıkarılan GPS ve görünüm referansları. Three.js 0.170.0 + JavaScript; statik HTTP(S) ile `/surus/` adresinden çalışır. Ham panorama arşivi yerelde kalır; siteye yalnızca analiz, düşük boyutlu kırpım kaplamaları ve temsili küçük referanslar yüklenir.

## Kullanım

W/↑ gaz, S/↓ fren; basılı tutulunca durduktan sonra otomatik geri, A-D/←→ direksiyon, Boşluk el freni, R aracı yol üzerinde toparlama, F takip kamerasını arkaya alma. Fare sürükleme üçüncü şahıs kamerayı döndürür; tekerlek yakınlaştırır. Kilometre seçici aracı o bölüme götürür. Sekme/odak kaybında fizik duraklatılır; devamda momentum korunur.

## Referans ve tahmin

- Yatay merkez çizgisi: 1.107 panorama GPS noktası, yaklaşık 12 m yumuşatma, 2 m örnekleme. Yol genişliği tahmini 6,6 m, banket tahmini 0,65 m.
- Düşey profil: panorama metadatasındaki ham yüksekliklerin yumuşatılmış göreli farkları; ölçülmüş yol kotu, yerel datum veya fotogrametrik yüzey değildir. Kamera ile zemin yüksekliği aynı kabul edilen referanstan takip edilir. Başlangıç–bitiş göreli farkı yaklaşık +680 m.
- Tüm 1.107 fotoğrafta gökyüzü ve araç altı dışındaki bantlarda beyazlık/renk ve bitki örtüsü için basit renk eşikleri kullanıldı. 100 m civarı yumuşatılmış kar, yeşillik, yoğunluk, zemin ve asfalt renk profilleri sahneye uygulanır. Bunlar yaklaşık sezgisel sınıflandırmalardır, semantik model veya ölçüm değildir.
- Asfalt, toprak ve kar kaplamaları gerçek fotoğraf kırpımlarından türetilmiştir. Tüm arazi, ağaç, çalı, kaya ve bina geometri ve yerleşimleri tahminidir. Başlangıçtaki yaklaşık bina kütleleri görsel referanslardaki yerleşim karakterini temsil eder; tek tek gerçek yapıların rekonstrüksiyonu değildir.
- Panoramalar skybox veya geçiş arka planı olarak kullanılmaz. Gökyüzü düz renk ve sistir. Teknik renkler turkuaz yüzeyleri ve turuncu tahmini nesneleri ayırır; `userData.provenance` ve `route/analysis.json` / `route/route.json` kaynak kaydını taşır.

## N100 profili

- Yolun tamamı tek sürekli BufferGeometry; banketler kesintisiz iki şerit.
- Çevre 160 m bölümler halinde, en fazla 7 etkin ve 14 önbellekte bölüm; uzaktaki bölümler kaldırılır ve GPU instance tamponları serbest bırakılır.
- Ağaçlar, dallar, çalılar, kayalar ve yapılar InstancedMesh ile ortak geometri kullanır. Uzak yapraksız ağaçların ince dalları çizilmez.
- Ekonomik profil başlangıçta en fazla 800×500, düşük FPS halinde 640 genişliğe kadar otomatik çözünürlük azaltma; gerçek zamanlı gölge, MSAA, postprocess ve yüksek boyutlu panorama GPU yüklemesi yoktur. Normal profil daha yüksek çözünürlük sunar.
- Canlı panel FPS, etkin/önbellekteki bölüm sayısı, üçgen ve draw call değerlerini gösterir. Test bilgisayarı Intel N100 / Intel UHD Graphics olarak doğrulandı; performans görünür bölge ve diğer uygulamalara göre değişir.

## Kontroller

`check-full-road.mjs`: tüm kaynaklar, güzergâh sürekliliği, 6,6 m genişlik, tüm bölüm dikişleri, kameranın yakın yol hesabı, başlangıç/bitiş sınırları, kuru/karlı profil.
`check-full-world.mjs`: güzergâh boyunca bölüm üretimi, sonlu geometri, yukarı bakan asfalt normalleri, etkin/önbellek sınırları, kaynak serbest bırakma, teknik görünümün yeni bölümlerle uyumu.
Tarayıcı: WASD hareketi, 3/6/9 km ve bitiş seçimi, shader/WebGL hata kayıtları.

Fotoğraflar © Google; 1.106 adet Mart 2026, bir adet Temmuz 2024 referansı. Three.js MIT lisansı `vendor/THREE-LICENSE.txt` içindedir.

Güzergâh uçlarındaki gökyüzü boşluğunu kapatan zemin etekleri, örneklenen yolun dışındaki tahmini arka plan geometrisidir; kamera güzergâh sınırını aşmaz.

## Araba fiziği

cannon-es 0.20.0 RaycastVehicle, 1.150 kg dinamik gövde, 9,81 m/s² yerçekimi, dört yay-sönümleyicili tekerlek, motor kuvveti, hava ve yuvarlanma direnci, hıza bağlı direksiyon sınırı. Gaz ve fren lastik normal yükü/tutuş kapasitesiyle sınırlıdır; kar ve toprak daha az tutar. Fizik sabit 60 Hz, görüntü kare hızından ayrı çalışır. Fren impulslu kuvvetleri fizik adımına göre ölçeklenir.

Araç yol rayına kilitlenmez; yoldan çıkabilir, kayabilir ve devrilebilir. Yol çarpışmaları görsel yolun 2 m istasyonlarını paylaşan, örtüşmeyen kesintisiz üçgen yüzeylerle; yol dışı zemin üçgen meshlerle yaklaşık temsil edilir. Yakın ağaç gövdeleri, kayalar ve tahmini yapı kütleleri katı çarpışma gövdeleridir. İnce dallar ve çalılar için çarpışma yoktur. Asfalt üzerindeyken pahalı gövde/üçgen temasları filtrelenir; yol dışına çıkınca etkinleşir. Bu basitleştirilmiş lastik/süspansiyon modelidir; deformasyon veya ayrıntılı aktarma organı modeli yoktur.

Araç modeli hafif geometrilerden oluşturulmuştur. Gerçek zamanlı gölge yerine basit temas gölgesi vardır. Lisans: vendor/CANNON-LICENSE.txt. Testler: check-car.mjs (gaz/fren/geri vites, direksiyon, yokuş, katı engel, düşük kar tutuşu, kare hızı tutarlılığı); check-car-road.mjs (beş kilometrede dört teker desteği ve sınırlı çarpışma gövdesi sayısı).

## Sürüş güncellemesi

Normal grafik varsayılandır; N100/Eko elle seçilebilir. Hızlı direksiyon tepkisi, Ackermann ön teker açıları, ön/arka ayrı fren dağılımı, yay-sönümleyici ayarı ve viraj denge çubukları kullanılır. Akslar ve süspansiyon kolları teker hareketini görsel olarak izler. Yakın navigasyon gerçek araç konumu ve yönüyle döner.

Yol, banket ve arazi ortak 2 m istasyon ızgarasını kullanır; kenar etekleri ve örtüşme boşlukları kapatır. route/signs.json, fotoğraflarda kontrol edilmiş 49 viraj, bozuk yol, viraj dizisi ve sollama yasağı levhasını içerir. Levha konumları, boyutları ve yönleri yaklaşık; tüm gerçek tabelaların eksiksiz envanteri değildir.


## 18 Kasım 2026 düzeltmesi

Fizik 60 Hz, araç ve takip kamerası aynı ara değerli gövde pozunu kullanır; tekerleklerin yerel pozu da bu gövdeye taşınır. Üst üste gelen 4 m yol kutuları, yolun gerçek istasyonlarını paylaşan üçgen şeritlerle değiştirildi.

Navigasyon tüm 11,41 km güzergâhı tutar, kalan yolu mavi gösterir; hıza göre ölçeklenir. “Tüm güzergâh” düğmesi kuzey yukarı genel görünümü açar. Kalan süre mevcut hızdan yaklaşık hesaplanır, trafik verisi değildir.

`route/junctions.json`: Mart 2026 panorama arşivinin doğrudan bağlantı grafiğinde bulunan ve fotoğrafları kontrol edilen 6 ayrım: 65,669; 511,872; 3202,767; 8707,885; 10685,212; 11381,075 m. Yan yolların yatay noktaları panorama GPS verisinden; genişlik ve yükseklikleri tahminidir. Yalnız bir komşu noktanın bulunduğu 2 ayrımda görünür yan yol uzantısı yaklaşık 55 m boyunca tahminle uzatılır. Kaynakta doğrulanmayan yön levhaları eklenmez. Önceki 12 simülasyon yön tabelası ve güzergâh sonu yazı levhası kaldırıldı. Panorama bağlantısı olmayan bütün tali yolların eksiksiz envanteri henüz doğrulanmamıştır.

Doğrulama: `node surus/tests/check-car.mjs`, `node surus/tests/check-car-road.mjs`, `node surus/tests/check-surus.mjs` (depo kökünden). Altı kesimde gaz altında teker teması / düşey sıçrama, 6 ayrım / uydurma levha bulunmaması, navigasyon son noktası ve genel görünüm kontrol edilir.

Mobil: güvenli ekran kenarları, dinamik ekran yüksekliği, ayrı sol direksiyon / sağ pedal alanları, açılır ayarlar paneli ve küçük yatay ekran düzeni. Aynı anda direksiyon ve gaz dokunuşları pointer capture ile bağımsız tutulur; iptal/odak kaybı kontrolleri bırakır.

Araç oranları: gövde ölçeği 0,88, 0,38 m teker yarıçapı, 2,20 m aks mesafesi ve 1,60 m iz genişliği. Fizik çarpışma gövdesi de küçültüldü. Daha kısa ve sönümlü süspansiyon, ön/arka 2,2/2,45 asfalt tutuşu, hıza ve zemine göre yanal ivme sınırından türeyen direksiyon açısı. Kar/toprak tutuş farkı ve el freniyle kayma korunur. `node surus/tests/check-handling.mjs`: iki yönde 29/50/79 km/sa virajları, teker teması ve sarsıntı sonrası süspansiyonun yatışması.

Direksiyon tepkisi: önceki yanal ivme temelli sert sınır yerine hızla yumuşak azalan, yüksek hızlarda önceki açı sınırının en fazla 1,8 katına izin veren ayar ve 16/s tepki. Lastik sürüklenmesi testi, normal viraj geometrisinin ağırlık merkezinde oluşturduğu yanal hızı kayma sanmamak için arka aks temas hızını kullanır.

Navigasyon: 132–138 px, %18 panel arka planı, ince rota vurgusu ve zamana bağlı yön/zoom yumuşatması. OpenStreetMap standart raster zemini gerçek başlangıç enlem/boylamıyla dünya koordinatlarına yerleştirilir. Yalnız görünür alanın kutuları istenir; tarayıcının HTTP önbelleği kullanılır, çevrimdışı ön indirme yoktur. Atıf haritada görünürdür. Ağ yoksa GPS rota çizgisi kalır. Haritada yan yolların tahminle uzatılmış çizgileri yerine kaynak GPS noktaları kullanılır. `node surus/tests/check-navigation-map.mjs`: GPS/harita dönüşümü, karo sınırları ve sınırlı görünür alan.


## Fotoğraflı ayrım ve kayıtsız yarış denemesi

Kullanıcının iki fotoğrafı SIFT özellikleriyle yerel panorama 425 (`oqeedQzx2d71jD6bdOY3Gw`, 4.356,739 m) ile eşleştirildi. Doğrudan panorama bağlantı grafiğinde olmayan bu kol, OpenStreetMap 170854514 numaralı yolunun ilk yaklaşık 248 metresinden eklendi (© OpenStreetMap contributors, ODbL). Yolun birleşimi ana GPS çizgisinde 4.329,48 m'de hizalanır. “Güvenli 3 / BAŞÇİFTLİK” sağ ok levhası ve sol viraj şevronu fotoğrafla doğrulanmıştır; boyut/kot/kenar konumu yaklaşık modellenir. Menüde bu ayrım için kilometre seçeneği vardır. Diğer ayrımlara kaynaksız levha eklenmez.

Başlat: 3–2–1 geri sayımı; 11,400 km'de damalı finiş yüzeyi ve oyun finiş kemeri; çizgiyi ileri yönde yol üzerinde geçince süre durur. Kilometre seçerek atlama antrenman sayılır, finiş süresi kaydedilmez. Finiş kemeri gerçek yol tabelası değildir, yarış grafiğidir.

Birlikte oyna: başlangıç ekranında “Arkadaşınla oyna” bölümünden oda oluştur, bağlantıyı arkadaşına gönder; o kodla katılınca oda sahibi ortak yarışı başlatır. İki oyuncu, hesap/kayıt yok. Mavi araç arkadaşındır. İki araç ayrı yerel fiziğe sahiptir; bu denemede birbirleriyle çarpışmaz. Oda sahibinin sayfası açık kalmalıdır. WebRTC/PeerJS 1.5.5 kullanılır; yalnız bağlantı kurulurken PeerJS Cloud ve varsayılan STUN/TURN hizmetleri kullanılır. Oyun konumları veri kanalıyla yaklaşık 10 Hz aktarılır. Bu statik sayfaya Python sunucusu veya yeni kalıcı backend eklenmedi. Oda kodları sekmelik ve rastgeledir; hesap veya kalıcı oyuncu veritabanı yoktur. Ağ arızası ve dolu/bulunamayan oda kullanıcıya bildirilir. Saat farkı ping/pong ile tahmin edilir.

Kontrol: `node surus/tests/check-race-room.mjs` (iki taraflı protokol, senkron başlatma, paket doğrulama, tekrarlı paket atma, ayrılma, geri sayım ve bitiş); `node surus/tests/check-landmark-finish.mjs` (doğrulanmış 7 ayrım, tabela yazısı, finiş yüzeyi). Gerçek PeerJS sinyal sunucusunda OPEN yanıtı alındı. İki gerçek tarayıcı/telefonla uçtan uca görsel test, bağlı tarayıcı bulunmadığı için yapılamadı.
