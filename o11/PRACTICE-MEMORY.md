# Kişisel tekrar hafızası

15 cümlelik ekran, 10 mevcut + 5 önceki konu ve aynı kısa cümle/ses bankası korunur. İlk ünitede önceki konu olmadığı için 15 cümle aynı konudandır. Yeni veya ileri konulardan soru eklenmez.

## Seçim ve tekrar

- Yeni turun önceki konu cümleleri seçilirken önce zamanı gelen cümleler, ardından henüz düzeltilmemiş hatalar öncelik alır. Eşitliklerde farklı konular ve farklı yapılar tercih edilir.
- Hatalar yalnızca kelime farkından çıkarılmaz; Workers AI tarafından doğrulanan hata alanlarından edat, tanımlık, yardımcı fiil, çoğul, geçmiş eylem veya kelime hedefleri çıkarılır. Bunlar soru seçimine yarayan sınırlı etiketlerdir; kapsamlı bir dil çözümleyicisi değildir.
- Uygun farklı örnek varsa, hatadan sonra en az üç başka soru geçecek biçimde kalan sorular yer değiştirir veya henüz cevaplanmamış bir soru değiştirilir. Her hedef bir turda en fazla bir kez öne alınır. 10+5, 15 toplam, aynı cümleyi tekrar etmeme ve mevcut konu sınırı korunur. Uygun örnek yoksa zorlama bir cümle üretilmez; hedef sonraki turlarda öncelik kazanır.
- Yanlış cevap yaklaşık 10 dakika sonra yeniden zamanı gelmiş olur. Zamanı gelen ayrı günlerdeki başarılar aralığı 1, 3, 7, 14, 30, 60 güne taşır. Bu uygulamaya ait basit bir zamanlama kuralıdır; SM-2 veya kişisel unutma eğrisinin bilimsel olarak ölçüldüğü iddia edilmez.
- Aynı gün tekrar tekrar doğru yapmak veya tarihi gelmeden fazladan çalışmak aralığı büyütmez. Hata aynı gün yapılan düzeltmeyi ayrı bir başarılı öğrenme günü saydırmaz.

## İki çalışma biçimi

Yeni turlarda dinleme ve Türkçeden kurma soruları aynı ekranda dönüşümlü gelir; bilinen bir cümlenin zamanı gelen veya daha az çalışılmış biçimi önceliklidir. Türkçeden kurmada Türkçe baştan açıktır. Dinle ve Türkçesi düğmeleri her zaman bulunur.

Cevabı kontrol ettirmeden önce Dinle kullanıldıysa kayıt dinlemeye yazılır. Yalnızca Türkçe görüldüyse Türkçeden kurmaya yazılır. Sonuç sonradan dinlenince önceki bağımsız yanıtın türü değişmez. Geçmişte yardım biçimi bilinmeyen kayıtlar bağımsız üretim başarısı olarak sayılmaz.

Tekrar köşesinde en az üç ayrı, zamanı gelmiş günde doğru cevaplanan cümle sayıları iki biçim için ayrı gösterilir. Bunlar öğrenme kanıtlarıdır, dilde ustalık garantisi değildir. Öğrendim düğmesi kullanıcının kendi işareti olarak kalır; tek doğru cevapla otomatik işaret konmaz.

## Kayıtların korunması

Hafıza mevcut `fatedreel-o11-book-v1` verisinin `practiceMemory` alanındadır; mevcut yedek ve hesap eşitlemesi bu alanı da kapsar. Öğrencinin ayrıca hesap açması gerekmez. Cümleler ses/metin kimlikleriyle izlenir. Sonuç geldiğinde yalnızca bir kez kaydedilir; sayfa yenilemek, cevabı tekrar göstermek veya Sonraki cümleye basmak ek başarı üretmez.

İlk açılışta aynı içerik sürümüne ait bilinen Workers AI hataları yalnızca zayıf hedef olarak aktarılır. Eski doğru cevaplara yardım biçimi veya başarılı gün uydurulmaz. Devam eden tur, taslaklar, notlar, işaretler ve bitmiş tur korunur. Hatalı bir hafıza alanı tüm kitap kaydını silmez.

Boş cevap, atlama, servis/kota hatası ve belirsiz değerlendirme öğrenme hatası olarak kaydedilmez. Tekrar köşesinden bitmiş bir konu açıldığında yeni kişisel tur hazırlanır; yarım kalan turun taslağı korunarak devam edilir.

## Doğrulama

`node o11/scripts/test-practice-memory.mjs`: ilerletilmiş saatle ayrı günler, erken ve aynı gün tekrar sınırı, hata sonrası aralık, dinleme/çeviri ayrımı, belirsiz ve çevrimdışı yanıtlar, 10+5 ve gelecek konu sınırı, farklı örneğin gecikmeli gelişi, eski kayıt aktarımı, JSON yedeği ve tek seferlik kayıt.

Gerçek tarayıcıda ayrı localhost test kaydı ve canlı Workers AI ile eksik am/about yanıtı, beşinci soruda farklı bir about örneği, doğru alternatif, ses destekli yanıtın dinlemeye yazılması, yenileme ve uygulamanın indirdiği JSON yedeği de kontrol edildi. Canlı kullanıcı kaydına test geçmişi eklenmedi.
