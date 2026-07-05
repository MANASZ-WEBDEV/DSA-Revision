import type { SessionAnalytics } from "../../types";
import React from "react";
import { formatSessionDate, isSubstantiveReflection } from "../../lib/sm2";

interface Props {
  sessionHistory: SessionAnalytics[];
  onBack: () => void;
}

export function ReviewHistory({ sessionHistory, onBack }: Props) {
  // Sort reverse-chronologically
  const sortedSessions = [...sessionHistory].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  // Compute lifetime history stats
  const totalSessions = sessionHistory.length;
  const totalCardsReviewed = sessionHistory.reduce((acc, s) => acc + s.totalCards, 0);
  
  const overallRecallRate = useMemo(() => {
    let totalReviewed = 0;
    let totalCorrect = 0;
    sessionHistory.forEach((s) => {
      totalReviewed += s.totalCards;
      totalCorrect += s.results.filter((r) => r.quality >= 3).length;
    });
    return totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0;
  }, [sessionHistory]);

  const overallAvgTime = useMemo(() => {
    let totalReviewed = 0;
    let totalMs = 0;
    sessionHistory.forEach((s) => {
      totalReviewed += s.totalCards;
      totalMs += s.results.reduce((acc, r) => acc + r.timeMs, 0);
    });
    return totalReviewed > 0 ? Math.round((totalMs / totalReviewed) / 1000) : 0;
  }, [sessionHistory]);

  return (
    <div className="animate-fadeInUp" style={s.container}>
      <button onClick={onBack} style={s.backLink} className="btn-press">
        ← Back to dashboard
      </button>

      <div style={{ marginBottom: 24, marginTop: 12 }}>
        <span className="font-mono" style={s.eyebrow}>Revision Archives</span>
        <h1 style={s.h1}>Session History</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.55 }}>
          A detailed log of all your revision sessions, duration, and recall performance.
        </p>
      </div>

      {totalSessions > 0 ? (
        <>
          {/* History overview cards */}
          <div style={s.statsGrid}>
            <div style={s.statBox}>
              <span className="bigstat" style={{ fontSize: 24, color: "var(--ink)" }}>{totalSessions}</span>
              <span style={s.statLabel}>sessions</span>
            </div>
            <div style={s.statBox}>
              <span className="bigstat" style={{ fontSize: 24, color: "var(--ink)" }}>{totalCardsReviewed}</span>
              <span style={s.statLabel}>reviews</span>
            </div>
            <div style={s.statBox}>
              <span className="bigstat" style={{ fontSize: 24, color: "var(--accent)" }}>{overallRecallRate}%</span>
              <span style={s.statLabel}>avg recall</span>
            </div>
            <div style={s.statBox}>
              <span className="bigstat" style={{ fontSize: 24, color: "var(--ink)" }}>{overallAvgTime}s</span>
              <span style={s.statLabel}>avg speed</span>
            </div>
          </div>

          {/* List of all sessions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sortedSessions.map((session, sIdx) => {
              const durationMs = new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
              const mins = Math.floor(durationMs / 60000);
              const secs = Math.floor((durationMs % 60000) / 1000);
              const passed = session.results.filter(r => r.quality >= 3).length;
              const rate = session.totalCards > 0 ? Math.round((passed / session.totalCards) * 100) : 0;
              const avgTime = session.totalCards > 0 ? Math.round((session.results.reduce((acc, c) => acc + c.timeMs, 0) / session.totalCards) / 1000) : 0;

              return (
                <div key={sIdx} style={s.sessionCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>
                        {formatSessionDate(session.completedAt)}
                      </span>
                      <span className="numeral" style={{ fontSize: 11, color: "var(--caption)" }}>
                        {session.totalCards} cards · {mins > 0 ? `${mins}m ` : ""}{secs}s · {avgTime}s avg/card
                      </span>
                    </div>
                    <div className="bigstat" style={{
                      fontSize: 18,
                      color: rate >= 90 ? "var(--success)" : rate >= 70 ? "var(--accent)" : "var(--medium)"
                    }}>
                      {rate}% Recall
                    </div>
                  </div>
                  {isSubstantiveReflection(session.reflection) && (
                    <div style={s.reflectionBox}>
                      "{session.reflection}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={s.emptyHint}>
          <span className="bigstat" style={{ fontSize: 18, color: "var(--caption)", marginRight: 10 }}>O(0)</span>
          <span style={{ fontSize: 13, color: "var(--caption)", lineHeight: 1.6 }}>
            No sessions recorded yet. Complete a review session to save progress history.
          </span>
        </div>
      )}
    </div>
  );
}

// Helpers for memoization inside functional component
function useMemo<T>(fn: () => T, deps: any[]): T {
  return React.useMemo(fn, deps);
}

const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "1.5rem 1rem 3rem",
  },
  backLink: {
    background: "none",
    border: "none",
    fontSize: 13,
    color: "var(--accent)",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "var(--accent)",
    textTransform: "uppercase",
  },
  h1: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    fontWeight: 600,
    margin: "4px 0 0",
    color: "var(--ink)",
    letterSpacing: "-0.01em",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "14px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "var(--shadow-sm)",
  },
  statLabel: {
    fontSize: 10,
    color: "var(--caption)",
    marginTop: 2,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  },
  sessionCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "14px 18px",
    boxShadow: "var(--shadow-sm)",
  },
  reflectionBox: {
    fontSize: 12,
    color: "var(--ink-soft)",
    background: "var(--bg-sunken)",
    padding: "8px 10px",
    borderRadius: "var(--radius-sm)",
    borderLeft: "3px solid var(--accent)",
    fontStyle: "italic",
    marginTop: 2,
    lineHeight: 1.45,
  },
  emptyHint: {
    display: "flex",
    alignItems: "center",
    background: "var(--bg-sunken)",
    border: "1px dashed var(--border-strong)",
    borderRadius: "var(--radius)",
    padding: "16px 18px",
  },
};
