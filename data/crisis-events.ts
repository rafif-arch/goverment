// 18 crisis event hand-authored untuk tahap Perang Elektabilitas.
// Efek: elektabilitas (poin), dana_kampanye (juta Ʀ), kepercayaan_publik (poin),
// faksi: delta standing personal per kode faksi.
// Satire birokrasi/kampanye generik — tidak merujuk kasus hukum riil mana pun.

export interface CrisisOption {
  key: string;
  label: string;
  effects: {
    elektabilitas?: number;
    dana_kampanye?: number;
    kepercayaan_publik?: number;
    faksi?: Record<string, number>;
  };
}

export interface CrisisEventSeed {
  code: string;
  title: string;
  description: string;
  trigger_stage: "perang_elektabilitas";
  options: CrisisOption[];
}

export const CRISIS_EVENTS: CrisisEventSeed[] = [
  {
    code: "baliho_roboh",
    title: "Baliho Raksasa Roboh Menimpa Warung",
    description:
      "Baliho 8×16 meter bergambar wajah Anda tersenyum roboh diterpa angin dan menimpa warung kopi Bu Lastri. Tidak ada korban — kecuali termos dan elektabilitas.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "ganti_rugi", label: "Datangi langsung, ganti rugi 3x lipat, ngopi di sana seminggu", effects: { elektabilitas: 4, dana_kampanye: -300, kepercayaan_publik: 3, faksi: { buruh_tani: 3 } } },
      { key: "salahkan_vendor", label: "Salahkan vendor konstruksi baliho di konferensi pers", effects: { elektabilitas: -3, kepercayaan_publik: -2, faksi: { konsorsium_bisnis: -3 } } },
      { key: "diam", label: "Diamkan, semoga netizen cepat lupa", effects: { elektabilitas: -1, faksi: { menengah_urban: -2 } } },
    ],
  },
  {
    code: "harga_cabai",
    title: "Harga Cabai Meroket Menjelang Debat",
    description:
      "Harga cabai naik 300%. Ibu-ibu pasar menunggu jawaban di debat kandidat, dan moderator sudah menyiapkan pertanyaan jebakan: 'Berapa harga cabai hari ini?'",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "hafal_harga", label: "Blusukan subuh ke pasar, hafalkan harga sampai level per ons", effects: { elektabilitas: 5, kepercayaan_publik: 2, faksi: { buruh_tani: 4, menengah_urban: 2 } } },
      { key: "operasi_pasar", label: "Janjikan operasi pasar & subsidi ongkos angkut", effects: { elektabilitas: 3, dana_kampanye: -500, faksi: { buruh_tani: 3, konsorsium_bisnis: -2 } } },
      { key: "mekanisme_pasar", label: "Jawab 'itu mekanisme pasar' sambil tersenyum", effects: { elektabilitas: -5, faksi: { buruh_tani: -5, konsorsium_bisnis: 3 } } },
    ],
  },
  {
    code: "video_settingan",
    title: "Video Blusukan Ketahuan Settingan",
    description:
      "Video Anda menolong nenek menyeberang viral — sayangnya akun fanbase lupa memotong bagian sutradara meneriakkan 'CUT! Neneknya kurang terharu!'",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "minta_maaf", label: "Akui, minta maaf, ajak nenek asli ngobrol live tanpa skrip", effects: { elektabilitas: 2, kepercayaan_publik: 4, faksi: { menengah_urban: 3 } } },
      { key: "salahkan_tim", label: "Pecat tim media sosial secara terbuka", effects: { elektabilitas: -2, kepercayaan_publik: -1 } },
      { key: "video_baru", label: "Banjiri timeline dengan 20 video baru (semoga menimbun yang lama)", effects: { elektabilitas: -1, dana_kampanye: -400, faksi: { menengah_urban: -3 } } },
    ],
  },
  {
    code: "amplop_hajatan",
    title: "Amplop di Hajatan",
    description:
      "Di sebuah hajatan, panitia diam-diam membagikan amplop berlogo wajah Anda. Wartawan lokal memotretnya dengan kecepatan yang tidak pernah mereka pakai untuk memotret jalan rusak.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "tarik_laporkan", label: "Tarik semua amplop, laporkan oknum panitia ke pengawas pemilu", effects: { elektabilitas: -2, kepercayaan_publik: 5, faksi: { tokoh_agama: 4 } } },
      { key: "sumbangan_biasa", label: "Klaim itu 'sumbangan hajatan yang wajar secara adat'", effects: { elektabilitas: 1, kepercayaan_publik: -4, faksi: { tokoh_agama: -3 } } },
      { key: "bukan_tim", label: "Bilang itu bukan tim Anda (padahal fotonya jelas)", effects: { elektabilitas: -4, kepercayaan_publik: -5 } },
    ],
  },
  {
    code: "debat_mati_lampu",
    title: "Debat Kandidat Mati Lampu",
    description:
      "Listrik padam tepat saat Anda memaparkan program unggulan. Panggung gelap total. Mikrofon mati. Hanya ada Anda, kegelapan, dan 400 penonton.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "lanjut_teriak", label: "Lanjutkan pidato dengan suara lantang tanpa mik, tanpa slide", effects: { elektabilitas: 5, faksi: { buruh_tani: 2, menengah_urban: 2 } } },
      { key: "senter_hp", label: "Minta penonton nyalakan senter ponsel — jadikan momen dramatis", effects: { elektabilitas: 4, faksi: { menengah_urban: 3 } } },
      { key: "protes_panitia", label: "Protes keras ke panitia dan minta debat diulang", effects: { elektabilitas: -3, kepercayaan_publik: -1 } },
    ],
  },
  {
    code: "hoax_ijazah",
    title: "Hoax Ijazah Beredar",
    description:
      "Beredar 'temuan' bahwa ijazah Anda palsu, lengkap dengan analisis font oleh akun anonim bernama @PatriotFaktaData yang baru dibuat kemarin sore.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "tunjukkan_arsip", label: "Undang media ke kampus, buka arsip, ajak dosen pembimbing bicara", effects: { elektabilitas: 3, kepercayaan_publik: 3, faksi: { menengah_urban: 2 } } },
      { key: "lapor_polisi", label: "Laporkan penyebar dengan pasal pencemaran", effects: { elektabilitas: -1, faksi: { menengah_urban: -2 } } },
      { key: "abaikan", label: "Abaikan — 'anjing menggonggong, kafilah tetap kampanye'", effects: { elektabilitas: -2 } },
    ],
  },
  {
    code: "banjir_kampanye",
    title: "Banjir di Tengah Masa Kampanye",
    description:
      "Hujan tiga hari, kanal meluap, dua kelurahan terendam. Tim Anda mengingatkan: rival sudah di lokasi sejak subuh — lengkap dengan perahu karet warna partainya.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "posko_nyata", label: "Dirikan posko dapur umum tanpa atribut kampanye sama sekali", effects: { elektabilitas: 3, dana_kampanye: -700, kepercayaan_publik: 4, faksi: { buruh_tani: 3, tokoh_agama: 2 } } },
      { key: "posko_branding", label: "Posko bantuan dengan spanduk wajah Anda ukuran maksimal", effects: { elektabilitas: 2, dana_kampanye: -500, kepercayaan_publik: -3, faksi: { tokoh_agama: -2 } } },
      { key: "kirim_tim", label: "Kirim tim saja, Anda lanjut safari politik di tempat kering", effects: { elektabilitas: -4, faksi: { buruh_tani: -4 } } },
    ],
  },
  {
    code: "serangan_fajar_rival",
    title: "Rival Melancarkan 'Serangan Fajar'",
    description:
      "Laporan masuk: tim rival membagikan sembako bermerek jelang hari tenang. Saksi ada, foto ada. Tim Anda bertanya: mau jadi pahlawan, atau mau menang?",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "lapor_resmi", label: "Kumpulkan bukti, laporkan resmi ke pengawas pemilu", effects: { elektabilitas: 2, kepercayaan_publik: 4, faksi: { tokoh_agama: 3 } } },
      { key: "balas_sembako", label: "Balas dengan paket sembako yang lebih tebal", effects: { elektabilitas: 3, dana_kampanye: -900, kepercayaan_publik: -6, faksi: { tokoh_agama: -4 } } },
      { key: "viralkan", label: "Serahkan ke relawan untuk 'diviralkan secara organik'", effects: { elektabilitas: 1, kepercayaan_publik: -2, faksi: { menengah_urban: -1 } } },
    ],
  },
  {
    code: "endorse_selebgram",
    title: "Tawaran Endorse Selebgram",
    description:
      "Selebgram dengan 4 juta pengikut menawarkan paket endorse: tiga konten, satu joget, satu testimoni 'beliau sangat merakyat'. Harganya setara perbaikan dua jembatan desa.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "ambil", label: "Ambil paketnya — jangkauan adalah segalanya", effects: { elektabilitas: 4, dana_kampanye: -800, faksi: { menengah_urban: 2, tokoh_agama: -2 } } },
      { key: "mikro", label: "Tolak; rangkul 40 kreator lokal kecil dengan dana sama", effects: { elektabilitas: 3, dana_kampanye: -400, kepercayaan_publik: 2, faksi: { menengah_urban: 3 } } },
      { key: "tolak", label: "Tolak mentah-mentah, hemat dana", effects: { elektabilitas: -1, dana_kampanye: 0 } },
    ],
  },
  {
    code: "dangdutan_macet",
    title: "Panggung Dangdut Kampanye Membuat Macet Total",
    description:
      "Konser kampanye Anda sukses besar — sampai-sampai jalan nasional lumpuh 5 jam. Ambulans sempat terjebak. Penyanyi sudah pulang, tagar belum.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "minta_maaf_atur", label: "Minta maaf terbuka + biayai rekayasa lalu lintas acara berikutnya", effects: { elektabilitas: 1, dana_kampanye: -300, kepercayaan_publik: 3, faksi: { menengah_urban: 2 } } },
      { key: "bangga", label: "Sebut kemacetan sebagai 'bukti kecintaan rakyat'", effects: { elektabilitas: -3, kepercayaan_publik: -3, faksi: { menengah_urban: -4 } } },
      { key: "salahkan_dishub", label: "Salahkan dinas perhubungan yang 'kurang sigap'", effects: { elektabilitas: -2, kepercayaan_publik: -2 } },
    ],
  },
  {
    code: "isu_pemecah",
    title: "Isu Identitas Dimainkan di Grup Sebelah",
    description:
      "Pesan berantai menyerang latar belakang keluarga Anda beredar di ribuan grup percakapan. Tim menyarankan tiga opsi; hati nurani menyarankan satu.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "rangkul_tokoh", label: "Silaturahmi terbuka dengan majelis tokoh agama lintas komunitas", effects: { elektabilitas: 3, kepercayaan_publik: 3, faksi: { tokoh_agama: 5 } } },
      { key: "mainkan_balik", label: "Suruh relawan memainkan isu serupa ke arah rival", effects: { elektabilitas: 1, kepercayaan_publik: -6, faksi: { tokoh_agama: -5, menengah_urban: -2 } } },
      { key: "klarifikasi", label: "Klarifikasi datar lewat siaran pers", effects: { elektabilitas: -1 } },
    ],
  },
  {
    code: "sumbangan_misterius",
    title: "Sumbangan Misterius Masuk Rekening Kampanye",
    description:
      "Rekening kampanye menerima transfer sangat besar dari 'CV Berkah Melimpah' — perusahaan yang alamatnya ternyata sebuah kios pulsa yang sudah tutup.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "kembalikan", label: "Kembalikan dana & laporkan ke pengawas dana kampanye", effects: { elektabilitas: 0, dana_kampanye: 0, kepercayaan_publik: 5, faksi: { tokoh_agama: 2, menengah_urban: 2 } } },
      { key: "terima_diam", label: "Terima diam-diam, catat sebagai 'sumbangan perorangan'", effects: { elektabilitas: 0, dana_kampanye: 1500, kepercayaan_publik: -7, faksi: { tokoh_agama: -3 } } },
      { key: "tunda", label: "Endapkan dulu, putuskan setelah hari pemilihan", effects: { dana_kampanye: 0, kepercayaan_publik: -3 } },
    ],
  },
  {
    code: "kunjungan_majelis",
    title: "Undangan Majelis Akbar",
    description:
      "Majelis tokoh agama terbesar di region mengundang semua kandidat. Rival Anda sudah konfirmasi hadir dan kabarnya menyiapkan sumbangan pembangunan aula.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "hadir_dengar", label: "Hadir, lebih banyak mendengar daripada berpidato", effects: { elektabilitas: 2, faksi: { tokoh_agama: 4 } } },
      { key: "hadir_sumbang", label: "Hadir dengan sumbangan aula yang lebih besar dari rival", effects: { elektabilitas: 3, dana_kampanye: -600, faksi: { tokoh_agama: 3, menengah_urban: -1 } } },
      { key: "kirim_wakil", label: "Kirim calon wakil saja, Anda ke acara komunitas startup", effects: { elektabilitas: 0, faksi: { tokoh_agama: -3, menengah_urban: 2 } } },
    ],
  },
  {
    code: "demo_upah",
    title: "Demo Buruh di Depan Posko",
    description:
      "Serikat buruh berdemo damai di depan posko kampanye menuntut komitmen upah layak. Kamera media berjajar. Megafon sudah disodorkan ke arah Anda.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "temui_teken", label: "Temui perwakilan, teken kontrak politik upah layak", effects: { elektabilitas: 3, faksi: { buruh_tani: 6, konsorsium_bisnis: -4 } } },
      { key: "dialog_normatif", label: "Dialog normatif: 'akan kami kaji bersama semua pihak'", effects: { elektabilitas: 0, faksi: { buruh_tani: -2, konsorsium_bisnis: 1 } } },
      { key: "pintu_belakang", label: "Keluar lewat pintu belakang, ada 'agenda mendadak'", effects: { elektabilitas: -3, kepercayaan_publik: -2, faksi: { buruh_tani: -5 } } },
    ],
  },
  {
    code: "nelayan_bbm",
    title: "Solar Nelayan Langka",
    description:
      "Nelayan tidak bisa melaut tiga minggu karena solar bersubsidi raib di tingkat pengecer. Anehnya, SPBU industri milik kerabat pejabat setempat stoknya selalu penuh.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "bongkar_rantai", label: "Janji audit rantai distribusi terbuka + posko pengaduan", effects: { elektabilitas: 4, kepercayaan_publik: 3, faksi: { buruh_tani: 5, konsorsium_bisnis: -3 } } },
      { key: "subsidi_tunai", label: "Janjikan bantuan tunai nelayan (tanpa sentuh distribusi)", effects: { elektabilitas: 2, faksi: { buruh_tani: 2, konsorsium_bisnis: 1 } } },
      { key: "bukan_wewenang", label: "'Itu wewenang pusat' — geser topik ke pariwisata", effects: { elektabilitas: -3, faksi: { buruh_tani: -4 } } },
    ],
  },
  {
    code: "survei_bocor",
    title: "Survei Internal Bocor",
    description:
      "Survei internal yang menempatkan Anda tertinggal 11 poin bocor ke media. Lembaga survei membantah, tim panik, grup keluarga sudah mengirim stiker 'Yang Sabar Ya'.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "akui_gaspol", label: "Akui tertinggal, jadikan narasi 'petarung yang dikepung'", effects: { elektabilitas: 3, kepercayaan_publik: 2, faksi: { buruh_tani: 2 } } },
      { key: "survei_tandingan", label: "Rilis survei tandingan dari lembaga yang 'lebih bersahabat'", effects: { elektabilitas: 1, kepercayaan_publik: -3, dana_kampanye: -350, faksi: { menengah_urban: -2 } } },
      { key: "tuduh_rekayasa", label: "Tuduh kebocoran sebagai operasi rival", effects: { elektabilitas: -1, kepercayaan_publik: -1 } },
    ],
  },
  {
    code: "relawan_kaos",
    title: "Gudang Kaos Kampanye Kosong",
    description:
      "Sepuluh ribu relawan menagih kaos yang dijanjikan koordinator lapangan — yang ternyata memesan ke percetakan milik iparnya sendiri dan hasilnya baru jadi 4%.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "ganti_vendor", label: "Putus kontrak ipar itu, tender kilat terbuka ke 3 percetakan", effects: { elektabilitas: 1, dana_kampanye: -450, kepercayaan_publik: 3, faksi: { konsorsium_bisnis: 2 } } },
      { key: "tunggu_ipar", label: "Beri ipar waktu 2 minggu lagi (dia janji sungguh-sungguh)", effects: { elektabilitas: -2, faksi: { buruh_tani: -2 } } },
      { key: "tanpa_kaos", label: "Umumkan gerakan 'kampanye tanpa kaos, dananya untuk bibit'", effects: { elektabilitas: 2, kepercayaan_publik: 2, faksi: { buruh_tani: 3, menengah_urban: 1 } } },
    ],
  },
  {
    code: "wartawan_amplop",
    title: "Oknum Wartawan Minta 'Uang Bensin'",
    description:
      "Seorang oknum wartawan menawarkan liputan positif rutin dengan imbalan 'uang bensin bulanan'. Ia menunjukkan contoh: berita rival yang mendadak harum semerbak.",
    trigger_stage: "perang_elektabilitas",
    options: [
      { key: "tolak_umumkan", label: "Tolak & umumkan kebijakan anti-amplop untuk semua liputan", effects: { elektabilitas: 1, kepercayaan_publik: 4, faksi: { menengah_urban: 3 } } },
      { key: "bayar", label: "Bayar — anggap saja 'biaya media relations'", effects: { elektabilitas: 2, dana_kampanye: -250, kepercayaan_publik: -5 } },
      { key: "ancam_balik", label: "Ancam laporkan ke dewan pers sambil merekam", effects: { elektabilitas: 0, kepercayaan_publik: 1, faksi: { menengah_urban: -1 } } },
    ],
  },
];
