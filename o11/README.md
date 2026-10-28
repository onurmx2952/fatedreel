# Dil Atölyesi · Interactive Book / o11

Türkçe konuşan öğrenciler için özgün elektronik İngilizce kitabı. Kullanıcının paylaştığı 32 üniteli plan ve son öğretim düzeltmeleri temel alınır. Past Simple ve Did, Was/Were'den önce gelir. Dizi transkriptlerinden alıntı içermez; tüm Extra English bölümlerinin doğrulandığı iddia edilmez.

## İçerik ve kullanım

- 6 bölüm, 32 ünite; her ünitede 3 anlatım bölümü, yapı tablosu, 6 kelime/kalıp, örnekler, dört replikli diyalog, açıklamalı çeviri alıştırmaları, karma tekrar/sınav ve notlar.
- 392 örnek/diyalog cümlesi, 132 açıklamalı çeviri alıştırması, 64 dilbilgisi sorusu. Sınavda yalnızca mevcut ve önceki ünitelerden soru gelir; ilk ünitelerde mevcut havuz kadar soru, sonrasında 10 soru.
- Puanlanan sınavda doğru/yanlış ve kurallar gösterilir. Ayrı hatırlama turu çeviri/dikte ve açıkça belirtilen öz değerlendirme kullanır. Resmi seviye belgesi verilmez.
- Öğrendim / tekrar / önemli renkleri, yer imleri, notlar, taslak cevaplar, sınav ve hatırlama durumu yerel saklanır. Öğrenme durumu öğrencinin kendi işaretidir.
- Tekrar takvimi iyi hatırlamada 1/2/4/8/14 gün, zorlanmada ertesi gün. Yanlış öz değerlendirme otomatik tekrar işareti koyar.
- İngilizce gizleme, cümleye dokunarak dinleme ve ayrı göster/gizle. Türkçe çeviri başlangıçta kapalıdır. Anlatım içindeki tanınan İngilizce örnekler de gizlenir; yanlış cümle örnekleri seslendirilmeden açılabilir.
- Okuma boyutu, gece sayfası, odak görünümü, dinleme hızı. iPad Air 5 hedef boyutları: 820×1180 ve 1180×820 CSS px. Safari ana ekrana ekleme desteklenir.
- JSON yedek indir/yükle; yüklemeden önce mevcut verinin değiştirileceği belirtilir. Kayıt hatası görünürdür ve girilmiş taslak bellekte korunur.

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

32 ünitenin sırası, içerik alanları, soru seçenekleri/cevapları, cümle-ses SHA eşleşmeleri ve MP3 çözümlemesi kontrol edildi. Gerçek tarayıcıda iPad dikey/yatay görünüm, cümle gizleme/açma/dinleme, çeviri, işaretler, notlar, yenileme sonrası kayıt ve sınav sonucu kontrol edildi. Kayıt/yedek şeması ve kota hatası testleri üç kez; rastgele sınav bitirme akışı üç tur çalıştırıldı. Gerçek iPad Safari donanım testi yapılmadı.

## Günlük olumsuzlar

Örnekler ve diyaloglar do not/does not/did not yerine don't/doesn't/didn't; is not/are not/was not/were not yerine isn't/aren't/wasn't/weren't; will not için won't kullanır. I am not → I'm not; negatif sorular Why didn't you...? sırasındadır. Not to worry gibi kısaltılamayan yapılar korunur. Açıklamalardaki tam biçim → kısaltma eşleştirmeleri öğretim için kalır. Değişen metinlerin Caro Davy sesleri yeniden üretilmiştir. Eski kitap sürümünü açık tutan cihazlar için önceki ses dosyaları tutulur. Yerel ilerleme anahtarı değişmez.

## Atölye görünümü

Resimli ana sayfa, altı açılır bölüm, kaldığın ünite/sekmeden devam etme, kişisel not ve öğrenildi sayıları. `#unit-N` doğrudan ders açar; `#home` ana sayfaya döner. Yerel kayıt şeması, ders içeriği ve sesler değişmedi. Hesap paneli üst çubuktaki kişi düğmesinden açılır. Tema ve yazı boyutu ayarları korunur.


## Aktif alıştırma akışı

Önceki arayüzdeki 132 çeviri alıştırmasının tamamı örnek cümlelerle aynıydı. Bu sürümde 02–06 sekmeleri `activities.js` ile yürütülür. Eski `exercises`, `questions`, `quiz`, `exam` alanları eski yedekleri/kayıtları silmemek için korunur; yeni çalışma akışında kullanılmaz. Eski taslaklar dosyada durur; yeni cevaplar ayrı `activities` alanında saklanır.

- 02 Kelimeler: mevcut 192 kelime/kalıp için anlamdan İngilizceye seçim. Sözcük listesi isteğe bağlı açılır.
- 03 Dinle ve yaz: mevcut 264 sesli örnek, metin başlangıçta gizli. Kullanıcı yazdıktan sonra kontrollü cevap karşılaştırması; Türkçe ipucu ve isteğe bağlı sesli örnek arşivi.
- 04 Diyalog: 32 yeni dört replikli konuşma; üçüncü repliği öğrenci seçer. Kontrolden sonra konuşma ve açıklama tamamlanır. Yeni diyaloglar yazılı etkinliktir; yeni Caro Davy sesleri üretilmedi.
- 05 Alıştırma: ünite başına dört yeni görev: boşluk doldurma, sözcüklerden cümle kurma, istenen dönüşümü yapma ve seçim. Toplam 128 yeni görev.
- 06 Karma tekrar: 64 ayrı yeni soru; mevcut ve önceki ünitelerden en fazla sekiz soru. İlk ünitede iki soru vardır; gelecek konular sorulmaz.

Her tur ilk denemede doğru sayısını gösterir. Cevap kontrol edilmeden çözüm ve açıklama açılmaz. Tur sonunda yanlışlar ayrı turda yeniden çalışılabilir. Aynı tur yeniden açıldığında sorular, seçimler, yazılan cevap ve sıralanan sözcükler geri gelir. Kısaltmalar/açık biçimleri, büyük-küçük harf ve noktalama farkları kabul edilir; açıkça tanımlanan alternatif cevaplar da kabul edilir. Serbest çevirilerin tüm eş anlamlılarını veya açık uçlu yanıtları değerlendiren bir yapay zekâ yoktur. Sorular kontrollü yanıtlar ister; yaklaşık yazılmış yanlış dilbilgisi doğru sayılmaz.

`activities.json`, `scripts/build-activities.py` içindeki özgün, elle yazılmış içerikten üretilir. Yeni soru cevaplarının eski kitap cümleleriyle birebir tekrar etmediği test edilir. Toplam 680 görev (mevcut sözcük ve dinleme malzemesi dahil). Her yeni tur aynı ünite havuzunu farklı sırayla sunar; sonsuz yeni soru üretildiği iddia edilmez.

Kayıt, mevcut `fatedreel-o11-book-v1` anahtarına eklenen isteğe bağlı `activities` alanındadır; mevcut Google eşitlemesi ve yedek içine dahildir. Eski not, işaret ve yer imleri korunur. Karma tekrar tamamlanınca mevcut tekrar takvimi güncellenir; ünite otomatik olarak öğrenildi işaretlenmez.

Kontroller: `node o11/scripts/test-activities.mjs` içerik, cevap normalleştirme, 32 ünite sınırı ve kayıt okuma; `node o11/scripts/check-browser.mjs <o11-adresi> edge|webkit` gerçek tarayıcı akışı. Playwright paketi sistemde çözümlenemiyorsa `PLAYWRIGHT_MODULE` tam paket yolunu alır. Edge’de ses isteği; Windows WebKit’in MP3 oynatma desteğine bağımlı olmamak için WebKit testinde ses dosyasının HTTP yanıtı denetlenir. Gerçek iPad donanım testi yapılmadı.


## Açılış kurtarma (v7)

`boot.js` uygulama modülünden bağımsız olarak service worker güncellemesini başlatır. Modül/JSON hatası veya açılış zaman aşımı görünür bir “Tekrar aç” düğmesi sunar. Bu düğme yalnızca `/o11/` worker kaydını ve `o11-book-*` dosya önbelleklerini yeniler; localStorage ilerlemesine dokunmaz ve ünite bağlantısını korur. JSON istekleri 12 saniyede sonlanır. Worker ağ isteğini 8 saniyeyle sınırlar ve mevcut dosyaya döner; HTML kabuğunu sadece gezinme istekleri için kullanır. Eksik JavaScript/JSON yerine HTML göndermez, hatalı MIME yanıtlarını saklamaz, 206 ses parçalarını tam dosya olarak önbelleğe almaz. Görsel indirme hatası worker değişimini engellemez.

`node o11/scripts/test-startup.mjs`: modül yükleme hatası/kurtarma, çevrimdışı kabuk, dosya önbelleği, eksik JS/JSON, yanlış MIME, worker değişimi, başka uygulamanın önbelleğinin korunması ve kısmi ses yanıtları. Bu testler VM ortamındadır; gerçek tarayıcı/iPad testi yerine geçmez.
