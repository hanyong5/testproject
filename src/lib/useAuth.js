import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useAuth() {
  const [auth, setAuth] = useState({ session: null, loading: Boolean(supabase) });

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth({ session, loading: false });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return auth;
}
