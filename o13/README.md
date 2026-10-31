# O13 · Hikâye Atölyesi

12 kısa günlük hayat hikâyesi (6 A1, 6 A2), her kelimeye dokunarak Türkçe anlam, hikâye ve kelime sesleri, hikâye başına 3 anlama sorusu, kişisel kelime listesi ve aralıklı tekrar. İlgili yapıların O11 bağlantıları okuma ekranındadır.

## Akış

Hikâye aç → oku/dinle → kelimeye dokun → cümlesiyle kaydet → 3 soruyu cevapla. Kelimelerim ekranında zamanı gelen en fazla 10 kelimeyle hatırlama turu yapılır. Anlam açılmadan değerlendirme yapılamaz. Tekrar motoru English Trainer'ın SM-2 tarzı motorundan uyarlanmıştır.

Bugünkü çalışma sayfası o günün hikâyesini ve en fazla 5 kelimelik başlangıç turunu sabit tutar. Anlama soruları içerik sorularıdır, serbest çeviriyi örnek cümleyle karşılaştıran bir denetim değildir. İlk sürüm konuşma, IELTS puanlama veya serbest yazma değerlendirmesi içermez.

Kayıt anahtarı `fatedreel-o13-v1`. Kelimeler, örnek cümleler, sorulardaki ilerleme, günlük plan ve ayarlar yenilemede korunur. Yedek indir/yükle ve mevcut isteğe bağlı Google hesabıyla eşitleme desteklenir. Bozuk kayıt otomatik silinmez; doğrulanmış yedek açık onayla yüklenir, önceki kayıt ayrıca saklanır. Hesap açmak kullanım koşulu değildir.

`/o13/` kapsamındaki service worker uygulama kabuğu ve hikâyeleri, dinlenen sesleri ve açılan görselleri saklar. Daha önce açılmamış bir ses çevrimdışıyken bulunmayabilir. Ses dosyası hatasında başka bir sese sessizce geçilmez.

## Kaynak ve üretim

[SOURCES.md](SOURCES.md) ve [MIT lisansı](vendor/english-trainer/LICENSE).

- `python o13/scripts/build-content.py`: küratörlü kaynaklardan içerik ve hash oluşturur; sözlük kapsamı eksikse durur.
- `python o13/scripts/generate-audio.py`: mevcut yerel Caro Davy sunucusuyla eksik MP3'leri üretir.
- `node o13/scripts/test-model.mjs`: hikâye/sözlük bütünlüğü, kart tekilleştirme, tekrar takvimi, gizli cevap, soru ilerlemesi, günlük plan, yedek ve uygulama anahtarlarının ayrılığı.
- `python o13/scripts/verify-audio.py`: bütün seslerin hash, dosya kapsamı, çözümleme, süre ve sessizlik kontrolü.

Yayın mevcut fatedreel Git deposunun `origin/main` dalı üzerinden yapılır. Ayrı Node sunucusu veya yeni hizmet hesabı gerekmez.
