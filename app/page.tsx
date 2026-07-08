"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import AuthGate from "@/components/AuthGate";
import { useGame } from "@/lib/game-context";

const STEPS = [
  { icon: "🗺️", title: "Babak I — Peta & Makro", desc: "Pelajari region, indikator ekonomi, dan 4 faksi masyarakat." },
  { icon: "🧑‍💼", title: "Babak II — Karakter", desc: "Rakit kandidatmu. Hati-hati memilih penyandang dana." },
  { icon: "📣", title: "Babak III — Kampanye", desc: "Tiket partai, calon wakil, perang elektabilitas, hari pemilihan." },
  { icon: "🏛️", title: "Babak IV — Menjabat", desc: "Eksekusi proyek, hadapi sponsor... dan Komisi Integritas Arcapada." },
];

export default function Home() {
  const { session, loading, campaign } = useGame();
  const reduced = useReducedMotion();

  return (
    <div className="space-y-10 py-6">
      <motion.section
        initial={reduced ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Republik Arcapada</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          Simulator Politik <span className="text-amber-600">&</span> Birokrasi
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-black/60">
          Menang pemilu itu mudah. Bertahan dari audit — itu baru permainan.
          Satire birokrasi di negara fiksi yang datanya terinspirasi statistik sungguhan.
        </p>
      </motion.section>

      {loading ? (
        <p className="text-center text-sm text-black/50">Memuat…</p>
      ) : session ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          {campaign ? (
            <Link
              href={campaign.current_stage === "menjabat" || campaign.current_stage === "game_over" ? "/command-center" : "/kampanye"}
              className="w-full rounded-2xl bg-signal-gold px-6 py-4 text-center text-lg font-bold text-black shadow-glowGold"
            >
              ▶ Lanjutkan Permainan
            </Link>
          ) : (
            <Link
              href="/peta"
              className="w-full rounded-2xl bg-signal-gold px-6 py-4 text-center text-lg font-bold text-black shadow-glowGold"
            >
              ▶ Mulai dari Peta Arcapada
            </Link>
          )}
          <Link href="/leaderboard" className="text-sm text-black/60 underline">
            Lihat papan peringkat
          </Link>
        </div>
      ) : (
        <AuthGate />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            className="panel p-5"
            initial={reduced ? {} : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduced ? 0 : i * 0.08 }}
          >
            <div className="text-3xl">{s.icon}</div>
            <h3 className="mt-2 font-bold">{s.title}</h3>
            <p className="mt-1 text-sm text-black/60">{s.desc}</p>
          </motion.div>
        ))}
      </section>

      <p className="text-center text-xs text-black/40">
        Semua negara, kota, partai, tokoh, dan lembaga dalam game ini fiksi. Kemiripan dengan
        entitas nyata adalah kebetulan statistik — persis seperti alasan pejabat di dalam game ini.
      </p>
    </div>
  );
}
