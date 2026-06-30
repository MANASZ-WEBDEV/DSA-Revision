import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";
const THEME_KEY = "dsa_theme_override"; // absence = follow system

export function useTheme() {
  const getSystemTheme = (): Theme =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    return stored ?? getSystemTheme();
  });

  const [isOverridden, setIsOverridden] = useState<boolean>(() =>
    localStorage.getItem(THEME_KEY) !== null
  );

  // Apply to <html data-theme="...">
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Follow system changes unless user has manually overridden
  useEffect(() => {
    if (isOverridden) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setThemeState(getSystemTheme());
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [isOverridden]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    setIsOverridden(true);
    setThemeState(next);
  }, [theme]);

  const resetToSystem = useCallback(() => {
    localStorage.removeItem(THEME_KEY);
    setIsOverridden(false);
    setThemeState(getSystemTheme());
  }, []);

  return { theme, toggleTheme, resetToSystem, isOverridden };
}
