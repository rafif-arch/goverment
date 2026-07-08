"use client";
// Toko: top-up token (Midtrans Snap sandbox), VIP 30 hari, kosmetik (token).
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";
import { useSnap } from "@/components/SnapCheckout";
import StatCount from "@/components/StatCount";
import { GAME_CONFIG, type TokenPackKey } from "@/data/config";

interface CosmeticRow {
  id: string;
  code: string;
  nama: string;
  tipe: string;
  harga_token: number;
  asset_ref: string;
  deskripsi: string;
}
interface OwnedRow {
  cosmetic_item_id: string;
  equipped: boolean;
}

export default function ShopPage() {
  const { session, loading, tokenBalance, isVip, refresh } = useGame();
  const { ready: snapReady, pay } = useSnap();
  const [cosmetics, setCosmetics] = useState<CosmeticRow[]>([]);
  const [owned, setOwned] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [refInfo, setRefInfo] = useState<{ code: string; invited: number; already_redeemed: boolean; bonus: number } | null>(null);
  const [redeemCode, setRedeemCode] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabase();
    const [c, o, r] = await Promise.all([
      supabase.from("cosmetic_items").select("*").order("harga_token"),
      supabase.from("user_cosmetics").select("cosmetic_item_id, equipped"),
      supabase.rpc("get_my_referral"),
    ]);
    setCosmetics((c.data as CosmeticRow[]) ?? []);
    const map: Record<string, boolean> = {};
    for (const row of (o.data as OwnedRow[]) ?? []) map[row.cosmetic_item_id] = row.equipped;
    setOwned(map);
    if (r.data) setRefInfo(r.data);
  }, []);

  async function shareReferral() {
    if (!refInfo) return;
    const url = `${window.location.origin}/?ref=${refInfo.code}`;
    const text = `Aku lagi jadi kepala daerah di PolSim Arcapada 🏛️ — simulator politik satire. Daftar pakai kodeku "${refInfo.code}", kita berdua dapat ${refInfo.bonus} token gratis: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "PolSim Arcapada", text, url });
      } else {
        await navigator.clipboard.writeText(text);
        setMsg("Link ajakan disalin ke clipboard — tinggal tempel ke chat temanmu!");
      }
    } catch {}
  }

  async function redeemReferral() {
    if (!redeemCode.trim()) return;
    setBusy("redeem");
    const { data, error } = await getSupabase().rpc("redeem_referral", { p_code: redeemCode.trim() });
    if (error) {
      const m = error.message.includes("SUDAH_PERNAH")
        ? "Kamu sudah pernah memakai kode teman."
        : error.message.includes("KODE_SENDIRI")
          ? "Itu kodemu sendiri 😅"
          : "Kode tidak ditemukan.";
      setMsg(m);
    } else {
      setMsg(`🎉 Berhasil! +${data?.bonus ?? 15} token untukmu dan temanmu.`);
    }
    setBusy(null);
    await Promise.all([refresh(), load()]);
  }

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  async function checkout(itemType: "token_topup" | "vip_30d", packKey?: TokenPackKey) {
    setBusy(itemType + (packKey ?? ""));
    setMsg(null);
    try {
      const token = (await getSupabase().auth.getSession()).data.session?.access_token;
      const res = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_type: itemType, pack_key: packKey }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Gagal membuat order");
      pay(body.snap_token, async () => {
        setMsg("Menunggu konfirmasi pembayaran dari webhook Midtrans… saldo terisi otomatis setelah settlement.");
        setTimeout(() => refresh(), 4000);
      });
    } catch (e) {
      setMsg(`Gagal: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function buyCosmetic(item: CosmeticRow) {
    setBusy(item.code);
    setMsg(null);
    const { error } = await getSupabase().rpc("purchase_cosmetic", { p_item_code: item.code });
    if (error) {
      setMsg(error.message.includes("TOKEN_TIDAK_CUKUP") ? "Token tidak cukup — top-up dulu ya." : `Gagal: ${error.message}`);
    } else {
      setMsg(`✅ ${item.nama} dibeli!`);
    }
    await Promise.all([refresh(), load()]);
    setBusy(null);
  }

  async function toggleEquip(item: CosmeticRow, equipped: boolean) {
    setBusy(item.code);
    const { error } = await getSupabase().rpc("equip_cosmetic", { p_item_code: item.code, p_equipped: !equipped });
    if (error) setMsg(`Gagal: ${error.message}`);
    await load();
    setBusy(null);
  }

  if (loading) return <p className="py-10 text-center text-sm text-black/50">Memuat…</p>;
  if (!session)
    return <p className="py-10 text-center text-sm">Masuk dulu di <a href="/" className="underline">beranda</a>.</p>;

  return (
    <div className="space-y-8 py-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">🛍️ Toko Perlengkapan Politik</h1>
          <p className="text-sm text-black/60">Semua pembayaran memakai Midtrans <b>sandbox</b> — tidak ada uang sungguhan.</p>
        </div>
        <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
          🪙 <StatCount value={tokenBalance ?? 0} /> token
        </div>
      </header>

      {msg && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{msg}</p>}
      {!snapReady && (
        <p className="rounded-lg bg-black/5 px-3 py-2 text-xs text-black/50">
          Memuat Midtrans Snap… (butuh NEXT_PUBLIC_MIDTRANS_CLIENT_KEY sandbox)
        </p>
      )}

      {/* Referral */}
      {refInfo && (
        <section className="panel border-2 border-emerald-300/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold">🤝 Ajak Teman, Sama-sama Dapat {refInfo.bonus} Token</h2>
              <p className="mt-1 text-sm text-black/60">
                Kodemu: <b className="rounded bg-black/5 px-2 py-0.5 font-mono text-base tracking-widest">{refInfo.code}</b>
                {" · "}
                <span className="text-emerald-700 font-semibold">{refInfo.invited} teman bergabung</span>
              </p>
            </div>
            <button
              onClick={shareReferral}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"
            >
              📤 Bagikan Link Ajakan
            </button>
          </div>
          {!refInfo.already_redeemed && (
            <div className="mt-3 flex gap-2">
              <input
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="Punya kode teman? Masukkan di sini"
                className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={redeemReferral}
                disabled={busy !== null}
                className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Pakai
              </button>
            </div>
          )}
        </section>
      )}

      {/* Token packs */}
      <section>
        <h2 className="mb-3 font-bold">🪙 Token Kebijakan</h2>
        <p className="mb-3 text-xs text-black/50">
          Token dipakai untuk aksi berat: eksekusi proyek ({GAME_CONFIG.token_costs.eksekusi_proyek}–
          {GAME_CONFIG.token_costs.eksekusi_proyek_besar} token) & lobi MPD ({GAME_CONFIG.token_costs.lobi_dprd} token).
          Gratis {GAME_CONFIG.daily_grant.amount} token/hari — klik lencana 🪙 di bilah atas untuk klaim.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.entries(GAME_CONFIG.token_packs) as Array<[TokenPackKey, (typeof GAME_CONFIG.token_packs)[TokenPackKey]]>).map(
            ([key, pack]) => (
              <motion.div key={key} whileHover={{ y: -4 }} className="panel p-5 text-center">
                <p className="text-3xl">🪙</p>
                <p className="mt-1 font-bold">{pack.label}</p>
                <p className="text-2xl font-black text-amber-600">{pack.tokens} token</p>
                <button
                  onClick={() => checkout("token_topup", key)}
                  disabled={busy !== null || !snapReady}
                  className="mt-3 w-full rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  Rp {pack.price_idr.toLocaleString("id-ID")} (QRIS/VA sandbox)
                </button>
              </motion.div>
            )
          )}
        </div>
      </section>

      {/* VIP */}
      <section>
        <h2 className="mb-3 font-bold">👑 VIP &quot;Intelijen Pusat&quot;</h2>
        <div className="panel flex flex-wrap items-center justify-between gap-4 border-2 border-amber-400/60 p-6">
          <div className="max-w-md">
            <p className="text-lg font-black">
              {isVip ? "✅ VIP AKTIF" : "Langganan 30 hari (perpanjang kapan saja)"}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-black/70">
              <li>🏙️ Buka region ibu kota <b>Kota Candrakala</b> (difficulty 5)</li>
              <li>📡 Analisis Arah Dunia — ringkasan tren world events</li>
              <li>🎖️ Trait premium &quot;Kader Intelijen Pusat&quot; tanpa debuff</li>
            </ul>
          </div>
          <button
            onClick={() => checkout("vip_30d")}
            disabled={busy !== null || !snapReady}
            className="rounded-2xl bg-signal-gold px-6 py-4 text-lg font-black text-black shadow-glowGold disabled:opacity-40"
          >
            {isVip ? "Perpanjang +30 hari" : "Aktifkan"} — Rp {GAME_CONFIG.vip.price_idr.toLocaleString("id-ID")}
          </button>
        </div>
      </section>

      {/* Kosmetik */}
      <section>
        <h2 className="mb-3 font-bold">🖼️ Kosmetik (bayar pakai token)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cosmetics.map((item) => {
            const isOwned = item.id in owned;
            const equipped = owned[item.id];
            return (
              <div key={item.id} className="panel flex flex-col p-4">
                <p className="text-2xl">{item.tipe === "lencana" ? item.asset_ref : "🏠"}</p>
                <p className="mt-1 text-sm font-bold leading-tight">{item.nama}</p>
                <p className="mt-1 flex-1 text-xs text-black/55">{item.deskripsi}</p>
                {isOwned ? (
                  <button
                    onClick={() => toggleEquip(item, equipped)}
                    disabled={busy !== null}
                    className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold ${
                      equipped ? "bg-emerald-600 text-white" : "bg-black/10"
                    }`}
                  >
                    {equipped ? "✓ Terpasang — lepas" : "Pasang"}
                  </button>
                ) : (
                  <button
                    onClick={() => buyCosmetic(item)}
                    disabled={busy !== null}
                    className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-40"
                  >
                    Beli 🪙 {item.harga_token}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
