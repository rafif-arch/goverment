"use client";
// Angka stat yang beranimasi (count-up) — hormati prefers-reduced-motion.
import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

export default function StatCount({
  value,
  suffix = "",
  prefix = "",
  className = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);
  const prev = useRef(value);

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.6, ease: "easeOut" });
    prev.current = value;
    return controls.stop;
  }, [value, mv, reduced]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
