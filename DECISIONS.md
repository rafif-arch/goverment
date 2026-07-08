# DECISIONS.md — Keputusan Desain & Konten

Dokumen ini mencatat setiap keputusan non-trivial selama pembangunan PolSim Arcapada.
Bagian yang butuh review manusia ditandai **[REVIEW]**.

## 1. Dunia fiksi & penamaan (Pagar Konten #1)

- **Negara**: **Republik Arcapada**. "Arcapada" diambil dari kosakata pewayangan
  (dunia tengah/dunia manusia) — istilah kosmologi generik, bukan nama tempat riil dan
  bukan plesetan fonetik nama negara mana pun.
- **Mata uang**: **Ʀupa (Ʀ)** — satuan di database disimpan dalam **juta Ʀupa** agar bigint
  tetap kecil dan mudah dibaca (contoh: `base_cost = 12000` berarti Ʀ12 miliar).
- **Region** (5 flagship, semua nama invented — dicek tidak menyamai kota/kabupaten riil):
  1. **Kota Candrakala** — ibu kota metropolitan, difficulty 5, **VIP-only** ("Intelijen Pusat").
  2. **Kabupaten Lembah Sarna** — agraris, isu pangan & irigasi.
  3. **Kabupaten Kutabara** — industri/tambang ("kuta" + "bara"/batu bara — satire), isu lingkungan & PHK.
  4. **Kota Tirtagati** — pesisir/perikanan & pariwisata, kota menengah.
  5. **Kabupaten Argasoka** — "kampung halaman" fiksi, nama taman dalam pewayangan; town kecil, difficulty 1.
- **Lembaga audit/antikorupsi fiksi**: **Komisi Integritas Arcapada (KIA)** — bukan nama/akronim lembaga riil.
- **Legislatif daerah fiksi**: **Majelis Praja Daerah (MPD)** — pengganti istilah DPRD di dalam game
  (di kode tetap ada istilah teknis `lobi_dprd` sebagai nama fungsi internal; teks UI memakai MPD).
- **[REVIEW]** Mohon cek ulang kelima nama region terhadap nama desa/kecamatan kecil yang mungkin kebetulan sama.

## 2. Partai fiksi (Pagar Konten #2)

Satu partai per archetype, dibangun dari archetype ideologis + sejarah pola-umum (bukan kloning):

| Kode | Nama | Archetype |
|---|---|---|
| PDR | Partai Dwipa Raya | nasionalis-sekuler |
| PCN | Partai Cahaya Nurani | religius-konservatif |
| PAS | Partai Akal Sehat | teknokrat-progresif (satire) |
| PNS | Partai Niaga Sejahtera | oligarki-bisnis/pragmatis (akronim satire disengaja) |
| PSJ | Partai Suara Jelata | populis akar rumput |

Sejarah tiap partai ditulis dari pola umum (pecahan partai lama, kongres yang ricuh, dualisme kepengurusan)
tanpa memetakan 1:1 ke satu partai riil.

## 3. Tokoh NPC composite (Pagar Konten #3)

- Setiap tokoh dibangun dari kombinasi 4 axis (ekonomi populis↔pro-market, basis akar-rumput↔elite,
  komunikasi blak-blakan↔formal, legitimasi dinasti/self-made/teknokrat/militer) + variasi gender/generasi.
- Self-check dilakukan per tokoh: kombinasi axis + backstory + gender + generasi tidak menunjuk unik ke satu
  tokoh nyata. Backstory (kota asal fiksi, jalur karier, pendidikan, keluarga) sengaja dibuat menyimpang
  dari tokoh nyata mana pun yang gaya politiknya menginspirasi archetype.
- **[REVIEW]** Daftar 10 tokoh di `/data/politicians.ts` — mohon review manusia sebelum soft launch.

## 4. Arsitektur data & teknis

- **Schema**: semua objek game di schema `polsim` (project Supabase existing "Enterprise Asset Management").
  Schema `public` (3 tabel EAM) tidak disentuh. Client JS memakai `db: { schema: 'polsim' }`.
- **Uang dalam juta Ʀupa** (lihat §1) di semua kolom bigint (uang, dana_kampanye, anggaran, base_cost).
- **Faction standing dua lapis**:
  - `region_faction_satisfaction` = baseline dunia per region (digeser oleh world_events yang di-approve) — global untuk semua pemain.
  - `campaign_state.faction_standing` (jsonb) = standing personal pemain, digeser pilihan krisis.
  Alasan: pilihan satu pemain tidak boleh mengubah dunia pemain lain; spec tabel dipertahankan, lapisan personal ditambahkan.
- **Mutasi sensitif = RPC security definer** (`spend_tokens`, `credit_tokens`, `execute_project`, `lobi_dprd`,
  `resolve_sponsor_demand`, `resolve_election`, `apply_choice`, `run_audit_engine`, `admin_review_pending_event`,
  `submit_leaderboard`). Validasi `auth.uid()` di dalam fungsi; wallet update memakai conditional atomic update
  (anti double-spend). `credit_tokens` idempoten per `reference` (retry webhook aman).
- **Audit engine sebagai fungsi Postgres** (`polsim.run_audit_engine`), bukan logic di n8n: deterministik,
  atomic, dan n8n cukup memanggil RPC dengan service role. Formula di-mirror di `/lib/formula/audit.ts`
  untuk unit test — keduanya harus dijaga sinkron.
- **audit_flags & ipk_scores service-role-only** sesuai spec; pemain melihat **agregat** risiko
  (skor IPK terakhir + jumlah flag per tipe, tanpa detail) via RPC `get_my_ipk` — kompromi antara
  spec akses dan kebutuhan UI AuditMeter.
- **`execute_project(p_executed_at)`**: parameter opsional waktu eksekusi HANYA untuk memancing rule audit
  "jam tidak wajar" saat testing; efeknya hanya menaikkan risiko pemain sendiri sehingga bukan vektor cheat.
- **Stage transitions ringan** (pilih region/partai/wakil, pindah tahap) dilakukan update client-side dengan RLS
  pemilik; transisi berdampak besar (pemilu, proyek) via RPC. Trade-off yang disadari: pemain teknis bisa
  memanipulasi elektabilitas mentah miliknya via API, tetapi skor leaderboard tetap dihitung server-side.
- **Auth**: email+password Supabase Auth (default project). Tanpa magic link (butuh SMTP) dan tanpa
  anonymous sign-in (belum tentu aktif di project).
- **Wallet dibuat lazy** (upsert saat RPC pertama) + bonus pendaftaran, bukan trigger di `auth.users`,
  agar tidak menyentuh schema `auth`.

## 5. BPS & transformasi fiksi

- Sumber: **BPS Web API resmi** (`https://webapi.bps.go.id/v1/api/...`, `BPS_API_KEY` via env).
- Indikator: IPM (updateable var), Gini Ratio, TPT (Tingkat Pengangguran Terbuka). PDRB per kapita dicoba;
  bila endpoint/ID variabel berubah, nilai fallback fiksi realistis dipakai (lihat `/data/bps-fallback.json`).
- **Mapping provinsi riil → region fiksi** di `/data/region-mapping.ts` (contoh: provinsi agraris → Lembah Sarna).
  Mapping adalah *inspirasi statistik*, bukan identitas: nama & narasi region tetap fiksi.
- **Noise deterministik ±5–15%**: PRNG mulberry32 dengan seed dari hash string `(regionCode|indikator|periode)`
  → nilai sama untuk input sama (testable), berbeda antar region/indikator.
- Karena `BPS_API_KEY` belum tersedia saat build, seed live memakai jalur fallback (nilai fiksi realistis).
  Jalur API sudah diimplementasikan penuh di `scripts/fetch-bps.ts`.

## 6. Live News Layer

- Cadence 1×/hari. Feed RSS yang dipilih (stabil, publik, resmi):
  1. `https://www.antaranews.com/rss/terkini.xml` (LKBN Antara — kantor berita negara)
  2. `https://www.cnnindonesia.com/nasional/rss` (CNN Indonesia — nasional)
  3. `https://rss.tempo.co/nasional` (Tempo — nasional)
  Alasan: RSS resmi (bukan scraping HTML), cakupan nasional/ekonomi luas. Jika salah satu feed berubah,
  workflow tetap jalan dengan feed tersisa.
- Interpretasi AI **hanya memetakan ke sektor/axis** (pangan, energi, infrastruktur, dll) dan efek numerik
  faksi/variabel. Prompt (di `/n8n/prompts/news-interpreter.md`) secara eksplisit melarang menyebut
  nama orang/partai/tempat riil pada narasi in-game; ada guard `banned-terms` tambahan di kode approval UI.
- **Tidak ada auto-publish**: semua interpretasi masuk `pending_events` (status pending) dan hanya
  `admin_review_pending_event` (cek tabel `admin_users`) yang bisa mem-publish.
- Approve menggeser baseline `region_faction_satisfaction` (permanen, clamp 0–100) dan membuat `world_events`
  aktif selama `duration_days` (default 7) — event aktif juga memengaruhi elektabilitas via formula runtime.

## 7. Monetisasi

- **VIP "Intelijen Pusat" = pembelian blok 30 hari yang bisa diperpanjang** (bukan auto-recurring
  subscription API). Alasan: subscription API Midtrans di sandbox menambah kompleksitas besar tanpa nilai
  uji; kolom `midtrans_subscription_ref` disiapkan untuk upgrade di masa depan.
- Order dibuat server-side; Snap token diminta ke `app.sandbox.midtrans.com`; status order hanya
  berubah lewat webhook bersignature SHA512 valid (`order_id + status_code + gross_amount + ServerKey`).
- Semua mutasi saldo lewat RPC atomic (§4). Daily grant 10 token/hari (config `game_config.daily_grant`,
  sumber `/data/config.ts`).
- Item type saat ini: `token_topup` (3 paket) dan `vip_30d`.

## 8. n8n

- Tidak menyentuh instance produksi. Deliverable = 4 file JSON siap-import di `/n8n/workflows/`,
  semua bernama prefix **"PolSim — "**. Logika audit & transformasi berat ada di Postgres/HTTP request,
  node n8n hanya orkestrasi — meminimalkan drift antara file JSON dan kode repo.
- Workflow WhatsApp approval (Fonnte) disediakan sebagai struktur webhook dengan credential kosong.

## 9. Konten yang butuh review manusia — ringkasan **[REVIEW]**

1. 10 tokoh di `/data/politicians.ts` (self-check composite sudah dilakukan, tetap butuh mata kedua).
2. 5 sejarah partai di `/data/parties.ts`.
3. 18 crisis events di `/data/crisis-events.ts` (satire birokrasi — pastikan tidak ada yang menyentuh
   kasus hukum riil yang masih berjalan).
4. Nama-nama vendor & sponsor fiksi di `/data/vendors.ts`.
5. Prompt interpretasi berita `/n8n/prompts/news-interpreter.md`.
