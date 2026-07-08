import { describe, expect, it } from "vitest";
import { WalletError, WalletLedger } from "@/lib/formula/wallet";

describe("mutasi wallet (mirror semantik RPC atomic)", () => {
  it("bonus pendaftaran menjadi saldo awal", () => {
    expect(new WalletLedger(20).getBalance()).toBe(20);
  });

  it("spend mengurangi saldo; gagal atomik bila tidak cukup", () => {
    const w = new WalletLedger(10);
    expect(w.spend(7)).toBe(3);
    expect(() => w.spend(5)).toThrow(WalletError);
    expect(w.getBalance()).toBe(3); // saldo tidak berubah saat gagal
  });

  it("spend menolak jumlah nol/negatif/NaN", () => {
    const w = new WalletLedger(10);
    for (const bad of [0, -5, NaN]) expect(() => w.spend(bad)).toThrow("JUMLAH_TIDAK_VALID");
  });

  it("credit topup idempoten per reference (retry webhook aman)", () => {
    const w = new WalletLedger(0);
    expect(w.credit(100, "topup", "order-1")).toBe(100);
    expect(w.credit(100, "topup", "order-1")).toBe(100); // retry → tidak dobel
    expect(w.credit(100, "topup", "order-2")).toBe(200); // order berbeda → masuk
    expect(w.getTransactions().filter((t) => t.type === "topup")).toHaveLength(2);
  });

  it("daily grant hanya sekali per tanggal", () => {
    const w = new WalletLedger(0);
    expect(w.claimDailyGrant(10, "2026-07-08")).toEqual({ granted: true, balance: 10 });
    expect(w.claimDailyGrant(10, "2026-07-08")).toEqual({ granted: false, balance: 10 });
    expect(w.claimDailyGrant(10, "2026-07-09").granted).toBe(true);
  });

  it("urutan spend berturut-turut konsisten (simulasi anti double-spend)", () => {
    const w = new WalletLedger(10);
    w.spend(6);
    expect(() => w.spend(6)).toThrow("TOKEN_TIDAK_CUKUP");
    expect(w.getBalance()).toBe(4);
  });
});
