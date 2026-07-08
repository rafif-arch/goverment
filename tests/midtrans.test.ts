import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isPaidStatus, mapTransactionStatus, verifyMidtransSignature } from "@/lib/midtrans";

describe("verifikasi signature webhook Midtrans", () => {
  const serverKey = "SB-Mid-server-TESTKEY";
  const orderId = "polsim-tok-123";
  const statusCode = "200";
  const grossAmount = "25000.00";
  const validSig = createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest("hex");

  it("menerima signature sha512(order_id+status_code+gross_amount+server_key) yang benar", () => {
    expect(
      verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey: validSig, serverKey })
    ).toBe(true);
  });

  it("menolak signature salah / payload dimodifikasi", () => {
    expect(
      verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey: "deadbeef", serverKey })
    ).toBe(false);
    expect(
      verifyMidtransSignature({ orderId, statusCode, grossAmount: "999999.00", signatureKey: validSig, serverKey })
    ).toBe(false);
    expect(
      verifyMidtransSignature({ orderId: "order-lain", statusCode, grossAmount, signatureKey: validSig, serverKey })
    ).toBe(false);
  });

  it("menolak bila server key berbeda", () => {
    expect(
      verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey: validSig, serverKey: "kunci-lain" })
    ).toBe(false);
  });
});

describe("mapping status transaksi", () => {
  it("map status inti", () => {
    expect(mapTransactionStatus("settlement")).toBe("settlement");
    expect(mapTransactionStatus("pending")).toBe("pending");
    expect(mapTransactionStatus("expire")).toBe("expire");
    expect(mapTransactionStatus("cancel")).toBe("cancel");
    expect(mapTransactionStatus("deny")).toBe("deny");
    expect(mapTransactionStatus("refund")).toBe("refund");
    expect(mapTransactionStatus("tidak-dikenal")).toBeNull();
  });

  it("capture + fraud challenge → challenge (belum boleh beri benefit)", () => {
    expect(mapTransactionStatus("capture", "challenge")).toBe("challenge");
    expect(mapTransactionStatus("capture", "accept")).toBe("capture");
  });

  it("hanya settlement/capture yang dianggap paid", () => {
    expect(isPaidStatus("settlement")).toBe(true);
    expect(isPaidStatus("capture")).toBe(true);
    for (const s of ["pending", "challenge", "deny", "expire", "cancel", "refund"]) {
      expect(isPaidStatus(s)).toBe(false);
    }
  });
});
