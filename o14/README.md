# O14 · Hayatın İçinden İngilizce

O11’in ilk iki bölümündeki 14 yapıyı 10 günlük durum ve 60 yönlendirmeli konuşma adımı içinde çalıştırır. Önceki bağımsız boşluk soruları yeni akışta kullanılmaz.

## Kaynak gerçekten nerede kullanılıyor?

EchoType: https://github.com/Talljack/echo-type, commit `2b87b5825a79ccae7163626cada2f3c4c9375930`, MIT, Copyright (c) 2026 Talljack.

- `vendor/comparison.js`: EchoType `src/lib/levenshtein.ts` dosyasının TypeScript derleyicisiyle JavaScript çıktısı. Kelime dizilerini Needleman–Wunsch ile hizalar; eksik/fazla/farklı kelimeleri gösterir. Bir anlam doğrulama veya telaffuz puanı olarak kullanılmaz.
- `vendor/punctuation.js`: `src/lib/practice-translation.ts` dosyasının JavaScript çıktısı; tipografik apostrof normalleştirmesi gerçek cevap kontrolünde kullanılır.
- `echo-scenarios.json`: Orijinal senaryo tanımları ve ilgili 10 senaryonun kalıp defterleri. `Konuları hatırla` ekranındaki ek kullanım örnekleri doğrudan bu kalıp defterinden gelir. Senaryo hedefleri ve rol/görev akışı EchoType’ın `Scenario`, `ScenarioGoals` ve Speak modelinden uyarlandı.
- `ECHO-TYPE-LICENSE.txt`: Orijinal lisans.

Bu, EchoType’ın tamamının Next.js/Supabase/Tauri dağıtımı değildir. Mevcut Cloudflare sitesine uyarlanan yönlendirmeli senaryo sürümüdür. 60 İngilizce/Türkçe konuşma adımı O14 için yazıldı; bunlar EchoType’tan alınmış hazır içerik diye sunulmaz. O11 konu anlatımları aynı kitaptan alınır. Eski Grammar Guide lisansı tarihsel kod atfı için korunur.

## İçerik

Yeni komşuyla tanışma, yanlış gelen kahve, market alışverişi, ofiste rutin ve bugünün farkı, otobüs/istasyon, telefonda buluşma, ev arkadaşıyla yemek, mağazada beden/renk, otel resepsiyonu ve arkadaşlarla yemek planı. Her durumda belirli bir amaç, karşı tarafın cümlesi, öğrencinin ifade etmek istediği anlam ve altı sıralı cevap bulunur. Konuşma geçmişi açılabilir. İlk 14 ünitenin tümü `scenes.json` içindeki ünite eşlemesinde kapsanır. Bazı sık kullanılan işlevsel kalıplar (ör. Is breakfast included?) konuşma kalıbı olarak açıklanır.

## Cevaplar

Varsayılan kendi cümleni yazmaktır; isteğe bağlı küçük harfli kelimelerden kurma vardır. Bütün adaylar ve seçilen kelimeler küçük harftir; I ve I’m de başlangıç ipucu vermez. Bilinen eşdeğerler, açık/kısaltılmış biçimler ve noktalama/büyük harf farkları doğrudan kabul edilir.

Diğer cevaplar `/api/o14/check` üzerinden mevcut Workers AI ile anlam ve dilbilgisi açısından değerlendirilir. Sunucu öğrenciye ait turnId’den özgün bağlamı, Türkçe niyeti ve örnekleri bulur; istemcinin gönderdiği sahte referansları kullanmaz. O14’e özel prompt, sahiplik/ürün bulunması gibi günlük kullanım eşdeğerlerini açıkça kabul eder. Sunucu kaynak/çıktı doğrulaması ve O11 ile ortak mevcut hız/günlük kullanım sınırları korunur. O11 endpoint davranışına dokunulmaz.

Model hatası, zaman aşımı veya 429 cevabı yanlış sayılmaz; yazı korunur, yeniden deneme ve örnek açma mümkündür. Yapay zekâ yargıları yanılabilir; bütün alternatif İngilizce cümlelerin doğru değerlendirileceği iddia edilmez. Hatalı cevap düzeltilebilir; örneği açmak başarı sayılmaz. Tur sonunda yanlış/örneği açılan adımlar tekrar edilebilir. Kontrol sırasında başka duruma geçilirse önceki yanıt yeni duruma uygulanmaz.

Seslendirme cihazın tarayıcıdaki İngilizce sesiyle yapılır; O11’in Caro Davy kayıtlarıyla aynı ses olduğu iddia edilmez. İngilizce ses yoksa açıklama gösterilir; Türkçe sese geçilmez. Mikrofon kullanılmaz.

## Kayıt ve yayın

`fatedreel-o14-scenes-v2` kaydı mevcut durum, adım, taslak, kelime dizilimi ve cevapları saklar. Önceki O14 v1 kaydı silinmez; farklı içerikteki eski doğru cevaplar yeni sorulara taşınmaz. O11 kaydına dokunulmaz. Hesap eşitlemesi yoktur.

Statik istemci + Cloudflare Pages Function; yeni ücretli servis veya yeni kimlik bilgisi gerekmez. `/o14/` mevcut Git/main yayınını kullanır. İstemci sürüm sorgusu v2; kaynaklar yeniden doğrulamalı önbellek kullanır.

## Kontroller ve sınırlar

Görev klasöründeki `test-o14-scenes.cjs`: 60 tur, 14 konu kapsamı, tüm kayıtlı alternatifler, küçük harf/kelime geri alma, yazılı kontrol, anlamsal alternatif, hata/atlama/düzeltme, yenileme, eski async cevabı engelleme, gerçek EchoType kalıp defteri, HTML kaçışı, kayıt/yükleme hataları.

`test-o14-api.cjs`: sunucunun gerçek bağlam ve referansları kullanması, origin, input, yapılandırma, bozuk model sonucu ve kota kontrolleri. Testler DOM/model servis taklitleriyle çalışır; canlı AI ayrıca ayrı küçük örneklerle kontrol edilir. Gerçek tarayıcı görünümü, mobil düzen ve cihazda ses oynatma testi değildir. Work tarayıcı erişimi kapalı olduğu için bu görevde ekran görüntülü inceleme yapılamadı.
