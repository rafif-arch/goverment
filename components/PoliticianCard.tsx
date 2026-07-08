"use client";
// Kartu tokoh composite-archetype + skor kompatibilitas sbg calon wakil.
import { motion, useReducedMotion } from "framer-motion";

export interface PoliticianRow {
  id: string;
  code: string;
  name: string;
  gender: string;
  generasi: string;
  axis_ekonomi: number;
  axis_basis: number;
  axis_komunikasi: number;
  axis_legitimasi: string;
  backstory: string;
  portrait_description: string;
  party_id: string | null;
}

const LEGITIMASI_LABEL: Record<string, string> = {
  dinasti: "🏰 Dinasti",
  self_made: "🔨 Self-made",
  teknokrat: "📐 Teknokrat",
  militer: "🎖️ Purnawirawan",
};

function AxisBar({ label, left, right, value }: { label: string; left: string; right: string; value: number }) {
  return (
    <div className="text-[10px]">
      <div className="flex justify-between text-black/40">
        <span>{left}</span>
        <span className="font-semibold text-black/60">{label}</span>
        <span>{right}</span>
      </div>
      <div className="relative mt-0.5 h-1.5 rounded-full bg-black/10">
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-500 shadow"
          style={{ left: `calc(${(value + 100) / 2}% - 6px)` }}
        />
      </div>
    </div>
  );
}

export default function PoliticianCard({
  p,
  compatibility,
  partyName,
  selected,
  onSelect,
}: {
  p: PoliticianRow;
  compatibility?: number;
  partyName?: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      onClick={onSelect}
      whileHover={reduced || !onSelect ? {} : { y: -4 }}
      className={`panel w-full space-y-2 p-4 text-left transition ${
        selected ? "ring-2 ring-amber-500" : ""
      } ${onSelect ? "" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold leading-tight">{p.name}</p>
          <p className="text-xs text-black/50">
            {partyName ?? ""} · {p.generasi} · {LEGITIMASI_LABEL[p.axis_legitimasi] ?? p.axis_legitimasi}
          </p>
        </div>
        {compatibility !== undefined && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-black tabular-nums ${
              compatibility >= 60 ? "bg-emerald-100 text-emerald-700" : compatibility >= 45 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
            }`}
            title="Kompatibilitas dengan region"
          >
            {compatibility}%
          </span>
        )}
      </div>
      <p className="text-xs italic text-black/50">{p.portrait_description}</p>
      <p className="line-clamp-3 text-xs text-black/70">{p.backstory}</p>
      <div className="space-y-1.5 pt-1">
        <AxisBar label="Ekonomi" left="Populis" right="Pro-market" value={p.axis_ekonomi} />
        <AxisBar label="Basis" left="Akar rumput" right="Elite" value={p.axis_basis} />
        <AxisBar label="Komunikasi" left="Blak-blakan" right="Formal" value={p.axis_komunikasi} />
      </div>
    </motion.button>
  );
}
