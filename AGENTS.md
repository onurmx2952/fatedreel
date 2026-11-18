# FatedReel yayın kuralları

- Her yeni herkese açık uygulama/sayfa `/icindekiler/` dizinine kaydedilmelidir. Bu, kullanıcının kalıcı isteğidir.
- Yeni sayfaya anlamlı bir HTML `<title>` ekle. Özel açıklama gerekiyorsa `icindekiler/titles.json` içine klasör adı → Türkçe açıklama ekle.
- Yayınlamadan önce `python scripts/build-directory.py` çalıştır; değişen `icindekiler/index.html` ve `icindekiler/sites.json` dosyalarını aynı commit'e ekle.
- Oluşturucu kökteki `index.html` içeren uygulama klasörlerini otomatik keşfeder. Gizli klasörler, `*-source` ve dizinin kendisi hariçtir. İç içe veya dinamik yeni yollar için oluşturucuyu genişlet.
- D1 büyük harfli bir klasördür; bağlantıların harf büyüklüğünü koru. `/d1/` yönlendirmesi `/D1/` adresine gider.
- İlgisiz yerel dosyaları koru. Mevcut yayın yolu Git `origin/main` dalıdır. Yayın sonrası canlı URL ve ilgili işlevleri doğrula.
