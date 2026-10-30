# İngilizce kontrolü — hesapsız yerel sürüm etkin

Uygulama artık `local-check.js` ile hesapsız ve çevrimdışı denetim kullanır. Bu bir anlam modeli değildir: bilinen eşdeğerleri kabul eder, açık hataları kısa Türkçe açıklamayla gösterir. Değerlendiremediği farklı ifadeyi açıkça belirtir ve doğru/yanlış puanlamasına katmaz. 20 örnek, 480 özgün cevap ve belirsiz alternatifler gerçek yerel kodla sınanır (`node o11/scripts/test-local-check.mjs`). Model tabanlı servis aşağıda isteğe bağlı teknik altyapı olarak belgelenmiştir; uygulama ona istek göndermez.

## Hazır parçalar

- `functions/_lib/o11-grammar.js`: verilen sistem prompt'u, strict JSON Schema, OpenAI Responses isteği (`temperature: 0`, `store: false`), sınırlandırılmış girdiler, yanıt doğrulama ve `correct = errors.length === 0` değişmezi. Geçerli cümle model tarafından başka bir üsluba çevrilirse kod öğrencinin kendi cümlesini korur.
- `functions/api/o11/check.js`: `POST /api/o11/check` tam olarak `{turkish, accepted, student}` alır. GET yalnızca bağlantı durumunu döndürür. Anahtarlar hiçbir zaman istemciye gönderilmez. Geçersiz veya eksik model çıktısı hata olarak işlenir; yanlış öğrenci cevabı gibi gösterilmez.
- `o11/meaning-check.js`: hazırlanmış istemci, güvenli kısa geri bildirim, isteğe bağlı notlar, uygun he/she/they ve cook/make/prepare örnekleri. `app.js` henüz bunu çağırmıyor. Hiçbir bağlantı hatası yerel model-cevap karşılaştırmasına sessizce düşmez. `createSentencePractice` motorundaki `check` ve `renderResult` seçenekleriyle gerçek akışa takılmaya hazırdır; bekleme, tekrar deneme, eski yanıtı iptal etme ve kontrol sonuçlarını kaydetme tamamlanmıştır. Ana uygulama bu seçenekleri yerel denetim ile kullanıyor.
- `o11/scripts/grammar-cases.json`: 20 gerçek model değerlendirmesi. İlk 10 cümle doğru alternatifler, son 10 cümle yazım/dilbilgisi/anlam hataları içerir. `diner/dinner`, açık cinsiyet ve yanlış zaman örnekleri dahildir.

## Seçilen bağlantı: Cloudflare Workers AI

Kullanıcı Workers AI seçti. Backend `env.AI.run` bağlantısını destekler ve varsa OpenAI yerine onu kullanır. Varsayılan model `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; `temperature: 0`, `stream: false`, `response_format: {type: 'json_schema', json_schema: OUTPUT_SCHEMA}`. JSON metni ve nesne yanıtları doğrulanır; kota, zaman aşımı veya geçersiz yanıt öğrenci hatası olarak işlenmez.

Mevcut Pages projesinde **Settings → Bindings → Add → Workers AI**, değişken adı **AI**, Production ortamı. Ardından projeyi yeniden dağıtın. Bu yol yeni OpenAI hesabı veya API anahtarı gerektirmez. Mevcut D1/Google bağlantılarını değiştirmeyin ve sırf AI eklemek için eksik bir Wrangler yapılandırması oluşturmayın.

`GET /api/o11/check` sonucu `ready: true`, `provider: workers-ai` olunca gerçek 20 örnek `node o11/scripts/eval-grammar.mjs https://fatedreel.com/api/o11/check` ile sınanmalıdır. Bu testler geçene kadar ana ekran hesapsız yerel denetimde kalır. Backend taşıma/sözleşme testlerinin geçmesi, gerçek model değerlendirmesinin geçtiği anlamına gelmez.

Belgeler: [Pages Workers AI bağlantıları](https://developers.cloudflare.com/pages/functions/bindings/#workers-ai), [Workers AI JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/).

## İsteğe bağlı alternatif: OpenAI

Cloudflare Pages → fatedreel → Settings → Variables and Secrets bölümüne `OPENAI_API_KEY` **secret** olarak eklenmelidir. Anahtarı sohbet mesajına veya depoya yazmayın. İsteğe bağlı `O11_GRAMMAR_MODEL`, varsayılan `gpt-4.1-mini` değerini değiştirir. Sonrasında yeni dağıtım gerekir. Mevcut `PROGRAM_DB` D1 bağı, anonim kullanımla uyumlu hız/kullanım sınırı için kullanılır; yeni ücretli kaynak alınmaz. Kontrol metinleri bu tabloya yazılmaz.

`GET https://fatedreel.com/api/o11/check` şu anda `ready:false`, `reason:model_not_configured` döndürüyor; Workers AI bağı da bulunmuyor. Bu gerçek sunucu kontrolüdür. Model anahtarı olmadığından 20 örnekte gerçek model başarısı iddia edilmez.

## Testler

```
node o11/scripts/test-grammar-contract.mjs
node o11/scripts/test-meaning-client.mjs
node o11/scripts/test-meaning-practice.mjs
```

Yukarıdakiler **sahte sağlayıcı yanıtlarıyla** şema, taşıma, tutarsız `correct` alanı, reddedilen/eksik yanıt, güvenli HTML ve örnek varyasyonlarını sınar. Modelin Türkçe anlamı değerlendirdiğini kanıtlamaz.

Anahtar tanımlı güvenli yerel ortamda veya canlı sunucu bağlantısıyla gerçek test:

```
node o11/scripts/eval-grammar.mjs
node o11/scripts/eval-grammar.mjs https://fatedreel.com/api/o11/check
```

İlk biçim `OPENAI_API_KEY` ortam değişkenini okur; ikinci biçim sunucudaki gizli anahtarı kullanır. `O11_EVAL_REPORT` verilirse sonuç dosyası o konuma yazılır. Değerlendirme eksikse, doğru bir cümleye hata bulunursa, hata türü beklentiye uymazsa veya açıklama hedef zamanın adını verirse komut başarısız olur. Bağlantı yoksa “NOT EVALUATED” yazar; başarılı model testi saymaz.

Sonraki adım: bağlantı hazır olunca gerçek testleri çalıştırmak, sonuçları incelemek ve ancak sonra alıştırma ekranını bu istemciye bağlamak. 15 soru, 10+5 dağılımı, sesler ve bitiş ekranı korunacak.

Çıktı biçimi: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
