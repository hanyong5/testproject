import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Layers, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Login.css";

const errors = {
  user_already_exists: "이미 가입된 계정입니다. 로그인 페이지를 이용해 주세요.",
  weak_password: "비밀번호가 보안 기준을 충족하지 않습니다. 더 길고 다양한 문자를 사용해 주세요.",
  email_address_invalid: "올바른 이메일 주소를 입력해 주세요.",
  email_address_not_authorized: "현재 이 이메일 주소로 가입할 수 없습니다. 관리자에게 문의해 주세요.",
  signup_disabled: "현재 신규 회원가입이 중단되어 있습니다.",
  over_email_send_rate_limit: "이메일 발송 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  over_request_rate_limit: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
};

export default function Signup() {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const submitting = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = values.get("password");
    setError("");
    if (password !== values.get("confirmPassword")) {
      setError("비밀번호가 일치하지 않습니다. 다시 확인해 주세요.");
      form.elements.confirmPassword.focus();
      return;
    }
    if (!supabase) {
      setError("회원가입 서비스 설정을 확인 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: values.get("email").trim(),
        password,
      });
      if (authError) {
        setError(errors[authError.code] || "회원가입을 완료하지 못했습니다. 네트워크를 확인하고 잠시 후 다시 시도해 주세요.");
        return;
      }
      form.reset();
      setSuccess(data.session
        ? "회원가입이 완료되었습니다. NEXIS에 오신 것을 환영합니다."
        : "가입 요청을 접수했습니다. 이메일로 인증 안내가 도착하면 링크를 눌러 가입을 완료해 주세요. 메일이 보이지 않으면 스팸함을 확인해 주세요. 이미 가입한 이메일이라면 로그인 페이지를 이용해 주세요.");
    } catch {
      setError("서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도해 주세요.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="login-page" aria-labelledby="signup-title">
      <div className="login-shell">
        <aside className="login-story">
          <div className="login-brand"><Layers size={24} aria-hidden="true" /> NEXIS</div>
          <div>
            <p className="login-kicker">YOUR NEXT CONNECTION</p>
            <h2>새로운 가능성에,<br />한 걸음 더 가까이.</h2>
            <p className="login-story-copy">기술과 비즈니스가 만나는 곳.<br />NEXIS와 함께 다음 여정을 시작하세요.</p>
            <div className="login-orbit" aria-hidden="true"><div><Layers size={42} /></div><span>CLOUD</span><span>DATA</span><span>SECURITY</span></div>
          </div>
          <p className="login-story-foot">CONNECTED TECHNOLOGY. CLEAR POSSIBILITIES.</p>
        </aside>
        <div className="login-content">
          <Link to="/" className="login-back"><ArrowLeft size={16} aria-hidden="true" />홈으로 돌아가기</Link>
          <div className="login-form-wrap">
            <div className="login-symbol"><UserPlus size={24} aria-hidden="true" /></div>
            <p className="login-kicker portal-blue">START YOUR JOURNEY</p>
            <h1 id="signup-title">회원가입</h1>
            <p className="login-intro">이메일로 NEXIS 계정을 만들어 보세요.</p>
            {success ? (
              <div className="signup-result" role="status">
                <CheckCircle2 size={32} aria-hidden="true" />
                <h2>다음 여정을 위한 첫걸음</h2>
                <p>{success}</p>
                <Link to="/" className="login-submit">홈으로 이동 <ArrowRight size={18} aria-hidden="true" /></Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="login-form" aria-busy={pending}>
                <div>
                  <label htmlFor="signup-email">이메일</label>
                  <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="name@company.com" required maxLength={254} disabled={pending} />
                </div>
                <div>
                  <label htmlFor="signup-password">비밀번호</label>
                  <div className="login-password">
                    <input id="signup-password" name="password" type={visible ? "text" : "password"} autoComplete="new-password" placeholder="8자 이상 입력하세요" minLength={8} maxLength={128} required disabled={pending} aria-describedby="password-help" />
                    <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"} aria-pressed={visible} aria-controls="signup-password signup-confirm">
                      {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                    </button>
                  </div>
                  <p id="password-help" className="signup-help">8자 이상, 영문·숫자·기호 조합을 권장합니다.</p>
                </div>
                <div>
                  <label htmlFor="signup-confirm">비밀번호 확인</label>
                  <input id="signup-confirm" name="confirmPassword" type={visible ? "text" : "password"} autoComplete="new-password" placeholder="비밀번호를 한 번 더 입력하세요" required minLength={8} maxLength={128} disabled={pending} />
                </div>
                {error && <p className="login-notice signup-error" role="alert">{error}</p>}
                <button className="login-submit" type="submit" disabled={pending}>{pending ? "가입 처리 중…" : "계정 만들기"}<ArrowRight size={18} aria-hidden="true" /></button>
                <p className="signup-help">가입 후 이메일 인증이 필요할 수 있습니다.</p>
              </form>
            )}
            <p className="signup-switch">이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
          </div>
          <p className="login-bottom">기술과 비즈니스를 연결하는 NEXIS</p>
        </div>
      </div>
    </section>
  );
}
