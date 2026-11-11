# Doğrulama — 11 Kasım 2026

- TypeScript strict kontrolü ve Vite üretim derlemesi başarılı.
- Gerçek Chrome headless üzerinde çalışma zamanı hatası görülmedi.
- 18 nesnenin pointer tepkisi; kişilerin ve arabaların normale dönmesi doğrulandı.
- Saat: 0.30, 0.50, 0.72, 0.75, 0.80, 0.95, 0.24. Geometri NaN/Infinity içermiyor.
- Gece/gündüz dükkân kepenkleri, palet dönüşümü, saat çubuğu, duraklat/devam, klavye tepkisi geçti.
- Aynı etkileşim kontrolü üç ardışık çalıştırmada geçti.
- 1440×1000 masaüstü, 390×844 mobil ve 8 karelik yakın yürüyüş dizisi görsel olarak incelendi.
- Üç saniyelik canlı headless ölçümünde yaklaşık 47 fps; 60 fps tüm donanımlarda garanti edilmez. Yürüyen karakterin gerçek zamanlı ilerlemesi ayrıca doğrulandı.
- Azaltılmış hareket tercihi olan tarayıcıda dünya duraklatılmış başlar. Devam et düğmesiyle hareket açılır.

Bu kontroller yerel Chrome ile yapıldı; fiziksel dokunmatik cihaz testi yapılmadı.
