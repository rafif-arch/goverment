import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/game-context";
import { I18nProvider } from "@/lib/i18n";
import NavBar from "@/components/NavBar";
import BreakingNews from "@/components/BreakingNews";

export const metadata: Metadata = {
  title: "PolSim Arcapada — Simulator Politik & Birokrasi",
  description:
    "Simulasi politik satire Republik Arcapada: kampanye, menjabat, dan (usahakan jangan) kena operasi tangkap tangan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <I18nProvider>
          <GameProvider>
            <NavBar />
            <BreakingNews />
            <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6">
              {children}
            </main>
          </GameProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
