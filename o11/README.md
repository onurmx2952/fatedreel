# Dil Atölyesi · Interactive Book / o11

Türkçe konuşan öğrenciler için özgün elektronik İngilizce kitabı. Kullanıcının paylaştığı 32 üniteli plan ve son öğretim düzeltmeleri temel alınır. Past Simple ve Did, Was/Were'den önce gelir. Dizi transkriptlerinden alıntı içermez; tüm Extra English bölümlerinin doğrulandığı iddia edilmez.

## İçerik ve kullanım — tek cümle akışı (v11)

32 ünitenin konu anlatımı ve 192 kelime/kalıp listesi korunur. Sekmeler: Anlatım, Kelimeler, Alıştırma, Notlarım. Ayrı kelime sınavı, diyalog tamamlama, boşluk doldurma ve karma sınav ekranları kaldırıldı.

Alıştırmada yalnızca Dinle, Türkçesi, yazma alanı, Çözüm, Sonraki cümle bulunur. İngilizce cevap çözüme kadar gösterilmez. Türkçe ayrı düğmeyle açılır. Çözüm boş cevapla da açılabilir, cümle atlanabilir. Tur 15 cümleden oluşur. Son cümlede “Alıştırmayı bitir” seçilir; “Alıştırma bitti” ve 15/15 ekranı açılır. Yeni tur kendiliğinden başlamaz; “Yeni 15 cümle” düğmesiyle başlatılır. Bitmiş tur sayfa yenilendiğinde bitmiş olarak kalır.

- 32 ünitenin tamamında seviyeye göre gözden geçirilmiş 480 kısa günlük cümle (ünite başına 15). İlk 20 ünitede en fazla 8, sonrakilerde en fazla 10 kelime kullanılır. İlk konularda ileri zamanlar, uzun deyimler veya gereksiz ek kalıplar bulunmaz; ilerleme ünitenin öğrettiği yapıya göre olur. Ev, iş, ulaşım, alışveriş, yemek siparişi, telefon, komşular ve arkadaşlarla plan yapma gibi gerçek durumlar kullanılır. Aynı turda aynı cümle tekrarlanmaz.
- Her turda 10 mevcut ünite + 5 önceki ünite cümlesi, karışık sırada. Önceki cümlelerde farklı zamanlara ve farklı ünitelere öncelik verilir. İlk ünitede önceki konu olmadığından 15 mevcut cümle gelir. Gelecek ünitelerden soru gelmez.
- Tüm cümleler aynı Kyutai Pocket TTS / Caro Davy kadın sesiyle sunulur. Değişen metinler yeniden seslendirilir; aynı kalan kısa cümlelerin mevcut kayıtları kullanılır. Tarayıcı sistem sesine geçiş yoktur. Kullanılmayan önceki sesler eski istemciler için korunur.
- Büyük/küçük harf, noktalama ve kısaltmaların açık biçimleri kabul edilir. Çözümde yalnızca doğru cümle ve cevaba özel kısa düzeltmeler görünür; başlık, genel uyarı, ünite etiketi ve konu özeti eklenmez. Kelime hizalaması eksik/fazla/değişmiş sözcükleri ve yer değiştiren sözcükleri belirler. Edat kalıpları, yardımcı fiiller, fiil biçimleri, zamirler, tanımlıklar ve bağlaçlar için bağlama uygun Türkçe gerekçeler eklenir. Doğru veya boş cevapta yalnızca doğru cümle gösterilir. Serbest çevirilerin tüm doğru alternatiflerini değerlendiren uzaktaki bir yapay zekâ yoktur.
- 480 cümlenin Türkçesi bağlama göre günlük dille yeniden yazıldı; DeepL API kullanılmıyor. Türkçeler kitapta saklanır, çevrimdışı erişilebilir.
- Yazılan cevap, açılmış Türkçe ve çözüm, mevcut cümle yerel kayda ve mevcut hesap eşitlemesine dahildir. Eski notlar, işaretler, taslaklar ve activities/quiz/exam verileri korunur. Önceki on cümlelik oturumlar sentencePracticePrevious içinde saklanır; değişen cümlelere eski cevaplar taşınmaz. Yeni oturumlar sürüm 3 ve everyday-v11 içerik kimliğiyle kaydedilir. Değişen sürümlerin cevapları mevcut cümlelere uygulanmaz; önceki kayıtlar sentencePracticePrevious ve sentencePracticeHistory içinde saklanır. Eski examples/dialogue/review sekmeleri alıştırmaya yönlendirilir.
- Tamamlanan tur mevcut tekrar takvimini günceller; atlanan veya çözümü boş açılan cümleler doğru sayılmaz. On beş cümle tamamen doğruysa tekrar aralığı uzar; diğer durumlarda ertesi gün tekrar önerilir.

## Sesler

480 alıştırma MP3'ü, Kyutai Pocket TTS ile gerçek `caro_davy` sesi kullanılarak yerelde üretilmiştir. Konu anlatımında kullanılan önceki kayıtlar ve eski istemcilerin sesleri de korunur. iPad'de model indirilmez, Python sunucusu gerekmez ve başka bir sistem sesine sessizce geçilmez.

- Motor: https://github.com/kyutai-labs/pocket-tts (MIT).
- Resmi v4.0.1 sürümünün `pocket-tts-3.3.0-x86_64-pc-windows-msvc.zip` ikilisi, varsayılan English modeli.
- Model kaydı: `hf://kyutai/pocket-tts/languages/english/model.safetensors@db04f0e653473e5c7333c69686ac92b7460b0c1d`.
- Ses: https://huggingface.co/kyutai/tts-voices/blob/main/voice-zero/caro_davy.wav ; Kyutai kataloğundaki Voice-Zero/LibriVox kaynağı.
- Üretim: `pocket-tts serve --host 127.0.0.1 --port 8811 --default-voice caro_davy`; `/tts` multipart POST, text + voice_url=caro_davy; FFmpeg libmp3lame 64 kbps.
- Dosya adı, cümlenin UTF-8 SHA-256 özetinin ilk 16 karakteridir. `book.json` her cümlenin ses kimliğini içerir.

## Teknik

Derleme veya harici font gerekmez. İsteğe bağlı Google girişi ve hesap eşitleme mevcut `/api/program/` ve `/api/learning/` uçlarını kullanır. Statik HTML/CSS/JS ve içerik JSON'u; mevcut Cloudflare Pages/Git yayını kullanılır. `/o11 /o11/ 301` yönlendirmesi eklenmiştir. Service worker yalnızca `/o11/` dosyalarını yönetir. Kitap kabuğu ilk bağlantıda, sesler dinlendikçe çevrimdışı önbelleğe alınır; tamamı ilk ziyarette indirilmez.

localStorage anahtarı: `fatedreel-o11-book-v1`. Yedekler aynı sürüm şemasını kullanır. Yüklenecek dosya boyutu ve temel şema denetlenir; kullanıcı metni HTML'e kaçışlanarak yazılır. Ses hatası ve depolama hatası bildirilir. Mikrofon kullanılmaz. Kullanıcı Google ile giriş yapıp cihaz kaydını hesabına kaydettiğinde ilerleme ve notları PROGRAM_DB üzerinde saklanır.

## İçerik kaynağı ve ses üretimi

- `scripts/everyday-sentences.txt`: 32 konu için editoryal olarak yazılmış bütün İngilizce/Türkçe cümleler.
- `python o11/scripts/build-everyday.py`: kaynak dosyadan book.json örneklerini, legacy alıştırma alanlarını ve SHA-256 ses kimliklerini üretir. Anlatım, kelime listeleri ve ünite sırası korunur. Kullanılmayan eski diyalog örnekleri yeni havuza eklenmez.
- `python o11/scripts/generate-everyday-audio.py --port 8814`: mevcut yerel Pocket TTS servisi üzerinden eksik Caro Davy dosyalarını üretir. Yarım dosyalar atomik olarak tamamlanır, tekrar başlatılabilir. Ayrı bir yerel servisle sondan üretim için `--reverse` kullanılabilir.
- `scripts/retired-practice-audio.json`: ilk havuzun ses kimliklerinin tarihsel kaydıdır; seviye sadeleştirmesinde uygun kısa cümleleri dışlamak için kullanılmaz. Dosyaların kendisi silinmez.

## Doğrulama

- `node o11/scripts/test-content-level.mjs`: 480 cümlenin uzunluğu, erken ünitelerde henüz öğretilmeyen zaman ve modal yapılarının olmaması, ileri deyimlerin dışlanması ve Present Continuous ünitesindeki 15 cümlenin de hedef yapıyı kullanması.

- `node o11/scripts/test-sentences.mjs`: 32 ünite × 50 tur, 15 cümle ve 10/5 dağılımı, gelecek konu sınırı, tekrarsız sorular, seviyeye uygun içerik, çözüm/atlama/bitiş/yeni tur, bitişin yenilemede korunması ve eski verinin saklanması.
- `node o11/scripts/test-feedback.mjs`: 32 konuyu kapsayan hata örnekleri; on the way to work gibi ifadelerde kalıbın bütün olarak açıklanması; 480 cümlenin her kelimesini eksiltme/fazla kelime denemeleri; doğru/boş cevapta açıklama olmaması. Fotoğraftaki eksikler ayrıca korunmuş regresyon örnekleridir.
- `python o11/scripts/verify-everyday-audio.py`: 480 MP3'ün metin/hash eşleşmesi, kapsamı, tam ses çözümlemesi, süresi ve sessiz olmaması.
- `node o11/scripts/check-browser.mjs <o11-adresi> edge|webkit`: gerçek tarayıcıda gizli cevap/Türkçe, ses isteği, doğru/farklı/boş cevap, yenileme sonrası kayıt, 15. cümlede bitiş ve isteğe bağlı yeni tur, notlar, eski sekmeler ve 320–1440 px arası beş ekran boyutu. Playwright yolu `PLAYWRIGHT_MODULE` ile belirtilebilir.
- `node o11/scripts/test-startup.mjs`: modül hatasından kurtarma, çevrimdışı kabuk, dosya önbelleği, MIME, worker değişimi ve kısmi ses yanıtları. Kurtarma ilerlemeye dokunmaz. Worker sadece /o11/ kapsamındadır; v11 bağımlılıklarını önbellekler.
- Eski görev bankası dosyaları mevcut istemciler ve eski kayıtlar için korunur, yeni akışta yüklenmez.

Edge ve Windows WebKit testleri gerçek iPad donanım testi yerine geçmez. WebKit MP3 codec desteği ortama bağlı olduğundan bu testte dosyanın HTTP yanıtı kontrol edilir.

## Cloudflare Workers AI ile anlam kontrolü

Ana ekran Workers AI kullanır; öğrencinin ayrı API hesabına ihtiyacı yoktur. Gerçek model testleri 30 Ekim 2026 tarihinde 20/20 geçti, doğru alternatiflerde yanlış hata bulunmadı. Servis sorunu yanlış öğrenci cevabı gibi gösterilmez. Yerel denetim sonuçları arşivlenir; notlar ve konu ilerlemesi korunur. Bağlantı, testler ve sınırlar [GRAMMAR-CHECK.md](GRAMMAR-CHECK.md) içindedir.
