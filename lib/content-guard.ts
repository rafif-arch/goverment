// Guard pagar konten untuk Live News Layer (lapis kedua setelah prompt AI):
// mendeteksi kemungkinan bocornya nama entitas riil ke narasi in-game.
// Sengaja memakai POLA GENERIK (gelar, akronim kelembagaan, pola nama partai) —
// bukan daftar nama orang — supaya tidak ada nama tokoh riil tertulis di codebase.

const SUSPICIOUS_PATTERNS: Array<{ re: RegExp; alasan: string }> = [
  { re: /\b(presiden|menteri|gubernur|bupati|walikota|wali kota)\s+[A-Z][a-z]+/g, alasan: "jabatan riil diikuti nama orang" },
  { re: /\bpartai\s+[A-Z][A-Za-z]+(?!\s+(Dwipa|Cahaya|Akal|Niaga|Suara))/g, alasan: "menyebut nama partai di luar partai fiksi game" },
  { re: /\b(DPR|DPRD|MPR|KPK|Polri|TNI|KPU|Bawaslu|Kemen[a-z]+)\b/g, alasan: "akronim lembaga riil" },
  { re: /\b(Jakarta|Surabaya|Bandung|Medan|Semarang|Yogyakarta|Makassar|Bali|Indonesia)\b/gi, alasan: "nama tempat riil" },
  { re: /\bPT\s+[A-Z][A-Za-z]+\s+(Tbk|Persero)\b/g, alasan: "nama perusahaan riil (Tbk/Persero)" },
];

export interface GuardFinding {
  match: string;
  alasan: string;
}

/** Periksa teks draft event; kembalikan temuan mencurigakan (kosong = lolos). */
export function checkContentGuard(text: string): GuardFinding[] {
  const findings: GuardFinding[] = [];
  for (const { re, alasan } of SUSPICIOUS_PATTERNS) {
    const matches = text.match(re);
    if (matches) {
      for (const m of matches) findings.push({ match: m, alasan });
    }
  }
  return findings;
}
