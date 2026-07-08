// 6 template "proyek titipan" sponsor (Grup Singgasana — fiksi).
// Muncul saat menjabat HANYA jika karakter punya trait "Penyandang Dana (Oligarki)".
// efek_refuse: dampak menolak tagihan (uang/juta Ʀ, political_power, dana_kampanye, kepercayaan_publik).

export interface SponsorDemandTemplateSeed {
  code: string;
  deskripsi: string;
  vendor_code: string;
  nama_proyek: string;
  base_cost: number; // juta Ʀ — HPS wajar
  markup_paksa: number; // markup yang "diminta" sponsor
  deadline_days: number;
  efek_refuse: Record<string, number>;
}

export const SPONSOR_DEMAND_TEMPLATES: SponsorDemandTemplateSeed[] = [
  {
    code: "lampu_hias",
    deskripsi:
      "Grup Singgasana 'menitip' pengadaan lampu hias jalan protokol. Katalognya indah, harganya lebih indah lagi. 'Ini demi estetika kota, Pak/Bu. Dan demi kita semua.'",
    vendor_code: "kencana_dekor",
    nama_proyek: "Pengadaan Lampu Hias Jalan Protokol",
    base_cost: 6000,
    markup_paksa: 0.5,
    deadline_days: 5,
    efek_refuse: { uang: -1200, political_power: -8 },
  },
  {
    code: "mobil_dinas",
    deskripsi:
      "Sponsor mengirim brosur mobil dinas premium 'demi kewibawaan daerah'. Vendornya sudah ditentukan: PT Mercusuar Niaga Raya. Diskonnya nol, komitmennya penuh.",
    vendor_code: "mercusuar_niaga",
    nama_proyek: "Peremajaan Kendaraan Dinas Pimpinan",
    base_cost: 8000,
    markup_paksa: 0.4,
    deadline_days: 6,
    efek_refuse: { uang: -1500, political_power: -6 },
  },
  {
    code: "aplikasi_absensi",
    deskripsi:
      "'Digitalisasi absensi ASN' — aplikasi seharga sistem operasi, fiturnya setara lonceng. Grup Singgasana menyebutnya investasi masa depan. Masa depan siapa, tidak dijelaskan.",
    vendor_code: "mercusuar_niaga",
    nama_proyek: "Sistem Absensi Digital Terpadu",
    base_cost: 4000,
    markup_paksa: 0.6,
    deadline_days: 4,
    efek_refuse: { dana_kampanye: -800, political_power: -5 },
  },
  {
    code: "patung_gerbang",
    deskripsi:
      "Sponsor ingin 'meninggalkan warisan': patung gerbang kota raksasa. Desainnya kebetulan mirip logo Grup Singgasana kalau dilihat dari drone.",
    vendor_code: "kencana_dekor",
    nama_proyek: "Pembangunan Gerbang Ikonik Kota",
    base_cost: 10000,
    markup_paksa: 0.45,
    deadline_days: 7,
    efek_refuse: { uang: -1000, political_power: -10 },
  },
  {
    code: "renovasi_kantor",
    deskripsi:
      "Renovasi ruang kerja kepala daerah dengan interior impor. 'Tamu investor harus terkesan,' kata utusan sponsor sambil meletakkan katalog kursi seharga rumah.",
    vendor_code: "singgasana_konstruksi",
    nama_proyek: "Renovasi Ruang Kerja & Ruang Tamu Pimpinan",
    base_cost: 5000,
    markup_paksa: 0.55,
    deadline_days: 5,
    efek_refuse: { uang: -900, political_power: -7 },
  },
  {
    code: "angkut_reklamasi",
    deskripsi:
      "Kontrak pengangkutan material reklamasi harus jatuh ke PT Bara Makmur Sentosa. 'Mereka sudah berpengalaman' — terutama berpengalaman memenangkan kontrak seperti ini.",
    vendor_code: "bara_makmur",
    nama_proyek: "Jasa Angkutan Material Reklamasi",
    base_cost: 7000,
    markup_paksa: 0.35,
    deadline_days: 6,
    efek_refuse: { dana_kampanye: -1000, political_power: -8 },
  },
];
