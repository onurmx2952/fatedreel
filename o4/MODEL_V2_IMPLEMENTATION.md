# V2 uygulama ayrıntıları (deney sonrası açıklama; katsayı değişikliği yok)

Bu dosya deney öncesi MODEL_V2.md belgesini değiştirmez. V2 kaynak hash'i deney öncesi manifestle aynı doğrulanmıştır.

- Norm ve kişisel özgürlük idealleri Beta(2,2); sertlik ideali bağımsız Beta(2,2). Lider/fraksiyon sertlik idealinin logitine 4*leader_bias eklenir.
- Başlangıç kaynakları türün V1 ROLES tablosundaki r kaynak ortalamasıyla Beta(5r,5(1-r)); güven başlangıç T ile Beta(8T,8(1-T)). Kaynak tablosu vatandaş .35, fraksiyon .65, lider .75, ordu .85, polis .70, bürokrasi .60, yargı .55, işletme .80, muhalefet .40.
- Tercihin kişisel deneyim hedefi sigmoid(logit(ideal)+.5(W-.5)+.5(L-.5)). Etmen kaynakları ve normlar siyasi talep dışında çıkar farklılıkları oluşturur; ideolojik öncül tür başına doğuştan demokrat/otoriter ayrımı içermez.
- A ağırlıklarında ittifak sayısı etmen sayısına bölünür: kaynak*(1+ittifak_sayısı/160). Bu, çok bağlantılı etmenin sınırsız ağırlık üstünlüğünü azaltan varsayımdır.
- Protesto basıncı, z=-2+2.5G+F+.8H_p için 1-(1-sigmoid(z))^protest_scale. Çarpan 1 iken MODEL_V2.md'deki sigmoid(z) ile aynı; çarpan 0 iken sıfırdır. V1'in .015 tabanından farklıdır.
- Lider değişiminde mevcut lider dışındaki iki aday arasından .1+kaynak*(1+ittifak/160)*(1-K*|tercih-D|) ağırlığıyla seçim yapılır. Liderlik etmeni havuzu üç kişidir; nüfus doğum/ölümünü veya gerçek bir seçim sistemini temsil etmez.
- Olaylar için her ay beş Uniform çekiliş (dört dış olay, bir protesto) ve üç Normal baskı yeniliği koşulsuz tüketilir. Liderlik için Uniform, Uniform ve Beta çekilişleri de koşulsuzdur. Bu, şok sıklığı müdahalesinin diğer rastgele akışları kaydırmamasını sağlar. Durumlar ve etmen kararları yine farklılaşabilir.
- Kodda uyumluluk için kalan `resilience` adı V2'de **kurumsal geri besleme kuvveti** olarak yorumlanmalıdır. Etkisi I<.5 ve I>.5 için farklı işaretlidir; monoton dayanıklılık müdahalesi değildir. Arayüz ve rapor bunu belirtir. Bu adlandırma açıklaması katsayı güncellemesi değildir.
- `sustained_high_violence`: herhangi bir 12 aylık kayan ortalamanın .4'ü aşması. Son rejim sınıflaması değildir; ek oynaklık/istikrarsızlık ölçüsüdür.
- 'İç savaş' önceden belirlenmiş V≥.6 etiketidir; örgütlenme, ölüm veya coğrafya eşlemesi kalibre edilmemiştir. Gerçek iç savaş tanımıyla eşdeğer sayılmaz.
