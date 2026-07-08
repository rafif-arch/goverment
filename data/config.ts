// ============================================================
// Konfigurasi gameplay & ekonomi — SATU sumber kebenaran.
// Nilai ini di-seed ke polsim.game_config (server membaca dari DB;
// client memakai konstanta ini hanya untuk tampilan).
// Uang dalam JUTA Ʀupa. Harga pembayaran riil dalam IDR (sandbox).
// ============================================================

export const GAME_CONFIG = {
  daily_grant: { amount: 10 },
  signup_bonus: { amount: 20 },
  token_costs: {
    eksekusi_proyek: 5,
    eksekusi_proyek_besar: 8,
    lobi_dprd: 3,
    // anggaran >= nilai ini (juta Ʀ) dihitung "proyek besar"
    proyek_besar_threshold: 50000,
  },
  political_power_threshold: { value: 50 },
  // Bobot IPK (Indeks Persepsi Kerawanan): IPK = clamp(Σ bobot×severity + complied×5 − clean×4, 0..100)
  ipk_weights: {
    vendor_relational: 12,
    jam_tidak_wajar: 8,
    anggaran_janggal: 10,
    sponsor_complied: 5,
    clean_project_credit: 4,
  },
  audit_thresholds: {
    markup_warn: 0.2,
    markup_med: 0.35,
    markup_high: 0.5,
    night_start: 0, // jam UTC
    night_end: 4,
  },
  ipk_ott_threshold: { value: 80 },
  election: { bobot_elektabilitas: 0.6, bobot_faksi: 0.4, ambang_menang: 50 },
  score_weights: { pembangunan: 0.4, faksi: 0.3, integritas: 0.3 },
  token_packs: {
    paket_saku: { tokens: 30, price_idr: 10000, label: "Paket Uang Saku" },
    paket_kampanye: { tokens: 100, price_idr: 25000, label: "Paket Dana Kampanye" },
    paket_dinasti: { tokens: 300, price_idr: 60000, label: "Paket Warisan Dinasti" },
  },
  vip: { price_idr: 49000, days: 30, label: 'VIP "Intelijen Pusat" 30 hari' },
} as const;

export type TokenPackKey = keyof typeof GAME_CONFIG.token_packs;
