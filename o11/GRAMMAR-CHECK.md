# İngilizce kontrolü — Cloudflare Workers AI etkin

Cloudflare Production ortamında AI bağlantısı eklendi ve sunucu hazır. Llama 3.3 70B ile gerçek 20 örnek 30 Ekim 2026 tarihinde 20/20 geçti; doğru alternatiflerde yanlış hata sayısı 0. Testler yalnızca doğru/yanlış kararını değil hata türünü, düzeltilen İngilizce parçayı, cümleye özel açıklamayı ve zaman adı verilmemesini de denetler. Sonuçlar `scripts/workers-ai-evaluation.json` dosyasındadır.

Ana ekran `requestMeaningCheck` ile `/api/o11/check` servisini kullanır. Öğrencinin ayrı API hesabına ihtiyacı yoktur. Kota/bağlantı hatası öğrenci yanlışı sayılmaz; tekrar deneme sunulur. Eski yerel denetim sonuçları arşivlenir, model sonucu olarak yeniden kullanılmaz. Notlar ve konu ilerlemesi korunur.

## Hazır parçalar

- `functions/_lib/o11-grammar.js`: verilen sistem prompt'u, strict JSON Schema, OpenAI Responses isteği (`temperature: 0`, `store: false`), sınırlandırılmış girdiler, yanıt doğrulama ve `correct = errors.length === 0` değişmezi. Geçerli cümle model tarafından başka bir üsluba çevrilirse kod öğrencinin kendi cümlesini korur.
- `functions/api/o11/check.js`: `POST /api/o11/check` tam olarak `{turkish, accepted, student}` alır. GET yalnızca bağlantı durumunu döndürür. Anahtarlar hiçbir zaman istemciye gönderilmez. Geçersiz veya eksik model çıktısı hata olarak işlenir; yanlış öğrenci cevabı gibi gösterilmez.
- `o11/meaning-check.js`: hazırlanmış istemci, güvenli kısa geri bildirim, isteğe bağlı notlar, uygun he/she/they ve cook/make/prepare örnekleri. `app.js` bu istemciyi kullanıyor. Hiçbir bağlantı hatası yerel model-cevap karşılaştırmasına sessizce düşmez. `createSentencePractice` motorundaki `check` ve `renderResult` seçenekleriyle gerçek akışa takılmaya hazırdır; bekleme, tekrar deneme, eski yanıtı iptal etme ve kontrol sonuçlarını kaydetme tamamlanmıştır. Ana uygulama bu seçenekleri Workers AI ile kullanıyor.
- `o11/scripts/grammar-cases.json`: 20 gerçek model değerlendirmesi. İlk 10 cümle doğru alternatifler, son 10 cümle yazım/dilbilgisi/anlam hataları içerir. `diner/dinner`, açık cinsiyet ve yanlış zaman örnekleri dahildir.

## Seçilen bağlantı: Cloudflare Workers AI

Kullanıcı Workers AI seçti. Backend `env.AI.run` bağlantısını destekler ve varsa OpenAI yerine onu kullanır. Varsayılan model `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; `temperature: 0`, `stream: false`, `response_format: {type: 'json_schema', json_schema: OUTPUT_SCHEMA}`. JSON metni ve nesne yanıtları doğrulanır; kota, zaman aşımı veya geçersiz yanıt öğrenci hatası olarak işlenmez.

Mevcut Pages projesinde **Settings → Bindings → Add → Workers AI**, değişken adı **AI**, Production ortamı. Ardından projeyi yeniden dağıtın. Bu yol yeni OpenAI hesabı veya API anahtarı gerektirmez. Mevcut D1/Google bağlantılarını değiştirmeyin ve sırf AI eklemek için eksik bir Wrangler yapılandırması oluşturmayın.

`GET /api/o11/check` sonucu `ready: true`, `provider: workers-ai` olunca gerçek 20 örnek `node o11/scripts/eval-grammar.mjs https://fatedreel.com/api/o11/check` ile sınanmalıdır. Bu testler geçtikten sonra ana ekran Workers AI denetimine geçirildi. Backend taşıma/sözleşme testlerinin geçmesi, gerçek model değerlendirmesinin geçtiği anlamına gelmez.

Belgeler: [Pages Workers AI bağlantıları](https://developers.cloudflare.com/pages/functions/bindings/#workers-ai), [Workers AI JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/).

## İsteğe bağlı alternatif: OpenAI

Cloudflare Pages → fatedreel → Settings → Variables and Secrets bölümüne `OPENAI_API_KEY` **secret** olarak eklenmelidir. Anahtarı sohbet mesajına veya depoya yazmayın. İsteğe bağlı `O11_GRAMMAR_MODEL`, varsayılan `gpt-4.1-mini` değerini değiştirir. Sonrasında yeni dağıtım gerekir. Mevcut `PROGRAM_DB` D1 bağı, anonim kullanımla uyumlu hız/kullanım sınırı için kullanılır; yeni ücretli kaynak alınmaz. Kontrol metinleri bu tabloya yazılmaz.

`GET https://fatedreel.com/api/o11/check` artık `ready:true`, `provider:workers-ai` döndürür. OpenAI anahtarı kullanılmaz.

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
