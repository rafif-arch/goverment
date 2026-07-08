# 🚀 SETUP.md — Checklist "Tinggal Isi"

Ikuti dari atas ke bawah. Semua yang perlu kamu lakukan hanyalah **menyalin key ke tempatnya**
dan mencentang. Kode, schema, dan seed sudah beres — tidak ada yang perlu ditulis ulang.

---

## Langkah 0 — Salin template env (sekali)

```bash
cp .env.example .env.local
```

> `.env.local` tidak akan pernah ter-commit (sudah di `.gitignore`).

---

## Langkah 1 — Supabase (5 menit) ⭐ WAJIB

Project: **Enterprise Asset Management** (`nkqfdrgggrdwzseglyjm`) — sudah berisi schema
`polsim` lengkap dengan seed. Kamu tinggal:

- [ ] **1a.** Buka https://supabase.com/dashboard/project/nkqfdrgggrdwzseglyjm/settings/api
      → salin **anon key** → tempel ke `.env.local`:
      ```
      NEXT_PUBLIC_SUPABASE_ANON_KEY=<<TEMPEL_DI_SINI>>
      ```
- [ ] **1b.** Di halaman yang sama → salin **service_role key** → tempel:
      ```
      SUPABASE_SERVICE_ROLE_KEY=<<TEMPEL_DI_SINI>>
      ```
- [ ] **1c.** ⭐ **Exposed schemas** (tanpa ini app tidak bisa baca data):
      Dashboard → **Settings → Data API → Exposed schemas** → tambahkan `polsim` → Save.
- [ ] **1d.** Matikan konfirmasi email (demo cepat):
      **Authentication → Sign In / Providers → Email → Confirm email = OFF**.
- [ ] **1e.** Jadikan dirimu admin (untuk halaman Review Berita) — buka **SQL Editor**, jalankan
      *setelah* kamu mendaftar sekali lewat halaman app (`npm run dev` → Daftar):
      ```sql
      insert into polsim.admin_users(user_id)
      select id from auth.users where email = '<<EMAIL_AKUN_GAME_KAMU>>';
      ```

✅ Cek: `npm run dev` → daftar akun → peta `/peta` menampilkan 5 region berwarna.

---

## Langkah 2 — Midtrans Sandbox (5 menit) — untuk fitur Toko

- [ ] **2a.** Daftar/masuk https://dashboard.sandbox.midtrans.com
      → **Settings → Access Keys** → salin & tempel ke `.env.local`:
      ```
      MIDTRANS_SERVER_KEY=<<SB-Mid-server-...>>
      MIDTRANS_CLIENT_KEY=<<SB-Mid-client-...>>
      NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=<<SB-Mid-client-... (sama dgn atas)>>
      MIDTRANS_IS_PRODUCTION=false
      ```
- [ ] **2b.** Supaya webhook sampai ke laptopmu, buka tunnel:
      ```bash
      npx ngrok http 3000   # atau cloudflared tunnel --url http://localhost:3000
      ```
- [ ] **2c.** Dashboard sandbox → **Settings → Configuration → Payment Notification URL**:
      ```
      https://<<URL_TUNNEL_KAMU>>/api/payment/webhook
      ```

✅ Cek: buka `/shop` → beli Paket Uang Saku → bayar kartu test
`4811 1111 1111 1114` / CVV `123` / OTP `112233` → saldo 🪙 bertambah ±5 detik.

---

## Langkah 3 — BPS Web API (3 menit) — data statistik sungguhan

- [ ] **3a.** Registrasi gratis di https://webapi.bps.go.id/developer → aktivasi email
      → salin **App key (token)** → tempel:
      ```
      BPS_API_KEY=<<TEMPEL_DI_SINI>>
      ```
- [ ] **3b.** Jalankan:
      ```bash
      npm run fetch:bps
      ```
      Lihat lognya — kalau ada indikator yang jatuh ke fallback, itu normal
      (ID variabel BPS kadang berubah; game tetap jalan).

---

## Langkah 4 — n8n di VPS-mu (10 menit) — dunia "hidup" & audit otomatis

- [ ] **4a.** n8n UI → **Workflows → Import from File** → import 4 file dari `n8n/workflows/`.
- [ ] **4b.** Buat credential **Custom Auth** bernama persis `PolSim Supabase Service Role`, isi JSON:
      ```json
      { "headers": { "apikey": "<<SERVICE_ROLE_KEY>>", "Authorization": "Bearer <<SERVICE_ROLE_KEY>>" } }
      ```
- [ ] **4c.** Credential Custom Auth `PolSim Anthropic API`:
      ```json
      { "headers": { "x-api-key": "<<sk-ant-...>>" } }
      ```
      (buat key di https://console.anthropic.com)
- [ ] **4d.** Set env di instance n8n: `BPS_API_KEY=<<key langkah 3>>` lalu restart n8n.
- [ ] **4e.** Pasangkan credential di node yang bertanda, lalu **Activate**:
      `PolSim — Daily News Pipeline`, `PolSim — Audit Engine`, `PolSim — BPS Refresh`.
- [ ] **4f.** (Opsional, WhatsApp approval) isi credential `PolSim Fonnte`
      (`{"headers":{"Authorization":"<<TOKEN_FONNTE>>"}}`), set webhook Fonnte ke URL webhook
      workflow, dan ganti `62xxxxxxxxxxx` di node *Parse Perintah* dengan nomormu.

> Tidak mau klik-klik? Isi di `.env.local`:
> ```
> N8N_API_URL=<<https://n8n.domainmu.com>>
> N8N_API_KEY=<<api key n8n>>
> ```
> lalu `npm run push:n8n` — workflow terkirim otomatis (nonaktif, credential tetap manual).

✅ Cek tanpa menunggu jadwal: login admin → `/admin/news-review` → **"Muat fixture berita (dev)"**
→ Approve satu → breaking news muncul di semua tab yang sedang login.

---

## Langkah 5 — (Opsional) Deploy Vercel

- [ ] Import repo di https://vercel.com/new → framework Next.js terdeteksi otomatis.
- [ ] Salin SEMUA isi `.env.local` ke **Project Settings → Environment Variables**.
- [ ] Update `NEXT_PUBLIC_APP_URL` ke domain Vercel + ganti Payment Notification URL Midtrans
      ke `https://<domain>/api/payment/webhook` (tidak perlu tunnel lagi).

---

## Kalau ada yang aneh

| Gejala | Obat |
|---|---|
| Peta kosong / error `PGRST106` | Langkah **1c** belum: `polsim` belum masuk *Exposed schemas* |
| Tidak bisa daftar/masuk | Langkah **1d**: matikan Confirm email, atau cek folder spam |
| Menu 🛡️ Review Berita tak muncul | Langkah **1e** belum dijalankan / email tidak cocok |
| Saldo tidak bertambah setelah bayar | Webhook tidak sampai: cek tunnel & Notification URL (2b–2c) |
| Token habis saat main | Klik lencana 🪙 di bilah atas (jatah 10/hari), atau top-up |
| Ingin memancing OTT utk demo | README bagian "Cara memancing flag audit" |
