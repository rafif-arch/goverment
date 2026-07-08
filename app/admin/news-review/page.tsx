"use client";
// Halaman admin: review interpretasi berita AI → approve/reject.
// Approve = publish world_event (efek aktif ke semua pemain via Realtime).
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase/client";
import { useGame } from "@/lib/game-context";
import { checkContentGuard, type GuardFinding } from "@/lib/content-guard";

interface PendingRow {
  id: string;
  status: string;
  created_at: string;
  ai_interpretation: Record<string, unknown>;
  draft_event: {
    title?: string;
    narasi?: string;
    effects?: { sektor?: string; efek_faksi?: Record<string, number>; efek_variabel?: Record<string, number> };
    duration_days?: number;
  };
  news_raw: { headline: string; summary: string | null; source_name: string | null; source_url: string | null } | null;
}

export default function NewsReviewPage() {
  const { session, loading, isAdmin } = useGame();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await getSupabase()
      .from("pending_events")
      .select("id, status, created_at, ai_interpretation, draft_event, news_raw(headline, summary, source_name, source_url)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRows((data as unknown as PendingRow[]) ?? []);
  }, []);

  useEffect(() => {
    if (session && isAdmin) load();
  }, [session, isAdmin, load]);

  async function review(id: string, approve: boolean) {
    setBusy(id);
    setMsg(null);
    const { data, error } = await getSupabase().rpc("admin_review_pending_event", {
      p_pending_id: id,
      p_approve: approve,
    });
    if (error) setMsg(`Gagal: ${error.message}`);
    else setMsg(approve ? `✅ Dipublikasikan sebagai world event (${data?.world_event_id})` : "🗑️ Ditolak");
    setBusy(null);
    await load();
  }

  async function loadFixtures() {
    setBusy("fixtures");
    setMsg(null);
    const token = (await getSupabase().auth.getSession()).data.session?.access_token;
    const res = await fetch("/api/news/mock-ingest", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    setMsg(res.ok ? `Fixture dimuat: ${body.created} pending event baru` : `Gagal: ${body.error}`);
    setBusy(null);
    await load();
  }

  if (loading) return <p className="py-10 text-center text-sm text-black/50">Memuat…</p>;
  if (!session || !isAdmin)
    return (
      <p className="py-10 text-center text-sm">
        Halaman ini khusus admin. (Tambahkan user_id kamu ke tabel <code>polsim.admin_users</code>.)
      </p>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">🛡️ Review Berita → World Event</h1>
          <p className="text-sm text-black/60">
            Human-in-the-loop wajib: tidak ada event yang tayang tanpa persetujuan di halaman ini
            (atau via WhatsApp approval n8n).
          </p>
        </div>
        <button
          onClick={loadFixtures}
          disabled={busy !== null}
          className="rounded-full bg-black/5 px-4 py-2 text-xs font-semibold hover:bg-black/10"
        >
          🧪 Muat fixture berita (dev)
        </button>
      </header>

      {msg && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{msg}</p>}

      {rows.length === 0 && (
        <p className="panel p-8 text-center text-sm text-black/40">
          Tidak ada event menunggu review. Dunia Arcapada sedang damai — mencurigakan.
        </p>
      )}

      {rows.map((row) => {
        const guard: GuardFinding[] = checkContentGuard(
          `${row.draft_event?.title ?? ""} ${row.draft_event?.narasi ?? ""}`
        );
        const fx = row.draft_event?.effects;
        return (
          <motion.article key={row.id} layout className="panel space-y-3 p-5">
            <div className="rounded-xl bg-black/5 p-3 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                Berita sumber ({row.news_raw?.source_name ?? "?"})
              </p>
              <p className="font-semibold">{row.news_raw?.headline}</p>
              {row.news_raw?.summary && <p className="mt-1 text-xs text-black/60">{row.news_raw.summary}</p>}
              {row.news_raw?.source_url && (
                <a href={row.news_raw.source_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                  buka sumber ↗
                </a>
              )}
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Draft event in-game</p>
              <p className="font-bold text-blue-950">{row.draft_event?.title}</p>
              <p className="mt-1 text-blue-900">{row.draft_event?.narasi}</p>
              <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                {fx?.sektor && <span className="rounded-full bg-blue-200 px-2 py-0.5">sektor: {fx.sektor}</span>}
                {Object.entries(fx?.efek_faksi ?? {}).map(([k, v]) => (
                  <span key={k} className={`rounded-full px-2 py-0.5 ${v >= 0 ? "bg-emerald-200" : "bg-red-200"}`}>
                    {k}: {v > 0 ? "+" : ""}{v}
                  </span>
                ))}
                {Object.entries(fx?.efek_variabel ?? {}).map(([k, v]) => (
                  <span key={k} className="rounded-full bg-black/10 px-2 py-0.5">
                    {k}: {v}
                  </span>
                ))}
                <span className="rounded-full bg-black/10 px-2 py-0.5">⏱ {row.draft_event?.duration_days ?? 7} hari</span>
              </div>
            </div>

            {guard.length > 0 && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">
                <p className="font-bold">⚠️ Guard pagar konten menemukan pola mencurigakan — periksa manual:</p>
                <ul className="mt-1 list-inside list-disc">
                  {guard.map((g, i) => (
                    <li key={i}>
                      &quot;{g.match}&quot; — {g.alasan}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => review(row.id, true)}
                disabled={busy !== null}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                ✅ Approve & Publish
              </button>
              <button
                onClick={() => review(row.id, false)}
                disabled={busy !== null}
                className="flex-1 rounded-xl bg-red-100 px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-40"
              >
                ❌ Reject
              </button>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
