"use client";
// Babak II — Character creator multi-step (RPG).
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";
import {
  computeStartingStats,
  type CharacterInput,
  type Pendidikan,
  type Profesi,
  type Trait,
} from "@/lib/formula/character";
import StatCount from "@/components/StatCount";

const PENDIDIKAN: Array<{ key: Pendidikan; label: string }> = [
  { key: "sma", label: "SMA — lulusan kehidupan" },
  { key: "s1", label: "S1 — sarjana penuh semangat" },
  { key: "s2", label: "S2 — gelar untuk baliho" },
  { key: "s3", label: "S3 — doktor beneran" },
];

const PROFESI: Array<{ key: Profesi; label: string; desc: string }> = [
  { key: "pengusaha", label: "🏭 Pengusaha", desc: "Modal tebal, jejaring dagang. Publik agak curiga." },
  { key: "birokrat", label: "🗂️ Birokrat Karier", desc: "Paham prosedur & disposisi. Koneksi dalam." },
  { key: "aktivis", label: "✊ Aktivis", desc: "Dicintai rakyat, dompet menangis." },
  { key: "akademisi", label: "🎓 Akademisi", desc: "Kredibel, tapi mesin politiknya seminar." },
  { key: "pesohor", label: "🎤 Pesohor", desc: "Terkenal duluan, programnya menyusul." },
];

const TRAITS: Array<{ key: Trait; label: string; desc: string; vip?: boolean }> = [
  { key: "merakyat", label: "🍃 Anak Kampung Sejati", desc: "+kepercayaan publik, koneksi elit tipis." },
  { key: "teknokrat", label: "📊 Perencana Dingin", desc: "Seimbang; disukai birokrasi." },
  {
    key: "oligarki",
    label: "💰 Penyandang Dana (Oligarki)",
    desc: "Uang ×3 & dana kampanye jumbo. TAPI: utang politik 7/10 — sponsor MENAGIH proyek titipan saat menjabat.",
  },
  {
    key: "vip",
    label: "👑 Kader Intelijen Pusat (VIP)",
    desc: "Uang ×2 & koneksi +15 tanpa utang politik. Khusus pelanggan VIP.",
    vip: true,
  },
];

function KarakterForm() {
  const { session, loading, isVip, refresh } = useGame();
  const router = useRouter();
  const params = useSearchParams();
  const regionCode = params.get("region") ?? "argasoka";
  const reduced = useReducedMotion();

  const [step, setStep] = useState(0);
  const [nama, setNama] = useState("");
  const [umur, setUmur] = useState(45);
  const [pendidikan, setPendidikan] = useState<Pendidikan>("s1");
  const [profesi, setProfesi] = useState<Profesi>("birokrat");
  const [trait, setTrait] = useState<Trait>("teknokrat");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input: CharacterInput = { nama, umur, pendidikan, profesi, trait };
  const stats = useMemo(() => computeStartingStats(input), [nama, umur, pendidikan, profesi, trait]); // eslint-disable-line react-hooks/exhaustive-deps

  async function createCharacter() {
    if (!session) return;
    setBusy(true);
    setError(null);
    const supabase = getSupabase();
    try {
      const { data: region, error: regionErr } = await supabase
        .from("regions")
        .select("id, is_vip_only")
        .eq("code", regionCode)
        .single();
      if (regionErr || !region) throw new Error("Region tidak ditemukan");
      if (region.is_vip_only && !isVip) throw new Error("Region ini khusus VIP");

      const { data: pc, error: pcErr } = await supabase
        .from("player_characters")
        .insert({
          user_id: session.user.id,
          nama,
          umur,
          pendidikan,
          profesi,
          uang: stats.uang,
          kepercayaan_publik: stats.kepercayaan_publik,
          koneksi_politik: stats.koneksi_politik,
          has_oligarch_trait: stats.has_oligarch_trait,
          has_vip_trait: stats.has_vip_trait,
          utang_politik_level: stats.utang_politik_level,
        })
        .select("id")
        .single();
      if (pcErr || !pc) throw new Error(pcErr?.message ?? "Gagal membuat karakter");

      // nonaktifkan campaign lama, buat campaign baru
      await supabase.from("campaign_state").update({ is_active: false }).eq("is_active", true);
      const { error: csErr } = await supabase.from("campaign_state").insert({
        player_character_id: pc.id,
        user_id: session.user.id,
        current_stage: "cari_tiket",
        region_id: region.id,
        dana_kampanye: stats.dana_kampanye,
      });
      if (csErr) throw new Error(csErr.message);
      await refresh();
      router.push("/kampanye");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-black/50">Memuat…</p>;
  if (!session)
    return (
      <p className="py-10 text-center text-sm">
        Masuk dulu di <a href="/" className="underline">beranda</a>.
      </p>
    );

  const steps = ["Identitas", "Latar Belakang", "Trait & Ringkasan"];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-black">🧑‍💼 Babak II — Rakit Kandidatmu</h1>
        <p className="text-sm text-black/60">
          Maju dari region <b>{regionCode.replace("_", " ")}</b>. Stat awal dihitung dari formula terbuka
          (lihat README) — tidak ada gacha, hanya konsekuensi.
        </p>
      </header>

      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-signal-gold" : "bg-black/10"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="panel space-y-4 p-6"
        >
          {step === 0 && (
            <>
              <label className="block text-sm font-semibold">
                Nama kandidat
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="mis. Bapak/Ibu Harapan Rakyat"
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold">
                Umur: <span className="tabular-nums">{umur}</span> tahun
                <input
                  type="range"
                  min={25}
                  max={75}
                  value={umur}
                  onChange={(e) => setUmur(Number(e.target.value))}
                  className="mt-1 w-full accent-amber-500"
                />
              </label>
              <label className="block text-sm font-semibold">
                Pendidikan
                <select
                  value={pendidikan}
                  onChange={(e) => setPendidikan(e.target.value as Pendidikan)}
                  className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2"
                >
                  {PENDIDIKAN.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {PROFESI.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setProfesi(p.key)}
                  className={`rounded-xl border p-4 text-left transition ${
                    profesi === p.key ? "border-amber-500 bg-amber-50" : "border-black/10 hover:border-black/30"
                  }`}
                >
                  <p className="font-bold">{p.label}</p>
                  <p className="mt-1 text-xs text-black/60">{p.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <>
              <div className="grid gap-3">
                {TRAITS.map((t) => {
                  const locked = t.vip && !isVip;
                  return (
                    <button
                      key={t.key}
                      disabled={locked}
                      onClick={() => setTrait(t.key)}
                      className={`rounded-xl border p-4 text-left transition ${
                        trait === t.key ? "border-amber-500 bg-amber-50" : "border-black/10 hover:border-black/30"
                      } ${locked ? "opacity-50" : ""}`}
                    >
                      <p className="font-bold">
                        {t.label} {locked && <span className="text-xs">(perlu VIP — lihat Toko)</span>}
                      </p>
                      <p className="mt-1 text-xs text-black/60">{t.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl bg-black/5 p-4">
                <h3 className="text-sm font-bold">Pratinjau stat awal</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  <div>💵 Uang: <b><StatCount value={stats.uang} /> jt Ʀ</b></div>
                  <div>📣 Dana kampanye: <b><StatCount value={stats.dana_kampanye} /> jt Ʀ</b></div>
                  <div>❤️ Kepercayaan: <b><StatCount value={stats.kepercayaan_publik} /></b></div>
                  <div>🤝 Koneksi: <b><StatCount value={stats.koneksi_politik} /></b></div>
                  <div>⛓️ Utang politik: <b><StatCount value={stats.utang_politik_level} />/10</b></div>
                </div>
                {stats.has_oligarch_trait && (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    ⚠️ Grup Singgasana akan menagih &quot;proyek titipan&quot; begitu kamu menjabat.
                  </p>
                )}
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-lg px-4 py-2 text-sm disabled:opacity-30"
            >
              ← Mundur
            </button>
            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && nama.trim().length < 3}
                className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-30"
              >
                Lanjut →
              </button>
            ) : (
              <button
                onClick={createCharacter}
                disabled={busy || nama.trim().length < 3}
                className="rounded-lg bg-signal-gold px-5 py-2 text-sm font-bold text-black shadow-glowGold disabled:opacity-40"
              >
                {busy ? "Mendaftarkan…" : "🗳️ Daftarkan Kandidat"}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function KarakterPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-black/50">Memuat…</p>}>
      <KarakterForm />
    </Suspense>
  );
}
