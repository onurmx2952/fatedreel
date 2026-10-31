# Kaynaklar ve uyarlama

O13, kullanıcının seçtiği [dripips/english-trainer](https://github.com/dripips/english-trainer) projesindeki okuma, kişisel kelime listesi, günlük çalışma ve aralıklı tekrar akışları temel alınarak fatedreel.com için uyarlanmıştır.

Kaynak sürüm: `46f0f17c400cddf14d1266173ab1fdf67ee44e21`.

- `vendor/english-trainer/srs.js`, kaynak projenin `server/src/srs.js` dosyasından alınmıştır. Saat enjeksiyonu ve giriş doğrulaması eklendi; veritabanı yerine mevcut tarayıcı/hesap kaydı kullanılır. Kaynağın MIT lisansı ve Vadim Bobkov telif bildirimi aynı dizinde korunur.
- `art/*.webp`, kaynak projenin `web/public/reading/read-{coffee,my-day,new-job,family-picnic,rainy-day,london-weekend}.webp` çizimleridir. Kaynak projenin MIT lisansı altında yeniden kullanılır; lisans uygulamadaki Hakkında bölümünden erişilebilir.
- 12 kısa günlük hayat hikâyesi, Türkçe çevirileri, sözlük karşılıkları ve 36 anlama sorusu bu Türkçe sürüm için yeniden hazırlanmıştır. Rusça açıklamalar ve IELTS arayüzü kullanılmaz. A1/A2 etiketleri içerik tasarımının yaklaşık seviyeleridir, resmî seviye sertifikası değildir.
- Sesler mevcut O11 ile aynı Kyutai Pocket TTS / Caro Davy sesiyle kaydedilir. Aynı metne ait mevcut O11 kayıtları hash ile yeniden kullanılabilir. ElevenLabs, ücretli yeni servis, tarayıcı sistem sesi veya çalışma anında model indirmesi kullanılmaz.
- React/Fastify/SQLite çalışma ortamı taşınmamıştır. Uygulama mevcut statik Cloudflare Pages yayını ve isteğe bağlı mevcut Google/D1 kayıt eşitlemesiyle çalışır. O11'in dilbilgisi akışına yeni görev türü eklenmez.
