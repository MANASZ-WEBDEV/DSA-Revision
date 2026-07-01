import { useState, useEffect, useRef } from "react";
import type { FlashCard, ReviewQuality, SessionConfig, SessionAnalytics } from "../../types";
import { sm2, getDailySession, getDueCards, getBestBigO } from "../../lib/sm2";
import { PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";
import { ReviewConfig } from "./ReviewConfig";
import { ReviewAnalyticsComponent } from "./ReviewAnalytics";
import { Storage } from "../../lib/storage";

interface Props {
  cards: FlashCard[];
  onUpdate: (id: string, updates: Partial<FlashCard>) => void;
  onRecordReview: (card: FlashCard, quality: ReviewQuality) => void;
  onRecordSession: (session: SessionAnalytics) => void;
  onDone: () => void;
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  patterns: [],
  difficulties: [],
  decks: [],
  sessionSize: 20,
  timerEnabled: false,
  timerSeconds: 60,
  useSmartSession: true,
};

export function ReviewSession({ cards, onUpdate, onRecordReview, onRecordSession, onDone }: Props) {
  // --- Flow Steps: "config" | "session" | "analytics" ---
  const [step, setStep] = useState<"config" | "session" | "analytics">("config");

  // --- Session configuration ---
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>(() => {
    return Storage.getSessionConfig() ?? DEFAULT_SESSION_CONFIG;
  });

  // --- Active Session state ---
  const [activeCards, setActiveCards] = useState<FlashCard[]>([]);
  const [sessionMetadata, setSessionMetadata] = useState<{
    dueCount: number;
    staleTopUpCount: number;
    newCardCount: number;
    rolledOverCount: number;
    staleTags: string[];
  } | null>(null);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // For active recall helpers:
  const [selfExplanationText, setSelfExplanationText] = useState("");
  const [recalledApproaches, setRecalledApproaches] = useState<string[]>([]);
  
  // Timer state:
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<any>(null);

  // Time tracker for analytics:
  const cardStartTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<string>("");
  const [sessionResults, setSessionResults] = useState<SessionAnalytics["results"]>([]);
  const [analyticsData, setAnalyticsData] = useState<SessionAnalytics | null>(null);

  // Clean up timer on unmount:
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Reset timer on card change:
  useEffect(() => {
    if (step !== "session" || activeCards.length === 0) return;

    // Record start time of this card
    cardStartTimeRef.current = Date.now();

    if (sessionConfig.timerEnabled) {
      setSecondsLeft(sessionConfig.timerSeconds);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setRevealed(true); // Soft auto-reveal when timer expires
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, step, activeCards, sessionConfig.timerEnabled, sessionConfig.timerSeconds]);

  // Start the review session using filters and session builder
  const handleStartReview = (config: SessionConfig) => {
    Storage.saveSessionConfig(config);
    setSessionConfig(config);

    // 1. Filter candidate pool
    const candidates = cards.filter((card) => {
      if (config.decks.length > 0) {
        const dKey = card.deck || "My Cards";
        if (!config.decks.includes(dKey)) return false;
      }
      if (config.difficulties.length > 0) {
        if (!config.difficulties.includes(card.difficulty)) return false;
      }
      if (config.patterns.length > 0) {
        if (!card.patterns.some((p) => config.patterns.includes(p))) return false;
      }
      return true;
    });

    // 2. Build session composition
    let finalCards: FlashCard[] = [];
    if (config.useSmartSession) {
      const result = getDailySession(candidates);
      finalCards = result.cards;
      setSessionMetadata({
        dueCount: result.dueCount,
        staleTopUpCount: result.staleTopUpCount,
        newCardCount: result.newCardCount,
        rolledOverCount: result.rolledOverCount,
        staleTags: result.staleTags,
      });
    } else {
      finalCards = getDueCards(candidates);
      setSessionMetadata({
        dueCount: finalCards.length,
        staleTopUpCount: 0,
        newCardCount: 0,
        rolledOverCount: 0,
        staleTags: [],
      });
    }

    // 3. Slice by custom session limit if applicable
    if (config.sessionSize > 0 && finalCards.length > config.sessionSize) {
      finalCards = finalCards.slice(0, config.sessionSize);
    }

    if (finalCards.length === 0) {
      alert("No cards match your filter criteria.");
      return;
    }

    setActiveCards(finalCards);
    setIndex(0);
    setRevealed(false);
    setSelfExplanationText("");
    setRecalledApproaches([]);
    setSessionResults([]);
    sessionStartTimeRef.current = new Date().toISOString();
    setStep("session");
  };

  const currentCard = activeCards[index];

  const handleReveal = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRevealed(true);
  };

  const handleToggleRecallApproach = (label: string) => {
    setRecalledApproaches((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const submitQuality = (q: ReviewQuality) => {
    // 1. Calculate time taken
    const timeMs = Date.now() - cardStartTimeRef.current;

    // 2. Update storage & state
    const updates = sm2(currentCard, q);
    onUpdate(currentCard.id, updates);
    onRecordReview(currentCard, q);

    // 3. Save result for analytics
    const newResult = {
      cardId: currentCard.id,
      cardTitle: currentCard.title,
      quality: q,
      timeMs,
      recalledApproaches: [...recalledApproaches],
      isSelfExplained: selfExplanationText.trim().length > 0,
    };

    const updatedResults = [...sessionResults, newResult];
    setSessionResults(updatedResults);

    // 4. Check if finished
    if (index + 1 >= activeCards.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      const analytics: SessionAnalytics = {
        totalCards: activeCards.length,
        results: updatedResults,
        startedAt: sessionStartTimeRef.current,
        completedAt: new Date().toISOString(),
      };
      setAnalyticsData(analytics);
      setStep("analytics");
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
      setSelfExplanationText("");
      setRecalledApproaches([]);
    }
  };

  // Render views based on step:
  if (step === "config") {
    return (
      <ReviewConfig
        cards={cards}
        initialConfig={sessionConfig}
        onStartReview={handleStartReview}
        onCancel={onDone}
      />
    );
  }

  if (step === "analytics" && analyticsData) {
    return (
      <ReviewAnalyticsComponent
        analytics={analyticsData}
        onDone={(reflection) => {
          onRecordSession({
            ...analyticsData,
            reflection: reflection || undefined,
          });
          onDone();
        }}
      />
    );
  }

  if (activeCards.length === 0) {
    return (
      <div style={s.empty}>
        <div className="bigstat" style={{ fontSize: 38, color: "var(--accent)", marginBottom: 14 }}>O(1)</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 600, fontFamily: "var(--font-display)" }}>All caught up</h2>
        <p style={{ color: "var(--caption)", fontSize: 14, margin: "0 0 22px" }}>No cards due for review right now.</p>
        <button onClick={onDone} style={s.primaryBtn}>Back to library</button>
      </div>
    );
  }

  // --- Why is THIS card in today's session? ---
  let cardReason: string | null = null;
  if (sessionConfig.useSmartSession && sessionMetadata) {
    const isPastDueIndex = index < sessionMetadata.dueCount;
    const isStalenessIndex =
      index >= sessionMetadata.dueCount &&
      index < sessionMetadata.dueCount + sessionMetadata.staleTopUpCount;
    cardReason = isPastDueIndex
      ? null
      : isStalenessIndex
      ? "Pattern check-in — hasn't come up in a while"
      : "New card";
  }

  // Circular timer values
  const radius = 12;
  const strokeWidth = 2.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = sessionConfig.timerEnabled
    ? circumference - (secondsLeft / sessionConfig.timerSeconds) * circumference
    : 0;

  const timerWarning = sessionConfig.timerEnabled && (secondsLeft / sessionConfig.timerSeconds) <= 0.25;

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Progress & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span className="numeral" style={{ fontSize: 13, color: "var(--caption)" }}>
          {index + 1} / {activeCards.length}
        </span>

        {/* Circular Timer Display */}
        {sessionConfig.timerEnabled && !revealed && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="32" height="32" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="16"
                cy="16"
                r={radius}
                fill="transparent"
                stroke="var(--border)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="16"
                cy="16"
                r={radius}
                fill="transparent"
                stroke={timerWarning ? "var(--urgent)" : "var(--accent)"}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
              />
            </svg>
            <span className="numeral" style={{ fontSize: 12, fontWeight: 600, color: timerWarning ? "var(--urgent)" : "var(--caption)" }}>
              {secondsLeft}s
            </span>
          </div>
        )}

        <button onClick={onDone} style={{ background: "none", border: "none", fontSize: 13, color: "var(--caption)", cursor: "pointer" }}>
          End session
        </button>
      </div>

      {sessionMetadata && (sessionMetadata.staleTopUpCount > 0 || sessionMetadata.newCardCount > 0) && (
        <p style={{ fontSize: 11, color: "var(--caption)", margin: "0 0 14px" }}>
          {sessionMetadata.dueCount} due
          {sessionMetadata.staleTopUpCount > 0 && ` · ${sessionMetadata.staleTopUpCount} pattern check-in${sessionMetadata.staleTopUpCount > 1 ? "s" : ""}`}
          {sessionMetadata.newCardCount > 0 && ` · ${sessionMetadata.newCardCount} new`}
        </p>
      )}

      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${(index / activeCards.length) * 100}%` }} />
      </div>

      {/* Recall Trigger (Front) */}
      <div style={{ ...s.front, position: "relative", overflow: "hidden" }}>
        {getBestBigO(currentCard) && <span className="watermark">{getBestBigO(currentCard)}</span>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
          {currentCard.patterns.map((p) => (
            <span
              key={p}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: PATTERN_COLORS[p] ?? "var(--bg-sunken)",
                color: PATTERN_TEXT_COLORS[p] ?? "var(--ink-soft)",
              }}
            >
              {p}
            </span>
          ))}
          {cardReason && (
            <span style={{ fontSize: 10, fontWeight: 500, color: "var(--caption)", fontStyle: "italic" }}>
              {cardReason}
            </span>
          )}
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 18px", color: "var(--ink)", fontFamily: "var(--font-display)" }}>
          {currentCard.title}
        </h2>
        <div style={s.triggerLabel}>Recall trigger</div>
        <p style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", margin: 0, lineHeight: 1.55 }}>
          {currentCard.recall_trigger}
        </p>
      </div>

      {/* Self-Explanation Textarea */}
      {!revealed && (
        <div style={{ marginTop: 20 }}>
          <div style={s.activeRecallLabel}>Active Recall Helper (Optional)</div>
          <textarea
            value={selfExplanationText}
            onChange={(e) => setSelfExplanationText(e.target.value)}
            placeholder="Before revealing the approaches, briefly draft your optimal strategy or key intuition here..."
            style={s.explanationTextarea}
            rows={3}
          />
        </div>
      )}

      {/* Reveal Approaches Button */}
      {!revealed ? (
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <p style={{ fontSize: 13, color: "var(--caption)", marginBottom: 14 }}>
            Think through all approaches before revealing
          </p>
          <button onClick={handleReveal} style={s.revealBtn} className="btn-press">
            Reveal approaches →
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 20 }} className="animate-fadeIn">
          {/* User's typed recall attempt */}
          {selfExplanationText.trim() && (
            <div style={{ marginBottom: 22 }}>
              <div style={s.activeRecallLabel}>Your Recall Attempt</div>
              <div style={s.recallAttemptBox}>
                {selfExplanationText}
              </div>
            </div>
          )}

          {/* Approaches and Recall Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
            <div style={s.activeRecallLabel}>Verify & Grade Recall</div>
            {currentCard.approaches.map((a, i) => {
              const isChecked = recalledApproaches.includes(a.label);
              return (
                <div
                  key={i}
                  onClick={() => handleToggleRecallApproach(a.label)}
                  style={{
                    ...s.approachRow,
                    ...(isChecked ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : {}),
                  }}
                  className="card-interactive"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 600, color: isChecked ? "var(--accent-ink)" : "var(--accent)" }}>
                        {a.label}
                      </span>
                    </div>
                    <span className="numeral" style={{ fontSize: 12, color: isChecked ? "var(--accent-ink)" : "var(--ink-soft)" }}>
                      {a.complexity.time} · {a.complexity.space}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: isChecked ? "var(--accent-ink)" : "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.5 }}>
                    {a.key_observation}
                  </p>
                </div>
              );
            })}
          </div>

          {currentCard.notes && (
            <div style={{ marginTop: 16, marginBottom: 18 }}>
              <details style={s.notesDetails}>
                <summary style={s.notesSummary}>
                  <span>📝 View your personal notes on this problem</span>
                </summary>
                <div style={s.notesContent}>
                  {currentCard.notes}
                </div>
              </details>
            </div>
          )}

          {/* Quality buttons */}
          <div style={s.qualityLabel}>How well did you recall this?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
            {QUALITY_OPTIONS.map(({ q, label, sub, color }) => (
              <button
                key={q}
                onClick={() => submitQuality(q as ReviewQuality)}
                style={{ ...s.qualityBtn, borderColor: color, color }}
                className="btn-press"
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 10, color: "var(--caption)", marginTop: 2, textAlign: "center" }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const QUALITY_OPTIONS = [
  { q: 0, label: "Forgot", sub: "Blank",           color: "var(--hard)" },
  { q: 1, label: "Vague",  sub: "Recognized",      color: "var(--hard)" },
  { q: 3, label: "Hard",   sub: "Barely",          color: "var(--medium)" },
  { q: 4, label: "Good",   sub: "Hesitated",       color: "#3b6ea0" },
  { q: 5, label: "Easy",   sub: "Instant",         color: "var(--accent)" },
];

const s: Record<string, React.CSSProperties> = {
  empty:        { maxWidth: 420, margin: "4rem auto", textAlign: "center", padding: "0 1rem" },
  primaryBtn:   { padding: "10px 22px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  progressBar:  { height: 3, background: "var(--border)", borderRadius: 4, marginBottom: 26, overflow: "hidden" },
  progressFill: { height: "100%", background: "var(--accent)", borderRadius: 4, transition: "width 0.3s ease" },
  front:        { background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "22px 24px", boxShadow: "var(--shadow)" },
  triggerLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "var(--caption)", textTransform: "uppercase" as const, marginBottom: 8 },
  revealBtn:    { padding: "12px 28px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  approachRow:  { background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px", cursor: "pointer", transition: "all 0.15s ease" },
  qualityLabel: { fontSize: 11, fontWeight: 600, color: "var(--caption)", textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  qualityBtn:   { display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "10px 4px", background: "var(--bg-raised)", border: "1.5px solid", borderRadius: "var(--radius)", cursor: "pointer" },
  activeRecallLabel: { fontSize: 11, fontWeight: 600, color: "var(--caption)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 },
  explanationTextarea: { width: "100%", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 12px", fontSize: 14, color: "var(--ink)", outline: "none", resize: "none" },
  recallAttemptBox: { background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px", fontSize: 13.5, color: "var(--ink-soft)", whiteSpace: "pre-wrap" as const, lineHeight: 1.5, fontStyle: "italic" },
  notesDetails: { background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" },
  notesSummary: { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "var(--accent)", cursor: "pointer", userSelect: "none" as const },
  notesContent: { padding: "0 14px 12px", fontSize: 13, color: "var(--ink-soft)", whiteSpace: "pre-wrap" as const, lineHeight: 1.5, fontStyle: "italic" },
};
