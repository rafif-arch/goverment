"use client";
// Notifikasi "breaking news" beranimasi saat world_event baru di-publish
// (Supabase Realtime pada polsim.world_events).
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";

interface WorldEvent {
  id: string;
  title: string;
  narasi: string;
}

export default function BreakingNews() {
  const { session } = useGame();
  const [event, setEvent] = useState<WorldEvent | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel("world-events-breaking")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "polsim", table: "world_events" },
        (payload) => {
          setEvent(payload.new as WorldEvent);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { y: -80, opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed inset-x-0 top-14 z-50 mx-auto w-full max-w-2xl px-4"
          role="alert"
        >
          <div className="overflow-hidden rounded-2xl border border-red-500/40 bg-[#14060a] text-white shadow-elevate">
            <div className="flex items-center gap-2 bg-signal-red px-4 py-1.5 text-xs font-black uppercase tracking-widest">
              <motion.span
                animate={reduced ? {} : { opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                ●
              </motion.span>
              Kabar Sela — Kantor Berita Arcapada
            </div>
            <div className="px-4 py-3">
              <p className="font-bold">{event.title}</p>
              <p className="mt-1 text-sm text-white/80">{event.narasi}</p>
              <button
                onClick={() => setEvent(null)}
                className="mt-2 rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
