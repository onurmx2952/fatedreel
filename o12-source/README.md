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

## Türkçe içerik denetimi (v3)

- 7.298 kelimedeki 24.722 kullanım ifadesi örüntülerle tarandı; riskli deyim ve çok anlamlı ifadeler bağlamlarına göre incelendi. 415 ayrı kural, 423 kullanım karşılığını düzeltir.
- 216 ipucu doğrudan denetlendi. Diğer 7.082 otomatik ipucu öğrenme verisinde boş bırakılır; `tipReview: "withheld"` ile işaretlenir. Önceki metinler ve otomatik adaylar `unreviewed-tip-drafts.json` içinde **denetlenmemiş taslak** olarak saklanır; bunlar öğrenciye gösterilmez.
- 37 kullanım/yazım notu yeniden yazıldı. İngilizce kelimeler, tanımlar, örnek cümleler ve kullanım ifadelerinin İngilizce tarafı değiştirilmedi.
- Anlamlar ve örnek cümlelerin tamamı tek tek insan incelemesinden geçmemiştir. Bu çalışma her kaydın hatasız olduğuna ilişkin bir garanti değildir.

Düzeltmelerin kalıcı kaydı `editorial-review.json` dosyasıdır. Güncellemek için bu dosyayı düzenleyin, ardından:

```
npm run review:apply
npm run review:check
```

Denetlenen bir ipucunu `tips` alanına ekleyin; doğrudan onaylanmamış bir ipucunu öğrenme verisine eklemeyin. Kontrol, indeks, parçalar ve indirilebilir dosyanın tutarlılığını, yanlış deyimlere karşı regresyonları ve İngilizce kaynak içeriğin değişmediğini doğrular. Güncel yayın özeti `../o12/TRANSLATION_REVIEW.json` içindedir.
