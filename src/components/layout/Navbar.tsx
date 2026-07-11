import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { ProviderIcon } from "./ProviderIcon";
import { s } from "./layoutStyles";
import { useViewTransitionNavigate } from "../../hooks/useViewTransitionNavigate";
import type { FlashCard } from "../../types";

interface NavbarProps {
  cards: FlashCard[];
  dueCount: number;
  provider: { id: string; logo: string; name: string };
  keySet: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  user: any;
  signOut: () => void;
  syncStatus: "synced" | "syncing" | "offline" | "local";
  lastSyncedAt: Date | null;
  setShowSettings: (show: boolean) => void;
  setShowLogin: (show: boolean) => void;
}

const NavIcon = ({ d }: { d: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: <NavIcon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" /> },
  { path: "/library", label: "Library", icon: <NavIcon d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" /> },
  { path: "/generate", label: "Generate", icon: <NavIcon d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" /> },
];

export function Navbar({
  cards,
  dueCount,
  provider,
  keySet,
  theme,
  toggleTheme,
  user,
  signOut,
  syncStatus,
  lastSyncedAt,
  setShowSettings,
  setShowLogin
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const goTo = useViewTransitionNavigate();
  const location = useLocation();

  function handleNavClick(e: React.MouseEvent, path: string) {
    e.preventDefault();
    setMobileMenuOpen(false);
    // Skip transition if already on the target page
    if (location.pathname === path) return;
    goTo(path);
  }

  return (
    <nav className="nav" style={{ viewTransitionName: "nav-bar" as any }}>
      <NavLink
        to="/"
        className="logo-wrap"
        style={s.logo}
        onClick={(e) => handleNavClick(e, "/")}
      >
        <span className="logo-bracket logo-bracket-left font-mono" style={{ color: "var(--accent)", marginRight: 4 }}>{"{"}</span>
        <span>DSA Recall</span>
        <span className="logo-bracket logo-bracket-right font-mono" style={{ color: "var(--accent)", marginLeft: 4 }}>{"}"}</span>
      </NavLink>

      {/* Hamburger (mobile only) */}
      <button
        className="hamburger"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? "✕" : "☰"}
      </button>

      <div className={`nav-links${mobileMenuOpen ? " open" : ""}`} style={s.navLinks}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={(e) => handleNavClick(e, item.path)}
            style={({ isActive }) => ({
              ...s.navBtn,
              ...(isActive ? s.navActive : {}),
            })}
          >
            {item.icon}
            {item.label}
            {item.path === "/library" && dueCount > 0 && (
              <span className="pulse" style={s.pill}>{dueCount}</span>
            )}
          </NavLink>
        ))}

        {/* LLM settings badge next to Generate */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            ...s.navProviderBtn,
            ...(keySet ? {} : { borderColor: "var(--medium)", background: "var(--medium-soft)" }),
          }}
          className="btn-press"
          title="LLM Generation Settings"
        >
          <ProviderIcon id={provider.id} />
          <span style={{ fontSize: 12 }}>
            {keySet ? (provider.id === "anthropic" ? "Claude" : provider.id === "gemini" ? "Gemini" : "Groq") : "AI Setup"}
          </span>
          {keySet ? (
            <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>✓</span>
          ) : (
            <span style={{ fontSize: 10, color: "var(--medium)", fontWeight: 600 }}>Setup</span>
          )}
        </button>

        {cards.length > 0 && (
          <NavLink
            to="/review"
            onClick={(e) => handleNavClick(e, "/review")}
            style={({ isActive }) => ({
              ...s.navBtn,
              ...(isActive ? s.navActive : {}),
              color: dueCount > 0 ? "var(--urgent)" : "var(--ink-soft)",
              fontWeight: 600,
            })}
          >
            Review {dueCount > 0 ? `(${dueCount})` : ""}
          </NavLink>
        )}
      </div>

      {/* Subtle divider between nav and controls */}
      <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />

        <UserMenu
          user={user}
          signOut={signOut}
          syncStatus={syncStatus}
          lastSyncedAt={lastSyncedAt}
          setShowLogin={setShowLogin}
        />
      </div>
    </nav>
  );
}
