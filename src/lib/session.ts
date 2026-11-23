import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export type AppProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  address: string | null;
  village: string | null;
  district: string | null;
  state: string;
  pincode: string | null;
  language: string;
};

export function useSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<Session | null> => {
      if (!isSupabaseConfigured) return null;
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: ["session"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["my-farmer"] });
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return query;
}

export function useProfile() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AppProfile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data as AppProfile | null;
    },
  });
}

export function useMyFarmer() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["my-farmer", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("farmers").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIsAdmin() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).some((r) => r.role === "admin");
    },
  });
}
