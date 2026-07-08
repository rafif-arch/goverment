// Layer transformasi fiksi: mapping provinsi riil (sumber statistik BPS)
// → region fiksi Arcapada. Mapping ini INSPIRASI STATISTIK saja —
// identitas, nama, dan narasi region sepenuhnya fiksi (DECISIONS.md §5).
//
// Kode wilayah BPS memakai kode provinsi 2 digit.

export interface RegionMapping {
  regionCode: string; // kode region fiksi (polsim.regions.code)
  bpsProvinceCode: string; // kode provinsi BPS sumber statistik
  bpsProvinceLabel: string; // label sumber, hanya untuk dokumentasi pipeline
}

export const REGION_MAPPINGS: RegionMapping[] = [
  { regionCode: "candrakala", bpsProvinceCode: "3100", bpsProvinceLabel: "provinsi-ibukota" },
  { regionCode: "lembah_sarna", bpsProvinceCode: "3300", bpsProvinceLabel: "provinsi-agraris" },
  { regionCode: "kutabara", bpsProvinceCode: "6400", bpsProvinceLabel: "provinsi-tambang" },
  { regionCode: "tirtagati", bpsProvinceCode: "7100", bpsProvinceLabel: "provinsi-pesisir" },
  { regionCode: "argasoka", bpsProvinceCode: "3400", bpsProvinceLabel: "provinsi-kota-pelajar" },
];

// ID variabel BPS Web API (model=data, domain=0000).
// Catatan: ID variabel BPS bisa berubah antar rilis; jika request gagal/nilai kosong,
// pipeline otomatis memakai fallback (data/bps-fallback.json) dan mencatatnya.
export const BPS_VARIABLES = {
  ipm: { varId: 414, label: "Indeks Pembangunan Manusia", clamp: [40, 95] as [number, number] },
  gini_ratio: { varId: 370, label: "Gini Ratio", clamp: [0.2, 0.6] as [number, number] },
  tingkat_pengangguran: { varId: 543, label: "Tingkat Pengangguran Terbuka", clamp: [1, 20] as [number, number] },
};
