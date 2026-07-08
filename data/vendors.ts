// 8 vendor pengadaan fiksi. Vendor is_sponsor_linked = bahan aturan audit
// "vendor relational". Sponsor oligarki fiksi: "Grup Singgasana".

export interface VendorSeed {
  code: string;
  nama: string;
  is_sponsor_linked: boolean;
  afiliasi: Record<string, unknown>;
  track_record: string;
  markup_bias: number; // kecenderungan markup vendor saat dipilih (fraksi)
}

export const VENDORS: VendorSeed[] = [
  {
    code: "karya_bakti_utama",
    nama: "PT Karya Bakti Utama",
    is_sponsor_linked: false,
    afiliasi: {},
    track_record: "Kontraktor irigasi & jalan. Lambat 2 minggu tapi belum pernah kena temuan. Direkturnya alergi wartawan.",
    markup_bias: 0.05,
  },
  {
    code: "tirta_wahana",
    nama: "PT Tirta Wahana Konstruksi",
    is_sponsor_linked: false,
    afiliasi: {},
    track_record: "Spesialis drainase & dermaga. Portofolio rapi, harga wajar, tidak pernah menang tender yang 'sudah ada pemenangnya'.",
    markup_bias: 0.08,
  },
  {
    code: "griya_praja",
    nama: "CV Griya Praja Sejahtera",
    is_sponsor_linked: false,
    afiliasi: {},
    track_record: "Renovasi gedung sekolah & puskesmas. Kecil-kecil rapi; kadang kalah cepat karena menolak 'uang pelicin dokumen'.",
    markup_bias: 0.03,
  },
  {
    code: "purna_karya",
    nama: "PT Purna Karya Abadi",
    is_sponsor_linked: false,
    afiliasi: {},
    track_record: "Pengadaan alat kesehatan & pendidikan. Standar, membosankan, aman — kombinasi yang jarang di Arcapada.",
    markup_bias: 0.1,
  },
  {
    code: "singgasana_konstruksi",
    nama: "PT Singgasana Konstruksi Persada",
    is_sponsor_linked: true,
    afiliasi: { sponsor_code: "grup_singgasana", keterangan: "Anak usaha Grup Singgasana, sponsor utama trait 'Penyandang Dana'." },
    track_record: "Selalu menang tender di daerah yang kepala daerahnya 'dekat' dengan Grup Singgasana. Kebetulan yang konsisten selama 15 tahun.",
    markup_bias: 0.35,
  },
  {
    code: "bara_makmur",
    nama: "PT Bara Makmur Sentosa",
    is_sponsor_linked: true,
    afiliasi: { sponsor_code: "grup_singgasana", keterangan: "Terafiliasi Grup Singgasana lewat kepemilikan silang tiga lapis." },
    track_record: "Reklamasi tambang & pengangkutan. Laporan reklamasinya indah; drone menemukan hal yang berbeda.",
    markup_bias: 0.4,
  },
  {
    code: "kencana_dekor",
    nama: "CV Kencana Dekorindo",
    is_sponsor_linked: true,
    afiliasi: { sponsor_code: "grup_singgasana", keterangan: "Vendor favorit untuk proyek 'estetika' titipan sponsor." },
    track_record: "Lampu hias, patung kota, dan gapura. Harga lampunya bisa untuk membeli lampunya beserta tiangnya di tempat lain — dua kali.",
    markup_bias: 0.5,
  },
  {
    code: "mercusuar_niaga",
    nama: "PT Mercusuar Niaga Raya",
    is_sponsor_linked: true,
    afiliasi: { sponsor_code: "grup_singgasana", keterangan: "Distributor 'serba ada' — dari mobil dinas sampai aplikasi absensi." },
    track_record: "Bisa mengadakan apa pun dalam 3 hari. Garansi purna jualnya berupa nomor telepon yang tidak pernah diangkat.",
    markup_bias: 0.45,
  },
];
