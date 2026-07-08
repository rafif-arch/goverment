// Push workflow /n8n/workflows/*.json ke instance n8n via REST API.
// Jalankan: npm run push:n8n  (butuh N8N_API_URL + N8N_API_KEY di .env.local).
// Tanpa env tersebut script keluar dengan pesan ramah (exit 0) — tidak menggagalkan build.
// Keamanan: hanya membuat/meng-update workflow berprefix "PolSim — ";
// tidak pernah menyentuh workflow lain di instance.

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "../lib/load-env";

loadEnv();

const API_URL = process.env.N8N_API_URL?.replace(/\/$/, "");
const API_KEY = process.env.N8N_API_KEY;
const PREFIX = "PolSim — ";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      "X-N8N-API-KEY": API_KEY!,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  if (!API_URL || !API_KEY) {
    console.log("N8N_API_URL / N8N_API_KEY kosong — lewati push (import manual via UI n8n, lihat README).");
    return;
  }

  const existing = await api("/workflows?limit=250");
  const byName = new Map<string, string>(
    (existing.data ?? []).map((w: { id: string; name: string }) => [w.name, w.id])
  );

  const dir = resolve(process.cwd(), "n8n/workflows");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const wf = JSON.parse(readFileSync(resolve(dir, file), "utf8"));
    if (!String(wf.name ?? "").startsWith(PREFIX)) {
      console.warn(`  ! ${file}: nama tidak berprefix "${PREFIX}" — dilewati demi keamanan instance.`);
      continue;
    }
    // API v1 menolak field read-only
    const payload = {
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: wf.settings ?? {},
    };
    const existingId = byName.get(wf.name);
    if (existingId) {
      await api(`/workflows/${existingId}`, { method: "PUT", body: JSON.stringify(payload) });
      console.log(`  ↻ update: ${wf.name}`);
    } else {
      await api("/workflows", { method: "POST", body: JSON.stringify(payload) });
      console.log(`  + create: ${wf.name}`);
    }
  }
  console.log("Selesai. Workflow dibuat NON-AKTIF — aktifkan manual setelah credential diisi.");
}

main().catch((err) => {
  console.error("push:n8n gagal:", err.message);
  process.exit(1);
});
