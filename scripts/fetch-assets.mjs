// Prebuild: unduh aset visual AI (hero + potret tokoh) ke /public.
// Berjalan otomatis sebelum `next build` (hook npm "prebuild") — di Vercel
// jaringan terbuka sehingga aset selalu ikut ter-deploy. Kegagalan unduh
// TIDAK menggagalkan build: UI punya fallback bila file tidak ada.
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const BASE = "https://d8j0ntlcm91z4.cloudfront.net/user_3FtLVgw10RkjdAqhhyuRCfJWdze";

const ASSETS = [
  ["public/hero.webp", `${BASE}/hf_20260708_120101_88915d67-7cc7-4fbf-b48f-f09ee0eb3bcb_min.webp`],
  ["public/teaser.mp4", `${BASE}/hf_20260708_122036_e24d2f95-860e-4837-a449-4d190a84d444.mp4`],
  ["public/logo.webp", `${BASE}/hf_20260708_121500_c3e4471f-2be6-4573-8f5b-0448621b017b_min.webp`],
  ["public/ott.webp", `${BASE}/hf_20260708_121520_86f4b2c8-ef50-45dd-bcd5-8bfeb8c73d20_min.webp`],
  ["public/regions/candrakala.webp", `${BASE}/hf_20260708_121528_b7fc4d90-d576-45e6-8d67-26f2bd3c538f_min.webp`],
  ["public/regions/lembah_sarna.webp", `${BASE}/hf_20260708_121536_510b0e04-f62c-4f4e-8559-a578403efde5_min.webp`],
  ["public/regions/kutabara.webp", `${BASE}/hf_20260708_121830_46da1de5-a860-4fd6-9aa0-6830ad5e5bc6_min.webp`],
  ["public/regions/tirtagati.webp", `${BASE}/hf_20260708_121840_aca9fcc4-eeae-4ffd-b45b-65819d77b892_min.webp`],
  ["public/regions/argasoka.webp", `${BASE}/hf_20260708_121848_ed4145db-3e5a-4e03-8f3f-4be64477ca58_min.webp`],
  ["public/portraits/harsa_widagdo.webp", `${BASE}/hf_20260708_120124_0419a301-cd0d-463e-9421-c483fb890ac4_min.webp`],
  ["public/portraits/sekar_prameswari.webp", `${BASE}/hf_20260708_120134_40e0d8cb-4c83-4d69-ba06-480a8b8161a0_min.webp`],
  ["public/portraits/ki_anom_sudira.webp", `${BASE}/hf_20260708_120141_f300f659-8989-418a-9fb3-cbe8e88e4230_min.webp`],
  ["public/portraits/halimah_rukmini.webp", `${BASE}/hf_20260708_120241_68f1e853-c7b1-4ddd-82dc-61deed2ad4db_min.webp`],
  ["public/portraits/nirmala_chandrawinata.webp", `${BASE}/hf_20260708_120251_4b50477d-fed0-4a5f-8df4-84b58b54563f_min.webp`],
  ["public/portraits/yudhistira_mahesa.webp", `${BASE}/hf_20260708_120258_df61b713-e5e7-4ed7-ab83-38adce9fe783_min.webp`],
  ["public/portraits/bagas_hartawan.webp", `${BASE}/hf_20260708_120312_900e8c7d-f624-411b-a902-7fb3eebf918a_min.webp`],
  ["public/portraits/ratih_kusumadewi.webp", `${BASE}/hf_20260708_120324_4d77ae7a-6844-4df7-b972-b091076526f7_min.webp`],
  ["public/portraits/marta_simarmata.webp", `${BASE}/hf_20260708_120333_af87329a-d65c-4c63-91ab-00c4e80573cf_min.webp`],
  ["public/portraits/gilang_panuluh.webp", `${BASE}/hf_20260708_120342_fa43831a-d7aa-441c-b172-68bf28126e7f_min.webp`],
];

mkdirSync(resolve("public/portraits"), { recursive: true });
mkdirSync(resolve("public/regions"), { recursive: true });

let ok = 0;
for (const [path, url] of ASSETS) {
  const target = resolve(path);
  if (existsSync(target) && statSync(target).size > 1000) {
    ok++;
    continue; // sudah ada (commit lokal / build sebelumnya)
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error("respons terlalu kecil");
    writeFileSync(target, buf);
    ok++;
    console.log(`  ✓ ${path} (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.warn(`  ! lewati ${path}: ${err.message} (UI fallback aktif)`);
  }
}
console.log(`fetch-assets: ${ok}/${ASSETS.length} aset tersedia.`);
