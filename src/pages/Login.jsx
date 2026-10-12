import { useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Layers, LockKeyhole } from "lucide-react";
import "./Login.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const { session, loading } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current || loading) return;
    setMessage("");
    if (!supabase) {
      setMessage("로그인 서비스 설정을 확인 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const form = event.currentTarget;
    const values = new FormData(form);
    submitting.current = true;
    setPending(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.get("email").trim(),
        password: values.get("password"),
      });
      if (error) {
        const messages = {
          invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
          email_not_confirmed: "이메일 인증이 필요합니다. 가입 시 받은 인증 메일의 링크를 눌러 주세요.",
          over_request_rate_limit: "로그인 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
          user_banned: "현재 이용이 제한된 계정입니다. 관리자에게 문의해 주세요.",
        };
        setMessage(messages[error.code] || "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        form.elements.password.value = "";
        form.elements.password.focus();
      } else {
        form.reset();
      }
    } catch {
      setMessage("서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도해 주세요.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (session) return <Navigate to="/profile" replace />;

  return (
    <section className="login-page" aria-labelledby="login-title">
      <div className="login-shell">
        <aside className="login-story">
          <div className="login-brand"><Layers size={24} aria-hidden="true" /> NEXIS</div>
          <div>
            <p className="login-kicker">YOUR NEXT CONNECTION</p>
            <h2>가능성의 시작,<br />하나의 연결에서.</h2>
            <p className="login-story-copy">클라우드부터 데이터, 보안까지.<br />비즈니스의 다음 여정을 넥시스와 함께하세요.</p>
            <div className="login-orbit" aria-hidden="true"><div><Layers size={42} /></div><span>CLOUD</span><span>DATA</span><span>SECURITY</span></div>
          </div>
          <p className="login-story-foot">CONNECTED TECHNOLOGY. CLEAR POSSIBILITIES.</p>
        </aside>
        <div className="login-content">
          <Link to="/" className="login-back"><ArrowLeft size={16} aria-hidden="true" />홈으로 돌아가기</Link>
          <div className="login-form-wrap">
            <div className="login-symbol"><LockKeyhole size={24} aria-hidden="true" /></div>
            <p className="login-kicker portal-blue">WELCOME BACK</p>
            <h1 id="login-title">로그인</h1>
            <p className="login-intro">NEXIS 계정으로 시작하세요.</p>
            <form onSubmit={handleSubmit} className="login-form" aria-busy={pending || loading}>
              <div>
                <label htmlFor="login-email">이메일</label>
                <input id="login-email" name="email" type="email" autoComplete="username" placeholder="name@company.com" required maxLength={254} readOnly={pending} />
              </div>
              <div>
                <label htmlFor="login-password">비밀번호</label>
                <div className="login-password">
                  <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="비밀번호를 입력하세요" required readOnly={pending} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} aria-pressed={showPassword} aria-controls="login-password">
                    {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <button className="login-submit" type="submit" disabled={pending || loading}>{loading ? "로그인 상태 확인 중…" : pending ? "로그인 중…" : "로그인"} <ArrowRight size={18} aria-hidden="true" /></button>
              {message && <p className="login-notice signup-error" role="alert">{message}</p>}
            </form>
            <p className="signup-switch">아직 계정이 없으신가요? <Link to="/signup">회원가입</Link></p>
          </div>
          <p className="login-bottom">기술과 비즈니스를 연결하는 NEXIS</p>
        </div>
      </div>
    </section>
  );
}
