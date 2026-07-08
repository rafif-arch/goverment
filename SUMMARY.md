# SUMMARY.md — Laporan Akhir Build PolSim Arcapada

## Apa yang dibangun

Full-scope sesuai prompt v4, dikerjakan berurutan per milestone (7 commit terlacak):

1. **Schema Supabase lengkap** — 29 tabel + view di schema `polsim`, RLS ketat, 20+ fungsi RPC
   `SECURITY DEFINER` (wallet atomic, apply_choice, resolve_election, execute_project, lobi,
   sponsor, audit engine, review admin, leaderboard). **Semua migration (0001–0006) sudah
   di-apply live**; schema `public` (EAM) tidak disentuh.
2. **Pipeline BPS + seed** — `fetch-bps.ts` (BPS Web API resmi + fallback), transformasi
   deterministik mulberry32 ±5–15%, mapping provinsi→region fiksi. Seed lengkap **sudah dimuat
   live**: 5 region, 4 faksi, 5 partai (per archetype), 10 tokoh composite, 18 crisis event,
   8 vendor, 6 template proyek titipan, 8 kosmetik, 11 config key.
3. **Babak I–III** — peta SVG 2.5D interaktif + sidebar makro + meter faksi; character creator
   3 langkah dengan formula stat terbuka (trait Oligarki berefek penuh); stepper kampanye 4 tahap
   (tiket partai → wakil dengan kompatibilitas 4-axis → 5 krisis via RPC → pemilihan deterministik).
4. **Babak IV** — Dark Command Center, form KAK/RAB (slider markup), pemilihan vendor, lobi MPD,
   tagihan sponsor comply/refuse, AuditMeter agregat, dekorasi ruang kerja, layar OTT sinematik,
   leaderboard global dengan lencana.
5. **Live News Layer** — 4 workflow n8n siap-import (prefix `PolSim — `), prompt AI
   version-controlled, human-in-the-loop wajib (tanpa auto-publish), halaman admin review +
   content-guard, jalur WhatsApp/Fonnte (credential kosong), fixtures untuk uji E2E lokal,
   breaking news via Supabase Realtime.
6. **Monetisasi** — token (RPC atomic + daily grant), VIP 30 hari extendable, kosmetik;
   Midtrans Snap sandbox dengan order server-side, webhook signature SHA512, benefit idempoten.
7. **Testing & dokumentasi** — 43 unit test hijau (semua formula + wallet + signature),
   `npm run build` sukses, README lengkap, DECISIONS.md.

**Verifikasi live yang sudah dilakukan:** audit engine dijalankan terhadap kampanye simulasi di
database sungguhan → 5 flag benar (vendor sev 3+2, jam janggal sev 2, markup sev 2+3) → IPK 100 →
stage `game_over` + `game_over_log` + entri leaderboard outcome `ott`. Data uji sudah dibersihkan.

## Asumsi besar (detail di DECISIONS.md)

- Uang game dalam **juta Ʀupa** (mata uang fiksi) di semua kolom.
- Faction standing dua lapis: baseline dunia (global, digeser world events) + standing personal
  per kampanye (jsonb) — agar pilihan satu pemain tidak mengubah dunia pemain lain.
- Audit engine = fungsi Postgres deterministik; n8n hanya memanggil RPC (tidak ada logika ganda).
- VIP = pembelian blok 30 hari yang bisa diperpanjang, bukan subscription auto-recurring.
- Auth email+password (tanpa SMTP/magic-link); transisi stage ringan client-side dengan RLS,
  semua transaksi berdampak skor berjalan server-side.
- `resolve_election` & pemilihan krisis deterministik (tanpa RNG) demi testability.

## Status pipeline BPS

- Kode jalur API **lengkap** (`npm run fetch:bps`), tapi **belum pernah jalan dengan API key asli**
  (`BPS_API_KEY` tidak tersedia saat build). Region live memakai nilai fallback fiksi-realistis.
- ID variabel BPS (IPM 414, Gini 370, TPT 543) adalah *best guess* yang bisa berubah antar rilis
  BPS — parser dibuat toleran dan selalu jatuh ke fallback + log bila gagal. **Setelah registrasi,
  jalankan sekali dan cek lognya**; kalau var ID meleset, perbaiki di `data/region-mapping.ts`.

## Bagian yang paling butuh review konten (manusia) — lihat juga DECISIONS §9

1. **10 tokoh** di `data/politicians.ts` — self-check composite sudah dilakukan, butuh mata kedua.
2. 5 sejarah partai (`data/parties.ts`) & nama 5 region (kemungkinan tabrakan dengan nama desa kecil).
3. 18 crisis event (`data/crisis-events.ts`) — satire umum, pastikan tak menyentuh kasus berjalan.
4. Vendor/sponsor fiksi (`data/vendors.ts`, "Grup Singgasana").
5. Prompt interpretasi berita (`n8n/prompts/news-interpreter.md`) + hasil interpretasi hari-hari pertama.

## Yang harus kamu lakukan manual

1. **Supabase Dashboard**: tambahkan `polsim` ke *Exposed schemas* (Settings → Data API) — wajib
   sebelum app bisa membaca data; matikan *Confirm email* (atau pasang SMTP); salin
   `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`.
2. **Admin**: insert user_id kamu ke `polsim.admin_users` (SQL di README).
3. **BPS**: registrasi gratis di webapi.bps.go.id → isi `BPS_API_KEY` → `npm run fetch:bps`.
4. **Midtrans sandbox**: buat akun, salin server/client key, daftarkan Payment Notification URL.
5. **n8n**: import 4 workflow, buat 2–3 credential (`PolSim Supabase Service Role`,
   `PolSim Anthropic API`, opsional `PolSim Fonnte`), set env `BPS_API_KEY`, aktifkan.
6. (Opsional) Deploy ke Vercel — build sudah hijau; set semua env di project settings.

## Rekomendasi prioritas testing sebelum soft launch

1. **Full loop manual di browser** (paling penting): daftar → peta → karakter oligarki → menang →
   comply sponsor → eksekusi + markup + mode tengah malam → jalankan audit → OTT → leaderboard.
   (Jalur server-side-nya sudah diverifikasi live; jalur UI perlu dicoba manusia di tablet.)
2. **Pembayaran sandbox end-to-end** dengan webhook publik (tunnel), termasuk kirim ulang
   notifikasi dari dashboard Midtrans (menguji idempotensi credit).
3. **Pipeline berita hari pertama**: biarkan `PolSim — Daily News Pipeline` jalan 2–3 hari,
   review kualitas interpretasi + content-guard sebelum meng-approve apa pun.
4. **Kalah pemilu** (elektabilitas rendah) → pastikan leaderboard outcome `kalah`.
5. **Dua akun bersamaan** → cek RLS: tidak ada data pemain lain yang bocor, breaking news
   sampai ke keduanya.
6. Tablet mid-range nyata: cek 60fps peta & Command Center, mode `prefers-reduced-motion`.

## Definition of Done — status

| # | Kriteria | Status |
|---|---|---|
| 1 | `npm run build` sukses | ✅ |
| 2 | Test formula/wallet/signature passing | ✅ 43/43 |
| 3 | Pipeline BPS jalan / fallback terdokumentasi | ✅ (fallback aktif, API path siap) |
| 4 | Full loop tanpa crash + flag terpancing + OTT reproducible + leaderboard | ✅ server-side terverifikasi live; UI loop siap diuji manual |
| 5 | Live news E2E lokal (fixture → approve → world event → efek) | ✅ (fixtures + admin page + realtime) |
| 6 | Alur pembayaran sandbox testable | ✅ (butuh key sandbox + tunnel utk webhook) |
| 7 | 4 workflow n8n valid JSON + dokumentasi | ✅ |
| 8 | Animasi halus, reduced-motion, tanpa Three.js inti | ✅ |
| 9 | Politicians lolos self-check + catatan review | ✅ (DECISIONS §3, §9) |
| 10 | Tanpa nama entitas riil / credential hardcode | ✅ (content-guard tambahan utk pipeline berita) |
