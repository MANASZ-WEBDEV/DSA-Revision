import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Library } from "./components/library/Library";
import { GenerateCard } from "./components/generate/GenerateCard";
import { CardDetail } from "./components/cards/CardDetail";
import { ReviewSession } from "./components/review/ReviewSession";
import { ApiKeyModal } from "./components/settings/ApiKeyModal";
import { StarterPacks } from "./components/library/StarterPacks";
import { ThemeToggle } from "./components/layout/ThemeToggle";
import { LandingPage } from "./components/landing/LandingPage";
import { Onboarding } from "./components/landing/Onboarding";
import { ReviewHistory } from "./components/dashboard/ReviewHistory";
import { PrivacyPage } from "./components/landing/PrivacyPage";
import { AboutPage } from "./components/landing/AboutPage";
import { ContactPage } from "./components/landing/ContactPage";
import { SupportPage } from "./components/landing/SupportPage";
import { HowToUsePage } from "./components/landing/HowToUsePage";
import { FeedbackPage } from "./components/landing/FeedbackPage";
import { NotFoundPage } from "./components/layout/NotFoundPage";
import { Analytics } from "@vercel/analytics/react";
import { useCardStore, useProviderStore, useReviewHistory, useSessionHistory } from "./hooks/useStore";
import { useTheme } from "./hooks/useTheme";
import { formatRelativeTime } from "./lib/sm2";
import { getDueCards } from "./lib/sm2";
import { PROVIDERS } from "./lib/llm";
import type { FlashCard } from "./types";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LoginModal } from "./components/settings/LoginModal";
import { Storage } from "./lib/storage";


function AppContent() {
  const { cards, setCards, addCard, updateCard, deleteCard, importCards } = useCardStore();
  const { providerId, model, currentKey, keys, setProvider, setModel, setKey } = useProviderStore();
  const { events, setEvents, streak, setStreak, recordReview } = useReviewHistory();
  const { sessionHistory, setSessionHistory, recordSession } = useSessionHistory();
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();
  const isPrivacyPage = location.pathname === "/privacy";
  const isGeneratePage = location.pathname === "/generate";
  const isAboutPage = location.pathname === "/about";
  const isContactPage = location.pathname === "/contact";
  const isSupportPage = location.pathname === "/support";
  const isHowToUsePage = location.pathname === "/how-to-use";
  const isFeedbackPage = location.pathname === "/feedback";
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const knownPaths = ["/", "/welcome", "/onboarding", "/library", "/review", "/history", "/starter-packs"];
  const isKnownPath = knownPaths.includes(location.pathname);
  const cardIdMatch = location.pathname.match(/^\/card\/([^/]+)$/);
  const cardExists = cardIdMatch ? !!cards.find((c) => c.id === cardIdMatch[1]) : true;
  const is404 = !isKnownPath && (!cardIdMatch || !cardExists);

  const shouldLockViewport = (isPrivacyPage || isGeneratePage || isAboutPage || isContactPage || isSupportPage || isHowToUsePage || isFeedbackPage || is404) && !isMobile;
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline" | "local">("local");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (syncStatus !== "synced" || !lastSyncedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [syncStatus, lastSyncedAt]);

  const { session, user, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      setSyncStatus("local");
      return;
    }

    const userId = user.id;
    let isSubscribed = true;

    async function runSync() {
      if (!isSubscribed) return;
      setSyncStatus("syncing");

      // 1. Run migration first
      const migrated = await Storage.migrateLocalToSupabase(userId);
      if (!migrated && isSubscribed) {
        setSyncStatus("offline");
        return;
      }

      // 2. Sync with remote
      const res = await Storage.syncWithSupabase(userId);
      if (!isSubscribed) return;

      if (res.success) {
        setSyncStatus("synced");
        setLastSyncedAt(new Date());
        if (res.cards) {
          // Re-load state from storage (clears dirty flags & reconciles history/streaks)
          setCards(Storage.getCards());
          setEvents(Storage.getReviewHistory());
          setSessionHistory(Storage.getSessionHistory());
          setStreak(Storage.getStreak());
        }
      } else {
        setSyncStatus("offline");
      }
    }

    runSync();

    const interval = setInterval(runSync, 60000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user]);

  const hasOnboarded = localStorage.getItem("dsa_onboarded_v1") === "true";
  const showLanding = cards.length === 0 && !hasOnboarded;

  const dueCount = getDueCards(cards).length;
  const provider = PROVIDERS.find((p) => p.id === providerId)!;
  const keySet = !!currentKey;

  function handleCardCreated(card: FlashCard) {
    addCard(card);
    navigate(`/card/${card.id}`);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div style={{
      height: shouldLockViewport ? "100vh" : undefined,
      minHeight: shouldLockViewport ? undefined : "100vh",
      overflow: shouldLockViewport ? "hidden" : undefined,
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* ─── Glassmorphism Navigation ──────────────────────────────────── */}
      <nav className="nav">
        <NavLink
          to="/"
          className="logo-wrap"
          style={s.logo}
          onClick={closeMobileMenu}
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
              onClick={closeMobileMenu}
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
            <span>{provider.logo}</span>
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
              onClick={closeMobileMenu}
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

          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={s.avatarBtn}
                className="btn-press"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" style={s.avatarImg} />
                ) : (
                  <div style={s.avatarInitials}>
                    {user.email ? user.email.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </button>

              {menuOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 98, background: "transparent" }}
                    onClick={() => setMenuOpen(false)}
                  />
                  <div style={{ ...s.dropdownMenu, zIndex: 99 }}>
                    <div style={s.dropdownHeader}>
                      <div style={s.dropdownEmail}>{user.email}</div>
                      <div
                        style={{
                          ...s.dropdownSync,
                          color: syncStatus === "synced" ? "var(--easy)" : syncStatus === "syncing" ? "var(--medium)" : syncStatus === "offline" ? "var(--hard)" : "var(--caption)",
                          cursor: lastSyncedAt ? "help" : "default"
                        }}
                        title={lastSyncedAt ? `Last synced at ${lastSyncedAt.toLocaleTimeString()}` : undefined}
                      >
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: syncStatus === "synced" ? "var(--easy)" : syncStatus === "syncing" ? "var(--medium)" : syncStatus === "offline" ? "var(--hard)" : "var(--caption)",
                          display: "inline-block",
                          marginRight: 6
                        }} />
                        <span style={{ fontSize: 10, textTransform: "capitalize" }}>
                          {syncStatus === "synced" && lastSyncedAt
                            ? `Synced ${formatRelativeTime(lastSyncedAt)}`
                            : syncStatus === "synced" ? "Synced" : syncStatus === "syncing" ? "Syncing..." : syncStatus === "offline" ? "Offline" : "Local mode"}
                        </span>
                      </div>
                    </div>



                    <button
                      onClick={() => { setMenuOpen(false); signOut(); }}
                      style={{ ...s.dropdownItem, color: "var(--hard)", fontWeight: 500 }}
                      className="dropdown-item"
                    >
                      <span style={{ marginRight: 8, fontSize: 14 }}>🚪</span>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              style={{ ...s.providerBtn, background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
              className="btn-press"
            >
              ☁️ Sync
            </button>
          )}
        </div>
      </nav>

      {/* ─── Routes ────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minHeight: shouldLockViewport ? "0" : undefined }}>
        <Routes>
          <Route
            path="/"
            element={
              showLanding ? (
                <LandingPage onStart={() => navigate("/onboarding")} />
              ) : (
                <Dashboard
                  cards={cards}
                  events={events}
                  streak={streak}
                  sessionHistory={sessionHistory}
                  syncStatus={syncStatus}
                  lastSyncedAt={lastSyncedAt}
                  onSignInClick={() => setShowLogin(true)}
                  onStartReview={() => navigate("/review")}
                  onGenerate={() => navigate("/generate")}
                  onGoLibrary={(pattern) => navigate(pattern ? `/library?pattern=${encodeURIComponent(pattern)}` : "/library")}
                  onGoStarterPacks={() => navigate("/starter-packs")}
                  onGoHistory={() => navigate("/history")}
                />
              )
            }
          />
          <Route
            path="/welcome"
            element={<LandingPage onStart={() => navigate("/onboarding")} />}
          />
          <Route
            path="/onboarding"
            element={
              <Onboarding
                onComplete={() => {
                  localStorage.setItem("dsa_onboarded_v1", "true");
                  navigate("/");
                }}
              />
            }
          />
          <Route
            path="/library"
            element={
              <Library
                cards={cards}
                onSelectCard={(id) => navigate(`/card/${id}`)}
                onStartReview={() => navigate("/review")}
                onGenerate={() => navigate("/generate")}
                onGoStarterPacks={() => navigate("/starter-packs")}
              />
            }
          />
          <Route
            path="/generate"
            element={
              <GenerateCard
                cards={cards}
                providerId={providerId}
                model={model}
                apiKey={currentKey}
                onCardCreated={handleCardCreated}
                onNeedApiKey={() => setShowSettings(true)}
              />
            }
          />
          <Route
            path="/card/:id"
            element={
              <CardDetailRoute
                cards={cards}
                onUpdate={updateCard}
                onDelete={(id) => { deleteCard(id, user?.id); navigate("/library"); }}
              />
            }
          />
          <Route
            path="/review"
            element={
              <ReviewSession
                cards={cards}
                onUpdate={updateCard}
                onRecordReview={recordReview}
                onRecordSession={recordSession}
                onDone={() => navigate("/")}
              />
            }
          />
          <Route
            path="/history"
            element={
              <ReviewHistory
                sessionHistory={sessionHistory}
                onBack={() => navigate("/")}
              />
            }
          />
          <Route
            path="/starter-packs"
            element={
              <StarterPacks
                existingCards={cards}
                onImportDeck={importCards}
                onGoLibrary={() => navigate("/library")}
              />
            }
          />
          <Route
            path="/privacy"
            element={<PrivacyPage />}
          />
          <Route
            path="/about"
            element={<AboutPage />}
          />
          <Route
            path="/contact"
            element={<ContactPage />}
          />
          <Route
            path="/support"
            element={<SupportPage />}
          />
          <Route
            path="/how-to-use"
            element={<HowToUsePage />}
          />
          <Route
            path="/feedback"
            element={<FeedbackPage />}
          />
          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Routes>
      </main>

      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span>© {new Date().getFullYear()} DSA Recall</span>
          <div className="footer-links-grid" style={s.footerLinks}>
            <Link to="/how-to-use" style={s.footerLink}>How to Use</Link>
            <Link to="/about" style={s.footerLink}>About</Link>
            <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
            <Link to="/contact" style={s.footerLink}>Contact</Link>
            <Link to="/support" style={s.footerLink}>Support</Link>
            <Link to="/feedback" style={s.footerLink}>Feedback</Link>
            <a href="https://github.com/MANASZ-WEBDEV/DSA-Revision" target="_blank" rel="noreferrer" style={s.footerLink}>GitHub</a>
          </div>
        </div>
      </footer>

      {/* ─── Settings Modal ────────────────────────────────────────────── */}
      {showSettings && (
        <ApiKeyModal
          providerId={providerId}
          model={model}
          keys={keys}
          onSetProvider={setProvider}
          onSetModel={setModel}
          onSetKey={setKey}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ─── Login Modal ───────────────────────────────────────────────── */}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} />
      )}

      {/* ─── Vercel Web Analytics ─────────────────────────────────────── */}
      <Analytics />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// ─── Route wrapper for CardDetail (extracts :id param) ──────────────────────
function CardDetailRoute({
  cards,
  onUpdate,
  onDelete,
}: {
  cards: FlashCard[];
  onUpdate: (id: string, updates: Partial<FlashCard>) => boolean;
  onDelete: (id: string) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const card = cards.find((c) => c.id === id);

  if (!card) {
    return <NotFoundPage />;
  }

  return <CardDetail card={card} onBack={() => navigate("/library")} onUpdate={onUpdate} onDelete={onDelete} />;
}

// ─── Navigation icons (inline SVGs for cross-platform consistency) ───────────
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  logo: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--ink)", cursor: "pointer", marginRight: 10, letterSpacing: "-0.01em", display: "flex", alignItems: "center", textDecoration: "none" },
  navLinks: { display: "flex", gap: 2, flex: 1 },
  navBtn: { background: "none", border: "none", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", transition: "background 0.15s ease, color 0.15s ease" },
  navActive: { background: "var(--bg-sunken)", color: "var(--ink)", fontWeight: 500 },
  pill: { background: "var(--urgent)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 },
  providerBtn: { display: "flex", alignItems: "center", gap: 5, background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "5px 10px", cursor: "pointer", fontSize: 13, color: "var(--ink-soft)", transition: "border-color 0.15s ease" },
  primaryBtn: { padding: "10px 22px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  avatarBtn: {
    background: "none",
    padding: 0,
    cursor: "pointer",
    width: 32,
    height: 32,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid var(--border-strong)",
    transition: "border-color 0.15s ease",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitials: {
    width: "100%",
    height: "100%",
    background: "var(--accent-soft)",
    color: "var(--accent-ink)",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 220,
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-lg)",
    padding: "6px 0",
    display: "flex",
    flexDirection: "column",
    animation: "fadeIn 0.15s ease both",
  },
  dropdownHeader: {
    padding: "8px 12px",
  },
  dropdownEmail: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink)",
    wordBreak: "break-all",
  },
  dropdownSync: {
    fontSize: 11,
    color: "var(--caption)",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
  },
  dropdownDivider: {
    height: 1,
    background: "var(--border)",
    margin: "4px 0",
  },
  dropdownItem: {
    width: "100%",
    padding: "8px 12px",
    background: "none",
    border: "none",
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    color: "var(--ink-soft)",
    cursor: "pointer",
    transition: "background 0.1s ease",
    textAlign: "left",
  },
  navProviderBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: 11,
    color: "var(--ink-soft)",
    transition: "border-color 0.15s ease",
    alignSelf: "center",
    height: 28,
  },
  footer: {
    borderTop: "1px solid var(--border)",
    background: "var(--bg-raised)",
    padding: "20px 0",
    marginTop: "auto",
  },
  footerInner: {
    maxWidth: 880,
    margin: "0 auto",
    padding: "0 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "var(--caption)",
    flexWrap: "wrap",
    gap: 12,
  },
  footerLinks: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  footerLink: {
    color: "var(--caption)",
    textDecoration: "underline",
    cursor: "pointer",
    transition: "color 0.15s ease",
  },
};
