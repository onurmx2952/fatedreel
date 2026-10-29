# Niksar–Çamiçi sürekli 3D yol

11.412,331 m güzergâh; 1.107 tam panoramadan çıkarılan GPS ve görünüm referansları. Three.js 0.170.0 + JavaScript; statik HTTP(S) ile `/surus/` adresinden çalışır. Ham panorama arşivi yerelde kalır; siteye yalnızca analiz, düşük boyutlu kırpım kaplamaları ve temsili küçük referanslar yüklenir.

## Kullanım

WASD hareket, fareyle sürükleme veya isteğe bağlı pointer lock ile bakış, F yola hizalama, Q/E göz yüksekliği, Shift 2× hız. Yürüyüş / keşif / hızlı keşif hızı seçilebilir. Kilometre seçici ve kaydırıcı açıkça istenen konuma gider; olağan kamera hareketinde panorama veya konum atlaması yoktur. Araba / sürüş fiziği eklenmemiştir.

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
