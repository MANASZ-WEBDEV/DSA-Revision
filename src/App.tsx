import { useState, useEffect, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { Routes, Route, useParams, Link, useLocation } from "react-router-dom";
import { useViewTransitionNavigate } from "./hooks/useViewTransitionNavigate";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Library } from "./components/library/Library";
import { GenerateCard } from "./components/generate/GenerateCard";
import { CardDetail } from "./components/cards/CardDetail";
import { ReviewSession } from "./components/review/ReviewSession";
import { ApiKeyModal } from "./components/settings/ApiKeyModal";
import { StarterPacks } from "./components/library/StarterPacks";
import { NotesExplorer } from "./components/library/NotesExplorer";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
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
import { getDueCards } from "./lib/sm2";
import { PROVIDERS } from "./lib/llm";
import type { FlashCard } from "./types";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LoginModal } from "./components/settings/LoginModal";
import { Storage } from "./lib/storage";


function AppContent() {
  const { cards, setCards, addCard, updateCard, deleteCard, importCards } = useCardStore();
  const { providerId, model, currentKey, keys, codeLanguage, setProvider, setModel, setKey, setCodeLanguage } = useProviderStore();
  const { events, setEvents, streak, setStreak, recordReview } = useReviewHistory();
  const { sessionHistory, setSessionHistory, recordSession } = useSessionHistory();
  const { theme, toggleTheme } = useTheme();

  const navigate = useViewTransitionNavigate();
  const location = useLocation();
  const isPrivacyPage = location.pathname === "/privacy";
  const isGeneratePage = location.pathname === "/generate";
  const isAboutPage = location.pathname === "/about";
  const isContactPage = location.pathname === "/contact";
  const isSupportPage = location.pathname === "/support";
  const isHowToUsePage = location.pathname === "/how-to-use";
  const isFeedbackPage = location.pathname === "/feedback";
  const isLibraryPage = location.pathname === "/library";
  const isLibraryEmpty = isLibraryPage && cards.length === 0;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const knownPaths = ["/", "/welcome", "/onboarding", "/library", "/review", "/history", "/starter-packs", "/notes"];
  const isKnownPath = knownPaths.includes(location.pathname);
  const cardIdMatch = location.pathname.match(/^\/card\/([^/]+)$/);
  const cardExists = cardIdMatch ? !!cards.find((c) => c.id === cardIdMatch[1]) : true;
  const is404 = !isKnownPath && (!cardIdMatch || !cardExists);

  const shouldLockViewport = (isPrivacyPage || isGeneratePage || isAboutPage || isContactPage || isSupportPage || isHowToUsePage || isFeedbackPage || isLibraryEmpty || is404) && !isMobile;
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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
      <Navbar
        cards={cards}
        dueCount={dueCount}
        provider={provider}
        keySet={keySet}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        signOut={signOut}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        setShowSettings={setShowSettings}
        setShowLogin={setShowLogin}
      />

      {/* ─── Routes ────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minHeight: shouldLockViewport ? "0" : undefined, viewTransitionName: "page-content" as any }}>
        <ErrorBoundary>
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
                onGoNotes={() => navigate("/notes")}
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
                codeLanguage={codeLanguage}
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
            path="/notes"
            element={
              <NotesExplorer
                cards={cards}
                onSelectCard={(id) => navigate(`/card/${id}`)}
                onBack={() => navigate("/library")}
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
        </ErrorBoundary>
      </main>

      <Footer />

      {/* ─── Settings Modal ────────────────────────────────────────────── */}
      {showSettings && (
        <ApiKeyModal
          providerId={providerId}
          model={model}
          keys={keys}
          codeLanguage={codeLanguage}
          onSetProvider={setProvider}
          onSetModel={setModel}
          onSetKey={setKey}
          onSetCodeLanguage={setCodeLanguage}
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

// ─── Error Boundary ─────────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[DSA Recall] Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center", padding: "0 1rem" }}>
          <div className="bigstat" style={{ fontSize: 36, color: "var(--hard)", marginBottom: 16 }}>Error</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", fontFamily: "var(--font-display)" }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: "var(--caption)", margin: "0 0 20px", lineHeight: 1.6 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
            style={{ padding: "10px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
            className="btn-press"
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
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
  const navigate = useViewTransitionNavigate();
  const card = cards.find((c) => c.id === id);

  if (!card) {
    return <NotFoundPage />;
  }

  return <CardDetail card={card} onBack={() => navigate("/library")} onUpdate={onUpdate} onDelete={onDelete} />;
}


