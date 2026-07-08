// Fixture berita untuk pengujian lokal end-to-end pipeline Live News
// (tanpa n8n & tanpa API berita): dimuat lewat POST /api/news/mock-ingest.
// Interpretasi di bawah meniru format output prompt /n8n/prompts/news-interpreter.md.

export interface NewsFixture {
  headline: string;
  summary: string;
  source_name: string;
  source_url: string;
  interpretation: {
    relevan: boolean;
    sektor: string;
    ringkasan_netral: string;
    efek_faksi: Record<string, number>;
    efek_variabel: Record<string, number>;
    draft_narasi_in_game: string;
    judul_in_game: string;
    duration_days: number;
  };
}

export const NEWS_FIXTURES: NewsFixture[] = [
  {
    headline: "[FIXTURE] Harga beras naik menjelang musim paceklik",
    summary: "Harga beras medium dilaporkan naik di sejumlah pasar induk dalam dua pekan terakhir.",
    source_name: "fixture-lokal",
    source_url: "https://example.invalid/fixture/beras",
    interpretation: {
      relevan: true,
      sektor: "pangan",
      ringkasan_netral: "Harga beras naik di banyak pasar menjelang musim tanam.",
      efek_faksi: { buruh_tani: -5, menengah_urban: -2 },
      efek_variabel: { inflasi_proyek: 0.05, sentimen_publik: -2 },
      draft_narasi_in_game:
        "Harga beras di pasar-pasar Arcapada merangkak naik; warung makan mulai mengecilkan porsi sambal secara diam-diam.",
      judul_in_game: "Beras Mahal, Dapur Arcapada Gelisah",
      duration_days: 7,
    },
  },
  {
    headline: "[FIXTURE] Pemerintah umumkan paket percepatan infrastruktur digital",
    summary: "Program perluasan jaringan internet cepat ke kota-kota lapis kedua diumumkan.",
    source_name: "fixture-lokal",
    source_url: "https://example.invalid/fixture/digital",
    interpretation: {
      relevan: true,
      sektor: "digital",
      ringkasan_netral: "Ada dorongan nasional untuk perluasan infrastruktur internet cepat.",
      efek_faksi: { menengah_urban: 4, konsorsium_bisnis: 3 },
      efek_variabel: { sentimen_publik: 2 },
      draft_narasi_in_game:
        "Demam infrastruktur digital melanda Arcapada; setiap dinas mendadak punya proposal 'smart-sesuatu'.",
      judul_in_game: "Demam Digitalisasi Melanda Arcapada",
      duration_days: 7,
    },
  },
  {
    headline: "[FIXTURE] Sorotan publik pada transparansi anggaran daerah menguat",
    summary: "Koalisi masyarakat sipil meluncurkan kanal pemantauan belanja daerah.",
    source_name: "fixture-lokal",
    source_url: "https://example.invalid/fixture/transparansi",
    interpretation: {
      relevan: true,
      sektor: "keamanan",
      ringkasan_netral: "Tekanan publik terhadap transparansi belanja pemerintah daerah meningkat.",
      efek_faksi: { tokoh_agama: 2, menengah_urban: 2 },
      efek_variabel: { sorotan_audit: 6, sentimen_publik: -1 },
      draft_narasi_in_game:
        "Komisi Integritas Arcapada kebanjiran laporan warga; mesin fotokopi di kantornya kini bekerja tiga sif.",
      judul_in_game: "Mata Publik Menyala ke Arah Anggaran",
      duration_days: 10,
    },
  },
];
