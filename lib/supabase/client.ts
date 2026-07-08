"use client";
// Supabase client untuk browser — schema polsim, anon key.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
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
