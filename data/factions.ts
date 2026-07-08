// 4 faksi masyarakat Republik Arcapada
export interface FactionSeed {
  code: string;
  name: string;
  description: string;
  icon: string; // emoji sederhana untuk UI
}

export const FACTIONS: FactionSeed[] = [
  {
    code: "buruh_tani",
    name: "Serikat Buruh & Tani",
    description:
      "Pekerja pabrik, buruh pelabuhan, dan petani penggarap. Peka terhadap harga pangan, upah minimum, dan pupuk yang mendadak langka menjelang musim tanam.",
    icon: "🌾",
  },
  {
    code: "menengah_urban",
    name: "Kelas Menengah Urban",
    description:
      "Komuter, pekerja kantoran, dan pelaku ekonomi digital. Menuntut transportasi publik, internet cepat, dan birokrasi yang tidak minta fotokopi KTP lima kali.",
    icon: "🏙️",
  },
  {
    code: "tokoh_agama",
    name: "Majelis Tokoh Agama",
    description:
      "Pemuka agama dan jejaring majelis komunitas. Menjaga moral publik dan sangat memperhatikan adab pejabat — termasuk adab anggarannya.",
    icon: "🕌",
  },
  {
    code: "konsorsium_bisnis",
    name: "Konsorsium Bisnis",
    description:
      "Asosiasi pengusaha, pemilik modal, dan pemburu proyek pengadaan. Ramah kepada siapa pun yang menandatangani izin — selama disposisinya cepat.",
    icon: "💼",
  },
];
