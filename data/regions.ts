// 5 region flagship Republik Arcapada — semua nama fiksi (lihat DECISIONS.md §1).
// Nilai indikator di sini adalah fallback awal; pipeline BPS (scripts/fetch-bps.ts)
// akan menimpanya dengan nilai transformasi dari data BPS riil + noise deterministik.

export interface IsuSektoral {
  kode: string;
  judul: string;
  sektor: string;
  severity: number; // 1-5
  base_cost: number; // HPS wajar, juta Ʀupa
  impact: number; // poin pembangunan saat proyek selesai
}

export interface RegionSeed {
  code: string;
  name: string;
  type: "provinsi" | "kota" | "kabupaten";
  difficulty: number;
  is_vip_only: boolean;
  deskripsi: string;
  map_ref: string;
  pendapatan_daerah: number; // miliar Ʀ/tahun (flavor)
  ipm: number;
  gini_ratio: number;
  tingkat_pengangguran: number;
  isu_sektoral: IsuSektoral[];
}

export const REGIONS: RegionSeed[] = [
  {
    code: "candrakala",
    name: "Kota Candrakala",
    type: "kota",
    difficulty: 5,
    is_vip_only: true,
    deskripsi:
      "Ibu kota Republik Arcapada. Gedung pencakar langit berdampingan dengan kampung padat; setiap keputusan diliput 24 jam oleh media dan disalahpahami dalam 24 menit.",
    map_ref: "region-candrakala",
    pendapatan_daerah: 82000,
    ipm: 81.5,
    gini_ratio: 0.42,
    tingkat_pengangguran: 7.1,
    isu_sektoral: [
      { kode: "banjir_musiman", judul: "Banjir musiman kanal tua", sektor: "infrastruktur", severity: 5, base_cost: 65000, impact: 18 },
      { kode: "macet_protokol", judul: "Kemacetan jalan protokol", sektor: "transportasi", severity: 4, base_cost: 48000, impact: 15 },
      { kode: "hunian_kumuh", judul: "Kampung padat tanpa sanitasi", sektor: "perumahan", severity: 4, base_cost: 30000, impact: 14 },
    ],
  },
  {
    code: "lembah_sarna",
    name: "Kabupaten Lembah Sarna",
    type: "kabupaten",
    difficulty: 2,
    is_vip_only: false,
    deskripsi:
      "Lumbung pangan Arcapada. Sawah berundak sejauh mata memandang — sayangnya saluran irigasinya seumuran dengan kemerdekaan republik.",
    map_ref: "region-lembah-sarna",
    pendapatan_daerah: 3100,
    ipm: 68.2,
    gini_ratio: 0.33,
    tingkat_pengangguran: 4.2,
    isu_sektoral: [
      { kode: "irigasi_rusak", judul: "Irigasi primer bocor & pendangkalan", sektor: "pangan", severity: 5, base_cost: 12000, impact: 16 },
      { kode: "harga_gabah", judul: "Harga gabah anjlok saat panen raya", sektor: "pangan", severity: 4, base_cost: 6000, impact: 12 },
      { kode: "jalan_desa", judul: "Jalan produksi desa putus", sektor: "infrastruktur", severity: 3, base_cost: 8000, impact: 10 },
    ],
  },
  {
    code: "kutabara",
    name: "Kabupaten Kutabara",
    type: "kabupaten",
    difficulty: 3,
    is_vip_only: false,
    deskripsi:
      "Kabupaten tambang. Malam hari langit menyala oranye oleh smelter; siang hari menyala oleh demonstrasi karyawan yang dirumahkan.",
    map_ref: "region-kutabara",
    pendapatan_daerah: 9800,
    ipm: 72.9,
    gini_ratio: 0.36,
    tingkat_pengangguran: 6.8,
    isu_sektoral: [
      { kode: "reklamasi_tambang", judul: "Lubang bekas tambang tak direklamasi", sektor: "lingkungan", severity: 5, base_cost: 22000, impact: 16 },
      { kode: "phk_smelter", judul: "Gelombang PHK smelter", sektor: "ketenagakerjaan", severity: 4, base_cost: 9000, impact: 13 },
      { kode: "air_tercemar", judul: "Sungai tercemar limbah olahan", sektor: "lingkungan", severity: 4, base_cost: 14000, impact: 13 },
    ],
  },
  {
    code: "tirtagati",
    name: "Kota Tirtagati",
    type: "kota",
    difficulty: 2,
    is_vip_only: false,
    deskripsi:
      "Kota pesisir dengan pelabuhan perikanan tersibuk di Arcapada dan matahari terbenam yang lebih rajin difoto daripada laporan pertanggungjawaban dinasnya.",
    map_ref: "region-tirtagati",
    pendapatan_daerah: 4200,
    ipm: 71.4,
    gini_ratio: 0.35,
    tingkat_pengangguran: 5.9,
    isu_sektoral: [
      { kode: "dermaga_rapuh", judul: "Dermaga pendaratan ikan rapuh", sektor: "kelautan", severity: 4, base_cost: 11000, impact: 14 },
      { kode: "abrasi_pantai", judul: "Abrasi menggerus kampung nelayan", sektor: "lingkungan", severity: 4, base_cost: 13000, impact: 13 },
      { kode: "wisata_mandek", judul: "Kawasan wisata minim penataan", sektor: "pariwisata", severity: 3, base_cost: 7000, impact: 10 },
    ],
  },
  {
    code: "argasoka",
    name: "Kabupaten Argasoka",
    type: "kabupaten",
    difficulty: 1,
    is_vip_only: false,
    deskripsi:
      "Kabupaten kecil berhawa sejuk, terkenal sebagai 'kampung halaman semua orang'. Politik di sini sederhana: siapa hadir di hajatan, dia menang.",
    map_ref: "region-argasoka",
    pendapatan_daerah: 1900,
    ipm: 74.6,
    gini_ratio: 0.37,
    tingkat_pengangguran: 3.9,
    isu_sektoral: [
      { kode: "puskesmas_kurang", judul: "Puskesmas kekurangan tenaga & alat", sektor: "kesehatan", severity: 4, base_cost: 5000, impact: 12 },
      { kode: "sekolah_rusak", judul: "Atap sekolah dasar bocor massal", sektor: "pendidikan", severity: 3, base_cost: 4000, impact: 10 },
      { kode: "umkm_lesu", judul: "UMKM oleh-oleh kalah oleh ritel modern", sektor: "ekonomi_kreatif", severity: 3, base_cost: 3000, impact: 9 },
    ],
  },
];
