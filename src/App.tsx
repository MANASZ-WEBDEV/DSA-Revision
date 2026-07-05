import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate, useParams } from "react-router-dom";
import { Dashboard }      from "./components/dashboard/Dashboard";
import { Library }        from "./components/library/Library";
import { GenerateCard }   from "./components/generate/GenerateCard";
import { CardDetail }     from "./components/cards/CardDetail";
import { ReviewSession }  from "./components/review/ReviewSession";
import { ApiKeyModal }    from "./components/settings/ApiKeyModal";
import { StarterPacks }   from "./components/library/StarterPacks";
import { ThemeToggle }    from "./components/layout/ThemeToggle";
import { LandingPage }    from "./components/landing/LandingPage";
import { Onboarding }     from "./components/landing/Onboarding";
import { Analytics }      from "@vercel/analytics/react";
import { useCardStore, useProviderStore, useReviewHistory, useSessionHistory } from "./hooks/useStore";
import { useTheme }       from "./hooks/useTheme";
import { getDueCards }    from "./lib/sm2";
import { PROVIDERS }      from "./lib/llm";
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
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline" | "local">("local");

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

  const dueCount     = getDueCards(cards).length;
  const provider      = PROVIDERS.find((p) => p.id === providerId)!;
  const keySet        = !!currentKey;

  function handleCardCreated(card: FlashCard) {
    addCard(card);
    navigate(`/card/${card.id}`);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
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
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
              {item.path === "/library" && dueCount > 0 && (
                <span className="pulse" style={s.pill}>{dueCount}</span>
              )}
            </NavLink>
          ))}

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

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          
          <button onClick={() => setShowSettings(true)} style={s.providerBtn} className="btn-press">
            <span>{provider.logo}</span>
            <span style={{ fontSize: 12 }}>
              {provider.id === "anthropic" ? "Claude" : provider.id === "gemini" ? "Gemini" : "Groq"}
            </span>
            <span style={{ fontSize: 10, color: keySet ? "var(--accent)" : "var(--urgent)" }}>
              {keySet ? "✓" : "⚠"}
            </span>
          </button>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--accent-ink)", fontWeight: 500, background: "var(--accent-soft)", padding: "4px 8px", borderRadius: "var(--radius-sm)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                style={{ ...s.providerBtn, background: "var(--urgent-soft)", color: "var(--urgent-ink)", borderColor: "var(--urgent)" }}
                className="btn-press"
              >
                Sign Out
              </button>
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
      <main>
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
                  onSignInClick={() => setShowLogin(true)}
                  onStartReview={() => navigate("/review")}
                  onGenerate={() => navigate("/generate")}
                  onGoLibrary={() => navigate("/library")}
                  onGoStarterPacks={() => navigate("/starter-packs")}
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
            path="/starter-packs"
            element={
              <StarterPacks
                existingCards={cards}
                onImportDeck={importCards}
                onGoLibrary={() => navigate("/library")}
              />
            }
          />
        </Routes>
      </main>

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
  onUpdate: (id: string, updates: Partial<FlashCard>) => void;
  onDelete: (id: string) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const card = cards.find((c) => c.id === id);

  if (!card) {
    return (
      <div style={{ maxWidth: 420, margin: "4rem auto", textAlign: "center", padding: "0 1rem" }}>
        <div className="bigstat" style={{ fontSize: 38, color: "var(--caption)", marginBottom: 14 }}>404</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 600, fontFamily: "var(--font-display)" }}>Card not found</h2>
        <p style={{ color: "var(--caption)", fontSize: 14, margin: "0 0 22px" }}>
          This card may have been deleted.
        </p>
        <button onClick={() => navigate("/library")} style={s.primaryBtn} className="btn-press">
          Go to library
        </button>
      </div>
    );
  }

  return <CardDetail card={card} onBack={() => navigate("/library")} onUpdate={onUpdate} onDelete={onDelete} />;
}

// ─── Navigation items ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: "/",         label: "Dashboard", icon: "◈" },
  { path: "/library",  label: "Library",   icon: "▤" },
  { path: "/generate", label: "Generate",  icon: "✦" },
];

// ─── Styles ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  logo:        { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--ink)", cursor: "pointer", marginRight: 10, letterSpacing: "-0.01em", display: "flex", alignItems: "center", textDecoration: "none" },
  navLinks:    { display: "flex", gap: 2, flex: 1 },
  navBtn:      { background: "none", border: "none", padding: "6px 12px", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", transition: "background 0.15s ease, color 0.15s ease" },
  navActive:   { background: "var(--bg-sunken)", color: "var(--ink)", fontWeight: 500 },
  pill:        { background: "var(--urgent)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 },
  providerBtn: { display: "flex", alignItems: "center", gap: 5, background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "5px 10px", cursor: "pointer", fontSize: 13, color: "var(--ink-soft)", transition: "border-color 0.15s ease" },
  primaryBtn:  { padding: "10px 22px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
};
