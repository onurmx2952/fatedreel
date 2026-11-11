# Ankara, 1926 — Bir sokağın hafızası

1920’ler Ankara’sından esinlenen etkileşimli SVG sokak sahnesi. Mimari ve kişiler tarihsel bir yorumdur; belirli bir sokağın birebir rekonstrüksiyonu değildir.

## Çalıştırma

Node.js 22.18+ ile:

```sh
npm ci
npm run dev
npm run typecheck
npm run build
```

Üretim çıktısı `dist/`, yayın tabanı `/line/`. Sunucu, API veya çalışma zamanında harici bağımlılık gerektirmez.

## Etkileşimler

- Yayalar selam verir; at arabacıları karşılık verir.
- Altı dükkânın kepenkleri günün saatine göre açılıp kapanır, tıklayarak da değiştirilebilir.
- Fenerler sallanır, kedi gerinir, serçeler uçar ve geri döner.
- Güneş/ay sürüklenebilir; aşağıdaki saat çubuğu tüm günü seçer. Ok tuşlarıyla da saat değişir.
- Dokunma, fare, Tab/Enter/Boşluk desteklenir. Sistem azaltılmış hareket istiyorsa sahne duraklatılmış başlar; “Devam et” hareketi açar.
- Gün 180 saniyedir. Yürüyüş hızı günün süresinden bağımsızdır.

## Doğrulama

`?debug` rAF yerine `window.__step(seconds)` sunar. `?tau=0.8` saati geceye sabitler, `?start=0.3` şafakta başlatır, `?day=30` döngüyü 30 saniyeye indirir. `window.__ankara` kişi, araba ve dükkân durumlarını test için dışa açar.

## Kaynak ve lisans

[JDhruv14/line-art-animation](https://github.com/JDhruv14/line-art-animation) projesinin MIT lisanslı `lib/ink.ts`, `gait.ts`, `motion.ts`, `daynight.ts` modülleri kullanıldı. Lisans `LICENSE.line-art-animation` dosyasındadır. `ink.ts` içindeki tek uyarlama, azaltılmış hareket/duraklatma yönetimini sahneye bırakır. Kaynağın SKILL.md çizim ve fizik ilkeleri temel alındı.

Sahne kendi TypeScript/SVG çizimleridir; harici görsel, font veya analitik istekleri yoktur.
