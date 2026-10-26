# Kelime Atlası · Türkçe

Canlı uygulama: https://fatedreel.com/o12/

Kaynak: https://github.com/designfuchen/word-atlas
Uyarlanan sürüm: 9eff300e5d5d0b31dcd9de2a4e040a89c78cbcc8

7.298 kelime ve 14.596 İngilizce örnek cümle korunmuştur. 13.733 anlam, İngilizce tanımların bağlamına göre Türkçeleştirilmiştir. Türkçe anlamlar, örnek çevirileri, kullanımlar ve ipuçları otomatik çeviriyle hazırlanmıştır; tek tek insan incelemesinden geçmemiştir. Arayüz, Türkçe arama, tarih/süre gösterimi ve veri saklama anahtarları uyarlandı. Geleneksel `zh` alan adları veri uyumluluğu için korunur; içerikleri Türkçedir.

## Geliştirme

Bu klasörden:

```
npm ci
node prepare-public.mjs
npm test
npm run dev
```

PowerShell ile yayın derlemesi:

```
$env:ATLAS_BASE='/o12/'
npm run build
```

`dist/` içeriği deponun `o12/` klasörüne aktarılır. Diğer siteler değiştirilmez.
`public/` varlıkları aynı deponun `o12/` klasöründen hazırlanır.
Türkçe kelime verisi `../o12/word-atlas.tr.json`; web için parçalı kopyası `../o12/atlas/entries/` altındadır. Düzeltme yaparken indeksin anlam alanını, ilgili parça dosyasını ve indirilebilir JSON dosyasını birlikte güncelleyin.

## Barındırma

Resimler ve kelime verileri fatedreel.com üzerinde barındırılır. İngilizce sesler kaynak deponun sabit sürümündeki raw.githubusercontent.com adreslerinden gelir. Ulaşılamazsa tarayıcının İngilizce seslendirmesi kullanılır. Çince arayüz seslendirmeleri kapalıdır. İlerleme sadece tarayıcıda saklanır; yedek dışa/içe aktarılabilir.

## Lisans

Kod: MIT (LICENSE). İçerik: Word Atlas contributors — CC BY 4.0 (CONTENT_LICENSE.md); Türkçe çeviriler ve yerelleştirme eklenmiştir. Özgün İngilizce kelime içerikleri de AI üretimidir; resmî IELTS kaynağı değildir.

Kelime verilerini güncellerken `o12/sw.js` içindeki uygulamaya özel önbellek sürümünü de artırın.

## Türkçe içerik denetimi (v4)

- 7.298 kelimedeki 24.722 kullanım ifadesi örüntülerle tarandı; riskli deyim ve çok anlamlı ifadeler bağlamlarına göre incelendi. 629 ayrı kural, 648 kullanım karşılığını düzeltir.
- 216 ipucu doğrudan denetlendi. Diğer 7.082 otomatik ipucu öğrenme verisinde boş bırakılır; `tipReview: "withheld"` ile işaretlenir. Önceki metinler ve otomatik adaylar `unreviewed-tip-drafts.json` içinde **denetlenmemiş taslak** olarak saklanır; bunlar öğrenciye gösterilmez.
- 37 kullanım/yazım notu yeniden yazıldı. İngilizce kelimeler, tanımlar, örnek cümleler ve kullanım ifadelerinin İngilizce tarafı değiştirilmedi.
- Anlamlar ve örnek cümlelerin tamamı tek tek insan incelemesinden geçmemiştir. Bu çalışma her kaydın hatasız olduğuna ilişkin bir garanti değildir.

Düzeltmelerin kalıcı kaydı `editorial-review.json` dosyasıdır. Güncellemek için bu dosyayı düzenleyin, ardından:

```
npm run review:apply
npm run review:check
```

Denetlenen bir ipucunu `tips` alanına ekleyin; doğrudan onaylanmamış bir ipucunu öğrenme verisine eklemeyin. Kontrol, indeks, parçalar ve indirilebilir dosyanın tutarlılığını, yanlış deyimlere karşı regresyonları ve İngilizce kaynak içeriğin değişmediğini doğrular. Güncel yayın özeti `../o12/TRANSLATION_REVIEW.json` içindedir.
## iPad Safari görüntü ve gezinme düzeltmesi (26 Ekim 2026)

7.298 resim dosyası ve 73 içerik parçası / 7.298 içerik kaydı denetlendi; dizindeki hiçbir kelimenin resmi veya içeriği eksik değil. Atlas A2 filtresindeki cloud/alive/circle/pardon/succeed/easily görselleri yerindedir.

Atlas kartlarında resim yüksekliği yalnızca aspect-ratio ile hesaplanıyordu. Bu özellik devre dışı bırakıldığında yükseklik sıfıra düştü ve fotoğraftaki boş kart görünümü yeniden üretildi. Kartın hesaplanmış genişliğinden açık resim yüksekliği atanır; resimlere doğal 512×512 boyutları ve eski Safari için height:auto desteği eklendi.

WebKit testinde yerel View Transition ile Atlas → Alıştırma geçişinde tarayıcı hedefi kapandı; aynı test API devre dışıyken geçti. Sayfa yönlendirmesi ve kelime açma artık güncellemeyi doğrudan uygular; gezinme deneysel görsel geçişin callback'ini beklemez. Mevcut CSS geri bildirimleri korunur. Gerçek iPad donanım testi yapılmadı; tarayıcı motoru testi kullanıldı.

Tekrar testi: `node scripts/check-browser.mjs http://127.0.0.1:8811/o12/ webkit` veya son parametre `edge`. Önce kök depoda statik sunucu açın; Playwright için ilgili tarayıcı kurulu olmalıdır. PLAYWRIGHT_MODULE ortam değişkeniyle hazır bir Playwright paketinin yolu verilebilir. Testler geçici, yalıtılmış tarayıcı verisi kullanır; kullanıcı hesabına giriş yapmaz.

Test kapsamı: 810 ve 390 genişliklerinde resim alanı (aspect-ratio devre dışıyken de), Atlas → Alıştırma, yazma turu, Bugün → kelime çalışması, yenileme ve devam etme. Safari/WebKit ve Edge üzerinde geçti; 23 birim testi ve TypeScript kontrolü de geçti. Yayın yeni JS/CSS adlarını ve service worker v6'yı kullanır; ilerleme anahtarları değişmedi. Eski JS/CSS dosyaları açık eski sekmeler için tutulur.
