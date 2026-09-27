# Ortaokul ders arşivi

Canlı adres: https://fatedreel.com/ortaokul/

Statik HTML/CSS/JavaScript; Cloudflare Pages üzerinde mevcut sitenin bir bölümüdür.
Hesap gerektirmez. Video dosyaları internette herkese açıktır; yerel OpenMontage
sunucusuna bağlantı kurulmaz. API anahtarı veya üretim dosyası barındırmaz.

## Yeni OpenMontage videosu ekleme

OpenMontage ortamında `Activate-OpenMontage.ps1` betiğini dot-source ettikten sonra:

```powershell
python scripts/export_school.py --project projects/sudan-elektrige --site C:/Users/aa/Documents/github/fatedreel --lesson projects/sudan-elektrige/school-lesson.json
```

Aktarım için `artifacts/final_review.json` sonucu `pass`, `artifacts/beats.json`,
proje içindeki tamamlanmış MP4 ve `renders/<ders-id>.srt` gerekir. Ders tanımı
`id`, `title`, `subject`, `description`, `takeaways`, `quiz` alanlarını içerir.
Quiz: `question`, `options`, sıfırdan başlayan `correct`, `explanation`.

Komut yalnızca incelemeden geçmiş video, kapak ve altyazıyı `media/` altına
kopyalar; `library.json` listesine ekler veya aynı id'yi günceller. Git push
yapmaz. Sonrasında yalnızca ilgili ders dosyalarını commit edip mevcut Pages
Git dağıtımıyla yayınlayın. Her dosya 25 MiB altında olmalıdır. Daha büyük
videolar için sıkıştırma veya ayrı nesne depolama gerekir.

## Kontrol

Site kökünü yerel HTTP sunucusuyla açın; `/ortaokul/` adresinde oynatma,
bölüm atlama, arama, sınıf görünümü, soru ve indirme bağlantılarını deneyin.
Yayınlandıktan sonra gerçek alan adında MP4 için `200/206` ve `video/mp4`
yanıtını doğrulayın. Ders bağlantısı `#ders-id` ile paylaşılabilir.
