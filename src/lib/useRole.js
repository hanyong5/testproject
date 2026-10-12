import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useRole(userId) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!userId || !supabase) return;
    let active = true;
    async function load() {
      try {
        const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
        if (active) setResult({ userId, role: error ? null : data?.role || "user", error: Boolean(error) });
      } catch {
        if (active) setResult({ userId, role: null, error: true });
      }
    }
    load();
    window.addEventListener("focus", load);
    return () => { active = false; window.removeEventListener("focus", load); };
  }, [userId]);
  if (!userId) return { role: null, loading: false, error: false };
  return result?.userId === userId ? { ...result, loading: false } : { role: null, loading: true, error: false };
}
