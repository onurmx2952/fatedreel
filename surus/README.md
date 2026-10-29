# 100 metre sürekli 3D yol

Three.js 0.170.0, JavaScript modülleri. `/surus/` HTTP(S) üzerinden açılır.

## Kamera

WASD ile yere göre hareket, Shift hızlı hareket, Q/E göz yüksekliği, sürükleme veya isteğe bağlı pointer lock ile bakış. Kare süresine bağlı hareket, üstel hız yumuşatma, normalize çapraz hareket, odak kaybında tuş temizleme; araç veya sürüş fiziği yok. Yol tek sürekli BufferGeometry şerididir; arka plan panorama içermez.

## Veri ve tahmin

Mevcut kaynaklar önceki denemenin 5 panoraması (0–51,6 m). Kullanıcının belirttiği 11 dosyanın tamamı henüz sağlanmadı. Fotoğraflardan küçük asfalt/kar/toprak kırpımları kaplama olarak kullanılır. Ağaç tipleri, yoğunluk, kış renkleri ve yol karakteri görsel olarak yaklaşık değerlendirilmiştir. Kalibre kamera/ölçek veya fotogrametri yoktur. 6,6 m yol genişliği, viraj, yükselti ve her nesnenin konumu tahminidir. 51,6–100 m prosedürel uzatmadır. Gerçek fotoğraftan ölçülmüş 3D bölge yoktur.

`scene/analysis.json` renk örnekleri ve parametreleri kaydeder. Her mesh'in `userData.provenance` alanı `geometry: estimated`, `appearance: photo-texture | generated` ve kaynak bilgisini içerir. Teknik renk düğmesi aynı ayrımı sahnede gösterir. Bu renkler herhangi bir geometrinin ölçülmüş olduğunu iddia etmez.

## Performans

Ekonomik profil en fazla 960×600 çizim tamponu, MSAA/postprocess/gerçek zamanlı gölge yok; 256–512 piksel kaplamalar, 2× anizotropi, tek yön ışığı + hemisphere. Gövde/dal/çalı/kaya ortak geometrileri InstancedMesh ile çizilir. Yaklaşık 66 bin görünür üçgen, ~28 draw call (bakışa bağlı). FPS, draw call, üçgen ve tampon boyutu canlı paneldedir. Intel N100 üzerinde fiziksel performans testi yapılmadı; FPS garantisi yoktur.

Three.js MIT lisansı `vendor/THREE-LICENSE.txt` içindedir. Görsel kaynak © Google, Mart 2026, önceki geçici örnekten.
