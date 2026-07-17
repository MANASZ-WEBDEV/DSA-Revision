import type { SessionAnalytics } from "../../types";
import React from "react";
import { isSubstantiveReflection } from "../../lib/sm2";

interface Props {
  sessionHistory: SessionAnalytics[];
  onBack: () => void;
}

// ─── Date helpers ───────────────────────────────────────────────────────────

/** "Jul 17, 2026" */
function formatDateKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "2:30 PM" */
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** "3h ago", "Yesterday", "2 days ago", etc. */
function relativeLabel(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return "";
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ReviewHistory({ sessionHistory, onBack }: Props) {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const isDesktop = window.innerWidth > 768;
    const originalOverflow = document.body.style.overflow;
    if (isDesktop) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  const sorted = React.useMemo(
    () => [...sessionHistory].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    ),
    [sessionHistory]
  );

  // Lifetime stats
  const stats = React.useMemo(() => {
    let sessions = 0, reviews = 0, correct = 0, totalMs = 0;
    sessionHistory.forEach((s) => {
      sessions++;
      reviews += s.totalCards;
      correct += s.results.filter((r) => r.quality >= 3).length;
      totalMs += s.results.reduce((a, r) => a + r.timeMs, 0);
    });
    const recall = reviews > 0 ? Math.round((correct / reviews) * 100) : 0;
    const avgSpeed = reviews > 0 ? Math.round((totalMs / reviews) / 1000) : 0;
    return { sessions, reviews, recall, avgSpeed };
  }, [sessionHistory]);

  // Group sessions by date key
  const grouped = React.useMemo(() => {
    const map = new Map<string, SessionAnalytics[]>();
    sorted.forEach((s) => {
      const key = formatDateKey(s.completedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return [...map.entries()];
  }, [sorted]);

  return (
    <div className="animate-fadeInUp privacy-container">
      <div style={st.header}>
        <button onClick={onBack} style={st.backLink} className="btn-press">
          ← Back to dashboard
        </button>
        <span className="font-mono" style={st.eyebrow}>Revision Archives</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h1 style={st.h1}>Session History</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.55 }}>
          A detailed log of all your revision sessions, duration, and recall performance.
        </p>
      </div>

      <div className="privacy-card">
        {stats.sessions > 0 ? (
          <>
            {/* ── Lifetime stats ── */}
            <div style={st.statsRow}>
              <StatPill label="Sessions" value={stats.sessions} />
              <StatPill label="Reviews" value={stats.reviews} />
              <StatPill label="Recall" value={`${stats.recall}%`} accent />
              <StatPill label="Avg speed" value={`${stats.avgSpeed}s`} />
            </div>

            {/* ── Date-grouped timeline ── */}
            <div style={st.timeline}>
              {grouped.map(([dateKey, sessions]) => (
                <div key={dateKey}>
                  {/* Date header */}
                  <div style={st.dateHeader}>
                    <span style={st.dateDot} />
                    <span style={st.dateText}>{dateKey}</span>
                    <span className="numeral" style={st.dateCount}>
                      {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
                    </span>
                  </div>

                  {/* Sessions for this date */}
                  <div style={st.sessionsGroup}>
                    {sessions.map((session, sIdx) => {
                      const durationMs = new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
                      const passed = session.results.filter(r => r.quality >= 3).length;
                      const rate = session.totalCards > 0 ? Math.round((passed / session.totalCards) * 100) : 0;
                      const avgMs = session.totalCards > 0 ? Math.round(session.results.reduce((a, r) => a + r.timeMs, 0) / session.totalCards) : 0;
                      const rel = relativeLabel(session.completedAt);

                      return (
                        <div key={sIdx} style={st.sessionCard}>
                          {/* Top row: time + recall badge */}
                          <div style={st.cardTopRow}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={st.timeLabel}>{formatTime(session.completedAt)}</span>
                              {rel && <span style={st.relBadge}>{rel}</span>}
                            </div>
                            <span
                              className="bigstat"
                              style={{
                                fontSize: 15,
                                color: rate >= 90 ? "var(--success)" : rate >= 70 ? "var(--accent)" : rate >= 50 ? "var(--medium)" : "var(--hard)",
                              }}
                            >
                              {rate}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div style={st.progressTrack}>
                            <div
                              style={{
                                ...st.progressFill,
                                width: `${rate}%`,
                                background:
                                  rate >= 90
                                    ? "var(--success)"
                                    : rate >= 70
                                    ? "var(--accent)"
                                    : rate >= 50
                                    ? "var(--medium)"
                                    : "var(--hard)",
                              }}
                            />
                          </div>

                          {/* Metric chips */}
                          <div style={st.metricsRow}>
                            <span style={st.metricChip}>
                              <span style={st.metricIcon}>📚</span> {session.totalCards} cards
                            </span>
                            <span style={st.metricChip}>
                              <span style={st.metricIcon}>⏱</span> {formatDuration(durationMs)}
                            </span>
                            <span style={st.metricChip}>
                              <span style={st.metricIcon}>⚡</span> {Math.round(avgMs / 1000)}s/card
                            </span>
                          </div>

                          {/* Per-card result dots */}
                          <div style={st.dotsRow}>
                            {session.results.map((r, rIdx) => (
                              <span
                                key={rIdx}
                                title={`${r.cardTitle} — q${r.quality}`}
                                style={{
                                  ...st.dot,
                                  background:
                                    r.quality >= 4
                                      ? "var(--success)"
                                      : r.quality === 3
                                      ? "var(--medium)"
                                      : "var(--hard)",
                                }}
                              />
                            ))}
                          </div>

                          {/* Reflection */}
                          {isSubstantiveReflection(session.reflection) && (
                            <div style={st.reflectionBox}>
                              "{session.reflection}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={st.emptyHint}>
            <span className="bigstat" style={{ fontSize: 18, color: "var(--caption)", marginRight: 10 }}>O(0)</span>
            <span style={{ fontSize: 13, color: "var(--caption)", lineHeight: 1.6 }}>
              No sessions recorded yet. Complete a review session to save progress history.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StatPill sub-component ─────────────────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={st.statPill}>
      <span className="bigstat" style={{ fontSize: 20, color: accent ? "var(--accent)" : "var(--ink)" }}>
        {value}
      </span>
      <span style={st.statPillLabel}>{label}</span>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const st: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  backLink: {
    background: "none",
    border: "none",
    fontSize: 13,
    color: "var(--accent)",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
    textDecoration: "none",
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

  /* ── Stat pills ── */
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    marginBottom: 20,
  },
  statPill: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 8px",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "var(--caption)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginTop: 2,
  },

  /* ── Timeline ── */
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  dateHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 0",
    position: "relative",
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--accent)",
    flexShrink: 0,
  },
  dateText: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
  },
  dateCount: {
    fontSize: 11,
    color: "var(--caption)",
    marginLeft: "auto",
  },
  sessionsGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingLeft: 16,
    borderLeft: "2px solid var(--border)",
    marginLeft: 3,
    marginBottom: 16,
    paddingTop: 6,
  },

  /* ── Session card ── */
  sessionCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "12px 14px",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink)",
    fontFamily: "var(--font-mono)",
    letterSpacing: "-0.02em",
  },
  relBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: "var(--accent)",
    background: "var(--accent-soft)",
    padding: "2px 7px",
    borderRadius: 10,
    letterSpacing: "0.01em",
  },

  /* ── Progress bar ── */
  progressTrack: {
    height: 4,
    borderRadius: 2,
    background: "var(--bg-sunken)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.4s ease",
  },

  /* ── Metric chips ── */
  metricsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  metricChip: {
    fontSize: 11,
    color: "var(--ink-soft)",
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
  },
  metricIcon: {
    fontSize: 11,
  },

  /* ── Per-card dots ── */
  dotsRow: {
    display: "flex",
    gap: 3,
    flexWrap: "wrap",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    display: "inline-block",
    opacity: 0.85,
  },

  /* ── Reflection ── */
  reflectionBox: {
    fontSize: 12,
    color: "var(--ink-soft)",
    background: "var(--bg-sunken)",
    padding: "8px 10px",
    borderRadius: "var(--radius-sm)",
    borderLeft: "3px solid var(--accent)",
    fontStyle: "italic",
    lineHeight: 1.45,
  },

  /* ── Empty state ── */
  emptyHint: {
    display: "flex",
    alignItems: "center",
    background: "var(--bg-sunken)",
    border: "1px dashed var(--border-strong)",
    borderRadius: "var(--radius)",
    padding: "16px 18px",
  },
};
