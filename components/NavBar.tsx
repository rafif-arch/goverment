"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n";
import TokenBadge from "@/components/TokenBadge";

export default function NavBar() {
  const pathname = usePathname();
  const { session, isAdmin, signOut } = useGame();
  const { lang, setLang, t } = useI18n();
  const [hasLogo, setHasLogo] = useState(true);
  const dark = pathname?.startsWith("/command-center");

  const LINKS = [
    { href: "/peta", label: t("nav.map") },
    { href: "/kampanye", label: t("nav.campaign") },
    { href: "/command-center", label: t("nav.command") },
    { href: "/leaderboard", label: t("nav.leaderboard") },
    { href: "/shop", label: t("nav.shop") },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur ${
        dark ? "border-white/10 bg-[#0a0e1a]/85 text-white" : "border-black/10 bg-white/75"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2 sm:px-6">
        <Link href="/" className="mr-2 flex items-center gap-2 font-bold tracking-tight">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo.webp"
              alt="PolSim Arcapada"
              onError={() => setHasLogo(false)}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span aria-hidden>🏛️</span>
          )}
          <span className="hidden sm:inline">PolSim Arcapada</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
                pathname?.startsWith(l.href)
                  ? "bg-signal-gold/20 font-semibold text-amber-700"
                  : dark
                    ? "hover:bg-white/10"
                    : "hover:bg-black/5"
              } ${dark && pathname?.startsWith(l.href) ? "text-signal-gold" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/news-review"
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                dark ? "bg-white/10" : "bg-black/5"
              }`}
            >
              🛡️ Review
            </Link>
          )}
        </nav>
        <button
          onClick={() => setLang(lang === "id" ? "en" : "id")}
          title={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
          className={`rounded-full px-2 py-1 text-[11px] font-bold ${dark ? "bg-white/10" : "bg-black/5"}`}
        >
          {lang === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}
        </button>
        {session ? (
          <div className="flex items-center gap-2">
            <TokenBadge dark={dark} />
            <button
              onClick={() => signOut()}
              className={`rounded-full px-3 py-1.5 text-xs ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
            >
              {t("nav.logout")}
            </button>
          </div>
        ) : (
          <Link href="/" className="rounded-full bg-signal-gold px-3 py-1.5 text-xs font-semibold text-black">
            {t("nav.login")}
          </Link>
        )}
      </div>
    </header>
  );
}
