# FatedReel Program

Okul ders programı uygulaması `https://fatedreel.com/program/` altında çalışır.

## Cloudflare ayarları

1. Cloudflare D1 veritabanı oluştur.
2. Pages projesine D1 binding ekle:
   - Binding adı: `PROGRAM_DB`
3. `program-schema.sql` dosyasındaki SQL'i D1 üzerinde çalıştır.
4. Google Cloud Console'da OAuth Client oluştur:
   - Application type: Web application
   - Authorized JavaScript origin: `https://fatedreel.com`
5. Cloudflare Pages environment variable ekle:
   - `GOOGLE_CLIENT_ID`: Google OAuth client id

## API yolları

- `GET /api/program/config`
- `POST /api/program/solve`
- `POST /api/program/auth/google`
- `GET /api/program/me`
- `GET /api/program/data`
- `PUT /api/program/data`
- `POST /api/program/logout`

Kayıtlar Google hesabına göre ayrılır. Aynı kullanıcı tekrar giriş yaptığında kendi ders programı verisi yüklenir.

## OR-Tools solver

Cloudflare Pages Python/OR-Tools calistirmadigi icin program uretme isi ayri bir Python servisine devredilir.

Lokal calistirma:

```bash
cd program
pip install -r requirements-solver.txt
uvicorn ortools_solver:app --host 127.0.0.1 --port 8090
```

Canli ortamda Cloudflare Pages environment variable:

- `ORTOOLS_SOLVER_URL`: Python solver servis adresi, ornek `https://solver.example.com`
