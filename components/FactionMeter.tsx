"use client";
// Meter kepuasan faksi — bar beranimasi (transform-only).
import { motion, useReducedMotion } from "framer-motion";
import StatCount from "@/components/StatCount";

export default function FactionMeter({
  name,
  icon,
  level,
}: {
  name: string;
  icon: string;
  level: number;
}) {
  const reduced = useReducedMotion();
  const color = level >= 65 ? "#30a46c" : level >= 40 ? "#f5b544" : "#e5484d";
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-lg" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-medium">{name}</span>
          <span className="text-xs font-bold tabular-nums">
            <StatCount value={level} />
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/10">
          <motion.div
            className="h-full origin-left rounded-full"
            style={{ backgroundColor: color }}
            initial={reduced ? { scaleX: level / 100 } : { scaleX: 0 }}
            animate={{ scaleX: level / 100 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
