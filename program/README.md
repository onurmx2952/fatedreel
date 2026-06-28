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
- `POST /api/program/auth/google`
- `GET /api/program/me`
- `GET /api/program/data`
- `PUT /api/program/data`
- `POST /api/program/logout`

Kayıtlar Google hesabına göre ayrılır. Aynı kullanıcı tekrar giriş yaptığında kendi ders programı verisi yüklenir.

