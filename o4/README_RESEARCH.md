# Araştırma sürümünü çalıştırma

Bu paket iki modeli içerir. V1 sınır yığılması kusuruyla arşivlenmiştir. V2 yalnızca araştırma adayıdır: clip kaldırılmış olsa da siyasi endekslerde uçlara yakın iki çekici sürmektedir. Hiçbiri gerçek Fransa için tahmin değildir. Önce AUDIT_V1.md ve STUDY_V2.md dosyalarını okuyun.

1. Python 3.14 ortamında `pip install -r requirements.txt` çalıştırın.
2. Sonuçları yeniden hesaplamadan incelemek için research-data.zip paketini bu kodla aynı klasöre çıkarın.
3. `python -m streamlit run app.py` ile Türkçe Python arayüzünü açın. Adres `/o4/` alt yolundadır.
4. `python -m pytest -q` doğrulama testlerini çalıştırır. Tam sonuç testleri araştırma verileri mevcutsa ayrıca denetlenir. Testler ampirik geçerlilik kanıtı değildir.
5. `python audit_v1.py` eski 100 deneyi ve şok kapatma kontrolünü kuralları değiştirmeden tekrarlar.
6. `python run_v2_study.py` deney öncesi tanımlı 15 yapılandırmada 100'er bağımsız tohumla toplam 1500 V2 yolu üretir; dört yerel işlem kullanır. Değişken bir hedef rejim payı yoktur.
7. `python build_research_report.py` raporu ve Jacobian ayrıntılarını; `python plot_research.py` araştırma grafiklerini üretir.

Web arayüzünü yerelde çalıştırmak için ayrıca `python download_runtime.py`, ardından `python prepare_web_research.py` ve `python -m http.server 8502 --directory web` çalıştırın. Runtime wheel dosyaları SHA256 ile denetlenir. İlk V1 verileri research-data.zip içinde results/ altında, V2 ana verileri v2_results/scenario_0/ altında bulunur.

V1/V2 rejim eşikleri aynıdır. İlk grafik bütün 100 yolun 20. yıl sınıf dağılımıdır. Tekil yollar ayrı sekmededir; tek deney, deneylerin medyanı ve ortalaması açıkça ayrılır. Ortalama yol rejim olarak sınıflandırılmaz. Sıfır sayılı sınıflar gizlenmez. Monte Carlo aralıkları yalnızca tohum değişkenliğidir; model ve gerçek dünya belirsizliğini içermez.

Deney öncesi tasarım MODEL_V2.md, kaynak doğrulaması research/v2/preregistration.json ve source_manifest.json içindedir. Dosyaları değiştirirseniz bu deneyin aynısını değil yeni bir model sürümünü çalıştırmış olursunuz. Sonuç sonrası açıklamalar MODEL_V2_IMPLEMENTATION.md dosyasındadır; kaynak katsayıları değiştirilmemiştir.
