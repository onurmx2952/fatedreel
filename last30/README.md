# Last30

Ziyaret sırasında bir POST isteği araştırmayı başlatır; cron, zamanlayıcı veya kapalı sayfada çalışan servis yoktur. Her açılış yeni tarama yapar. Son rapor indirilerek saklanabilir.

Cloudflare Pages Functions, mevcut AI ve PROGRAM_DB bağlarını kullanır. Kaynaklar paralel taranır; 30 gün dışındaki kayıtlar ve aynı başlıklar elenir. Workers AI, farklı olayları birleştirerek 15 kaynaklı Türkçe konu seçer. Geçersiz kaynak kimlikleri kabul edilmez. Erişilemeyen kaynaklar açıkça gösterilir. Haber kapsamı sosyal etkileşim gibi sunulmaz. Özetler haber başlıklarıyla sınırlıdır.

Bu uygulama mvanhorn/last30days-skill keşif yaklaşımının Pages için bağımsız uyarlamasıdır; Python motoru çalıştırılmaz. X/YouTube/TikTok anahtarı veya oturumu kullanılmaz.

Kontroller: node --check last30/app.js; node --check functions/api/last30/research.js; node --test tests/last30.test.mjs
