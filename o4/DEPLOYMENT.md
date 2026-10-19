# /o4 web yayını

FatedReel statik yayın deposu için web/ dizini hazırlanmıştır. index.html, app.js, style.css ve worker.js Türkçe arayüzü oluşturur. Mesa modeli model.py ile birebir aynıdır; JavaScript'e çevrilmemiştir. Hesaplama Pyodide 314.0.6 üzerinde Python 3.14.2 ile module Web Worker içinde yapılır.

Başlangıçta experiment.json içindeki native Python 3.14.4 / Mesa 3.5.1 ile hesaplanmış 100 x 240 aylık sonuç gösterilir. Yeniden hesaplama gerçek Python/Mesa modelini çalıştırır. Runtime NumPy 2.4.6, pandas 3.0.2, SciPy 1.18.0 sürümlerini kullanır; sürümler runtime/pyodide-lock.json içinde kilitlidir. Python ve NumPy sürümleri arasında birebir bit düzeyinde eşitlik garanti edilmez. Aynı çalışma ortamı, tohum ve parametreler yeniden üretim içindir.

runtime/ dosyaları ve Mesa wheel aynı siteden sunulur; üçüncü taraf CDN çağrısı yapılmaz. Ağdan yalnızca kullanıcı sayfasının kendi origin dosyaları indirilir. Yeniden hesaplama cihazın hızına göre sürebilir; Durdur düğmesi worker'ı sonlandırır ve önceki tamamlanmış sonucu korur. Sekme kapatılırsa sonuç korunmaz; JSON indirerek saklayın.

Yerel önizleme: `.venv/Scripts/python -m http.server 8502 --directory web`.

Yayın yolu: C:/Users/aa/Documents/github/fatedreel deposunun güncel origin/main dalından ayrılan fatedreel-o4 çalışma kopyasında o4/ dizini; root _redirects içinde /o4 -> /o4/ yönlendirmesi. Mevcut site dosyalarına dokunulmaz. Yayımdan sonra HTML, worker, wasm ve veriler HTTP ve gerçek tarayıcıda doğrulanmalıdır.

## Üçüncü taraf yazılım
Pyodide 314.0.6: https://github.com/pyodide/pyodide/releases/tag/314.0.6 (runtime/LICENSE).
Mesa 3.5.1: https://pypi.org/project/Mesa/3.5.1/ (BSD-3-Clause; wheel içinde lisans).
NumPy, pandas, SciPy, networkx ve diğer Python paketlerinin sürümleri/hashes runtime/pyodide-lock.json içindedir. Lisanslar wheel dağıtımlarının .dist-info dizinlerinde korunur. download_runtime.py tüm seçilen wheel dosyalarının SHA256 değerlerini lock ile doğrular.
