import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { saveTheme } from "../lib/theme";

function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  const isDark = theme === "dark";

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";
    saveTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="다크 테마"
      aria-pressed={isDark}
      title={isDark ? "라이트 테마로 전환" : "다크 테마로 전환"}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {isDark ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
      {isDark ? "다크" : "라이트"}
    </button>
  );
}

export default ThemeToggle;
