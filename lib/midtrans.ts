// Helper Midtrans Snap (server-side only).
// SANDBOX default; produksi hanya bila MIDTRANS_IS_PRODUCTION=true (lihat README go-live).
import { createHash } from "node:crypto";

export function midtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum di-set");
  return {
    serverKey,
    isProduction,
    snapBaseUrl: isProduction
      ? "https://app.midtrans.com/snap/v1"
      : "https://app.sandbox.midtrans.com/snap/v1",
  };
}

/** Buat transaksi Snap → { token, redirect_url }. */
export async function createSnapTransaction(params: {
  orderId: string;
  grossAmount: number; // IDR
  itemName: string;
  customerEmail?: string;
}): Promise<{ token: string; redirect_url: string }> {
  const { serverKey, snapBaseUrl } = midtransConfig();
  const res = await fetch(`${snapBaseUrl}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: params.orderId, gross_amount: params.grossAmount },
      item_details: [
        { id: params.orderId, price: params.grossAmount, quantity: 1, name: params.itemName.slice(0, 50) },
      ],
      customer_details: params.customerEmail ? { email: params.customerEmail } : undefined,
    }),
  });
  if (!res.ok) {
    throw new Error(`Midtrans Snap error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Verifikasi signature notifikasi Midtrans:
 * sha512(order_id + status_code + gross_amount + server_key)
 * Sumber kebenaran status order — JANGAN percaya redirect client.
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  serverKey: string;
}): boolean {
  const expected = createHash("sha512")
    .update(params.orderId + params.statusCode + params.grossAmount + params.serverKey)
    .digest("hex");
  return expected === params.signatureKey;
}

/** Map transaction_status Midtrans → status kolom payment_orders. */
export function mapTransactionStatus(
  transactionStatus: string,
  fraudStatus?: string
): "settlement" | "capture" | "pending" | "deny" | "cancel" | "expire" | "refund" | "challenge" | null {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "challenge" ? "challenge" : "capture";
    case "settlement":
      return "settlement";
    case "pending":
      return "pending";
    case "deny":
      return "deny";
    case "cancel":
      return "cancel";
    case "expire":
      return "expire";
    case "refund":
    case "partial_refund":
      return "refund";
    default:
      return null;
  }
}

/** Status yang dianggap pembayaran sukses (boleh memberi benefit). */
export function isPaidStatus(status: string): boolean {
  return status === "settlement" || status === "capture";
}
