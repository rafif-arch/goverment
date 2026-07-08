"use client";
// "Ruang Kerja Kepala Daerah" — layer dekorasi kosmetik yang dimiliki & dipasang.
import { motion, useReducedMotion } from "framer-motion";

const DECOR_LAYERS: Record<string, { emoji: string; style: React.CSSProperties }> = {
  "decor-kursi": { emoji: "🪑", style: { bottom: "8%", left: "44%", fontSize: "3rem" } },
  "decor-akuarium": { emoji: "🐠", style: { bottom: "22%", right: "8%", fontSize: "2.6rem" } },
  "decor-rak": { emoji: "🏆", style: { top: "14%", left: "8%", fontSize: "2.2rem" } },
  "decor-karpet": { emoji: "🟥", style: { bottom: "2%", left: "30%", fontSize: "2.4rem", transform: "scaleX(3)" } },
  "decor-lukisan": { emoji: "🖼️", style: { top: "10%", right: "12%", fontSize: "2.4rem" } },
};

export default function OfficeDecor({ equippedRefs }: { equippedRefs: string[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#151b2e] to-[#0d1220]">
      <div className="absolute inset-x-0 bottom-0 h-8 bg-white/5" />
      <p className="absolute left-3 top-2 text-[10px] uppercase tracking-widest text-white/35">
        Ruang Kerja Kepala Daerah
      </p>
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-5xl" aria-hidden>
        🧑‍💼
      </span>
      {equippedRefs.map((ref, i) => {
        const layer = DECOR_LAYERS[ref];
        if (!layer) return null;
        return (
          <motion.span
            key={ref}
            className="absolute select-none"
            style={layer.style}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : i * 0.1 }}
            aria-hidden
          >
            {layer.emoji}
          </motion.span>
        );
      })}
      {equippedRefs.length === 0 && (
        <p className="absolute inset-x-0 bottom-10 text-center text-xs text-white/30">
          Ruangan masih kosong — mampir ke Toko untuk dekorasi.
        </p>
      )}
    </div>
  );
}
