"use client";
// Peta 2.5D kepulauan fiksi Republik Arcapada — SVG + Framer Motion.
// Elevate + shadow saat hover/tap; hanya transform & opacity yang dianimasikan.
import { motion, useReducedMotion } from "framer-motion";

export interface MapRegionInfo {
  code: string;
  name: string;
  is_vip_only: boolean;
  difficulty: number;
}

// path abstrak per region (pulau fiksi — bukan peta wilayah riil)
const SHAPES: Record<string, { d: string; fill: string; labelX: number; labelY: number }> = {
  candrakala: {
    d: "M330,150 C355,120 410,115 440,135 C470,155 475,190 455,215 C430,245 370,250 340,225 C315,204 312,172 330,150 Z",
    fill: "#3e7bfa",
    labelX: 392,
    labelY: 185,
  },
  lembah_sarna: {
    d: "M120,270 C160,230 250,225 290,260 C330,295 325,355 280,385 C230,418 140,410 105,365 C78,330 88,300 120,270 Z",
    fill: "#30a46c",
    labelX: 205,
    labelY: 325,
  },
  kutabara: {
    d: "M520,90 C580,60 670,70 700,115 C728,158 710,220 660,240 C605,262 535,245 510,200 C490,163 490,115 520,90 Z",
    fill: "#c98a12",
    labelX: 608,
    labelY: 160,
  },
  tirtagati: {
    d: "M560,300 C600,280 660,290 680,325 C700,362 680,405 635,418 C588,431 540,410 530,370 C522,340 532,315 560,300 Z",
    fill: "#0ea5b7",
    labelX: 606,
    labelY: 358,
  },
  argasoka: {
    d: "M330,400 C355,380 400,382 420,405 C440,430 430,465 398,477 C365,490 328,475 318,445 C311,425 315,412 330,400 Z",
    fill: "#8b5cf6",
    labelX: 374,
    labelY: 435,
  },
};

export default function MapSVG({
  regions,
  selected,
  onSelect,
}: {
  regions: MapRegionInfo[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="relative w-full" style={{ perspective: 1000 }}>
      <motion.svg
        viewBox="0 0 800 520"
        className="h-auto w-full rounded-3xl bg-gradient-to-b from-[#0b2447] to-[#123a6b] shadow-elevate"
        initial={reduced ? {} : { rotateX: 8, opacity: 0 }}
        animate={reduced ? {} : { rotateX: 4, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        role="group"
        aria-label="Peta Republik Arcapada"
      >
        <defs>
          <filter id="island-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>
        {/* gelombang laut dekoratif */}
        {[80, 200, 330, 460].map((y, i) => (
          <path
            key={y}
            d={`M0,${y} Q200,${y - 12} 400,${y} T800,${y}`}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={2}
            fill="none"
          />
        ))}
        {regions.map((r) => {
          const shape = SHAPES[r.code];
          if (!shape) return null;
          const active = selected === r.code;
          return (
            <motion.g
              key={r.code}
              className="map-region"
              tabIndex={0}
              role="button"
              aria-label={`${r.name}${r.is_vip_only ? " (khusus VIP)" : ""}`}
              onClick={() => onSelect(r.code)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(r.code)}
              whileHover={reduced ? {} : { scale: 1.05, y: -6 }}
              whileTap={reduced ? {} : { scale: 0.98 }}
              animate={active && !reduced ? { scale: 1.06, y: -8 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              style={{ filter: "url(#island-shadow)" }}
            >
              <path d={shape.d} fill={shape.fill} opacity={active ? 1 : 0.88} stroke="rgba(255,255,255,0.35)" strokeWidth={active ? 3 : 1.5} />
              <text
                x={shape.labelX}
                y={shape.labelY}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fill="#fff"
                fontSize="16"
                fontWeight={700}
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}
              >
                {r.name.replace("Kabupaten ", "").replace("Kota ", "")}
              </text>
              <text
                x={shape.labelX}
                y={shape.labelY + 18}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fill="rgba(255,255,255,0.85)"
                fontSize="11"
              >
                {r.is_vip_only ? "👑 VIP" : "⭐".repeat(r.difficulty)}
              </text>
            </motion.g>
          );
        })}
        <text x="24" y="500" fill="rgba(255,255,255,0.5)" fontSize="12">
          Republik Arcapada — peta tidak menggambarkan wilayah mana pun di dunia nyata
        </text>
      </motion.svg>
    </div>
  );
}
