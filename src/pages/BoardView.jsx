import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BoardPostEditor from "../components/BoardPostEditor";
import { useAuth } from "../lib/useAuth";
import { useRole } from "../lib/useRole";
import PageHero from "../components/PageHero";
import { supabase } from "../lib/supabase";
import "./Board.css";

export default function BoardView() {
  const { id } = useParams();
  return <>
    <PageHero label="공지사항" eyebrow="NEWS & RESOURCES" title={<>NEXIS의 새로운 소식,<br />한곳에서 확인하세요.</>} description="공지사항부터 제품소식, 이용가이드까지 안내합니다." />
    <div className="nexis-container nexis-section">
      <PostView key={id} id={id} />
    </div>
  </>;
}

function PostView({ id }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const { session } = useAuth();
  const { role } = useRole(session?.user.id);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          if (active) setPost(null);
          return;
        }
        if (!supabase) throw new Error("configuration");
        const { data, error: failure } = await supabase.from("board_posts").select("id,category,title,content,created_at,image_paths").eq("id", id).maybeSingle();
        if (failure) throw failure;
        if (active) setPost(data);
      } catch {
        if (active) setError("게시글을 불러오지 못했습니다. 다시 시도해 주세요.");
      } finally { if (active) setLoading(false); }
    }
    window.scrollTo(0, 0);
    load();
    return () => { active = false; };
  }, [id, retry]);

  return <section className="board-view">
    <Link to="/board" className="board-back"><ArrowLeft size={17} aria-hidden="true" /> 공지사항 목록</Link>
    {loading ? <p className="board-empty" role="status">게시글을 불러오는 중…</p> : error ? <div className="board-empty"><p role="alert">{error}</p><button className="nexis-cta" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></div> : !post ? <div className="board-empty"><h1>게시글을 찾을 수 없습니다.</h1><p>주소가 올바른지 확인하거나 목록에서 다른 글을 선택해 주세요.</p></div> : <article>
      <header className="board-view-header">
        <span className="portal-badge">{post.category}</span>
        <h1>{post.title}</h1>
        <p className="board-date">NEXIS 관리자 · <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</time></p>
      </header>
      {post.image_paths?.length > 0 && <div className="board-view-images" aria-label="게시글 첨부 이미지">{post.image_paths.map((path, index) => <BoardImage key={path} path={path} title={post.title} index={index} />)}</div>}
      <div className="board-view-content board-body">{post.content}</div>
      {notice && <p role="status">{notice}</p>}
      {role === "admin" && (editing ? <BoardPostEditor key={post.id} userId={session.user.id} post={post} onCancel={() => setEditing(false)} onSaved={(updated, message) => { setPost(updated); setEditing(false); setNotice(message); }} /> : <button type="button" className="nexis-cta" onClick={() => setEditing(true)}>게시글 / 이미지 수정</button>)}
      <footer className="board-view-footer"><Link to="/board" className="nexis-cta"><ArrowLeft size={17} aria-hidden="true" /> 목록으로</Link></footer>
    </article>}
  </section>;
}

function BoardImage({ path, title, index }) {
  const [failed, setFailed] = useState(false);
  const url = supabase.storage.from("board-images").getPublicUrl(path).data.publicUrl;
  return <figure className="board-attachment">{failed ? <p role="status">이미지를 불러오지 못했습니다.</p> : <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`첨부 이미지 ${index + 1} 원본 보기 (새 창)`}><img src={url} alt={`${title} 첨부 이미지 ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} onError={() => setFailed(true)} /></a>}<figcaption>첨부 이미지 {index + 1} · 클릭하면 원본을 볼 수 있습니다.</figcaption></figure>;
}
