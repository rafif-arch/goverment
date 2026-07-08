"use client";
// Meter IPK (Indeks Persepsi Kerawanan) — pemain hanya melihat agregat
// via RPC get_my_ipk (detail flag tetap rahasia Komisi Integritas Arcapada).
import { motion, useReducedMotion } from "framer-motion";
import StatCount from "@/components/StatCount";

const FLAG_LABEL: Record<string, string> = {
  vendor_relational: "Relasi vendor mencurigakan",
  jam_tidak_wajar: "Aktivitas anggaran jam janggal",
  anggaran_janggal: "Markup RAB tidak wajar",
};

export default function AuditMeter({
  score,
  flagCounts,
}: {
  score: number;
  flagCounts: Record<string, number>;
}) {
  const reduced = useReducedMotion();
  const danger = score >= 60;
  const desc =
    score >= 80
      ? "Tim KIA sudah memesan tiket ke daerahmu."
      : score >= 60
        ? "Wartawan investigasi mulai menelepon mantan bendaharamu."
        : score >= 35
          ? "Ada desas-desus di warung kopi dekat kantor inspektorat."
          : score > 0
            ? "Sejauh ini aman. Sejauh ini."
            : "Bersih. Komisi Integritas sampai bosan.";

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-white/50">Indeks Persepsi Kerawanan</p>
          <p className={`text-4xl font-black tabular-nums ${danger ? "text-signal-red" : "text-signal-gold"}`}>
            <StatCount value={score} decimals={0} />
            <span className="text-lg text-white/40">/100</span>
          </p>
        </div>
        {danger && (
          <motion.span
            animate={reduced ? {} : { opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.9 }}
            className="rounded-full bg-signal-red/20 px-3 py-1 text-xs font-bold text-signal-red"
          >
            ⚠ ZONA BAHAYA
          </motion.span>
        )}
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full origin-left rounded-full"
          style={{
            background: "linear-gradient(90deg, #30a46c 0%, #f5b544 55%, #e5484d 85%)",
          }}
          initial={reduced ? { scaleX: score / 100 } : { scaleX: 0 }}
          animate={{ scaleX: score / 100 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* garis ambang OTT */}
        <div className="absolute inset-y-0 left-[80%] w-0.5 bg-white/70" title="Ambang OTT (80)" />
      </div>
      <p className="text-xs italic text-white/50">{desc}</p>
      {Object.keys(flagCounts).length > 0 && (
        <ul className="space-y-1 text-xs text-white/70">
          {Object.entries(flagCounts).map(([type, count]) => (
            <li key={type} className="flex justify-between">
              <span>🚩 {FLAG_LABEL[type] ?? type}</span>
              <span className="font-bold tabular-nums">×{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
