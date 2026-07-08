# 🏛️ PolSim Arcapada — Simulator Politik & Birokrasi Makro

Game simulasi politik **satire** berlatar negara fiksi **Republik Arcapada**, full loop:
buat karakter → kampanye → menang pemilihan → **menjabat & memerintah** → dihantui audit →
Game Over lewat **Operasi Tangkap Tangan** kalau serakah. Dunia game "hidup" karena
diperbarui berita dunia nyata yang diinterpretasi AI **dengan approval manusia**.

> Semua negara, kota, partai, tokoh, lembaga, dan perusahaan dalam game ini fiksi
> (pagar konten lengkap: lihat `DECISIONS.md`).

Target device utama: **tablet & mobile browser**. Stack: Next.js 14 (App Router) + TypeScript +
Tailwind + Framer Motion + Supabase (schema `polsim`) + n8n + Midtrans Snap (sandbox) + Anthropic API.

---

## Struktur proyek

```
/app                  → routes (peta, karakter, kampanye, command-center, leaderboard, shop, admin/news-review)
/app/api              → payment order, midtrans webhook, audit run, news mock-ingest
/components           → MapSVG, FactionMeter, StepperTimeline, PoliticianCard, CrisisCard,
                        AuditMeter, OfficeDecor, BreakingNews, SnapCheckout, dll
/lib                  → supabase clients, formula (character/elektabilitas/faksi/election/audit/score/wallet),
                        bps-transform, midtrans, content-guard
/data                 → seed data + region-mapping + config gameplay + fixtures berita
/scripts              → fetch-bps.ts, seed.ts, generate-seed-sql.ts, push-n8n.ts
/n8n/workflows        → 4 workflow JSON siap-import (prefix "PolSim — ")
/n8n/prompts          → prompt AI interpretasi berita (version-controlled)
/supabase/migrations  → SQL migrations (0001–0006)
/tests                → Vitest (43 test)
DECISIONS.md          → semua keputusan desain + catatan review konten
SUMMARY.md            → laporan akhir build
```

## Status environment (per build ini)

- ✅ Migrations 0001–0006 **sudah di-apply** ke project Supabase `nkqfdrgggrdwzseglyjm`, schema `polsim`.
- ✅ Seed data **sudah dimuat** (5 region, 4 faksi, 5 partai, 10 tokoh, 18 krisis, 8 vendor, 6 template sponsor, 8 kosmetik, 11 config).
- ✅ Audit engine diverifikasi live (flag + IPK + OTT + leaderboard).
- ⚠️ Nilai indikator region masih dari **fallback fiksi-realistis** — jalankan `npm run fetch:bps` setelah punya `BPS_API_KEY`.

## Setup

### 1. Env variables

```bash
cp .env.example .env.local
```

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nkqfdrgggrdwzseglyjm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard → Settings → API Keys (anon/publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API Keys. **Server only**, untuk webhook/admin/scripts |
| `BPS_API_KEY` | Registrasi gratis di https://webapi.bps.go.id → menu Registrasi → aktivasi email → salin App key |
| `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` | Sandbox: https://dashboard.sandbox.midtrans.com → Settings → Access Keys |
| `MIDTRANS_IS_PRODUCTION` | `false` (sandbox) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | = client key sandbox (dipakai Snap.js) |
| `N8N_API_URL` / `N8N_API_KEY` | Opsional, untuk `npm run push:n8n` |
| `NEXT_PUBLIC_APP_URL` | Base URL app |

### 2. Satu kali di Dashboard Supabase (manual, penting)

1. **Exposed schemas**: Settings → Data API → tambahkan `polsim` ke *Exposed schemas*
   (tanpa ini PostgREST tidak melayani tabel/RPC game).
2. **Auth**: Authentication → Providers → Email. Untuk demo cepat, matikan *Confirm email*
   (atau siapkan SMTP).
3. **Admin**: tambahkan dirimu sebagai reviewer berita — SQL editor:
   ```sql
   insert into polsim.admin_users(user_id)
   select id from auth.users where email = 'emailmu@contoh.com';
   ```

### 3. Migrasi & seed (bila memakai project/env baru)

Migration sudah applied di project ini. Untuk apply ulang/fresh:
jalankan file `supabase/migrations/0001..0006` berurutan via SQL editor / CLI, lalu:

```bash
npm install
npm run seed        # butuh SUPABASE_SERVICE_ROLE_KEY
npm run fetch:bps   # tarik BPS Web API → transformasi fiksi → update regions
                    # (tanpa BPS_API_KEY otomatis pakai fallback data/bps-fallback.json)
npm run seed:sql    # alternatif: cetak SQL seed idempotent ke stdout
```

### 4. Jalankan

```bash
npm run dev      # http://localhost:3000
npm test         # 43 unit test (formula & keamanan pembayaran)
npm run build    # build produksi (deploy-ready Vercel)
```

---

## Ringkasan formula (sinkron SQL ⇄ TS; unit-tested)

**Stat awal karakter** (`lib/formula/character.ts`)
- `uang = base_profesi × (1 + max(0, umur−25) × 1.5%)`; kepercayaan/koneksi = base profesi + bonus pendidikan (+umur/4 utk koneksi).
- Trait: `merakyat` (+8 kepercayaan, −5 koneksi) · `teknokrat` (+3/+5) ·
  **`oligarki`: uang ×3, dana kampanye 50% uang, kepercayaan −10, `utang_politik = 7` → sponsor MENAGIH saat menjabat** ·
  `vip` (premium): uang ×2, koneksi +15, tanpa debuff.

**Kompatibilitas calon wakil** (0–100): `50 + fit_ekonomi + fit_basis + (10 − |komunikasi|/10)` —
region timpang (gini ≥ 0.38) menghargai populis; region difficulty ≥ 4 menghargai basis elite.

**Elektabilitas awal**: `clamp(5 + 0.2·kepercayaan + 0.1·koneksi + afinitas_partai + 0.15·kompatibilitas, 5..45)`;
sisanya direbut lewat 5 crisis event (efek diaplikasikan server-side via RPC `apply_choice`, sekali per event).

**Trade-off faksi**: standing personal per faksi 0–100 (clamp), digeser pilihan krisis;
baseline dunia per region digeser world events yang di-approve.

**Hari pemilihan** (RPC `resolve_election`, deterministik tanpa RNG):
`final = 0.6·elektabilitas + 0.4·(0.5·rata2_standing_personal + 0.5·rata2_baseline_region) − (difficulty−1)·2` — menang bila `final ≥ 50`.

**IPK — Indeks Persepsi Kerawanan** (audit engine, `polsim.run_audit_engine`):

| Rule | Kondisi | Severity |
|---|---|---|
| `vendor_relational` | vendor proyek selesai `is_sponsor_linked` | 3 bila proyek titipan sponsor, selain itu 2 |
| `jam_tidak_wajar` | `executed_at` jam **00:00–03:59 UTC** | 2 |
| `anggaran_janggal` | markup = (anggaran−HPS)/HPS | >50% → 3 · >35% → 2 · >20% → 1 |

`IPK = clamp( Σ bobot[tipe]×severity + complied_sponsor×5 − proyek_bersih×4 , 0..100 )`
dengan bobot `vendor_relational=12, jam_tidak_wajar=8, anggaran_janggal=10`
(sumber: `data/config.ts` → tabel `game_config`). **IPK ≥ 80 → OTT** oleh Komisi Integritas
Arcapada → layar Game Over + `game_over_log` + skor masuk leaderboard (outcome `ott`).

**Skor akhir leaderboard**: `0.4·min(100, pembangunan) + 0.3·rata2_faksi + 0.3·(100 − IPK)`.

### Cara memancing flag audit (testing)

1. Buat karakter dengan trait **Penyandang Dana (Oligarki)** → menang pemilu → tagihan sponsor muncul → pilih **"Siap, diatur."** lalu eksekusi proyek titipannya (`vendor_relational` sev 3 + `anggaran_janggal`).
2. Di form proyek, geser **markup RAB > 20%** (>50% untuk severity 3).
3. Centang **"Mode lembur tengah malam"** sebelum eksekusi (`jam_tidak_wajar`).
4. Jalankan audit: workflow n8n *PolSim — Audit Engine*, atau on-demand sebagai admin:
   ```bash
   curl -X POST $APP/api/audit/run -H "Authorization: Bearer <access_token_admin>"
   ```
   Kombinasi (1)+(2)+(3) pada 2–3 proyek menghasilkan IPK ≥ 80 → OTT reproducible
   (diverifikasi juga oleh `tests/audit.test.ts` skenario "pancing OTT").

---

## Live News Layer

Arsitektur: **n8n (VPS) → RSS resmi → Anthropic `claude-sonnet-4-6` → `pending_events` → approval manusia → `world_events` → Supabase Realtime → breaking news di layar pemain.**
Cadence 1×/hari. **Tidak ada jalur auto-publish.**

### Import & aktivasi workflow n8n

1. n8n UI → **Workflows → Import from File** → import 4 file dari `/n8n/workflows/`
   (semua bernama `PolSim — …`; tidak menyentuh workflow lain).
2. Buat credentials (Credentials → New → **Custom Auth**):
   - **`PolSim Supabase Service Role`** — JSON:
     ```json
     { "headers": { "apikey": "SERVICE_ROLE_KEY", "Authorization": "Bearer SERVICE_ROLE_KEY" } }
     ```
   - **`PolSim Anthropic API`** — JSON: `{ "headers": { "x-api-key": "sk-ant-..." } }`
   - **`PolSim Fonnte`** (opsional, WhatsApp) — `{ "headers": { "Authorization": "TOKEN_FONNTE" } }`
3. Set env instance n8n: `BPS_API_KEY=...` (dipakai *PolSim — BPS Refresh*).
4. Pasangkan credential di node yang menandai placeholder, klik **Activate** per workflow.
5. WhatsApp approval: set webhook Fonnte ke URL webhook workflow, isi nomor admin di node
   *Parse Perintah*; format perintah `SETUJU <pending_id>` / `TOLAK <pending_id>`.
6. Alternatif via API: isi `N8N_API_URL` + `N8N_API_KEY` lalu `npm run push:n8n`
   (hanya membuat/meng-update workflow berprefix `PolSim — `, dibuat non-aktif).

### Uji end-to-end lokal (tanpa n8n)

1. Login sebagai admin → `/admin/news-review` → **"Muat fixture berita (dev)"**
   (3 berita fixture → interpretasi → `pending_events`).
2. Review: berita sumber + interpretasi AI + draft event + peringatan *content-guard* → **Approve**.
3. Event masuk `world_events` → pemain online melihat **breaking news** beranimasi (Realtime),
   baseline kepuasan faksi bergeser, dan event tampil di tahap Perang Elektabilitas +
   panel VIP "Analisis Arah Dunia".

---

## Monetisasi & pembayaran (sandbox)

- **Token Kebijakan**: aksi berat memotong saldo via RPC atomic (`spend_tokens`) —
  eksekusi proyek 5 (besar 8), lobi MPD 3. **Gratis 10 token/hari** (klik lencana 🪙; config `data/config.ts`).
- **VIP "Intelijen Pusat"**: blok 30 hari yang bisa diperpanjang (bukan auto-recurring; lihat DECISIONS §7).
  Membuka region ibu kota, panel Analisis Arah Dunia, trait premium.
- **Kosmetik**: dibeli dengan token; dekorasi ruang kerja tampil di Command Center, lencana tampil di leaderboard.

### Alur aman (KRITIS)

1. Order dibuat **server-side** (`/api/payment/order`) — harga selalu dari `game_config`, bukan dari client.
2. Client hanya membuka **Snap popup** (QRIS/VA tersedia otomatis di sandbox).
3. Status order **hanya** berubah lewat `/api/payment/webhook` dengan verifikasi
   `sha512(order_id + status_code + gross_amount + ServerKey)`; callback/redirect client diabaikan.
4. Benefit idempoten: `credit_tokens` menolak double-credit per `order_id`; subscription satu per order;
   notifikasi telat tidak bisa menurunkan status order yang sudah paid.

### Menguji pembayaran di sandbox

1. Isi key sandbox di `.env.local`; jalankan app; buka **Toko** → pilih paket → Snap popup muncul.
2. Bayar dengan test instrument Midtrans: kartu `4811 1111 1111 1114` (CVV `123`, exp bebas masa depan,
   OTP `112233`), atau QRIS/VA lalu tandai lunas via https://simulator.sandbox.midtrans.com
3. Webhook: Dashboard sandbox → Settings → Configuration → **Payment Notification URL** →
   `https://<url-publikmu>/api/payment/webhook` (lokal: pakai tunnel mis. `ngrok http 3000`).
4. Setelah settlement → webhook terverifikasi → saldo token/VIP bertambah otomatis (refresh ±5 detik).

### ✅ Checklist Go-Live Pembayaran (manual saat pindah produksi)

- [ ] Buat akun & lengkapi KYC di dashboard **produksi** Midtrans; tunggu approval.
- [ ] Ganti `MIDTRANS_SERVER_KEY`/`MIDTRANS_CLIENT_KEY`/`NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` dengan key produksi.
- [ ] Set `MIDTRANS_IS_PRODUCTION=true` (helper otomatis pindah ke `app.midtrans.com`).
- [ ] Ganti URL Snap.js di `components/SnapCheckout.tsx` ke `https://app.midtrans.com/snap/snap.js`.
- [ ] Daftarkan **Payment Notification URL produksi** di dashboard Midtrans.
- [ ] Aktivasi channel QRIS (perjanjian terpisah) & channel lain yang diinginkan.
- [ ] Review compliance: harga & deskripsi item jelas, kebijakan refund, batas usia, dan
      pastikan "token" tidak bisa diuangkan kembali (aturan uang elektronik).
- [ ] Uji satu transaksi kecil end-to-end di produksi sebelum diumumkan.

---

## Performa & motion

- Semua animasi hanya **transform/opacity** (60fps target tablet mid-range); stat memakai count-up spring.
- `prefers-reduced-motion` dihormati global (CSS) + per-komponen (`useReducedMotion`).
- Peta = SVG 2.5D (CSS 3D transform + drop-shadow filter), **tanpa Three.js di gameplay inti**.
- Babak IV berpindah penuh ke *Dark Mode Command Center* (perubahan theme dramatis, gradasi radial).
- Komponen berat dimuat per-route oleh App Router; Snap.js dimuat lazy hanya di Toko.

## Keamanan data

- RLS ketat: data personal per `auth.uid()`; referensi read-only; `bps_raw_cache`, `news_raw`,
  `pending_events`, `audit_flags`, `ipk_scores` service-role-only (pemain hanya melihat agregat IPK via RPC).
- Semua mutasi sensitif = fungsi Postgres `SECURITY DEFINER` dengan validasi `auth.uid()` + update kondisional atomic.
- Tidak ada credential di repo; semua via env. Schema `public` (EAM lama) tidak disentuh.
