"use client";
// Konteks global game: sesi auth, karakter aktif, campaign aktif, wallet, VIP.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";

export interface PlayerCharacter {
  id: string;
  nama: string;
  umur: number;
  pendidikan: string;
  profesi: string;
  uang: number;
  kepercayaan_publik: number;
  koneksi_politik: number;
  has_oligarch_trait: boolean;
  has_vip_trait: boolean;
  utang_politik_level: number;
}

export interface CampaignState {
  id: string;
  player_character_id: string;
  current_stage: string;
  region_id: string | null;
  party_id: string | null;
  running_mate_id: string | null;
  elektabilitas: number;
  political_power: number;
  dana_kampanye: number;
  faction_standing: Record<string, number>;
  term_day: number;
  pembangunan_score: number;
  apbd_total: number;
  apbd_sisa: number;
  is_active: boolean;
}

interface GameContextValue {
  session: Session | null;
  loading: boolean;
  character: PlayerCharacter | null;
  campaign: CampaignState | null;
  tokenBalance: number | null;
  isVip: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const GameContext = createContext<GameContextValue>({
  session: null,
  loading: true,
  character: null,
  campaign: null,
  tokenBalance: null,
  isVip: false,
  isAdmin: false,
  refresh: async () => {},
  signOut: async () => {},
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState<PlayerCharacter | null>(null);
  const [campaign, setCampaign] = useState<CampaignState | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadGameState = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setCharacter(null);
      setCampaign(null);
      setTokenBalance(null);
      setIsVip(false);
      setIsAdmin(false);
      return;
    }
    const supabase = getSupabase();
    // auto-redeem kode referral dari link ajakan (sekali; apa pun hasilnya jangan diulang)
    try {
      const ref = localStorage.getItem("polsim_ref");
      if (ref) {
        localStorage.removeItem("polsim_ref");
        await supabase.rpc("redeem_referral", { p_code: ref });
      }
    } catch {}
    const [cs, wallet, subs, admin] = await Promise.all([
      supabase
        .from("campaign_state")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("user_wallets").select("token_balance").maybeSingle(),
      supabase
        .from("subscriptions")
        .select("expires_at")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .limit(1),
      supabase.from("admin_users").select("user_id").maybeSingle(),
    ]);
    const campaignRow = (cs.data as CampaignState | null) ?? null;
    setCampaign(campaignRow);
    setTokenBalance(wallet.data?.token_balance ?? null);
    setIsVip((subs.data?.length ?? 0) > 0);
    setIsAdmin(Boolean(admin.data));
    if (campaignRow) {
      const { data: pc } = await supabase
        .from("player_characters")
        .select("*")
        .eq("id", campaignRow.player_character_id)
        .maybeSingle();
      setCharacter((pc as PlayerCharacter | null) ?? null);
    } else {
      setCharacter(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await loadGameState(data.session?.user?.id);
  }, [loadGameState]);

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadGameState(data.session?.user?.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      await loadGameState(sess?.user?.id);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadGameState]);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, loading, character, campaign, tokenBalance, isVip, isAdmin, refresh, signOut }),
    [session, loading, character, campaign, tokenBalance, isVip, isAdmin, refresh, signOut]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}
