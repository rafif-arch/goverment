import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet "command center" Republik Arcapada
        abyss: "#0a0e1a",
        panel: "#111827",
        panelLight: "#1b2436",
        amber: {
          glow: "#f5b544",
        },
        signal: {
          red: "#e5484d",
          green: "#30a46c",
          blue: "#3e7bfa",
          gold: "#f5b544",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        elevate: "0 12px 30px -10px rgba(0,0,0,0.55)",
        glowGold: "0 0 24px rgba(245,181,68,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
