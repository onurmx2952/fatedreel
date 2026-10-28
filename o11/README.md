# Dil Atölyesi · Interactive Book / o11

Türkçe konuşan öğrenciler için özgün elektronik İngilizce kitabı. Kullanıcının paylaştığı 32 üniteli plan ve son öğretim düzeltmeleri temel alınır. Past Simple ve Did, Was/Were'den önce gelir. Dizi transkriptlerinden alıntı içermez; tüm Extra English bölümlerinin doğrulandığı iddia edilmez.

## İçerik ve kullanım — tek cümle akışı (v8)

32 ünitenin konu anlatımı ve 192 kelime/kalıp listesi korunur. Sekmeler: Anlatım, Kelimeler, Alıştırma, Notlarım. Ayrı kelime sınavı, diyalog tamamlama, boşluk doldurma ve karma sınav ekranları kaldırıldı.

Alıştırmada yalnızca Dinle, Türkçesi, yazma alanı, Çözüm, Sonraki cümle bulunur. İngilizce cevap çözüme kadar gösterilmez. Türkçe ayrı düğmeyle açılır. Çözüm boş cevapla da açılabilir, cümle atlanabilir. Onuncu cümleden sonra aynı ekranla yeni tur başlar; zorunlu sonuç ekranı yoktur.

- 344 farklı kaynak kaydı: mevcut sesli örnekler ve bağlam gerektirmeyen tam diyalog cümleleri. Aynı turda aynı cümle tekrarlanmaz.
- Her turda 7 mevcut ünite + 3 önceki ünite cümlesi, karışık sırada. Önceki cümlelerde farklı zamanlara ve farklı ünitelere öncelik verilir. İlk ünitede önceki konu olmadığından 10 mevcut cümle gelir. Gelecek ünitelerden soru gelmez.
- Caro Davy ses dosyaları korunur. Yeni ses üretimi veya tarayıcı sistem sesine geçiş yoktur.
- Büyük/küçük harf, noktalama ve kısaltmaların açık biçimleri kabul edilir. Yaygın -ing, was/were ve did/does hataları için kurallı Türkçe geri bildirim; diğer farklarda hedef cümleyle karşılaştırma. Serbest çevirilerin tüm doğru alternatiflerini değerlendiren uzaktaki bir yapay zekâ yoktur.
- 52 çeviri kaydı günlük Türkçeye göre düzenlendi; DeepL API kullanılmıyor. Türkçeler kitapta saklanır, çevrimdışı erişilebilir.
- Yazılan cevap, açılmış Türkçe ve çözüm, mevcut cümle yerel kayda ve mevcut hesap eşitlemesine dahildir. Eski notlar, işaretler, taslaklar ve activities/quiz/exam verileri korunur. Eski examples/dialogue/review sekmeleri alıştırmaya yönlendirilir.
- Tamamlanan tur mevcut tekrar takvimini günceller; atlanan veya çözümü boş açılan cümleler doğru sayılmaz. On cümle tamamen doğruysa tekrar aralığı uzar; diğer durumlarda ertesi gün tekrar önerilir.

## Sesler

403 etkin benzersiz MP3 (~6.7 MB), Kyutai Pocket TTS ile gerçek `caro_davy` sesi kullanılarak yerelde üretilmiştir. Bu sayı 392 örneğin tekilleştirilmiş dosyalarını ve anlatım içi ek cümleleri içerir. iPad'de model indirilmez, Python sunucusu gerekmez ve başka bir sistem sesine sessizce geçilmez.

- Motor: https://github.com/kyutai-labs/pocket-tts (MIT).
- Resmi v4.0.1 sürümünün `pocket-tts-3.3.0-x86_64-pc-windows-msvc.zip` ikilisi, varsayılan English modeli.
- Model kaydı: `hf://kyutai/pocket-tts/languages/english/model.safetensors@db04f0e653473e5c7333c69686ac92b7460b0c1d`.
- Ses: https://huggingface.co/kyutai/tts-voices/blob/main/voice-zero/caro_davy.wav ; Kyutai kataloğundaki Voice-Zero/LibriVox kaynağı.
- Üretim: `pocket-tts serve --host 127.0.0.1 --port 8811 --default-voice caro_davy`; `/tts` multipart POST, text + voice_url=caro_davy; FFmpeg libmp3lame 64 kbps.
- Dosya adı, cümlenin UTF-8 SHA-256 özetinin ilk 16 karakteridir. `book.json` her cümlenin ses kimliğini içerir.

## Teknik

Derleme veya harici font gerekmez. İsteğe bağlı Google girişi ve hesap eşitleme mevcut `/api/program/` ve `/api/learning/` uçlarını kullanır. Statik HTML/CSS/JS ve içerik JSON'u; mevcut Cloudflare Pages/Git yayını kullanılır. `/o11 /o11/ 301` yönlendirmesi eklenmiştir. Service worker yalnızca `/o11/` dosyalarını yönetir. Kitap kabuğu ilk bağlantıda, sesler dinlendikçe çevrimdışı önbelleğe alınır; tamamı ilk ziyarette indirilmez.

localStorage anahtarı: `fatedreel-o11-book-v1`. Yedekler aynı sürüm şemasını kullanır. Yüklenecek dosya boyutu ve temel şema denetlenir; kullanıcı metni HTML'e kaçışlanarak yazılır. Ses hatası ve depolama hatası bildirilir. Mikrofon kullanılmaz. Kullanıcı Google ile giriş yapıp cihaz kaydını hesabına kaydettiğinde ilerleme ve notları PROGRAM_DB üzerinde saklanır.

## Doğrulama

- `node o11/scripts/test-sentences.mjs`: 32 ünite × 50 tur, 7/3 dağılımı, gelecek konu sınırı, tekrarsız sorular, ses dosyaları, yaygın hata açıklamaları, boş çözüm, atlama, yeni tur ve eski verinin korunması.
- `node o11/scripts/check-browser.mjs <o11-adresi> edge|webkit`: gerçek tarayıcıda gizli cevap/Türkçe, ses isteği, doğru/farklı/boş cevap, yenileme sonrası kayıt, sonraki cümle/tur, notlar, eski sekme geçişi ve 320–1440 px arası beş ekran boyutu. Playwright yolu `PLAYWRIGHT_MODULE` ile belirtilebilir.
- `node o11/scripts/test-startup.mjs`: modül hatasından kurtarma, çevrimdışı kabuk, dosya önbelleği, MIME, worker değişimi ve kısmi ses yanıtları. Kurtarma ilerlemeye dokunmaz. Worker sadece /o11/ kapsamındadır; v8 bağımlılıklarını önbellekler.
- Eski görev bankası dosyaları mevcut istemciler ve eski kayıtlar için korunur, yeni akışta yüklenmez. `test-activities.mjs` eski bankanın tutarlılığını denetlemeye devam eder.

Edge ve Windows WebKit testleri gerçek iPad donanım testi yerine geçmez. WebKit MP3 codec desteği ortama bağlı olduğundan bu testte dosyanın HTTP yanıtı kontrol edilir.
