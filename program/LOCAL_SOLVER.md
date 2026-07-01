# Yerel Ders Programı Solver

Bu klasördeki `ortools_solver.py`, Render yerine bu bilgisayarda çalışan OR-Tools API servisidir.

## 1. Kurulum

```powershell
powershell -ExecutionPolicy Bypass -File ".\local-solver-install.ps1"
```

## 2. Yerel server başlat

```powershell
powershell -ExecutionPolicy Bypass -File ".\local-solver-start.ps1"
```

Test:

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/health
```

## 3. Geçici Cloudflare Tunnel

```powershell
powershell -ExecutionPolicy Bypass -File ".\local-tunnel-quick-start.ps1"
```

Çıkan `https://....trycloudflare.com` adresini Cloudflare Pages `ORTOOLS_SOLVER_URL` değişkenine yazabilirsiniz.

## 4. Kalıcı kullanım

Cloudflare Dashboard üzerinden named tunnel açıp public hostname olarak örneğin:

```text
api.fatedreel.com -> http://127.0.0.1:8000
```

bağlayın. Sonra Cloudflare Pages Production değişkeni:

```text
ORTOOLS_SOLVER_URL=https://api.fatedreel.com
```

olmalı.

Bu bilgisayar kapanırsa, internet giderse, `uvicorn` veya `cloudflared` kapanırsa solver çalışmaz.

## 5. Windows açılışında otomatik başlatma

Admin yetkisi yoksa en kolay yöntem Startup klasörüdür.

Bu dosya gizli şekilde solver başlatır:

```text
local-solver-startup.vbs
```

Kullanıcının Startup klasörüne kopyalanırsa, Windows oturumu açılınca solver otomatik başlar:

```text
C:\Users\aa\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

Cloudflare Tunnel tarafı Windows servisi olarak `Automatic` çalışmalıdır.
