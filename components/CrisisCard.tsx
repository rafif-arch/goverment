"use client";
// Kartu crisis event ala breaking news + pilihan respons.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface CrisisRow {
  id: string;
  code: string;
  title: string;
  description: string;
  source: string;
  options: Array<{
    key: string;
    label: string;
    effects: Record<string, unknown>;
  }>;
}

function effectPreview(effects: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof effects.elektabilitas === "number" && effects.elektabilitas !== 0)
    parts.push(`elektabilitas ${effects.elektabilitas > 0 ? "+" : ""}${effects.elektabilitas}`);
  if (typeof effects.dana_kampanye === "number" && effects.dana_kampanye !== 0)
    parts.push(`dana ${effects.dana_kampanye > 0 ? "+" : ""}${effects.dana_kampanye} jt`);
  if (typeof effects.kepercayaan_publik === "number" && effects.kepercayaan_publik !== 0)
    parts.push(`kepercayaan ${effects.kepercayaan_publik > 0 ? "+" : ""}${effects.kepercayaan_publik}`);
  const faksi = effects.faksi as Record<string, number> | undefined;
  if (faksi) {
    for (const [k, v] of Object.entries(faksi)) parts.push(`${k.replace("_", " ")} ${v > 0 ? "+" : ""}${v}`);
  }
  return parts.join(" · ");
}

export default function CrisisCard({
  crisis,
  answered,
  answeredKey,
  busy,
  onChoose,
}: {
  crisis: CrisisRow;
  answered: boolean;
  answeredKey?: string;
  busy: boolean;
  onChoose: (key: string) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`overflow-hidden rounded-2xl border shadow-sm ${
        answered ? "border-black/10 bg-white/60 opacity-70" : "border-red-300 bg-white"
      }`}
    >
      <div className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white ${answered ? "bg-black/40" : "bg-signal-red"}`}>
        {!answered && (
          <motion.span animate={reduced ? {} : { opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.1 }}>
            ●
          </motion.span>
        )}
        {crisis.source === "news_derived" ? "Krisis — dari dunia nyata" : "Krisis Kampanye"}
      </div>
      <div className="space-y-3 p-4">
        <h3 className="font-bold leading-snug">{crisis.title}</h3>
        <p className="text-sm text-black/70">{crisis.description}</p>
        <AnimatePresence>
          <div className="grid gap-2">
            {crisis.options.map((opt) => {
              const isPicked = answeredKey === opt.key;
              return (
                <button
                  key={opt.key}
                  disabled={answered || busy}
                  onClick={() => onChoose(opt.key)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    isPicked
                      ? "border-amber-500 bg-amber-50 font-semibold"
                      : answered
                        ? "border-black/5 text-black/40"
                        : "border-black/10 hover:border-amber-400 hover:bg-amber-50/50"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="mt-0.5 block text-[11px] text-black/45">{effectPreview(opt.effects)}</span>
                </button>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
