// Supabase client server-side. JANGAN diimpor dari kode client.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type PolsimClient = SupabaseClient<any, "polsim", any>;

/** Client service role — bypass RLS. Untuk webhook, admin endpoint, scripts. */
export function createServiceClient(): PolsimClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum di-set — endpoint server tidak bisa jalan.");
  }
  return createClient(url, key, {
    db: { schema: "polsim" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Client dengan identitas user (Bearer token dari client) — tetap terkena RLS.
 * Dipakai route handler untuk memverifikasi & bertindak atas nama user.
 */
export function createUserClient(accessToken: string): PolsimClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Env Supabase belum di-set.");
  return createClient(url, anon, {
    db: { schema: "polsim" },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Ambil user dari Authorization header sebuah Request. */
export async function getUserFromRequest(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { user: null, token: null };
  const service = createServiceClient();
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) return { user: null, token: null };
  return { user: data.user, token };
}
