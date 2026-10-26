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
