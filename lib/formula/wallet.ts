// Model TypeScript dari semantik wallet SQL (polsim.spend_tokens / credit_tokens /
// claim_daily_grant) — dipakai unit test kontrak anti-double-spend & idempotensi.
// SUMBER KEBENARAN runtime adalah fungsi Postgres (supabase/migrations/0005);
// jaga perilaku keduanya sinkron.

export class WalletError extends Error {}

export interface WalletTx {
  amount: number;
  type: "topup" | "spend" | "daily_grant" | "refund" | "signup_bonus";
  reference?: string;
}

export class WalletLedger {
  private balance: number;
  private txs: WalletTx[] = [];
  private lastDailyGrant: string | null = null;

  constructor(signupBonus = 20) {
    this.balance = signupBonus;
    this.txs.push({ amount: signupBonus, type: "signup_bonus" });
  }

  getBalance(): number {
    return this.balance;
  }

  getTransactions(): readonly WalletTx[] {
    return this.txs;
  }

  /** Mirror polsim.spend_tokens: gagal atomik bila saldo kurang / jumlah invalid. */
  spend(amount: number, reference?: string): number {
    if (!Number.isFinite(amount) || amount <= 0) throw new WalletError("JUMLAH_TIDAK_VALID");
    if (this.balance < amount) throw new WalletError("TOKEN_TIDAK_CUKUP");
    this.balance -= amount;
    this.txs.push({ amount: -amount, type: "spend", reference });
    return this.balance;
  }

  /** Mirror polsim.credit_tokens: idempoten per (reference, type). */
  credit(amount: number, type: "topup" | "refund", reference?: string): number {
    if (!Number.isFinite(amount) || amount <= 0) throw new WalletError("JUMLAH_TIDAK_VALID");
    if (
      reference &&
      this.txs.some((t) => t.reference === reference && t.type === type)
    ) {
      return this.balance; // retry webhook: tidak menggandakan saldo
    }
    this.balance += amount;
    this.txs.push({ amount, type, reference });
    return this.balance;
  }

  /** Mirror polsim.claim_daily_grant: satu kali per tanggal. */
  claimDailyGrant(amount: number, today: string): { granted: boolean; balance: number } {
    if (this.lastDailyGrant === today) return { granted: false, balance: this.balance };
    this.lastDailyGrant = today;
    this.balance += amount;
    this.txs.push({ amount, type: "daily_grant" });
    return { granted: true, balance: this.balance };
  }
}
