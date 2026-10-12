import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../lib/useAuth";
import { useRole } from "../lib/useRole";
import { supabase } from "../lib/supabase";

const menus = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/product", label: "Product" },
  { to: "/board", label: "Board" },
  { to: "/map", label: "Map" },
];

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const { session, loading } = useAuth();
  const { role } = useRole(session?.user.id);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");
  const logoutPending = useRef(false);

  async function handleLogout() {
    if (logoutPending.current || !supabase) return;
    logoutPending.current = true;
    setSigningOut(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      closeMenu();
    } catch {
      setAuthError("로그아웃하지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.");
    } finally {
      logoutPending.current = false;
      setSigningOut(false);
    }
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && isMenuOpen) {
      closeMenu();
      menuButtonRef.current?.focus();
    }
  }

  return (
    <header className="border-b border-border bg-card" onKeyDown={handleKeyDown}>
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link to="/" onClick={closeMenu} className="text-xl font-bold text-blue-700 dark:text-blue-300">NEXIS <span className="text-[9px] font-normal tracking-widest text-muted-foreground">ENTERPRISE TECH</span></Link>
        <nav
          id="main-navigation"
          aria-label="메인 메뉴"
          className={`${isMenuOpen ? "flex" : "hidden"} order-last w-full flex-col gap-2 border-t border-border pt-4 md:order-none md:flex md:w-auto md:flex-row md:border-0 md:pt-0`}
        >
          {menus.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to !== "/board"}
              onClick={closeMenu}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "text-muted-foreground hover:bg-muted"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {loading ? <span className="text-xs text-muted-foreground" role="status">계정 확인 중…</span> : session ? (
            <>
              {role === "admin" && <NavLink to="/admin" onClick={closeMenu} className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300">관리자</NavLink>}
              <NavLink to="/profile" onClick={closeMenu} className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">회원정보</NavLink>
              <button type="button" onClick={handleLogout} disabled={signingOut} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{signingOut ? "로그아웃 중…" : "로그아웃"}</button>
            </>
          ) : <>
          <NavLink to="/signup" onClick={closeMenu} className={({ isActive }) => `rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${isActive ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "border-border text-foreground hover:bg-muted"}`}>회원가입</NavLink>
          <NavLink to="/login" onClick={closeMenu} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">로그인</NavLink>
          </>}
          <ThemeToggle />
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:hidden"
          >
            {isMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
        {authError && <p role="alert" className="w-full text-sm text-destructive">{authError}</p>}
      </div>
    </header>
  )
}

export default Header
