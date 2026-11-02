# O14 · Cümle Atölyesi

O11’in 01 Cümle kurmanın temelleri ve 02 Günlük hayat ve şimdi bölümlerinin 14 konusunu kapsayan web uygulaması. Her konuda 10, toplam 140 görev: 2 PickAnOption, 2 TextWithOptions, 2 YesNoQuestion, 4 PickAnOrder.

## Kaynak ve uyarlama

https://github.com/agolikov/grammar-guide, MIT, Copyright (c) 2024 Alexander Golikov. Lisans GRAMMAR-GUIDE-LICENSE.txt içinde korunur.

Flutter `client/lib/model/exercise.dart` türleri ve `view/widget/exercise/construct_sentence.dart`, `validator.dart`, `single_choice_test.dart`, `complete_sentence_widget.dart`, `yes_no_question.dart` bileşenlerinin alıştırma akışı tarayıcı JavaScript’ine uyarlanmıştır. Özellikle PickAnOrder için kelime havuzundan cevaba taşıma, geri alma ve bütün parçalar seçildikten sonra doğrulama davranışı korunur. Bu dağıtım orijinal Flutter istemcisini veya .NET API’yi çalıştırmaz. Google Cloud, Gemini, Vertex ve MongoDB gerektirmez; AI içerik üretimi sunmaz.

Anlatım, sorular ve örnekler O11 book.json ilk iki bölümünden alınır; doğru/yanlış cümleleri yanlış seçeneklerden türetilir ve editoryal olarak kontrol edilir. Sesler mevcut `/o11/audio/` Caro Davy MP3 dosyalarıdır. Orijinal sesleri çoğaltmaz. O14, O11 ses yoluna bağımlıdır.

## Davranış

Karma tur ve tek tür turları, kısa anlatım, cevap kontrolü, açıklama, cevap sonrası dinleme, yanlış tekrarı, bitiş özeti ve açık/koyu tema. Sıralama sabit örnek cümleyi kurma görevidir; serbest çeviri değerlendirmesi değildir. Boşluk ve seçenekler yalnızca verilen seçeneklere göre değerlendirilir.

`fatedreel-o14-v1` localStorage kaydı üniteyi, seçili türü, kelime sırasını, yanıtı, sonuçları ve tamamlanmış turu saklar. Cevabı göster yanlış sayılmaz; doğruluk yüzdesine dönüştürülmeyen doğru/yanlış/gösterilen sayıları ayrı sunulur. Kayıt hataları kullanıcıya bildirilir. Hesap veya cihazlar arası eşitleme yoktur. O11 kayıtlarına dokunulmaz.

Statik HTML/CSS/JS; build gerektirmez. `/o14` → `/o14/` yönlendirmesi; dosyalar yeniden doğrulamalı önbellek başlığıyla sunulur. Google Fonts erişilemezse Arial kullanılır.

## Doğrulama

Görev klasöründeki `test-o14.cjs` DOM tabanlı test, linkedom ile 140 doğru cevap, yanlış/atlama/tekrar, cevap ve kelime diziliminin yenilemede korunması, tamamlanan turun yeniden açılmaması, tema, anlatım, depolama ve içerik yükleme hatalarını kapsar. Ses dosyalarının tamamının varlığı denetlenir. Bu test gerçek tarayıcıda görsel/mobil veya ses oynatma testi yerine geçmez.
