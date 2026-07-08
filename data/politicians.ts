// 10 tokoh NPC composite-archetype (DECISIONS.md §3).
// SELF-CHECK dilakukan per tokoh: kombinasi axis + backstory + gender + generasi
// tidak boleh menunjuk unik ke satu tokoh nyata. Semua nama, kota asal, dan jalur
// karier adalah fiksi. Axis: -100..+100
//   axis_ekonomi     : -100 populis      .. +100 pro-market
//   axis_basis       : -100 akar rumput  .. +100 elite
//   axis_komunikasi  : -100 blak-blakan  .. +100 formal
//   axis_legitimasi  : dinasti | self_made | teknokrat | militer

export interface PoliticianSeed {
  code: string;
  name: string;
  party_code: string;
  gender: "pria" | "wanita";
  generasi: "muda" | "menengah" | "senior";
  axis_ekonomi: number;
  axis_basis: number;
  axis_komunikasi: number;
  axis_legitimasi: "dinasti" | "self_made" | "teknokrat" | "militer";
  backstory: string;
  portrait_description: string;
  is_running_mate_candidate: boolean;
}

export const POLITICIANS: PoliticianSeed[] = [
  {
    code: "harsa_widagdo",
    name: "Harsa Widagdo",
    party_code: "pdr",
    gender: "pria",
    generasi: "senior",
    axis_ekonomi: 20,
    axis_basis: 55,
    axis_komunikasi: 70,
    axis_legitimasi: "militer",
    backstory:
      "Purnawirawan korps zeni yang menghabiskan dinasnya membangun jembatan di pelosok Arcapada, lalu pensiun menjadi komisaris BUMD air minum. Masuk politik karena kesal proposal perbaikan bendungan ditolak tiga kali berturut-turut oleh tiga kepala daerah berbeda.",
    portrait_description: "Pria 60-an berkacamata baca, rambut putih rapi, setelan safari abu-abu dengan pin jembatan kecil di kerah.",
    is_running_mate_candidate: true,
  },
  {
    code: "sekar_prameswari",
    name: "Sekar Prameswari",
    party_code: "pdr",
    gender: "wanita",
    generasi: "muda",
    axis_ekonomi: 10,
    axis_basis: 60,
    axis_komunikasi: 40,
    axis_legitimasi: "dinasti",
    backstory:
      "Cucu salah satu deklarator Partai Dwipa Raya. Lulusan hubungan internasional yang memilih pulang mengurus koperasi batik neneknya di Tirtagati sebelum ditarik ke pengurus pusat. Sering diremehkan sebagai 'cucu deklarator' — sampai orang melihat notulen rapatnya yang berwarna-warni dan mengerikan detailnya.",
    portrait_description: "Perempuan akhir 20-an, blazer batik modern, membawa tablet penuh stiker catatan.",
    is_running_mate_candidate: true,
  },
  {
    code: "ki_anom_sudira",
    name: "Ki Anom Sudira",
    party_code: "pcn",
    gender: "pria",
    generasi: "senior",
    axis_ekonomi: -55,
    axis_basis: -60,
    axis_komunikasi: -30,
    axis_legitimasi: "self_made",
    backstory:
      "Guru mengaji kampung yang membangun jejaring 400 majelis dari nol sambil berdagang hasil kebun. Terkenal karena khotbahnya pendek dan pertanyaannya panjang — terutama kepada pejabat yang datang minta didoakan menjelang pemilihan.",
    portrait_description: "Pria 60-an bersarung tenun dan peci hitam, senyum tipis, tangan memegang buku catatan kecil lusuh.",
    is_running_mate_candidate: true,
  },
  {
    code: "halimah_rukmini",
    name: "Halimah Rukmini",
    party_code: "pcn",
    gender: "wanita",
    generasi: "menengah",
    axis_ekonomi: -30,
    axis_basis: -20,
    axis_komunikasi: 50,
    axis_legitimasi: "self_made",
    backstory:
      "Mantan bendahara pasar induk Lembah Sarna yang naik jadi ketua asosiasi pedagang setelah berhasil membuat sistem retribusi yang tidak bisa 'dititipkan'. Masuk partai karena diajak; bertahan karena penasaran ke mana perginya dana renovasi musala pasar.",
    portrait_description: "Perempuan 40-an berkerudung sederhana, blus polos, kalkulator dagang masih di tas.",
    is_running_mate_candidate: true,
  },
  {
    code: "nirmala_chandrawinata",
    name: "Dr. Nirmala Chandrawinata",
    party_code: "pas",
    gender: "wanita",
    generasi: "menengah",
    axis_ekonomi: 35,
    axis_basis: 45,
    axis_komunikasi: 65,
    axis_legitimasi: "teknokrat",
    backstory:
      "Doktor statistik yang sepuluh tahun menjadi konsultan perencanaan daerah. Pernah membatalkan proyek monumen senilai puluhan miliar hanya dengan satu slide berisi kurva manfaat-biaya. Slide itu kini dibingkai di kantor pusat Partai Akal Sehat.",
    portrait_description: "Perempuan 40-an berkacamata tanpa bingkai, blazer navy, laser pointer selalu di saku.",
    is_running_mate_candidate: true,
  },
  {
    code: "yudhistira_mahesa",
    name: "Yudhistira Mahesa",
    party_code: "pas",
    gender: "pria",
    generasi: "muda",
    axis_ekonomi: 55,
    axis_basis: 20,
    axis_komunikasi: -45,
    axis_legitimasi: "self_made",
    backstory:
      "Pendiri startup logistik antarpulau yang gulung tikar dengan terhormat, lalu membangun koperasi kurir yang justru menguntungkan. Bicara apa adanya sampai tim humas partai menyiapkan tombol darurat untuk memotong live-nya.",
    portrait_description: "Pria awal 30-an, kemeja flanel digulung, jam tangan penunjuk detak jantung, dua ponsel.",
    is_running_mate_candidate: true,
  },
  {
    code: "bagas_hartawan",
    name: "Bagas Hartawan",
    party_code: "pns",
    gender: "pria",
    generasi: "senior",
    axis_ekonomi: 80,
    axis_basis: 85,
    axis_komunikasi: 60,
    axis_legitimasi: "self_made",
    backstory:
      "Memulai dari satu truk sewaan menjadi raja pergudangan Arcapada. Motonya: 'Semua bisa diangkut, kecuali reputasi.' Menjadi bendahara umum partai bukan karena paham politik, melainkan karena tidak ada yang berani memeriksa pembukuannya.",
    portrait_description: "Pria 60-an, batik sutra mengilap, cerutu tak pernah dinyalakan — hanya untuk menunjuk.",
    is_running_mate_candidate: true,
  },
  {
    code: "ratih_kusumadewi",
    name: "Ratih Kusumadewi",
    party_code: "pns",
    gender: "wanita",
    generasi: "menengah",
    axis_ekonomi: 60,
    axis_basis: 70,
    axis_komunikasi: -20,
    axis_legitimasi: "dinasti",
    backstory:
      "Generasi kedua dinasti bisnis perhotelan Tirtagati. Mengambil alih perusahaan keluarga di usia 30 dan melipatgandakannya — lalu bosan, karena 'hotel tidak bisa membalas di media sosial'. Politik ternyata bisa.",
    portrait_description: "Perempuan 40-an, setelan putih tegas, kacamata hitam disangkutkan di kerah.",
    is_running_mate_candidate: true,
  },
  {
    code: "marta_simarmata",
    name: "Marta Simarmata",
    party_code: "psj",
    gender: "wanita",
    generasi: "menengah",
    axis_ekonomi: -75,
    axis_basis: -80,
    axis_komunikasi: -60,
    axis_legitimasi: "self_made",
    backstory:
      "Organizer buruh pelabuhan Tirtagati yang memimpin negosiasi upah paling singkat dalam sejarah: 40 menit, karena ia membawa fotokopi pembukuan ganda perusahaan. Kalimat andalannya: 'Saya tidak marah, saya cuma membacakan angka.'",
    portrait_description: "Perempuan 40-an, rompi serikat pekerja di atas kemeja, map merah tebal di ketiak.",
    is_running_mate_candidate: true,
  },
  {
    code: "gilang_panuluh",
    name: "Gilang Panuluh",
    party_code: "psj",
    gender: "pria",
    generasi: "muda",
    axis_ekonomi: -50,
    axis_basis: -70,
    axis_komunikasi: -70,
    axis_legitimasi: "self_made",
    backstory:
      "Penyiar radio komunitas Kutabara yang siarannya memaksa dinas menambal 217 lubang jalan dalam setahun — pendengar tinggal menyebut lokasi, Gilang menyebutkannya setiap jam sampai ditambal. Kini ingin tahu apakah trik yang sama berlaku untuk anggaran.",
    portrait_description: "Pria akhir 20-an, jaket parasut komunitas, headphone melingkar di leher.",
    is_running_mate_candidate: true,
  },
];
