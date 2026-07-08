"use client";
// Babak I — Peta interaktif & data makro region + meter 4 faksi.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";
import MapSVG from "@/components/MapSVG";
import FactionMeter from "@/components/FactionMeter";
import StatCount from "@/components/StatCount";

interface Region {
  id: string;
  code: string;
  name: string;
  type: string;
  difficulty: number;
  is_vip_only: boolean;
  deskripsi: string;
  pendapatan_daerah: number;
  ipm: number;
  gini_ratio: number;
  tingkat_pengangguran: number;
  isu_sektoral: Array<{ kode: string; judul: string; sektor: string; severity: number }>;
}

interface Faction {
  id: string;
  code: string;
  name: string;
  icon: string;
}

// Ilustrasi region (AI-generated, /public/regions/<code>.webp) — sembunyi bila belum ada.
function RegionArt({ code, name }: { code: string; name: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/regions/${code}.webp`}
      alt={name}
      loading="lazy"
      onError={() => setOk(false)}
      className="h-36 w-full rounded-xl object-cover"
    />
  );
}

export default function PetaPage() {
  const { session, loading, isVip, campaign } = useGame();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [regions, setRegions] = useState<Region[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [satisfaction, setSatisfaction] = useState<Record<string, Record<string, number>>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabase();
    (async () => {
      const [r, f, s] = await Promise.all([
        supabase.from("regions").select("*").order("difficulty"),
        supabase.from("factions").select("*"),
        supabase.from("region_faction_satisfaction").select("region_id, faction_id, satisfaction_level"),
      ]);
      setRegions((r.data as Region[]) ?? []);
      setFactions((f.data as Faction[]) ?? []);
      const map: Record<string, Record<string, number>> = {};
      for (const row of s.data ?? []) {
        map[row.region_id] = map[row.region_id] ?? {};
        map[row.region_id][row.faction_id] = row.satisfaction_level;
      }
      setSatisfaction(map);
    })();
  }, [session]);

  const region = useMemo(() => regions.find((r) => r.code === selected) ?? null, [regions, selected]);

  if (loading) return <p className="py-10 text-center text-sm text-black/50">Memuat…</p>;
  if (!session)
    return (
      <p className="py-10 text-center text-sm">
        Masuk dulu di <a href="/" className="underline">beranda</a> untuk membuka peta.
      </p>
    );

  const lockedVip = region?.is_vip_only && !isVip;

  return (
    <div className="space-y-4 py-4">
      <header>
        <h1 className="text-2xl font-black">🗺️ Babak I — Peta Republik Arcapada</h1>
        <p className="text-sm text-black/60">
          Ketuk sebuah region untuk membedah data makronya. Indikator diperbarui dari pipeline
          statistik (BPS-transformed).
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <MapSVG
          regions={regions.map((r) => ({ code: r.code, name: r.name, is_vip_only: r.is_vip_only, difficulty: r.difficulty }))}
          selected={selected}
          onSelect={setSelected}
        />

        <AnimatePresence mode="wait">
          {region ? (
            <motion.aside
              key={region.code}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
              className="panel space-y-4 p-5"
            >
              <RegionArt code={region.code} name={region.name} />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold">{region.name}</h2>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">
                    {region.is_vip_only ? "👑 VIP" : `Kesulitan ${"⭐".repeat(region.difficulty)}`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-black/60">{region.deskripsi}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                {[
                  { label: "IPM", value: region.ipm, decimals: 1 },
                  { label: "Gini Ratio", value: region.gini_ratio, decimals: 2 },
                  { label: "Pengangguran", value: region.tingkat_pengangguran, decimals: 1, suffix: "%" },
                  { label: "Pendapatan (miliar Ʀ)", value: region.pendapatan_daerah, decimals: 0 },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-black/5 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-black/50">{s.label}</p>
                    <p className="text-xl font-black tabular-nums">
                      <StatCount value={Number(s.value ?? 0)} decimals={s.decimals} suffix={s.suffix ?? ""} />
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Kepuasan Faksi (baseline dunia)</h3>
                <div className="space-y-2">
                  {factions.map((f) => (
                    <FactionMeter
                      key={f.id}
                      name={f.name}
                      icon={f.icon}
                      level={satisfaction[region.id]?.[f.id] ?? 50}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Isu Sektoral</h3>
                <ul className="space-y-1">
                  {region.isu_sektoral.map((isu) => (
                    <li key={isu.kode} className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 text-sm">
                      <span>{isu.judul}</span>
                      <span className="text-xs text-red-600">{"▲".repeat(isu.severity)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {campaign && campaign.current_stage !== "selesai" && campaign.current_stage !== "game_over" ? (
                <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800">
                  Kamu sudah punya kampanye aktif — lanjutkan di menu Kampanye/Komando.
                </p>
              ) : lockedVip ? (
                <a href="/shop" className="block rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-signal-gold">
                  👑 Region ibu kota terkunci — buka dengan VIP &quot;Intelijen Pusat&quot;
                </a>
              ) : (
                <button
                  onClick={() => router.push(`/karakter?region=${region.code}`)}
                  className="w-full rounded-xl bg-signal-gold px-4 py-3 font-bold text-black shadow-glowGold"
                >
                  🚀 Maju dari {region.name}
                </button>
              )}
            </motion.aside>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="panel flex items-center justify-center p-10 text-center text-sm text-black/40"
            >
              Pilih region di peta untuk melihat detail makro-ekonominya.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
