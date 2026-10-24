# Elsewhere / o9

Türkçe konuşan başlangıç öğrencileri için özgün, tarayıcıda çalışan İngilizce öğrenme macerası. Bağımlılık, build, hesap veya sunucu API'si gerektirmez. `index.html` bir HTTP sunucusuyla açılır.

## Öğrenme yolu

- 16 hikâye bölgesi; her bölgede dört ifadeyi tanıtan üç görev: 48 görev, 192 özgün ifade.
- Görevlerde toplam 576 temel alıştırma: anlam, cümle sıralama, İngilizce üretim ve sesli dikte. Yanlışlar tur sonuna ayrıca eklenir.
- Her bölgede 12 soruluk bağımsız sınav: 192 ek değerlendirme sorusu. Hem toplam %80 hem her beceride %60 gerekir. Başarısız turda ödül verilmez; tekrar mümkündür.
- 16 sesli konuşma durağı. Web Speech Recognition isteğe bağlı, kelime dökümü eşleşmesi sağlar; telaffuz puanlamaz. Mikrofonsuz sesli pratik öz beyanla kaydedilebilir.
- Dört dönüm noktasında üç cümle ve en az 12 kelimelik günlük notu. Serbest yazıya otomatik başarı notu verilmez.
- Son değerlendirme 48 sorudur; her bölgeden yazma, dinleme ve dönüşümlü okuma/dil bilgisi/diyalog içerir. Aynı toplam ve beceri eşikleri uygulanır.
- Altı kasaba projesi; para sadece ilk görev/sınav başarısında verilir, tekrar oynayarak çoğaltılmaz. Fener projesi final gerektirir.
- Kişiye göre ifade tekrarı: hata sonrası hemen, başarıda 10 dakika, 1 gün, 3 gün, 7 gün, 14 gün.

İçerik günlük ifadeler, kişisel bilgiler, basit yönergeler ve temel ihtiyaçlar için CEFR A1 tanımlarını temel alır: https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale

Oyunun bitirilmesi bağımsız A1 yeterliği veya resmî sertifika garantisi değildir. Özellikle serbest konuşma ve yazının değerlendirilmesi için gerçek insanlarla pratik ve haricî değerlendirme gerekir. Oyun içi belge bu sınırı açıkça belirtir.

## Teknik notlar

`curriculum.js`: özgün Türkçe açıklamalar, İngilizce ifadeler, okuma ve diyalog metinleri.

`engine.js`: görev üretimi, dar kapsamlı cevap normalizasyonu ve yaygın kabul edilebilir varyantlar, beceri puanları, kilitler, ödüller ve tekrar planı.

`app.js`: ES modül tabanlı arayüz, Web Speech Synthesis dinlemeleri, isteğe bağlı Speech Recognition, yerel JSON kayıt/yedek, PDF için yazdırma görünümü.

Veriler `elsewhere-o9-v1` localStorage anahtarında saklanır. Yedek alma/aktarma ayarlardadır. Kaydetme hatası görünür bildirilir. Cevabı verilmiş görev adımı ve sonuç/ödül aynı kayıtta saklanır. Turları veya sayfayı yenilemek ödülü çoğaltmaz. Yarım kalan görevler devam ettirilebilir; metin taslakları saklanır. JSON içe aktarımında sürüm, temel şema ve boyut kontrol edilir. İçerik HTML'e yazılmadan kaçışlanır.

Harita görseli `town.webp`, yerleşik imagegen ile bu proje için üretilmiştir. Fontlar Google Fonts'tan gelir, yüklenmezse sistem yazı tipine düşer. Haricî ses servisi anahtarı gerekmez. Ses motorunun kullanılabilirliği ve İngilizce sesi cihaza bağlıdır. Ses gelmediğinde erişilebilir metin seçilebilir; bu destek kullanılan sonuçlar bağımsız dinleme olarak sunulmaz.

## Yayın

Mevcut fatedreel.com statik Git yayın akışı kullanılır; `o9/` dosyaları ve `_redirects` içindeki `/o9 /o9/ 301` dışında siteye dokunulmaz.
