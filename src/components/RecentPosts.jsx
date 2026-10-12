import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Newspaper } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function RecentPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(false);
      try {
        if (!supabase) throw new Error("configuration");
        const { data, error: failure } = await supabase.from("board_posts")
          .select("id,category,title,created_at,image_paths")
          .order("created_at", { ascending: false }).order("id").limit(3);
        if (failure) throw failure;
        if (active) setPosts(data);
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [retry]);

  if (loading) return <p className="home-news" role="status">최근 소식을 불러오는 중…</p>;
  if (error) return <div className="home-news"><p role="alert">최근 소식을 불러오지 못했습니다.</p><button type="button" className="portal-text-link" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></div>;
  if (!posts.length) return <p className="home-news">아직 등록된 소식이 없습니다.</p>;

  return <div className="home-news-cards">{posts.map((post) => <NewsCard key={post.id} post={post} />)}</div>;
}

function NewsCard({ post }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = post.image_paths?.[0];
  return <article className="home-news-card">
    <Link to={`/board/${post.id}`} className="home-news-card-link">
      <div className="home-news-card-image">
        {image && !imageFailed ? <img src={supabase.storage.from("board-images").getPublicUrl(image).data.publicUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} /> : <div className="home-news-card-placeholder" aria-hidden="true"><Newspaper size={38} /><span>NEXIS NEWS</span></div>}
      </div>
      <div className="home-news-card-content">
        <span className="portal-badge">{post.category}</span>
        <h3>{post.title}</h3>
        <div className="home-news-card-footer"><time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</time><span>자세히 보기 <ArrowRight size={16} aria-hidden="true" /></span></div>
      </div>
    </Link>
  </article>;
}
