"use client";
// Leaderboard global: skor akhir campaign + lencana kosmetik.
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";

interface Entry {
  id: string;
  display_name: string;
  score: number;
  outcome: string;
  badge_code: string | null;
  breakdown: { pembangunan?: number; faksi?: number; integritas?: number; ipk?: number };
  created_at: string;
}

const OUTCOME_LABEL: Record<string, string> = {
  selesai: "🏁 Purna tugas",
  kalah: "🥀 Kalah pemilu",
  ott: "🚨 Kena OTT",
};

export default function LeaderboardPage() {
  const { session, loading } = useGame();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [badges, setBadges] = useState<Record<string, { nama: string; asset_ref: string }>>({});
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabase();
    (async () => {
      const [lb, cos] = await Promise.all([
        supabase.from("leaderboard_entries").select("*").order("score", { ascending: false }).limit(50),
        supabase.from("cosmetic_items").select("code, nama, asset_ref").eq("tipe", "lencana"),
      ]);
      setEntries((lb.data as Entry[]) ?? []);
      const map: Record<string, { nama: string; asset_ref: string }> = {};
      for (const c of cos.data ?? []) map[c.code] = { nama: c.nama, asset_ref: c.asset_ref };
      setBadges(map);
    })();
  }, [session]);

  if (loading) return <p className="py-10 text-center text-sm text-black/50">Memuat…</p>;
  if (!session)
    return <p className="py-10 text-center text-sm">Masuk dulu di <a href="/" className="underline">beranda</a>.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4">
      <header>
        <h1 className="text-2xl font-black">🏆 Papan Peringkat Arcapada</h1>
        <p className="text-sm text-black/60">
          Skor = 40% pembangunan + 30% kepuasan faksi + 30% integritas (100 − IPK).
        </p>
      </header>
      {entries.length === 0 && (
        <p className="panel p-8 text-center text-sm text-black/40">Belum ada yang menyelesaikan campaign. Jadilah legenda pertama.</p>
      )}
      <ol className="space-y-2">
        {entries.map((e, i) => (
          <motion.li
            key={e.id}
            initial={reduced ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : Math.min(i * 0.04, 0.5) }}
            className="panel flex items-center gap-3 p-4"
          >
            <span className={`w-8 text-center text-lg font-black ${i < 3 ? "text-amber-500" : "text-black/30"}`}>
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {e.display_name}{" "}
                {e.badge_code && badges[e.badge_code] && (
                  <span title={badges[e.badge_code].nama}>{badges[e.badge_code].asset_ref}</span>
                )}
              </p>
              <p className="text-xs text-black/50">
                {OUTCOME_LABEL[e.outcome] ?? e.outcome} · 🏗️ {e.breakdown?.pembangunan ?? 0} · 👥{" "}
                {e.breakdown?.faksi ?? 0} · 🛡️ {e.breakdown?.integritas ?? 0}
              </p>
            </div>
            <span className="text-xl font-black tabular-nums">{Number(e.score).toFixed(1)}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
