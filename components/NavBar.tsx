"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGame } from "@/lib/game-context";
import TokenBadge from "@/components/TokenBadge";

const LINKS = [
  { href: "/peta", label: "Peta" },
  { href: "/kampanye", label: "Kampanye" },
  { href: "/command-center", label: "Komando" },
  { href: "/leaderboard", label: "Peringkat" },
  { href: "/shop", label: "Toko" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { session, isAdmin, signOut } = useGame();
  const dark = pathname?.startsWith("/command-center");

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur ${
        dark ? "border-white/10 bg-[#0a0e1a]/85 text-white" : "border-black/10 bg-white/75"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2 sm:px-6">
        <Link href="/" className="mr-2 flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden>🏛️</span>
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
              🛡️ Review Berita
            </Link>
          )}
        </nav>
        {session ? (
          <div className="flex items-center gap-2">
            <TokenBadge dark={dark} />
            <button
              onClick={() => signOut()}
              className={`rounded-full px-3 py-1.5 text-xs ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
            >
              Keluar
            </button>
          </div>
        ) : (
          <Link href="/" className="rounded-full bg-signal-gold px-3 py-1.5 text-xs font-semibold text-black">
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
