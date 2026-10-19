# Hesaplanan deney ve doğrulama raporu

Bu rapor sentetik model çıktılarıdır; Fransa tahmini değildir.

Ana deney: 100 bağımsız tohum, 240 aylık geçiş; 24100 kayıt.

## Ana sonuçlar

- Demokrasi: 89/100, Wilson %95 aralığı %81.4–%93.7.
- Otoriter: 10/100, Wilson %95 aralığı %5.5–%17.4.
- Kırılgan yönetim: 1/100, Wilson %95 aralığı %0.2–%5.4.

## Sayısal doğrulama

Sonlu ve [0,1] aralığındaki endeksler: True.

Sınırda (0 veya 1) aylık gözlem payları:

- concentration: %69.2
- liberties: %67.7
- violence: %67.0
- prosperity: %54.4
- trust: %63.6
- independence: %68.4

Yüksek sınır payları modelin clip ve geri besleme yapısının etkisidir; ampirik kesinlik göstermez. İç savaşın bu örneklemde görülmemesi yapısal olarak imkânsız olduğunu kanıtlamaz; bu sınıfın erişilebilirliği ve şiddet dinamiklerinin kalibrasyonu ayrıca araştırılmalıdır.

## Başlangıç koşulları

scenario           regime          
Devrim             Demokrasi            89
                   Kırılgan yönetim      1
                   Otoriter             10
Kurumların devamı  Demokrasi           100
Parçalanma         Demokrasi             6
                   Otoriter             94
Uzlaşma            Demokrasi           100

## Tek etkenli duyarlılık

    parameter  value  authoritarian_rate  paired_difference  paired_mc_se
   resilience   0.50                0.18               0.08      0.027266
   resilience   1.50                0.09              -0.01      0.010000
  shock_scale   0.50                0.10               0.00      0.000000
  shock_scale   1.50                0.12               0.02      0.014071
protest_scale   0.50                0.10               0.00      0.000000
protest_scale   1.50                0.13               0.03      0.017145
  leader_bias  -0.25                0.00              -0.10      0.030151
  leader_bias   0.25                0.83               0.73      0.044620

Pay farkları eşleştirilmiş tohumlarla hesaplanmıştır. paired_mc_se farkın Monte Carlo standart hatasıdır; model belirsizliği değildir.

En büyük tek etken etkisi lider_bias +0.25 varyantında görülmüştür: otoriter payı %10’dan %83’e çıkmıştır. Kurumsal dayanıklılık 0.5 olduğunda pay %18 olmuştur. Bu sonuçlar katsayıların ve başlangıç koşullarının ürünü olup gerçek Fransa hakkında tahmin değildir. Kontrolde ve uzlaşmada 100/100 demokrasi görülmesi, bu modelin olumlu başlangıçlarda güçlü çekim havzasına sahip olduğunu düşündürür; ampirik bir kesinlik iddiası değildir.
