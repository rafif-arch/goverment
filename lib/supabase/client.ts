"use client";
// Supabase client untuk browser — schema polsim, anon key.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type PolsimClient = SupabaseClient<any, "polsim", any>;

let _client: PolsimClient | null = null;

export function getSupabase(): PolsimClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set (lihat .env.example)."
    );
  }
  _client = createClient(url, anon, {
    db: { schema: "polsim" },
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _client;
}
