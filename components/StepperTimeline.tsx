"use client";
// Stepper 4 tahap kampanye (Babak III).
import { motion, useReducedMotion } from "framer-motion";

const STAGES = [
  { key: "cari_tiket", label: "Tiket Partai", icon: "🎫" },
  { key: "meminang_wakil", label: "Meminang Wakil", icon: "🤝" },
  { key: "perang_elektabilitas", label: "Perang Elektabilitas", icon: "⚔️" },
  { key: "hari_pemilihan", label: "Hari Pemilihan", icon: "🗳️" },
];

export default function StepperTimeline({ current }: { current: string }) {
  const reduced = useReducedMotion();
  const idx = Math.max(0, STAGES.findIndex((s) => s.key === current));
  return (
    <ol className="flex items-center gap-1 overflow-x-auto py-2 sm:gap-2">
      {STAGES.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s.key} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <motion.div
              initial={false}
              animate={active && !reduced ? { scale: [1, 1.06, 1] } : {}}
              transition={{ repeat: active ? Infinity : 0, duration: 2 }}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-xl px-2 py-2 text-center ${
                active
                  ? "bg-signal-gold text-black shadow-glowGold"
                  : done
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-black/5 text-black/40"
              }`}
            >
              <span className="text-lg">{done ? "✅" : s.icon}</span>
              <span className="truncate text-[11px] font-semibold sm:text-xs">{s.label}</span>
            </motion.div>
            {i < STAGES.length - 1 && <span className="text-black/20">›</span>}
          </li>
        );
      })}
    </ol>
  );
}
