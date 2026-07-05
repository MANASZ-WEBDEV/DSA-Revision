import { useState, useEffect } from "react";
import type { FlashCard, ReviewEvent, StreakData, PatternTag, SessionAnalytics } from "../../types";
import { PATTERN_TAGS } from "../../types";
import { PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";
import { getDueCards, getStats, formatRelativeTime, formatSessionDate, isSubstantiveReflection } from "../../lib/sm2";
import { Heatmap } from "./Heatmap";
import { SyncBanner } from "../landing/SyncBanner";


interface Props {
  cards: FlashCard[];
  events: ReviewEvent[];
  streak: StreakData;
  sessionHistory: SessionAnalytics[];
  syncStatus: "synced" | "syncing" | "offline" | "local";
  lastSyncedAt: Date | null;
  onSignInClick: () => void;
  onStartReview: () => void;
  onGenerate: () => void;
  onGoLibrary: (pattern?: string) => void;
  onGoStarterPacks: () => void;
  onGoHistory: () => void;
}

export function Dashboard({ cards, events, streak, sessionHistory, syncStatus, lastSyncedAt, onSignInClick, onStartReview, onGenerate, onGoLibrary, onGoStarterPacks, onGoHistory }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (syncStatus !== "synced" || !lastSyncedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [syncStatus, lastSyncedAt]);

  const stats = getStats(cards);
  const dueCount = getDueCards(cards).length;

  const last7 = events.filter(
    (e) => Date.now() - new Date(e.reviewed_at).getTime() < 7 * 24 * 60 * 60 * 1000
  );
  const accuracy7 =
    last7.length === 0
      ? null
      : Math.round((last7.filter((e) => e.quality >= 3).length / last7.length) * 100);

  // Pattern mastery — count of reviews + accuracy per pattern, only patterns with data
  const patternStats = PATTERN_TAGS.map((tag) => {
    const tagEvents = events.filter((e) => e.patterns.includes(tag));
    if (tagEvents.length === 0) return null;
    const correct = tagEvents.filter((e) => e.quality >= 3).length;
    return {
      tag,
      reviews: tagEvents.length,
      accuracy: Math.round((correct / tagEvents.length) * 100),
    };
  }).filter((x): x is { tag: PatternTag; reviews: number; accuracy: number } => x !== null)
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 8);

  const hasActivity = events.length > 0;
  const hasCards = cards.length > 0;

  // Find weakest pattern (lowest accuracy under 85%, at least 1 review)
  const weakPattern = patternStats.length > 0
    ? [...patternStats].filter(p => p.accuracy < 85).sort((a, b) => a.accuracy - b.accuracy)[0]
    : null;

  return (
    <div className="animate-fadeInUp" style={{ maxWidth: 880, margin: "0 auto", padding: "1.75rem 1rem 3rem" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="font-mono" style={{ display: "flex", alignItems: "center", gap: 6, ...s.eyebrow }}>
            <span>Dashboard</span>
            <span style={s.dividerDot}>·</span>
            <span 
              style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--caption)", cursor: lastSyncedAt ? "help" : "default" }}
              title={lastSyncedAt ? `Last synced at ${lastSyncedAt.toLocaleTimeString()}` : undefined}
            >
              <span style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: syncStatus === "synced" ? "var(--easy)" : syncStatus === "syncing" ? "var(--medium)" : syncStatus === "offline" ? "var(--hard)" : "var(--caption)",
                display: "inline-block",
              }} />
              <span style={{ fontSize: 10, textTransform: "capitalize" }}>
                {syncStatus === "synced" && lastSyncedAt
                  ? `Synced ${formatRelativeTime(lastSyncedAt)}`
                  : syncStatus === "synced" ? "Synced" : syncStatus === "syncing" ? "Syncing..." : syncStatus === "offline" ? "Offline" : "Local Mode"}
              </span>
            </span>
          </div>
          <h1 style={s.h1}>Your progress</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {cards.length > 0 && (
            <button onClick={onStartReview} style={s.primaryBtn} className="btn-press">
              Review {dueCount > 0 ? `${dueCount} due ` : ""}→
            </button>
          )}
          {dueCount === 0 && (
            <button onClick={onGenerate} style={s.secondaryBtn} className="btn-press">✦ Generate a card</button>
          )}
        </div>
      </div>

      {/* Sync banner for anonymous local users */}
      {syncStatus === "local" && (
        <SyncBanner onSignInClick={onSignInClick} />
      )}

      {/* Stat ledger — horizontal rows, hairline dividers */}
      <div style={s.ledger} className="card-interactive">
        <StatRow
          label="Current streak"
          value={streak.current}
          unit={streak.current === 1 ? "day" : "days"}
          accent={streak.current > 0}
          flame={streak.current >= 3}
        />
        <StatRow label="Longest streak" value={streak.longest} unit={streak.longest === 1 ? "day" : "days"} />
        <StatRow label="Cards due now" value={dueCount} unit="cards" urgent={dueCount > 0} />
        <StatRow label="Total cards" value={stats.total} unit="in library" />
        <StatRow
          label="Mastered"
          value={stats.mastered}
          unit="≥21 day interval"
          accent
          tooltip="Cards you've reviewed successfully with a 21+ day gap"
        />
        <StatRow
          label="7-day accuracy"
          value={accuracy7 === null ? "—" : accuracy7}
          unit={accuracy7 === null ? "no reviews yet" : "%"}
          isLast
        />
      </div>

      {/* First-time user banner */}
      {!hasCards && (
        <div style={s.welcomeBanner} className="animate-fadeInUp">
          <div style={{ marginBottom: 14 }}>
            <span className="bigstat" style={{ fontSize: 24, color: "var(--accent)" }}>O(1)</span>
            <span style={{ fontSize: 13, color: "var(--caption)", marginLeft: 8 }}>Quick start</span>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 6px", fontFamily: "var(--font-display)" }}>
            Welcome to DSA Recall
          </h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 16px", lineHeight: 1.6 }}>
            Start with the <strong>Blind 75 starter deck</strong> — 75 essential problems for FAANG interviews, 
            ready to review with no API key needed. Or generate your own cards from any problem.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onGoStarterPacks} style={s.primaryBtn} className="btn-press">
              📦 Get Blind 75 deck
            </button>
            <button onClick={onGenerate} style={s.secondaryBtn} className="btn-press">
              ✦ Generate a card
            </button>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <Section title="Review activity" sub={`${events.length} review${events.length === 1 ? "" : "s"} all time`}>
        {hasActivity ? (
          <Heatmap events={events} />
        ) : (
          <EmptyHint text="Your activity heatmap fills in as you complete review sessions." />
        )}
      </Section>

      {/* Pattern mastery */}
      <Section title="Pattern mastery" sub="Based on review accuracy per tag">
        {patternStats.length > 0 ? (
          <div className="stagger-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {patternStats.map((p) => {
              const isWeakest = weakPattern && p.tag === weakPattern.tag;
              return (
                <div key={p.tag} style={s.patternRow}>
                  <span
                    style={{
                      ...s.patternTag,
                      background: PATTERN_COLORS[p.tag] ?? "var(--bg-sunken)",
                      color: PATTERN_TEXT_COLORS[p.tag] ?? "var(--ink-soft)",
                    }}
                  >
                    {p.tag}
                  </span>
                  {isWeakest && (
                    <button
                      onClick={() => onGoLibrary(p.tag)}
                      style={s.nudgeBtn}
                      className="btn-press"
                      title={`Review your ${p.tag} cards`}
                    >
                      Review {p.tag} →
                    </button>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
                    <span className="numeral" style={{ fontSize: 12, color: "var(--caption)" }}>
                      {p.reviews} review{p.reviews === 1 ? "" : "s"}
                    </span>
                    <div style={s.barTrack}>
                      <div
                        className="bar-animate"
                        style={{
                          ...s.barFill,
                          width: `${p.accuracy}%`,
                          background:
                            p.accuracy >= 80 ? "var(--easy)" : p.accuracy >= 50 ? "var(--medium)" : "var(--hard)",
                        }}
                      />
                    </div>
                    <span className="numeral" style={{ fontSize: 12, fontWeight: 600, width: 34, textAlign: "right" }}>
                      {p.accuracy}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyHint text="Review a few cards across different patterns to see your mastery breakdown here." />
        )}
      </Section>

      {/* Recent Sessions */}
      <Section title="Recent sessions" sub="Recall performance and trends over time">
        {sessionHistory.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessionHistory.slice(-5).reverse().map((session, sIdx) => {
              const durationMs = new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
              const mins = Math.floor(durationMs / 60000);
              const secs = Math.floor((durationMs % 60000) / 1000);
              const passed = session.results.filter(r => r.quality >= 3).length;
              const rate = session.totalCards > 0 ? Math.round((passed / session.totalCards) * 100) : 0;
              const avgTime = session.totalCards > 0 ? Math.round((session.results.reduce((acc, c) => acc + c.timeMs, 0) / session.totalCards) / 1000) : 0;

               return (
                <div key={sIdx} style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "12px 18px",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>
                        {formatSessionDate(session.completedAt)}
                      </span>
                      <span className="numeral" style={{ fontSize: 11, color: "var(--caption)" }}>
                        {session.totalCards} cards · {mins > 0 ? `${mins}m ` : ""}{secs}s · {avgTime}s avg/card
                      </span>
                    </div>
                    <div className="bigstat" style={{
                      fontSize: 16,
                      color: rate >= 90 ? "var(--success)" : rate >= 70 ? "var(--accent)" : "var(--medium)"
                    }}>
                      {rate}% Recall
                    </div>
                  </div>
                  {isSubstantiveReflection(session.reflection) && (
                    <div style={{
                      fontSize: 12,
                      color: "var(--ink-soft)",
                      background: "var(--bg-sunken)",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      borderLeft: "3px solid var(--accent)",
                      fontStyle: "italic",
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}>
                      "{session.reflection}"
                    </div>
                  )}
                </div>
              );
            })}
            {sessionHistory.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <button onClick={onGoHistory} style={s.linkBtn} className="btn-press">
                  View all sessions →
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyHint text="Your session summaries and recall accuracy history will appear here." />
        )}
      </Section>

      {/* Quick links */}
      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        <button onClick={() => onGoLibrary()} style={s.linkBtn}>Browse library →</button>
        <button onClick={onGenerate} style={s.linkBtn}>Generate new card →</button>
        <button onClick={onGoStarterPacks} style={s.linkBtn}>Starter packs →</button>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatRow({
  label, value, unit, accent, urgent, flame, isLast, tooltip,
}: {
  label: string;
  value: number | string;
  unit: string;
  accent?: boolean;
  urgent?: boolean;
  flame?: boolean;
  isLast?: boolean;
  tooltip?: string;
}) {
  const color = urgent ? "var(--urgent)" : accent ? "var(--accent)" : "var(--ink)";
  return (
    <div 
      style={{ ...s.statRow, borderBottom: isLast ? "none" : "1px solid var(--border)" }}
      title={tooltip}
    >
      <span style={{ ...s.statLabel, display: "flex", alignItems: "center", gap: 4 }}>
        {label}
        {tooltip && (
          <span style={{ color: "var(--caption)", fontSize: 10, cursor: "help" }}>
            ℹ
          </span>
        )}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        {flame && <span style={{ fontSize: 16 }}>🔥</span>}
        <span className="bigstat count-animate" style={{ fontSize: 26, color }}>{value}</span>
        <span style={s.statUnit}>{unit}</span>
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={s.sectionTitle}>{title}</h2>
        <p style={s.sectionSub}>{sub}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={s.emptyHint}>
      <span className="bigstat" style={{ fontSize: 18, color: "var(--caption)", marginRight: 10 }}>O(0)</span>
      <span style={{ fontSize: 13, color: "var(--caption)", lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  eyebrow:      { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--accent)", textTransform: "uppercase" as const, marginBottom: 4 },
  dividerDot:   { color: "var(--border-strong)", fontSize: 11 },
  h1:           { fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, margin: 0, color: "var(--ink)", letterSpacing: "-0.01em" },
  primaryBtn:   { padding: "10px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { padding: "10px 18px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  ledger:       { background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "4px 20px", boxShadow: "var(--shadow-sm)" },
  statRow:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" },
  statLabel:    { fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 },
  statUnit:     { fontSize: 12, color: "var(--caption)" },
  sectionTitle: { fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, margin: 0, color: "var(--ink)" },
  sectionSub:   { fontSize: 12, color: "var(--caption)", margin: "2px 0 0" },
  patternRow:   { display: "flex", alignItems: "center", gap: 10 },
  patternTag:   { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, flexShrink: 0, width: 150, textAlign: "center" as const, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  barTrack:     { flex: 1, height: 8, background: "var(--bg-sunken)", borderRadius: 5, overflow: "hidden" },
  barFill:      { height: "100%", borderRadius: 5 },
  barPct:       { fontSize: 12, color: "var(--ink-soft)", width: 36, textAlign: "right" as const },
  barCount:     { fontSize: 11, color: "var(--caption)", width: 30, textAlign: "right" as const },
  emptyHint:    { display: "flex", alignItems: "center", background: "var(--bg-sunken)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius)", padding: "16px 18px" },
  linkBtn:      { background: "none", border: "none", fontSize: 13, color: "var(--accent)", fontWeight: 500, cursor: "pointer", padding: 0 },
  welcomeBanner: { background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "var(--radius-lg)", padding: "22px 24px", marginTop: 24, boxShadow: "var(--shadow-sm)" },
  nudgeBtn: {
    background: "var(--accent-soft)",
    border: "none",
    color: "var(--accent-ink)",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    padding: "3px 8px",
    borderRadius: 20,
    transition: "transform 0.1s ease",
    display: "inline-flex",
    alignItems: "center",
  },
};
