// 8 item kosmetik: dekorasi Ruang Kerja Kepala Daerah (layer visual Command Center)
// + lencana profil/leaderboard. Dibeli dengan token.

export interface CosmeticSeed {
  code: string;
  nama: string;
  tipe: "dekorasi_ruang" | "lencana";
  harga_token: number;
  asset_ref: string; // key layer visual / emoji lencana
  deskripsi: string;
}

export const COSMETICS: CosmeticSeed[] = [
  {
    code: "kursi_jati_ukir",
    nama: "Kursi Jati Ukir 'Singgasana Rakyat'",
    tipe: "dekorasi_ruang",
    harga_token: 40,
    asset_ref: "decor-kursi",
    deskripsi: "Kursi kayu ukir megah. Tidak menambah kinerja, tapi sangat menambah rasa percaya diri saat menolak proposal.",
  },
  {
    code: "akuarium_arwana",
    nama: "Akuarium Arwana Platinum",
    tipe: "dekorasi_ruang",
    harga_token: 60,
    asset_ref: "decor-akuarium",
    deskripsi: "Ikan mahal berenang tenang — simbol status pejabat sejati. Ikannya lebih tenang daripada bendahara Anda saat audit.",
  },
  {
    code: "rak_penghargaan",
    nama: "Rak Piala & Plakat Penghargaan",
    tipe: "dekorasi_ruang",
    harga_token: 30,
    asset_ref: "decor-rak",
    deskripsi: "Rak penuh plakat 'Daerah Ter-...' dari berbagai lembaga yang sebagian besar baru Anda dengar namanya.",
  },
  {
    code: "karpet_beludru",
    nama: "Karpet Beludru Merah",
    tipe: "dekorasi_ruang",
    harga_token: 25,
    asset_ref: "decor-karpet",
    deskripsi: "Karpet merah untuk menyambut tamu penting. Juga efektif menyerap suara langkah wartawan.",
  },
  {
    code: "lukisan_panen",
    nama: "Lukisan 'Panen Raya di Lembah Sarna'",
    tipe: "dekorasi_ruang",
    harga_token: 20,
    asset_ref: "decor-lukisan",
    deskripsi: "Lukisan sawah menguning. Pengingat visual bahwa di luar gedung ini ada rakyat yang menanam sesuatu selain anggaran.",
  },
  {
    code: "praja_terjujur",
    nama: "Lencana 'Praja Terjujur'",
    tipe: "lencana",
    harga_token: 50,
    asset_ref: "🎖️",
    deskripsi: "Penghargaan tahunan Komisi Integritas Arcapada untuk kepala daerah dengan IPK terendah. Memakainya adalah pernyataan — atau tantangan.",
  },
  {
    code: "tangan_dingin",
    nama: "Lencana 'Tangan Dingin Pembangunan'",
    tipe: "lencana",
    harga_token: 35,
    asset_ref: "🏗️",
    deskripsi: "Untuk yang menyelesaikan proyek lebih cepat daripada rapat evaluasinya.",
  },
  {
    code: "sahabat_jelata",
    nama: "Lencana 'Sahabat Jelata'",
    tipe: "lencana",
    harga_token: 35,
    asset_ref: "🤝",
    deskripsi: "Diberikan oleh gabungan serikat rakyat kepada pejabat yang nomor ponselnya asli, bukan nomor ajudan.",
  },
];
