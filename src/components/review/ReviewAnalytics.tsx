import type { SessionAnalytics } from "../../types";
import { PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";

interface Props {
  analytics: SessionAnalytics;
  onDone: () => void;
}

export function ReviewAnalytics({ analytics, onDone }: Props) {
  const { results, startedAt, completedAt } = analytics;

  // 1. Compute duration
  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  // 2. Count grades
  const total = results.length;
  const perfect = results.filter((r) => r.quality >= 4).length;
  const vague = results.filter((r) => r.quality === 1 || r.quality === 2).length;
  const forgot = results.filter((r) => r.quality === 0).length;
  const passed = results.filter((r) => r.quality >= 3).length;

  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const avgTimeSeconds = total > 0 ? Math.round((results.reduce((acc, curr) => acc + curr.timeMs, 0) / total) / 1000) : 0;

  // 3. Performance by pattern tag
  const patternStats = useMemo(() => {
    const map = new Map<string, { total: number; passed: number }>();
    
    // We need to look up patterns from results. Since we don't have card details here directly,
    // let's pass down or simulate, or map from what we recorded. Let's map patterns.
    // Wait, let's make sure results contains patterns.
    // Let's check results structure in type definition:
    // we should make sure that we include patterns in the results of SessionAnalytics!
    // Yes! Let's ensure results has `patterns: string[]`. Let's assume they are there.
    return [];
  }, [results]);

  // Wait, let's use standard hooks/helpers:
  // Let's compute pattern stats from results:
  const computedPatterns = useMemo(() => {
    const statsMap: Record<string, { total: number; pass: number }> = {};
    
    // Let's extract patterns from card data or if we record them in results
    // Let's check: does results have patterns?
    // Let's look at type definition for results in types/index.ts we just added:
    // results: { cardId: string; cardTitle: string; quality: ReviewQuality; timeMs: number; recalledApproaches: string[]; isSelfExplained: boolean }[]
    // Ah, it doesn't have patterns! But wait, we can easily add `patterns: PatternTag[]` to the results array in types/index.ts to compute pattern accuracy!
    // Let's check if we can pass patterns in results. Yes, that is extremely useful for analytics.
    // Let's see: results: { ..., patterns: PatternTag[] }[]
    return statsMap;
  }, [results]);

  return null; // Let's write the complete implementation below
}

// Let's import useMemo
import { useMemo } from "react";

export function ReviewAnalyticsComponent({ analytics, onDone }: Props) {
  const { results, startedAt, completedAt } = analytics;

  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  const total = results.length;
  const perfect = results.filter((r) => r.quality >= 4).length;
  const passed = results.filter((r) => r.quality >= 3).length;
  const struggled = results.filter((r) => r.quality > 0 && r.quality < 3).length;
  const forgot = results.filter((r) => r.quality === 0).length;

  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const avgTimeSeconds = total > 0 ? Math.round((results.reduce((acc, curr) => acc + curr.timeMs, 0) / total) / 1000) : 0;

  // Let's render a beautiful page
  return (
    <div className="animate-fadeIn" style={s.container}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <span className="font-mono" style={s.eyebrow}>Session Complete</span>
        <h1 style={s.h1}>Revision Analytics</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 6 }}>
          Here is how you performed in this recall session.
        </p>
      </div>

      {/* Grid of big statistics */}
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div className="bigstat" style={{ fontSize: 32, color: "var(--accent)" }}>{total}</div>
          <div style={s.statLabel}>Reviewed</div>
        </div>
        <div style={s.statCard}>
          <div className="bigstat" style={{ fontSize: 32, color: "var(--accent)" }}>{passRate}%</div>
          <div style={s.statLabel}>Recall Rate</div>
        </div>
        <div style={s.statCard}>
          <div className="bigstat" style={{ fontSize: 32, color: "var(--accent)" }}>{avgTimeSeconds}s</div>
          <div style={s.statLabel}>Avg Time/Card</div>
        </div>
        <div style={s.statCard}>
          <div className="bigstat" style={{ fontSize: 32, color: "var(--accent)" }}>
            {minutes > 0 ? `${minutes}m ` : ""}{seconds}s
          </div>
          <div style={s.statLabel}>Duration</div>
        </div>
      </div>

      {/* Composition and Performance */}
      <div style={s.sectionsGrid}>
        {/* Left Side: Cards reviewed */}
        <div style={s.cardSection}>
          <h3 style={s.sectionTitle}>Cards Reviewed</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {results.map((r, i) => {
              const qualityLabel = QUALITY_LABELS[r.quality] || "Forgot";
              const qualityColor = QUALITY_COLORS[r.quality] || "var(--hard)";
              
              return (
                <div key={i} style={s.cardRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.cardTitle}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className="numeral" style={{ fontSize: 11, color: "var(--caption)" }}>
                        {Math.round(r.timeMs / 1000)}s
                      </span>
                      {r.isSelfExplained && (
                        <span style={s.badge}>Self-Explained</span>
                      )}
                      {r.recalledApproaches.length > 0 && (
                        <span style={s.badge}>Recalled {r.recalledApproaches.length} approaches</span>
                      )}
                    </div>
                  </div>
                  <div style={{ ...s.qualityIndicator, borderColor: qualityColor, color: qualityColor }}>
                    {qualityLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Tips and Next Action */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={s.cardSection}>
            <h3 style={s.sectionTitle}>Performance Summary</h3>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={s.summaryItem}>
                <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Perfect Recall (Easy/Good):</span>
                <span className="numeral" style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>{perfect}</span>
              </div>
              <div style={s.summaryItem}>
                <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Correct but Struggled (Hard):</span>
                <span className="numeral" style={{ fontSize: 14, fontWeight: 600, color: "var(--medium)" }}>{passed - perfect}</span>
              </div>
              <div style={s.summaryItem}>
                <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Incorrect (Vague/Forgot):</span>
                <span className="numeral" style={{ fontSize: 14, fontWeight: 600, color: "var(--urgent)" }}>{struggled + forgot}</span>
              </div>
            </div>
            {struggled + forgot > 0 && (
              <p style={{ fontSize: 12, color: "var(--urgent)", background: "var(--hard-soft)", padding: "10px 12px", borderRadius: "var(--radius-sm)", margin: "14px 0 0", lineHeight: 1.5 }}>
                ⚠️ {struggled + forgot} card{struggled + forgot > 1 ? "s" : ""} reset to interval=1 day. You'll see them again tomorrow to reinforce your recall.
              </p>
            )}
          </div>

          <button onClick={onDone} style={s.primaryBtn} className="btn-press">
            Back to Library
          </button>
        </div>
      </div>
    </div>
  );
}

const QUALITY_LABELS: Record<number, string> = {
  0: "Forgot",
  1: "Vague",
  2: "Wrong",
  3: "Hard",
  4: "Good",
  5: "Easy"
};

const QUALITY_COLORS: Record<number, string> = {
  0: "var(--hard)",
  1: "var(--hard)",
  2: "var(--medium)",
  3: "var(--medium)",
  4: "#3b6ea0",
  5: "var(--accent)"
};

const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "1.75rem 1rem 3rem",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--accent)",
  },
  h1: {
    fontSize: 26,
    fontWeight: 700,
    fontFamily: "var(--font-display)",
    margin: "4px 0 0",
    color: "var(--ink)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: 14,
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "18px 12px",
    textAlign: "center",
    boxShadow: "var(--shadow-sm)",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--caption)",
    textTransform: "uppercase",
    marginTop: 4,
    letterSpacing: "0.02em",
  },
  sectionsGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 24,
  },
  cardSection: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 22px",
    boxShadow: "var(--shadow-sm)",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
    color: "var(--ink)",
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 10,
    background: "var(--accent-soft)",
    color: "var(--accent-ink)",
  },
  qualityIndicator: {
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    border: "1.5px solid",
    background: "var(--bg-raised)",
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    padding: "12px 0",
    background: "var(--ink)",
    color: "var(--bg)",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
