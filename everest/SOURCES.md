# Everest yürüyüş prototipi

Bu sürüm Lukla → Phakding → Monjo → Namche Bazaar → Tengboche → Dingboche → Lobuche → Gorak Shep → Everest Ana Kampı yürüyüşünü kapsar. Zirve, Khumbu Icefall ekipman fiziği, bina, ip, merdiven ve köprü modelleri içermez. Yaklaşık 30 m arazi örnekleri, dar patikalar veya köprü tabliyeleri için yeterli değildir.

## Gerçek veri

- **Arazi:** [Mapzen Terrain Tiles / AWS Open Data](https://registry.opendata.aws/terrain-tiles/), Terrarium PNG, zoom 12. Kaynak URL: `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png`. Zoom 12'de x=3031…3038, y=1713…1722. 2048×2560 signed int16 little-endian mozaik, metre cinsinden. Kaynak yükseklikleri bir metreye yuvarlanmıştır; yatay çözünürlük Lukla civarında yaklaşık 34 metredir. [Kaynak atıf ve lisansları](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). Nepal bölgesinde SRTM ve veri sağlayıcıları. Arazi ve kamera aynı mozaikten örneklenir; göz hizasında çizilen ağın yüksekliği de hesaba katılır. Çizim, yararlı kaynak çözünürlüğünde durur. Mozaik dışındaki dünya bu bölgesel uygulamanın kapsamı dışındadır.
- **Patika:** © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0. 22 Kasım 2026 Overpass sorgusu; 1040 patika parçasından oluşturulan bağlı grafikte ara duraklar üzerinden en kısa yürünebilir bağlantı. `route.json` 2776 koordinat ve 9 durak içerir; yaklaşık 54 km. Bu türetilmiş rota veritabanı ODbL 1.0 altında aynı dosyadan indirilebilir. Bazı köy duraklarına gidiş ve aynı yoldan geri dönüş vardır; rota ilerlemesi sıralı yol uzunluğuyla hesaplanır.
- **Uydu:** Esri World Imagery, Esri/Maxar/Earthstar Geographics ve ilgili sağlayıcılar. İnternet bağlantısıyla yüklenir, arazi verisi ise aynı siteden sunulur. [Servis bilgisi](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Cesium'un kaynak atıfları ekranda korunur.
- **Motor:** Sitedeki `/ucus/cesium/` yolundan CesiumJS 1.142.0. API anahtarı veya sunucu uygulaması gerektirmez. WebGL destekleyen modern tarayıcı gerekir.

## Oyun kuralları

Birinci şahıs serbest yürüyüş, sürükleyerek bakış, WASD/ok tuşları ve dokunmatik joystick. Otomatik yürüyüş gerçek OSM koordinatlarını takip eder. Tempo 1/5/20/80 katıdır; temel hız 1,4 m/s. Enerji mesafeye göre azalır, kar senaryosu yürüyüşü yavaşlatır ve tüketimi artırır. Mola enerjiyi yeniler. Basınç göstergesi standart atmosfer yaklaşımıdır, kandaki oksijen veya sağlık ölçümü değildir. Hava seçenekleri senaryodur; canlı hava servisi yoktur.

İlerleme `everest-v1` anahtarıyla tarayıcının yerel depolamasında tutulur. Depolama engellenirse uyarı gösterilir ve yürüyüş oturum içinde sürer. Yenileme sonrası yürüyüş kendiliğinden başlamaz. Işınlanma enerji veya yürünen mesafeyi artırmaz. Fiziksel iPhone/iPad cihaz testi yapılmadı; responsive arayüz tarayıcıda kontrol edildi.

Gerçek sefer planlaması veya navigasyon için uygun değildir.

## Çizim sınırı

Arazi örnekleri göz hizası için daha ince bir ağa enterpole edilir; bu işlem yeni coğrafi ayrıntı üretmez. Cesium 1.142'nin quadtree rafinasyonu 15. seviyede sınırlandırılır. Motorun normal geometrik hata ve etek yüksekliği hesapları korunur; bunları sıfırlamak uydu seçimini ve arazi parçası birleşimlerini bozabilir. Kamera, hem yüklenmiş yükseklik örneğini hem ekranda çizilen araziye aşağı yönlü ışın kesişimini kontrol eder. Cesium sürümü değiştirilirse bu sınırlandırmanın yeniden doğrulanması gerekir.
