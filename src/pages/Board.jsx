import { useEffect, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import BoardPostEditor from "../components/BoardPostEditor";
import PageHero from "../components/PageHero";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import { useRole } from "../lib/useRole";
import "./Board.css";

const categories = ["공지", "제품소식", "이용가이드"];
const pageSize = 20;

export default function Board() {
  const { session } = useAuth();
  const { role } = useRole(session?.user.id);
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [posts, setPosts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [writing, setWriting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        if (!supabase) throw new Error("configuration");
        let request = supabase.from("board_posts").select("id,category,title,created_at,image_paths", { count: "exact" }).order("created_at", { ascending: false }).order("id").range(page * pageSize, (page + 1) * pageSize - 1);
        if (category !== "전체") request = request.eq("category", category);
        if (search) request = request.ilike("title", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
        const result = await request;
        if (result.error) throw result.error;
        if (active) { setPosts(result.data); setCount(result.count || 0); }
      } catch { if (active) setError("게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [category, search, page, revision]);

  return <>
    <PageHero label="공지사항" eyebrow="NEWS & RESOURCES" title={<>NEXIS의 새로운 소식,<br />한곳에서 확인하세요.</>} description="공지사항부터 제품소식, 이용가이드까지 안내합니다." />
    <section className="nexis-container nexis-section board-section">
      <div className="section-heading"><div><p className="nexis-eyebrow">NEXIS NOTICE BOARD</p><h2>공지사항</h2></div>{role === "admin" && <button type="button" className="nexis-cta" aria-expanded={writing} onClick={() => setWriting((value) => !value)}>{writing ? "작성 닫기" : "글 등록"}</button>}</div>
      {role === "admin" && writing && <BoardPostEditor key={session.user.id} userId={session.user.id} onSaved={() => { setWriting(false); setNotice("게시글을 등록했습니다."); setCategory("전체"); setSearch(""); setQuery(""); setPage(0); setRevision((value) => value + 1); }} />}
      {notice && <p className="board-count" role="status">{notice}</p>}
      <div className="board-toolbar"><div className="nexis-filters">{["전체", ...categories].map((name) => <button type="button" key={name} aria-pressed={category === name} onClick={() => { setCategory(name); setPage(0); }}>{name}</button>)}</div><form className="board-search" onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); setPage(0); }}><label className="sr-only" htmlFor="board-search">게시글 제목 검색</label><input id="board-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목 검색" maxLength={150} /><button type="submit" aria-label="검색"><Search size={18} aria-hidden="true" /></button></form></div>
      {loading ? <p role="status" className="board-empty">게시글을 불러오는 중…</p> : error ? <div className="board-empty"><p role="alert">{error}</p><button className="nexis-cta" onClick={() => setRevision((value) => value + 1)}>다시 시도</button></div> : <>
        <p className="board-count" role="status">총 <strong>{count}</strong>개의 게시글</p>
        <div className="board-list">{posts.map((post) => <Link key={post.id} to={`/board/${post.id}`} className="board-post board-row">{post.image_paths?.[0] && <span className="board-thumbnail-frame"><img className="board-row-thumbnail" src={supabase.storage.from("board-images").getPublicUrl(post.image_paths[0]).data.publicUrl} alt={`${post.title} 첫 번째 첨부 이미지`} width={80} height={80} loading="lazy" decoding="async" /></span>}<span className="portal-badge">{post.category}</span><span className="board-row-title">{post.title}{post.image_paths?.length > 0 && <span className="board-image-count">이미지 {post.image_paths.length}개</span>}</span><time className="board-row-date" dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</time><ChevronRight size={18} aria-hidden="true" /></Link>)}{posts.length === 0 && <div className="board-empty"><h3>{search ? "검색 결과가 없습니다." : "등록된 게시글이 없습니다."}</h3><p>새로운 소식이 등록되면 이곳에서 확인할 수 있습니다.</p></div>}</div>
        {count > pageSize && <nav className="board-pagination" aria-label="게시글 페이지"><button disabled={page === 0} onClick={() => setPage((value) => value - 1)}>이전</button><span>{page + 1} / {Math.ceil(count / pageSize)}</span><button disabled={(page + 1) * pageSize >= count} onClick={() => setPage((value) => value + 1)}>다음</button></nav>}
      </>}
    </section>
  </>;
}

