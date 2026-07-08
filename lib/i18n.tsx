"use client";
// i18n ringan ID/EN untuk chrome UI (navigasi, landing, tombol, label utama).
// Konten naratif game (krisis, backstory, berita) tetap bahasa Indonesia — by design
// (satire-nya berbahasa; lihat DECISIONS.md). Persist pilihan di localStorage.
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "id" | "en";

const DICT: Record<string, { id: string; en: string }> = {
  // nav
  "nav.map": { id: "Peta", en: "Map" },
  "nav.campaign": { id: "Kampanye", en: "Campaign" },
  "nav.command": { id: "Komando", en: "Command" },
  "nav.leaderboard": { id: "Peringkat", en: "Ranking" },
  "nav.shop": { id: "Toko", en: "Shop" },
  "nav.logout": { id: "Keluar", en: "Sign out" },
  "nav.login": { id: "Masuk", en: "Sign in" },
  // landing
  "landing.tagline": { id: "Republik Arcapada", en: "Republic of Arcapada" },
  "landing.title1": { id: "Simulator Politik", en: "Political Simulator" },
  "landing.title2": { id: "Birokrasi", en: "Bureaucracy" },
  "landing.subtitle": {
    id: "Menang pemilu itu mudah. Bertahan dari audit — itu baru permainan. Satire birokrasi di negara fiksi yang datanya terinspirasi statistik sungguhan.",
    en: "Winning the election is easy. Surviving the audit — that's the real game. A bureaucracy satire set in a fictional nation powered by real statistics.",
  },
  "landing.continue": { id: "▶ Lanjutkan Permainan", en: "▶ Continue Playing" },
  "landing.start": { id: "▶ Mulai dari Peta Arcapada", en: "▶ Start from the Map" },
  "landing.viewboard": { id: "Lihat papan peringkat", en: "View leaderboard" },
  "landing.step1t": { id: "Babak I — Peta & Makro", en: "Act I — Map & Macro" },
  "landing.step1d": { id: "Pelajari region, indikator ekonomi, dan 4 faksi masyarakat.", en: "Study regions, economic indicators, and the 4 factions." },
  "landing.step2t": { id: "Babak II — Karakter", en: "Act II — Character" },
  "landing.step2d": { id: "Rakit kandidatmu. Hati-hati memilih penyandang dana.", en: "Build your candidate. Choose your financier wisely." },
  "landing.step3t": { id: "Babak III — Kampanye", en: "Act III — Campaign" },
  "landing.step3d": { id: "Tiket partai, calon wakil, perang elektabilitas, hari pemilihan.", en: "Party ticket, running mate, electability war, election day." },
  "landing.step4t": { id: "Babak IV — Menjabat", en: "Act IV — In Office" },
  "landing.step4d": { id: "Eksekusi proyek, hadapi sponsor... dan Komisi Integritas Arcapada.", en: "Run projects, face your sponsor... and the Integrity Commission." },
  "landing.disclaimer": {
    id: "Semua negara, kota, partai, tokoh, dan lembaga dalam game ini fiksi. Kemiripan dengan entitas nyata adalah kebetulan statistik — persis seperti alasan pejabat di dalam game ini.",
    en: "Every nation, city, party, figure, and institution in this game is fictional. Any resemblance to real entities is a statistical coincidence — exactly what the officials in this game would say.",
  },
  // auth
  "auth.signin": { id: "Masuk", en: "Sign in" },
  "auth.signup": { id: "Daftar Warga Baru", en: "Register as Citizen" },
  "auth.email": { id: "email", en: "email" },
  "auth.password": { id: "kata sandi (min. 6)", en: "password (min. 6)" },
  "auth.toSignup": { id: "Belum punya akun? Daftar", en: "No account yet? Register" },
  "auth.toSignin": { id: "Sudah punya akun? Masuk", en: "Have an account? Sign in" },
  // shop
  "shop.title": { id: "🛍️ Toko Perlengkapan Politik", en: "🛍️ Political Supply Shop" },
  "shop.sandbox": { id: "Semua pembayaran memakai Midtrans sandbox — tidak ada uang sungguhan.", en: "All payments use Midtrans sandbox — no real money involved." },
  "shop.tokens": { id: "🪙 Token Kebijakan", en: "🪙 Policy Tokens" },
  "shop.referral": { id: "🤝 Ajak Teman, Sama-sama Untung", en: "🤝 Invite Friends, Both Win" },
  "shop.referralDesc": {
    id: "Bagikan kodemu. Setiap teman yang mendaftar & memasukkan kode: kalian BERDUA dapat token gratis.",
    en: "Share your code. Every friend who registers & redeems it: you BOTH get free tokens.",
  },
  "shop.share": { id: "📤 Bagikan Link Ajakan", en: "📤 Share Invite Link" },
  "shop.redeem": { id: "Pakai kode", en: "Redeem", },
  "shop.invited": { id: "teman bergabung", en: "friends joined" },
  // command center
  "cc.title": { id: "Pusat Komando Pemerintahan", en: "Government Command Center" },
  "cc.apbd": { id: "APBD Belanja Pembangunan", en: "Development Budget (APBD)" },
  "cc.projects": { id: "📋 Proyek Pemerintahan", en: "📋 Government Projects" },
  "cc.newProject": { id: "+ Rancang Proyek (KAK/RAB)", en: "+ Draft Project (ToR/Budget)" },
  "cc.power": { id: "Political Power", en: "Political Power" },
  "cc.trust": { id: "Kepercayaan", en: "Public Trust" },
  "cc.slushFund": { id: "Dana Taktis", en: "Slush Fund" },
  "cc.development": { id: "Pembangunan", en: "Development" },
  // campaign
  "camp.title": { id: "📣 Babak III — Jalan Menuju Kursi", en: "📣 Act III — Road to the Seat" },
  "camp.electability": { id: "Elektabilitas", en: "Electability" },
  // misc
  "common.loading": { id: "Memuat…", en: "Loading…" },
  "common.day": { id: "Hari ke-", en: "Day " },
};

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: "id",
  setLang: () => {},
  t: (k) => DICT[k]?.id ?? k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("polsim_lang") as Lang | null) : null;
    if (saved === "en" || saved === "id") setLangState(saved);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        try {
          localStorage.setItem("polsim_lang", l);
        } catch {}
      },
      t: (key) => DICT[key]?.[lang] ?? DICT[key]?.id ?? key,
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
