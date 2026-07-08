// POST /api/audit/run — jalankan audit engine on-demand (testing/dev).
// Produksi memakai n8n scheduled workflow; endpoint ini dibatasi untuk admin.
import { NextResponse } from "next/server";
import { createServiceClient, getUserFromRequest } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const service = createServiceClient();
    const { data: admin } = await service.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) return NextResponse.json({ error: "BUKAN_ADMIN" }, { status: 403 });

    let campaignId: string | null = null;
    try {
      const body = await req.json();
      campaignId = body?.campaign_state_id ?? null;
    } catch {
      /* body kosong = audit semua campaign menjabat */
    }

    const { data, error } = await service.rpc("run_audit_engine", {
      p_campaign_state_id: campaignId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
