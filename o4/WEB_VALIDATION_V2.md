# V2 web doğrulaması

Python/Mesa V2 motoru Pyodide Python 3.14.2 üzerinde tarayıcıda 100 x 240 ay yeniden çalıştırıldı. İndirilen JSON 24100 kayıt/100 sonuç içeriyor. Native Python 3.14.4 sonuçlarıyla rejim sınıfları ve olaylar eşit, aylık sayısal değerler 1e-12 toleransla eşleşiyor. V1/V2 seçimi, dağılım varsayılanı, tekil yol/ortalama/medyan ayrımı ve JSON indirme tarayıcıda doğrulandı. Bu kontrol ampirik model validasyonu değildir.

Python doğrulama testleri: 32 geçti (model, tekrar üretim, sınır hareketi, şok akışları, deney öncesi hash, 1500 yörünge ve arayüz). Rejim yüzdeleri hiçbir testin başarı ölçütü değildir.
