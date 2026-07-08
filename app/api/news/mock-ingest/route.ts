// POST /api/news/mock-ingest — muat fixture berita → news_raw + pending_events.
// Untuk pengujian lokal end-to-end Live News tanpa n8n. Admin only.
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient, getUserFromRequest } from "@/lib/supabase/service";
import { NEWS_FIXTURES } from "@/data/news-fixtures";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const service = createServiceClient();
    const { data: admin } = await service.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "BUKAN_ADMIN" }, { status: 403 });

    let created = 0;
    for (const fx of NEWS_FIXTURES) {
      const hash = createHash("sha256").update(fx.headline).digest("hex");
      const { data: news, error: newsErr } = await service
        .from("news_raw")
        .upsert(
          {
            headline: fx.headline,
            summary: fx.summary,
            source_name: fx.source_name,
            source_url: fx.source_url,
            published_at: new Date().toISOString(),
            content_hash: hash,
          },
          { onConflict: "content_hash" }
        )
        .select("id")
        .single();
      if (newsErr || !news) continue;

      // hindari duplikasi pending utk news yang sama
      const { data: existing } = await service
        .from("pending_events")
        .select("id")
        .eq("news_raw_id", news.id)
        .limit(1);
      if (existing && existing.length > 0) continue;

      const it = fx.interpretation;
      const { error: peErr } = await service.from("pending_events").insert({
        news_raw_id: news.id,
        ai_interpretation: it,
        draft_event: {
          title: it.judul_in_game,
          narasi: it.draft_narasi_in_game,
          effects: { sektor: it.sektor, efek_faksi: it.efek_faksi, efek_variabel: it.efek_variabel },
          duration_days: it.duration_days,
        },
      });
      if (!peErr) created++;
    }
    return NextResponse.json({ created, total_fixtures: NEWS_FIXTURES.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
