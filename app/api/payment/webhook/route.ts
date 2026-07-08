// POST /api/payment/webhook — notifikasi Midtrans (HTTP(S) POST dari server Midtrans).
// SATU-SATUNYA jalur yang mengubah status order & memberi benefit.
// Verifikasi signature SHA512 wajib; benefit idempoten (credit_tokens per order_id).
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPaidStatus, mapTransactionStatus, verifyMidtransSignature } from "@/lib/midtrans";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const notif = await req.json();
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return NextResponse.json({ error: "SERVER_KEY_KOSONG" }, { status: 500 });

    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = notif ?? {};
    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: "PAYLOAD_TIDAK_LENGKAP" }, { status: 400 });
    }

    if (
      !verifyMidtransSignature({
        orderId: order_id,
        statusCode: String(status_code),
        grossAmount: String(gross_amount),
        signatureKey: String(signature_key),
        serverKey,
      })
    ) {
      return NextResponse.json({ error: "SIGNATURE_TIDAK_VALID" }, { status: 403 });
    }

    const service = createServiceClient();
    const { data: order } = await service.from("payment_orders").select("*").eq("order_id", order_id).maybeSingle();
    if (!order) return NextResponse.json({ error: "ORDER_TIDAK_DITEMUKAN" }, { status: 404 });

    // cegah downgrade status: order yang sudah paid tidak diubah oleh notifikasi telat
    const newStatus = mapTransactionStatus(String(transaction_status), fraud_status ? String(fraud_status) : undefined);
    if (!newStatus) return NextResponse.json({ ok: true, note: "status diabaikan" });
    if (isPaidStatus(order.status) && !isPaidStatus(newStatus)) {
      return NextResponse.json({ ok: true, note: "order sudah paid; notifikasi telat diabaikan" });
    }

    await service
      .from("payment_orders")
      .update({ status: newStatus, midtrans_response: notif, updated_at: new Date().toISOString() })
      .eq("order_id", order_id);

    if (isPaidStatus(newStatus)) {
      if (order.item_type === "token_topup") {
        const amount = Number(order.item_meta?.token_amount ?? 0);
        if (amount > 0) {
          // idempoten: credit_tokens menolak double-credit utk reference sama
          const { error } = await service.rpc("credit_tokens", {
            p_user_id: order.user_id,
            p_amount: amount,
            p_type: "topup",
            p_reference: order_id,
          });
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else if (order.item_type === "vip_30d") {
        const days = Number(order.item_meta?.days ?? 30);
        // idempoten: satu subscription per order (midtrans_subscription_ref = order_id)
        const { data: dup } = await service
          .from("subscriptions")
          .select("id")
          .eq("midtrans_subscription_ref", order_id)
          .maybeSingle();
        if (!dup) {
          const { data: latest } = await service
            .from("subscriptions")
            .select("expires_at")
            .eq("user_id", order.user_id)
            .eq("status", "active")
            .order("expires_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const base =
            latest && new Date(latest.expires_at) > new Date() ? new Date(latest.expires_at) : new Date();
          const expires = new Date(base.getTime() + days * 24 * 3600 * 1000);
          const { error } = await service.from("subscriptions").insert({
            user_id: order.user_id,
            tier: "vip",
            status: "active",
            expires_at: expires.toISOString(),
            midtrans_subscription_ref: order_id,
          });
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
