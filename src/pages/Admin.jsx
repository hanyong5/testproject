import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";

export default function Admin() {
  const { session, loading } = useAuth();
  if (loading) return <p role="status">계정 확인 중…</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <AdminOverview key={session.user.id} />;
}

function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await supabase.rpc("admin_overview");
        if (!active) return;
        if (result.error) {
          setError(result.error.code === "42501" ? "관리자만 접근할 수 있는 페이지입니다." : "관리자 정보를 불러오지 못했습니다. 새로고침해 주세요.");
        } else setData(result.data);
      } catch { if (active) setError("서버에 연결할 수 없습니다. 새로고침해 주세요."); }
    }
    load();
    return () => { active = false; };
  }, []);
  return <section className="space-y-6">
    <p className="text-xs font-bold tracking-widest text-blue-700 dark:text-blue-300">NEXIS ADMIN</p>
    <h1 className="text-3xl font-bold">관리자 대시보드</h1>
    {error ? <p role="alert" className="rounded-xl border border-border p-6">{error}</p> : !data ? <p role="status">관리자 권한 확인 중…</p> : <>
      <p className="text-muted-foreground">회원 현황을 확인할 수 있습니다.</p>
      <div className="grid gap-4 sm:grid-cols-3">{[["전체 회원", data.members], ["프로필 작성 회원", data.profiles], ["관리자", data.admins]].map(([label, count]) => <div key={label} className="rounded-2xl border border-border bg-card p-6"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-bold">{count}명</p></div>)}</div>
    </>}
    <Link to="/profile" className="inline-block text-blue-700 underline dark:text-blue-300">나의 회원정보로 이동</Link>
  </section>;
}
