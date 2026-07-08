// 5 partai fiksi — satu per archetype ideologis (DECISIONS.md §2).
// Sejarah ditulis dari POLA UMUM politik (pecahan, kongres ricuh, dualisme),
// bukan menyalin sejarah satu partai riil.

export interface PartySeed {
  code: string;
  name: string;
  archetype_ideologi:
    | "nasionalis_sekuler"
    | "religius_konservatif"
    | "teknokrat_progresif"
    | "oligarki_bisnis"
    | "populis_akar_rumput";
  basis_konstituen: string;
  sejarah_fiksi: string;
  warna: string;
  mahar_politik: number; // juta Ʀupa
  // kecocokan awal dengan faksi (untuk formula tiket & elektabilitas)
  faksi_afinitas: Record<string, number>; // -10..+10
}

export const PARTIES: PartySeed[] = [
  {
    code: "pdr",
    name: "Partai Dwipa Raya",
    archetype_ideologi: "nasionalis_sekuler",
    basis_konstituen: "Pegawai negeri, veteran, pemilih loyalis simbol kebangsaan",
    sejarah_fiksi:
      "Lahir dari fusi tiga organisasi kebangsaan era pergerakan. Sudah empat kali berganti lambang tanpa pernah berganti gaya pidato. Slogan: 'Satu Dwipa, Satu Suara' — meski di internal biasanya ada tiga suara.",
    warna: "#b3282d",
    mahar_politik: 4000,
    faksi_afinitas: { buruh_tani: 2, menengah_urban: 2, tokoh_agama: 0, konsorsium_bisnis: 2 },
  },
  {
    code: "pcn",
    name: "Partai Cahaya Nurani",
    archetype_ideologi: "religius_konservatif",
    basis_konstituen: "Jejaring majelis, sekolah keagamaan, pedagang pasar tradisional",
    sejarah_fiksi:
      "Berdiri dari jaringan majelis pengajian lintas kota. Pernah pecah kongres dua kali karena beda tafsir soal boleh-tidaknya baliho bergambar wajah. Keduanya akhirnya rujuk demi ongkos baliho yang lebih murah.",
    warna: "#1c7a3d",
    mahar_politik: 3000,
    faksi_afinitas: { buruh_tani: 3, menengah_urban: -1, tokoh_agama: 8, konsorsium_bisnis: -2 },
  },
  {
    code: "pas",
    name: "Partai Akal Sehat",
    archetype_ideologi: "teknokrat_progresif",
    basis_konstituen: "Profesional muda urban, akademisi, komunitas open data",
    sejarah_fiksi:
      "Didirikan sekelompok konsultan dan dosen yang frustrasi rapat anggaran. Semua keputusan partai memakai dashboard; sayangnya dashboard tidak bisa memenangkan pemilu di daerah tanpa sinyal.",
    warna: "#2563eb",
    mahar_politik: 2500,
    faksi_afinitas: { buruh_tani: -1, menengah_urban: 8, tokoh_agama: -1, konsorsium_bisnis: 3 },
  },
  {
    code: "pns",
    name: "Partai Niaga Sejahtera",
    archetype_ideologi: "oligarki_bisnis",
    basis_konstituen: "Asosiasi pengusaha, kontraktor, pemburu konsesi",
    sejarah_fiksi:
      "Dibentuk konsorsium pengusaha logistik selepas krisis. Kantornya paling megah, kadernya paling sedikit, tapi daftar penyumbangnya paling panjang. Akronimnya sering disalahpahami — dan mereka menikmatinya.",
    warna: "#c98a12",
    mahar_politik: 1000,
    faksi_afinitas: { buruh_tani: -4, menengah_urban: 0, tokoh_agama: -1, konsorsium_bisnis: 9 },
  },
  {
    code: "psj",
    name: "Partai Suara Jelata",
    archetype_ideologi: "populis_akar_rumput",
    basis_konstituen: "Buruh, petani penggarap, pedagang kaki lima, komunitas kampung",
    sejarah_fiksi:
      "Tumbuh dari posko bantuan hukum penggusuran menjadi partai. Rapatnya di balai warga, iurannya patungan, dan satu-satunya partai yang ketumnya pernah antre sembako sungguhan — kamera datang belakangan.",
    warna: "#d43d6e",
    mahar_politik: 800,
    faksi_afinitas: { buruh_tani: 9, menengah_urban: 1, tokoh_agama: 2, konsorsium_bisnis: -5 },
  },
];
