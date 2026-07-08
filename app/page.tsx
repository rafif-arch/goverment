"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import AuthGate from "@/components/AuthGate";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { session, loading, campaign } = useGame();
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const [hasVideo, setHasVideo] = useState(true);
  const [hasHero, setHasHero] = useState(true);

  // tangkap kode referral dari link ajakan (/?ref=KODE) — di-redeem otomatis setelah login
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) localStorage.setItem("polsim_ref", ref);
    } catch {}
  }, []);

  const STEPS = [
    { icon: "🗺️", title: t("landing.step1t"), desc: t("landing.step1d") },
    { icon: "🧑‍💼", title: t("landing.step2t"), desc: t("landing.step2d") },
    { icon: "📣", title: t("landing.step3t"), desc: t("landing.step3d") },
    { icon: "🏛️", title: t("landing.step4t"), desc: t("landing.step4d") },
  ];

  return (
    <div className="space-y-10 py-6">
      {/* Teaser sinematik (AI-generated); fallback hero image; fallback teks */}
      {(hasVideo || hasHero) && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-3xl shadow-elevate"
        >
          {hasVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/hero.webp"
              onError={() => setHasVideo(false)}
              className="max-h-80 w-full object-cover"
            >
              <source src="/teaser.mp4" type="video/mp4" />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/hero.webp"
              alt="Panorama satire Republik Arcapada"
              onError={() => setHasHero(false)}
              className="max-h-80 w-full object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          <p className="pointer-events-none absolute bottom-3 left-4 text-sm font-bold text-white drop-shadow">
            🏛️ Kota Candrakala — {t("landing.tagline")}
          </p>
        </motion.div>
      )}

      <motion.section
        initial={reduced ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">{t("landing.tagline")}</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          {t("landing.title1")} <span className="text-amber-600">&</span> {t("landing.title2")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-black/60">{t("landing.subtitle")}</p>
      </motion.section>

      {loading ? (
        <p className="text-center text-sm text-black/50">{t("common.loading")}</p>
      ) : session ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          {campaign ? (
            <Link
              href={campaign.current_stage === "menjabat" || campaign.current_stage === "game_over" ? "/command-center" : "/kampanye"}
              className="w-full rounded-2xl bg-signal-gold px-6 py-4 text-center text-lg font-bold text-black shadow-glowGold"
            >
              {t("landing.continue")}
            </Link>
          ) : (
            <Link
              href="/peta"
              className="w-full rounded-2xl bg-signal-gold px-6 py-4 text-center text-lg font-bold text-black shadow-glowGold"
            >
              {t("landing.start")}
            </Link>
          )}
          <Link href="/leaderboard" className="text-sm text-black/60 underline">
            {t("landing.viewboard")}
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

      <p className="text-center text-xs text-black/40">{t("landing.disclaimer")}</p>
    </div>
  );
}
