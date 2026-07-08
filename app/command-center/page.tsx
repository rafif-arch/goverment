"use client";
// Babak IV — Governance Command Center (Dark Mode) & Audit.
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";
import AuditMeter from "@/components/AuditMeter";
import OfficeDecor from "@/components/OfficeDecor";
import FactionMeter from "@/components/FactionMeter";
import StatCount from "@/components/StatCount";
import { GAME_CONFIG } from "@/data/config";

interface Isu {
  kode: string;
  judul: string;
  sektor: string;
  severity: number;
  base_cost: number;
  impact: number;
}
interface RegionRow {
  id: string;
  name: string;
  isu_sektoral: Isu[];
}
interface VendorRow {
  id: string;
  code: string;
  nama: string;
  is_sponsor_linked: boolean;
  track_record: string;
  markup_bias: number;
}
interface ProjectRow {
  id: string;
  nama_proyek: string;
  isu_target: string;
  base_cost: number;
  anggaran: number;
  vendor_id: string | null;
  status: string;
  executed_at: string | null;
  sponsor_demand_id: string | null;
  impact: number;
}
interface DemandRow {
  id: string;
  deskripsi: string;
  vendor_code: string | null;
  deadline_day: number | null;
  status: string;
  efek_refuse: Record<string, number>;
}
interface GameOverRow {
  reason: string;
  final_stats: { score?: number; ipk?: number; pembangunan?: number };
}

const STATUS_LABEL: Record<string, string> = {
  draft_kak: "📝 Draft KAK",
  lobi_dprd: "🏛️ Perlu Lobi MPD",
  eksekusi: "✅ Disetujui — siap eksekusi",
  selesai: "🏁 Selesai",
};

const FACTION_META: Record<string, { name: string; icon: string }> = {
  buruh_tani: { name: "Buruh & Tani", icon: "🌾" },
  menengah_urban: { name: "Menengah Urban", icon: "🏙️" },
  tokoh_agama: { name: "Tokoh Agama", icon: "🕌" },
  konsorsium_bisnis: { name: "Konsorsium Bisnis", icon: "💼" },
};

export default function CommandCenterPage() {
  const { session, loading, character, campaign, refresh, isVip } = useGame();
  const reduced = useReducedMotion();

  const [region, setRegion] = useState<RegionRow | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [demands, setDemands] = useState<DemandRow[]>([]);
  const [ipk, setIpk] = useState<{ score: number; flag_counts: Record<string, number> }>({ score: 0, flag_counts: {} });
  const [equippedDecor, setEquippedDecor] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState<GameOverRow | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formIsu, setFormIsu] = useState<string>("");
  const [formVendor, setFormVendor] = useState<string>("");
  const [formMarkup, setFormMarkup] = useState(0); // % 0..80
  const [lobiProject, setLobiProject] = useState<ProjectRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<Record<string, number> | null>(null);
  const [nightMode, setNightMode] = useState(false); // testing hook utk rule jam_tidak_wajar
  const [worldTrends, setWorldTrends] = useState<Array<{ id: string; title: string; effects: { sektor?: string; efek_variabel?: Record<string, number> } }>>([]);

  const loadAll = useCallback(async () => {
    if (!campaign) return;
    const supabase = getSupabase();
    const [r, v, p, d, myIpk, cos] = await Promise.all([
      campaign.region_id
        ? supabase.from("regions").select("id, name, isu_sektoral").eq("id", campaign.region_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("vendors").select("*"),
      supabase.from("government_projects").select("*").eq("campaign_state_id", campaign.id).order("created_at", { ascending: false }),
      supabase.from("sponsor_demands").select("*").order("created_at", { ascending: false }),
      supabase.rpc("get_my_ipk", { p_campaign: campaign.id }),
      supabase
        .from("user_cosmetics")
        .select("equipped, cosmetic_items(asset_ref, tipe)")
        .eq("equipped", true),
    ]);
    setRegion((r.data as RegionRow | null) ?? null);
    setVendors((v.data as VendorRow[]) ?? []);
    setProjects((p.data as ProjectRow[]) ?? []);
    setDemands((d.data as DemandRow[]) ?? []);
    if (myIpk.data) setIpk(myIpk.data);
    const refs: string[] = [];
    for (const row of (cos.data as any[]) ?? []) {
      const item = row.cosmetic_items;
      if (item?.tipe === "dekorasi_ruang") refs.push(item.asset_ref);
    }
    setEquippedDecor(refs);
    const { data: trends } = await supabase.from("active_world_events").select("id, title, effects");
    setWorldTrends((trends as typeof worldTrends) ?? []);
    if (campaign.current_stage === "game_over") {
      const { data: gol } = await supabase
        .from("game_over_log")
        .select("reason, final_stats")
        .eq("campaign_state_id", campaign.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setGameOver((gol as GameOverRow | null) ?? null);
    }
  }, [campaign]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedIsu = useMemo(
    () => region?.isu_sektoral.find((i) => i.kode === formIsu) ?? null,
    [region, formIsu]
  );
  const anggaran = selectedIsu ? Math.round(selectedIsu.base_cost * (1 + formMarkup / 100)) : 0;

  async function createProject() {
    if (!campaign || !session || !selectedIsu || !formVendor) return;
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().from("government_projects").insert({
      campaign_state_id: campaign.id,
      user_id: session.user.id,
      nama_proyek: `Penanganan: ${selectedIsu.judul}`,
      isu_target: selectedIsu.kode,
      base_cost: selectedIsu.base_cost,
      anggaran,
      vendor_id: formVendor,
      political_power_cost: selectedIsu.severity,
      impact: selectedIsu.impact,
    });
    if (error) setError(error.message);
    else {
      setShowForm(false);
      setFormIsu("");
      setFormVendor("");
      setFormMarkup(0);
    }
    await loadAll();
    setBusy(false);
  }

  async function executeProject(p: ProjectRow) {
    setBusy(true);
    setError(null);
    const supabase = getSupabase();
    const params: Record<string, unknown> = { p_project_id: p.id };
    if (nightMode) {
      // testing hook: eksekusi "jam 02:00 UTC" utk memancing flag jam_tidak_wajar
      const d = new Date();
      d.setUTCHours(2, 0, 0, 0);
      params.p_executed_at = d.toISOString();
    }
    const { error } = await supabase.rpc("execute_project", params);
    if (error) {
      if (error.message.includes("PERLU_LOBI_DPRD")) setLobiProject(p);
      else if (error.message.includes("TOKEN_TIDAK_CUKUP")) setError("Token kebijakan habis — klaim jatah harian atau top-up di Toko.");
      else setError(error.message);
    }
    await Promise.all([refresh(), loadAll()]);
    setBusy(false);
  }

  async function doLobi(choice: "uang" | "koneksi") {
    if (!lobiProject) return;
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().rpc("lobi_dprd", { p_project_id: lobiProject.id, p_choice: choice });
    if (error) {
      if (error.message.includes("TOKEN_TIDAK_CUKUP")) setError("Token kebijakan habis untuk lobi — klaim harian / top-up.");
      else setError(error.message);
    } else {
      setLobiProject(null);
    }
    await Promise.all([refresh(), loadAll()]);
    setBusy(false);
  }

  async function resolveDemand(d: DemandRow, action: "comply" | "refuse") {
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().rpc("resolve_sponsor_demand", { p_demand_id: d.id, p_action: action });
    if (error) setError(error.message);
    await Promise.all([refresh(), loadAll()]);
    setBusy(false);
  }

  async function endTerm() {
    if (!campaign) return;
    if (!confirm("Akhiri masa jabatan dan kunci skor ke papan peringkat?")) return;
    setBusy(true);
    const { data, error } = await getSupabase().rpc("submit_leaderboard", { p_campaign: campaign.id });
    if (error) setError(error.message);
    else setFinalScore(data);
    await refresh();
    setBusy(false);
  }

  if (loading) return <p className="py-10 text-center text-sm">Memuat…</p>;
  if (!session)
    return <p className="py-10 text-center text-sm">Masuk dulu di <a href="/" className="underline">beranda</a>.</p>;
  if (!campaign || !["menjabat", "game_over", "selesai"].includes(campaign.current_stage))
    return (
      <p className="py-10 text-center text-sm">
        Ruang komando hanya untuk yang menjabat. Selesaikan <a href="/kampanye" className="underline">kampanye</a> dulu.
      </p>
    );

  // ============ GAME OVER: OTT ============
  if (campaign.current_stage === "game_over") {
    return (
      <div className="theme-command-center fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-lg space-y-5 text-center"
        >
          <motion.p
            className="text-7xl"
            animate={reduced ? {} : { rotate: [0, -3, 3, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            🚨
          </motion.p>
          <h1 className="text-3xl font-black text-signal-red">OPERASI TANGKAP TANGAN</h1>
          <p className="text-white/70">
            {gameOver?.reason ?? "Komisi Integritas Arcapada menjemputmu di ruang kerja."} Rompi oranye
            versi Arcapada sudah disiapkan dalam ukuranmu.
          </p>
          <div className="panel grid grid-cols-3 gap-3 p-4 text-white">
            <div>
              <p className="text-[10px] uppercase text-white/40">Skor Akhir</p>
              <p className="text-2xl font-black">{gameOver?.final_stats?.score ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/40">IPK</p>
              <p className="text-2xl font-black text-signal-red">{gameOver?.final_stats?.ipk ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/40">Pembangunan</p>
              <p className="text-2xl font-black">{gameOver?.final_stats?.pembangunan ?? campaign.pembangunan_score}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/leaderboard" className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white">
              Papan Peringkat
            </a>
            <a href="/peta" className="flex-1 rounded-xl bg-signal-gold px-4 py-3 text-sm font-bold text-black">
              Karier Baru
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const pendingDemands = demands.filter((d) => d.status === "pending");
  const powerLow = campaign.political_power < GAME_CONFIG.political_power_threshold.value;

  return (
    <div className="theme-command-center -mx-4 -mt-4 min-h-screen px-4 pb-16 pt-6 sm:-mx-6 sm:px-6">
      <motion.div
        initial={reduced ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-6xl space-y-4 text-white"
      >
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-signal-gold">Pusat Komando Pemerintahan</p>
            <h1 className="text-2xl font-black">🏛️ {region?.name ?? "…"}</h1>
            <p className="text-sm text-white/60">
              {character?.nama} · Hari ke-{campaign.term_day} masa jabatan
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Political Power", value: campaign.political_power, warn: powerLow },
              { label: "Kepercayaan", value: character?.kepercayaan_publik ?? 0 },
              { label: "Uang (jt Ʀ)", value: character?.uang ?? 0 },
              { label: "Pembangunan", value: campaign.pembangunan_score },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/5 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wide text-white/40">{s.label}</p>
                <p className={`text-lg font-black tabular-nums ${s.warn ? "text-signal-red" : ""}`}>
                  <StatCount value={s.value} />
                </p>
              </div>
            ))}
          </div>
        </header>

        {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        {/* Sponsor demands */}
        <AnimatePresence>
          {pendingDemands.map((d) => (
            <motion.div
              key={d.id}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-signal-gold/40 bg-signal-gold/10 p-4"
            >
              <p className="text-xs font-black uppercase tracking-widest text-signal-gold">📞 Telepon dari Grup Singgasana</p>
              <p className="mt-1 text-sm text-white/85">{d.deskripsi}</p>
              <p className="mt-1 text-xs text-white/50">
                Menolak: {Object.entries(d.efek_refuse).map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(", ")} ·
                Menuruti: proyek titipan bermarkup masuk daftarmu (dan daftar KIA).
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => resolveDemand(d, "comply")}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-signal-gold px-3 py-2 text-xs font-bold text-black"
                >
                  🤝 &quot;Siap, diatur.&quot;
                </button>
                <button
                  onClick={() => resolveDemand(d, "refuse")}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold"
                >
                  ✋ Tolak (tanggung akibatnya)
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
          {/* ==== Kolom proyek ==== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">📋 Proyek Pemerintahan</h2>
              <button
                onClick={() => setShowForm((v) => !v)}
                className="rounded-full bg-signal-gold px-4 py-1.5 text-xs font-bold text-black"
              >
                {showForm ? "Tutup" : "+ Rancang Proyek (KAK/RAB)"}
              </button>
            </div>

            <AnimatePresence>
              {showForm && region && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                  <div className="space-y-3 p-4">
                    <label className="block text-xs font-semibold text-white/70">
                      1. Isu yang ditangani (KAK)
                      <select
                        value={formIsu}
                        onChange={(e) => setFormIsu(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/15 bg-[#141a2c] px-3 py-2 text-sm"
                      >
                        <option value="">— pilih isu —</option>
                        {region.isu_sektoral.map((i) => (
                          <option key={i.kode} value={i.kode}>
                            {i.judul} (HPS {i.base_cost.toLocaleString("id-ID")} jt Ʀ)
                          </option>
                        ))}
                      </select>
                    </label>
                    {selectedIsu && (
                      <>
                        <label className="block text-xs font-semibold text-white/70">
                          2. RAB — markup dari HPS: <b className={formMarkup > 20 ? "text-signal-red" : "text-signal-gold"}>{formMarkup}%</b>
                          <input
                            type="range"
                            min={0}
                            max={80}
                            value={formMarkup}
                            onChange={(e) => setFormMarkup(Number(e.target.value))}
                            className="mt-1 w-full accent-amber-400"
                          />
                          <span className="text-[11px] font-normal text-white/45">
                            Anggaran diajukan: {anggaran.toLocaleString("id-ID")} jt Ʀ.
                            {formMarkup > 20 && " ⚠ Markup >20% berisiko flag audit."}
                            {formMarkup > 0 && formMarkup <= 20 && " Sisa markup masuk 'dana taktis' (dana kampanye)."}
                          </span>
                        </label>
                        <div className="text-xs font-semibold text-white/70">
                          3. Pilih vendor
                          <div className="mt-1 grid gap-2 sm:grid-cols-2">
                            {vendors.map((v) => (
                              <button
                                key={v.id}
                                onClick={() => setFormVendor(v.id)}
                                className={`rounded-xl border p-3 text-left text-xs transition ${
                                  formVendor === v.id ? "border-amber-400 bg-amber-400/10" : "border-white/10 hover:border-white/30"
                                }`}
                              >
                                <p className="font-bold">
                                  {v.nama} {v.is_sponsor_linked && <span title="Terafiliasi sponsor">🕴️</span>}
                                </p>
                                <p className="mt-0.5 font-normal text-white/50">{v.track_record}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={createProject}
                          disabled={busy || !formVendor}
                          className="w-full rounded-xl bg-signal-gold px-4 py-3 text-sm font-black text-black disabled:opacity-40"
                        >
                          📑 Ajukan Proyek
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {projects.length === 0 && !showForm && (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/40">
                Belum ada proyek. Rakyat menunggu — dan menghitung.
              </p>
            )}

            {projects.map((p) => {
              const vendor = vendors.find((v) => v.id === p.vendor_id);
              const markupPct = Math.round(((p.anggaran - p.base_cost) / p.base_cost) * 100);
              return (
                <motion.div
                  key={p.id}
                  layout={!reduced}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold">
                        {p.nama_proyek} {p.sponsor_demand_id && <span title="Proyek titipan sponsor">🕴️</span>}
                      </p>
                      <p className="text-xs text-white/50">
                        {vendor?.nama ?? "—"} · anggaran {p.anggaran.toLocaleString("id-ID")} jt Ʀ (markup {markupPct}%)
                        {p.executed_at && ` · dieksekusi ${new Date(p.executed_at).toLocaleString("id-ID")}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{STATUS_LABEL[p.status]}</span>
                  </div>
                  {p.status !== "selesai" && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => executeProject(p)}
                        disabled={busy}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black disabled:opacity-40"
                      >
                        ⚡ Eksekusi Anggaran ({p.anggaran >= GAME_CONFIG.token_costs.proyek_besar_threshold ? GAME_CONFIG.token_costs.eksekusi_proyek_besar : GAME_CONFIG.token_costs.eksekusi_proyek} 🪙)
                      </button>
                      {p.status === "lobi_dprd" && (
                        <button
                          onClick={() => setLobiProject(p)}
                          disabled={busy}
                          className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold"
                        >
                          🏛️ Lobi MPD ({GAME_CONFIG.token_costs.lobi_dprd} 🪙)
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}

            <label className="flex items-center gap-2 pt-2 text-[11px] text-white/35">
              <input type="checkbox" checked={nightMode} onChange={(e) => setNightMode(e.target.checked)} />
              Mode &quot;lembur tengah malam&quot;: eksekusi tercatat pukul 02.00 UTC (untuk menguji rule audit
              jam tidak wajar — menaikkan risiko IPK-mu sendiri)
            </label>
          </section>

          {/* ==== Kolom kanan ==== */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <AuditMeter score={Number(ipk.score)} flagCounts={ipk.flag_counts} />
              <p className="mt-2 text-[10px] text-white/30">
                Audit dijalankan berkala oleh Komisi Integritas Arcapada (n8n / audit engine). IPK ≥ 80 = OTT.
              </p>
            </div>

            <OfficeDecor equippedRefs={equippedDecor} />

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 text-sm font-bold">Standing Faksi</h3>
              <div className="space-y-2">
                {Object.entries(campaign.faction_standing).map(([code, level]) => (
                  <FactionMeter
                    key={code}
                    name={FACTION_META[code]?.name ?? code}
                    icon={FACTION_META[code]?.icon ?? "•"}
                    level={Number(level)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                📡 Analisis Arah Dunia <span className="rounded-full bg-signal-gold/20 px-2 py-0.5 text-[10px] text-signal-gold">VIP</span>
              </h3>
              {isVip ? (
                worldTrends.length > 0 ? (
                  <ul className="space-y-2 text-xs text-white/75">
                    {worldTrends.map((t) => (
                      <li key={t.id} className="rounded-lg bg-white/5 px-3 py-2">
                        <p className="font-semibold">{t.title}</p>
                        <p className="mt-0.5 text-white/45">
                          sektor {t.effects?.sektor ?? "-"}
                          {t.effects?.efek_variabel?.inflasi_proyek
                            ? ` · biaya proyek ${t.effects.efek_variabel.inflasi_proyek > 0 ? "naik" : "turun"} ${Math.abs(t.effects.efek_variabel.inflasi_proyek * 100).toFixed(0)}%`
                            : ""}
                          {t.effects?.efek_variabel?.sorotan_audit
                            ? ` · sorotan audit +${t.effects.efek_variabel.sorotan_audit}`
                            : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-white/40">Dunia sedang tenang. Intelijen Pusat ikut ngopi.</p>
                )
              ) : (
                <a href="/shop" className="block rounded-lg bg-white/5 px-3 py-2 text-xs text-white/50 hover:bg-white/10">
                  🔒 Ringkasan tren world events untuk pelanggan VIP — buka di Toko.
                </a>
              )}
            </div>

            {finalScore ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center">
                <p className="text-sm font-bold text-emerald-300">Skor terkunci: {finalScore.score}</p>
                <a href="/leaderboard" className="mt-2 block rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">
                  Lihat Papan Peringkat
                </a>
              </div>
            ) : (
              campaign.current_stage === "menjabat" && (
                <button
                  onClick={endTerm}
                  disabled={busy}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/10"
                >
                  🏁 Akhiri Masa Jabatan & Kunci Skor
                </button>
              )
            )}
          </aside>
        </div>

        {/* Modal Lobi MPD */}
        <AnimatePresence>
          {lobiProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setLobiProject(null)}
            >
              <motion.div
                initial={reduced ? {} : { scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#131a2c] p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-black">🏛️ Lobi Majelis Praja Daerah</h3>
                <p className="text-sm text-white/60">
                  Political power-mu ({campaign.political_power}) di bawah ambang {GAME_CONFIG.political_power_threshold.value}.
                  Fraksi-fraksi MPD minta &quot;pendekatan&quot; untuk meloloskan{" "}
                  <b>{lobiProject.nama_proyek}</b>.
                </p>
                <button
                  onClick={() => doLobi("uang")}
                  disabled={busy}
                  className="w-full rounded-xl bg-signal-gold px-4 py-3 text-left text-sm font-bold text-black"
                >
                  💵 Jalur &quot;uang ketok&quot; — biaya {Math.max(500, Math.round(lobiProject.anggaran / 20)).toLocaleString("id-ID")} jt Ʀ
                  <span className="block text-[11px] font-normal">Cepat, mahal, dan sebaiknya tidak difoto.</span>
                </button>
                <button
                  onClick={() => doLobi("koneksi")}
                  disabled={busy}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm font-bold"
                >
                  🤝 Tukar koneksi politik (−10 koneksi)
                  <span className="block text-[11px] font-normal text-white/50">Utang budi lama dicairkan.</span>
                </button>
                <button onClick={() => setLobiProject(null)} className="w-full py-1 text-xs text-white/40">
                  Batal
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
