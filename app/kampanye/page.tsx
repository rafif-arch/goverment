"use client";
// Babak III — Timeline Kampanye: tiket partai → wakil → perang elektabilitas → pemilihan.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";
import StepperTimeline from "@/components/StepperTimeline";
import PoliticianCard, { type PoliticianRow } from "@/components/PoliticianCard";
import CrisisCard, { type CrisisRow } from "@/components/CrisisCard";
import FactionMeter from "@/components/FactionMeter";
import StatCount from "@/components/StatCount";
import { PARTIES } from "@/data/parties";
import { hashString } from "@/lib/bps-transform";
import {
  initialElektabilitas,
  runningMateCompatibility,
  worldEventCampaignModifier,
} from "@/lib/formula/elektabilitas";

interface PartyRow {
  id: string;
  code: string;
  name: string;
  archetype_ideologi: string;
  basis_konstituen: string;
  sejarah_fiksi: string;
  warna: string;
  mahar_politik: number;
}

interface RegionRow {
  id: string;
  code: string;
  name: string;
  gini_ratio: number;
  difficulty: number;
}

interface WorldEventRow {
  id: string;
  title: string;
  narasi: string;
  effects: { efek_variabel?: Record<string, number>; efek_faksi?: Record<string, number>; sektor?: string };
}

const FACTION_META: Record<string, { name: string; icon: string }> = {
  buruh_tani: { name: "Serikat Buruh & Tani", icon: "🌾" },
  menengah_urban: { name: "Kelas Menengah Urban", icon: "🏙️" },
  tokoh_agama: { name: "Majelis Tokoh Agama", icon: "🕌" },
  konsorsium_bisnis: { name: "Konsorsium Bisnis", icon: "💼" },
};

const CRISIS_PER_CAMPAIGN = 5;

export default function KampanyePage() {
  const { session, loading, character, campaign, refresh } = useGame();
  const router = useRouter();
  const reduced = useReducedMotion();

  const [parties, setParties] = useState<PartyRow[]>([]);
  const [politicians, setPoliticians] = useState<PoliticianRow[]>([]);
  const [region, setRegion] = useState<RegionRow | null>(null);
  const [crisisPool, setCrisisPool] = useState<CrisisRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [worldEvents, setWorldEvents] = useState<WorldEventRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [electionResult, setElectionResult] = useState<{
    win: boolean;
    final_score: number;
    ambang: number;
    komponen_faksi: number;
  } | null>(null);

  const loadAll = useCallback(async () => {
    if (!campaign) return;
    const supabase = getSupabase();
    const [p, pol, r, ce, log, we] = await Promise.all([
      supabase.from("parties").select("*"),
      supabase.from("politicians").select("*"),
      campaign.region_id
        ? supabase.from("regions").select("id, code, name, gini_ratio, difficulty").eq("id", campaign.region_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("crisis_events").select("*").eq("trigger_stage", "perang_elektabilitas"),
      supabase.from("player_choices_log").select("crisis_event_id, choice_key").eq("campaign_state_id", campaign.id),
      supabase.from("active_world_events").select("*"),
    ]);
    setParties((p.data as PartyRow[]) ?? []);
    setPoliticians((pol.data as PoliticianRow[]) ?? []);
    setRegion((r.data as RegionRow | null) ?? null);
    const pool = ((ce.data as CrisisRow[]) ?? [])
      .slice()
      .sort((a, b) => hashString(campaign.id + a.code) - hashString(campaign.id + b.code))
      .slice(0, CRISIS_PER_CAMPAIGN);
    setCrisisPool(pool);
    const ans: Record<string, string> = {};
    for (const row of log.data ?? []) {
      if (row.crisis_event_id) ans[row.crisis_event_id] = row.choice_key;
    }
    setAnswers(ans);
    setWorldEvents((we.data as WorldEventRow[]) ?? []);
  }, [campaign]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const partyAffinity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const seed of PARTIES) {
      const values = Object.values(seed.faksi_afinitas);
      map[seed.code] = values.reduce((a, b) => a + b, 0) / values.length;
    }
    return map;
  }, []);

  const weModifier = worldEventCampaignModifier(worldEvents);

  async function buyTicket(party: PartyRow) {
    if (!campaign || !character) return;
    if (character.uang < party.mahar_politik) {
      setError(`Uangmu (${character.uang} jt Ʀ) tidak cukup untuk mahar ${party.name} (${party.mahar_politik} jt Ʀ).`);
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = getSupabase();
    await supabase.from("player_characters").update({ uang: character.uang - party.mahar_politik }).eq("id", character.id);
    await supabase
      .from("campaign_state")
      .update({ party_id: party.id, current_stage: "meminang_wakil", updated_at: new Date().toISOString() })
      .eq("id", campaign.id);
    await refresh();
    setBusy(false);
  }

  async function pickMate(p: PoliticianRow, compatibility: number) {
    if (!campaign || !character) return;
    setBusy(true);
    setError(null);
    const partyCode = parties.find((x) => x.id === campaign.party_id)?.code ?? "pdr";
    const elekt = initialElektabilitas({
      kepercayaan_publik: character.kepercayaan_publik,
      koneksi_politik: character.koneksi_politik,
      partyAffinityAvg: partyAffinity[partyCode] ?? 0,
      mateCompatibility: compatibility,
    });
    const supabase = getSupabase();
    await supabase
      .from("campaign_state")
      .update({
        running_mate_id: p.id,
        elektabilitas: elekt,
        current_stage: "perang_elektabilitas",
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);
    await refresh();
    setBusy(false);
  }

  async function chooseCrisis(eventId: string, key: string) {
    if (!campaign) return;
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().rpc("apply_choice", {
      p_campaign: campaign.id,
      p_event_id: eventId,
      p_choice_key: key,
    });
    if (error) setError(error.message);
    await Promise.all([refresh(), loadAll()]);
    setBusy(false);
  }

  async function gotoElection() {
    if (!campaign) return;
    setBusy(true);
    await getSupabase()
      .from("campaign_state")
      .update({ current_stage: "hari_pemilihan", updated_at: new Date().toISOString() })
      .eq("id", campaign.id);
    await refresh();
    setBusy(false);
  }

  async function openBallot() {
    if (!campaign) return;
    setBusy(true);
    setError(null);
    const { data, error } = await getSupabase().rpc("resolve_election", { p_campaign: campaign.id });
    if (error) {
      setError(error.message);
    } else {
      setElectionResult(data);
    }
    await refresh();
    setBusy(false);
  }

  if (loading) return <p className="py-10 text-center text-sm text-black/50">Memuat…</p>;
  if (!session)
    return <p className="py-10 text-center text-sm">Masuk dulu di <a href="/" className="underline">beranda</a>.</p>;
  if (!campaign)
    return (
      <p className="py-10 text-center text-sm">
        Belum ada kampanye aktif. Mulai dari <a href="/peta" className="underline">peta</a>.
      </p>
    );
  if (campaign.current_stage === "menjabat" || campaign.current_stage === "game_over") {
    router.replace("/command-center");
    return null;
  }

  const stage = campaign.current_stage;
  const answeredCount = crisisPool.filter((c) => answers[c.id]).length;

  return (
    <div className="space-y-4 py-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">📣 Babak III — Jalan Menuju Kursi</h1>
          <p className="text-sm text-black/60">
            {character?.nama} · {region?.name ?? "…"} · 💵 <StatCount value={character?.uang ?? 0} /> jt Ʀ · 📣 dana{" "}
            <StatCount value={campaign.dana_kampanye} /> jt Ʀ
          </p>
        </div>
        {stage !== "cari_tiket" && stage !== "selesai" && (
          <div className="panel px-4 py-2 text-center">
            <p className="text-[11px] uppercase tracking-wide text-black/50">Elektabilitas</p>
            <p className="text-2xl font-black tabular-nums text-amber-600">
              <StatCount value={Number(campaign.elektabilitas)} decimals={1} suffix="%" />
            </p>
          </div>
        )}
      </header>

      <StepperTimeline current={stage} />

      {worldEvents.length > 0 && stage === "perang_elektabilitas" && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm">
          <p className="font-semibold text-blue-900">🌏 Situasi dunia sedang memengaruhi kampanye:</p>
          <ul className="mt-1 space-y-0.5 text-blue-800">
            {worldEvents.map((w) => (
              <li key={w.id}>• {w.title}</li>
            ))}
          </ul>
          {weModifier !== 0 && (
            <p className="mt-1 text-xs text-blue-700">
              Sentimen publik {weModifier > 0 ? "+" : ""}
              {weModifier} terhadap petahana/kandidat (berlaku ke semua pemain).
            </p>
          )}
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* ============ TAHAP 1: CARI TIKET ============ */}
      {stage === "cari_tiket" && (
        <section className="grid gap-3 sm:grid-cols-2">
          {parties.map((party) => {
            const seed = PARTIES.find((s) => s.code === party.code);
            return (
              <motion.div
                key={party.id}
                whileHover={reduced ? {} : { y: -4 }}
                className="panel space-y-2 p-5"
                style={{ borderTop: `4px solid ${party.warna}` }}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold">{party.name}</h3>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px]">{party.archetype_ideologi.replace("_", "-")}</span>
                </div>
                <p className="text-xs text-black/60">{party.sejarah_fiksi}</p>
                <p className="text-xs"><b>Basis:</b> {party.basis_konstituen}</p>
                {seed && (
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {Object.entries(seed.faksi_afinitas).map(([f, v]) => (
                      <span key={f} className={`rounded-full px-2 py-0.5 ${v >= 3 ? "bg-emerald-100 text-emerald-700" : v <= -3 ? "bg-red-100 text-red-700" : "bg-black/5 text-black/50"}`}>
                        {FACTION_META[f]?.icon} {v > 0 ? "+" : ""}{v}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => buyTicket(party)}
                  disabled={busy}
                  className="mt-1 w-full rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  🎫 Ambil tiket — mahar <span className="tabular-nums">{party.mahar_politik.toLocaleString("id-ID")}</span> jt Ʀ
                </button>
              </motion.div>
            );
          })}
        </section>
      )}

      {/* ============ TAHAP 2: MEMINANG WAKIL ============ */}
      {stage === "meminang_wakil" && region && (
        <section className="space-y-3">
          <p className="text-sm text-black/60">
            Pilih pendamping. Kompatibilitas dihitung dari 4 axis tokoh terhadap karakter region
            ({region.name}: gini {region.gini_ratio}, kesulitan {region.difficulty}).
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {politicians
              .map((p) => ({ p, compat: runningMateCompatibility(p, region) }))
              .sort((a, b) => b.compat - a.compat)
              .map(({ p, compat }) => (
                <PoliticianCard
                  key={p.id}
                  p={p}
                  compatibility={compat}
                  partyName={parties.find((x) => x.id === p.party_id)?.name}
                  onSelect={() => !busy && pickMate(p, compat)}
                />
              ))}
          </div>
        </section>
      )}

      {/* ============ TAHAP 3: PERANG ELEKTABILITAS ============ */}
      {stage === "perang_elektabilitas" && (
        <section className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-3">
            {crisisPool.map((c) => (
              <CrisisCard
                key={c.id}
                crisis={c}
                answered={Boolean(answers[c.id])}
                answeredKey={answers[c.id]}
                busy={busy}
                onChoose={(key) => chooseCrisis(c.id, key)}
              />
            ))}
            {answeredCount >= crisisPool.length && crisisPool.length > 0 && (
              <motion.button
                initial={reduced ? {} : { scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={gotoElection}
                disabled={busy}
                className="w-full rounded-2xl bg-signal-gold px-6 py-4 text-lg font-black text-black shadow-glowGold"
              >
                🗳️ Masa kampanye usai — Menuju Hari Pemilihan
              </motion.button>
            )}
          </div>
          <aside className="panel h-fit space-y-3 p-4">
            <h3 className="text-sm font-bold">Standing Faksi Personal</h3>
            {Object.entries(campaign.faction_standing).map(([code, level]) => (
              <FactionMeter
                key={code}
                name={FACTION_META[code]?.name ?? code}
                icon={FACTION_META[code]?.icon ?? "•"}
                level={Number(level)}
              />
            ))}
            <p className="pt-2 text-xs text-black/50">
              Krisis terjawab: {answeredCount}/{crisisPool.length}. Setiap pilihan adalah trade-off — tidak ada
              jawaban yang menyenangkan semua faksi.
            </p>
          </aside>
        </section>
      )}

      {/* ============ TAHAP 4: HARI PEMILIHAN ============ */}
      {stage === "hari_pemilihan" && !electionResult && (
        <motion.section
          initial={reduced ? {} : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="panel mx-auto max-w-lg space-y-4 p-8 text-center"
        >
          <p className="text-5xl">🗳️</p>
          <h2 className="text-xl font-black">Hari Pemilihan Republik Arcapada</h2>
          <p className="text-sm text-black/60">
            TPS ditutup. Kotak suara menunggu. Elektabilitas akhirmu{" "}
            <b className="tabular-nums">{Number(campaign.elektabilitas).toFixed(1)}%</b> akan diadu dengan
            kepuasan faksi region (60 : 40).
          </p>
          <button
            onClick={openBallot}
            disabled={busy}
            className="w-full rounded-2xl bg-black px-6 py-4 text-lg font-black text-signal-gold disabled:opacity-50"
          >
            {busy ? "Menghitung suara…" : "📦 Buka Kotak Suara"}
          </button>
        </motion.section>
      )}

      {(electionResult || stage === "selesai") && (
        <AnimatePresence>
          <motion.section
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel mx-auto max-w-lg space-y-4 p-8 text-center"
          >
            {electionResult?.win ? (
              <>
                <motion.p
                  className="text-6xl"
                  animate={reduced ? {} : { rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.8 }}
                >
                  🎉
                </motion.p>
                <h2 className="text-2xl font-black text-emerald-600">KAMU MENANG!</h2>
                <p className="text-sm text-black/60">
                  Skor akhir {electionResult.final_score} (ambang {electionResult.ambang}). Rakyat memilihmu.
                  Sekarang bagian yang sulit: memerintah.
                </p>
                <button
                  onClick={() => router.push("/command-center")}
                  className="w-full rounded-2xl bg-signal-gold px-6 py-4 text-lg font-black text-black shadow-glowGold"
                >
                  🏛️ Masuki Ruang Komando
                </button>
              </>
            ) : (
              <>
                <p className="text-6xl">🥀</p>
                <h2 className="text-2xl font-black text-red-600">Belum Berjodoh dengan Kursi</h2>
                <p className="text-sm text-black/60">
                  {electionResult
                    ? `Skor akhir ${electionResult.final_score}, di bawah ambang ${electionResult.ambang}.`
                    : "Kampanye ini telah berakhir."}{" "}
                  Skormu tetap tercatat di papan peringkat.
                </p>
                <div className="flex gap-2">
                  <a href="/leaderboard" className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white">
                    Lihat Peringkat
                  </a>
                  <a href="/peta" className="flex-1 rounded-xl bg-signal-gold px-4 py-3 text-sm font-bold text-black">
                    Coba Lagi
                  </a>
                </div>
              </>
            )}
          </motion.section>
        </AnimatePresence>
      )}
    </div>
  );
}
