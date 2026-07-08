// POST /api/payment/order — buat order server-side → Snap token.
// Harga SELALU diambil dari game_config server-side (client tidak bisa menentukan harga).
import { NextResponse } from "next/server";
import { createServiceClient, getUserFromRequest } from "@/lib/supabase/service";
import { createSnapTransaction } from "@/lib/midtrans";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const body = await req.json();
    const itemType: string = body?.item_type;
    const packKey: string | undefined = body?.pack_key;

    const service = createServiceClient();
    let grossAmount = 0;
    let itemName = "";
    let itemMeta: Record<string, unknown> = {};

    if (itemType === "token_topup") {
      const { data: cfg } = await service.from("game_config").select("value").eq("key", "token_packs").single();
      const pack = cfg?.value?.[packKey ?? ""];
      if (!pack) return NextResponse.json({ error: "PAKET_TIDAK_DIKENAL" }, { status: 400 });
      grossAmount = pack.price_idr;
      itemName = `${pack.label} (${pack.tokens} token)`;
      itemMeta = { pack_key: packKey, token_amount: pack.tokens };
    } else if (itemType === "vip_30d") {
      const { data: cfg } = await service.from("game_config").select("value").eq("key", "vip").single();
      if (!cfg) return NextResponse.json({ error: "CONFIG_VIP_HILANG" }, { status: 500 });
      grossAmount = cfg.value.price_idr;
      itemName = cfg.value.label;
      itemMeta = { days: cfg.value.days };
    } else {
      return NextResponse.json({ error: "ITEM_TIDAK_DIKENAL" }, { status: 400 });
    }

    const orderId = `polsim-${itemType === "token_topup" ? "tok" : "vip"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { error: insertErr } = await service.from("payment_orders").insert({
      order_id: orderId,
      user_id: user.id,
      gross_amount: grossAmount,
      item_type: itemType,
      item_meta: itemMeta,
      status: "pending",
    });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    const snap = await createSnapTransaction({
      orderId,
      grossAmount,
      itemName,
      customerEmail: user.email ?? undefined,
    });

    await service.from("payment_orders").update({ snap_token: snap.token, updated_at: new Date().toISOString() }).eq("order_id", orderId);

    return NextResponse.json({ order_id: orderId, snap_token: snap.token, redirect_url: snap.redirect_url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
