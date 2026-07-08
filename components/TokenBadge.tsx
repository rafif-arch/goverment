"use client";
// Saldo token + klaim jatah harian (RPC claim_daily_grant).
import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";
import StatCount from "@/components/StatCount";

export default function TokenBadge({ dark = false }: { dark?: boolean }) {
  const { tokenBalance, refresh } = useGame();
  const [claiming, setClaiming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function claim() {
    setClaiming(true);
    setMsg(null);
    const { data, error } = await getSupabase().rpc("claim_daily_grant");
    setClaiming(false);
    if (error) {
      setMsg("Gagal klaim");
      return;
    }
    setMsg(data?.granted ? `+${data.amount} token harian!` : "Sudah diklaim hari ini");
    await refresh();
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="relative">
      <button
        onClick={claim}
        disabled={claiming}
        title="Klik untuk klaim jatah token harian"
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
          dark ? "bg-signal-gold/15 text-signal-gold" : "bg-amber-100 text-amber-800"
        }`}
      >
        <span aria-hidden>🪙</span>
        {tokenBalance === null ? "—" : <StatCount value={tokenBalance} />}
      </button>
      {msg && (
        <div className="absolute right-0 top-full z-50 mt-1 whitespace-nowrap rounded-lg bg-black px-2 py-1 text-[11px] text-white shadow">
          {msg}
        </div>
      )}
    </div>
  );
}
