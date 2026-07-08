"use client";
// Form masuk/daftar email+password Supabase Auth.
import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";

export default function AuthGate() {
  const { refresh } = useGame();
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = getSupabase();
    if (mode === "daftar") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setBusy(false);
      if (error) return setError(error.message);
      if (!data.session) {
        setInfo("Cek email untuk konfirmasi, lalu masuk. (Jika konfirmasi email dimatikan di project, langsung masuk saja.)");
        setMode("masuk");
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(error.message);
    }
    await refresh();
  }

  return (
    <form onSubmit={submit} className="panel mx-auto w-full max-w-sm space-y-3 p-6">
      <h2 className="text-lg font-bold">{mode === "masuk" ? "Masuk" : "Daftar Warga Baru"}</h2>
      <input
        type="email"
        required
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="kata sandi (min. 6)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-amber-700">{info}</p>}
      <button
        disabled={busy}
        className="w-full rounded-lg bg-signal-gold py-2 font-semibold text-black disabled:opacity-50"
      >
        {busy ? "..." : mode === "masuk" ? "Masuk" : "Daftar"}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "masuk" ? "daftar" : "masuk")}
        className="w-full text-center text-xs text-black/60 underline"
      >
        {mode === "masuk" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
      </button>
    </form>
  );
}
