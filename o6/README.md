# yakında · /o6

Statik HTML/CSS/JS ve Leaflet 1.9.4; Cloudflare Pages Function `/api/o6` ile çalışır. Build adımı veya tarayıcı API anahtarı gerekmez.

- `GET /api/o6?lat=39.8952&lng=32.8785&radius=100`
- `GET /api/o6?mode=geocode&q=Büyükesat%20Ankara`
- Yarıçaplar: 50, 100 (varsayılan), 250, 500 metre.
- Sunucu filtreleri: Haversine mesafesi ≤ yarıçap; rating ≥ 4.5; review count ≥ 100. Eksik puan/sayım elenir.
- İşletme türü bir eleme kriteri değildir. Genel keşif sorgularına kişisel bakım, hamam/spa/masaj, sağlık, hizmet ve konaklama sorguları da eklenir. Tanınmayan türler `other` grubunda kendi kategorisiyle gösterilir; sekmeler yalnızca görüntüleme filtresidir.
- Kamuya açık Maps sorguları sunucudan yapılır. Sonuç biçimi `map-request.js` ve `functions/api/o6.js` içinde sürümlenmiştir; harici uç nokta değişirse uyarlama gerekebilir.
- Başarılı konum sorguları 10 dakika edge cache'te tutulur. Canlı arama çalışmazsa `places.json` tarihli Ankara kayıtları kullanılır ve kullanıcıya açıkça belirtilir.
- API uç noktası veya ağ geçici olarak erişilemezse tarayıcı da aynı tarihli veriyle ve aynı `domain.js` filtreleriyle devam edebilir. Böylece statik yayında da Ankara kayıtları kullanılabilir; canlı veri olarak sunulmaz.
- Adres araması Photon üzerinden yalnızca Ara düğmesiyle yapılır; `O6_GEOCODER_URL` değişkeniyle başka uyumlu servis seçilebilir.
- Fotoğraflar Google Maps kaydından, harita OpenStreetMap'tendir. Fotoğrafın ürün içeriği, stok durumu, işletmenin açık/faal olması veya eksiksiz alan kapsamı garanti edilmez.
- GPS kullanıcı eylemiyle alınır; arka plan takibi/kullanıcı hesabı/konum geçmişi yoktur. Seçilen konum URL'ye eklenir.

Yerel Cloudflare derleme doğrulaması: `npx wrangler pages functions build functions --outdir <geçici-dizin>` (depo kökünde).

Veri dosyasında kişisel yorum metinleri tutulmaz; işletme adı, kategori, genel iletişim bilgisi, puan/sayım, koordinat, görsel ve kaynak bağlantısı vardır.
