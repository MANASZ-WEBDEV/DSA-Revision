import { useState } from "react";

interface Props {
  onStart: () => void;
}

export function LandingPage({ onStart }: Props) {
  // --- Demo Card State ---
  const [revealed, setRevealed] = useState(false);
  const [selfExplanation, setSelfExplanation] = useState("");
  const [recalled, setRecalled] = useState<string[]>([]);
  const [grade, setGrade] = useState<number | null>(null);

  const toggleRecall = (label: string) => {
    setRecalled((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleResetDemo = () => {
    setRevealed(false);
    setSelfExplanation("");
    setRecalled([]);
    setGrade(null);
  };

  return (
    <div className="animate-fadeIn" style={s.container}>
      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.badge}>For FAANG Interview Prep</div>
        <h1 style={s.headline}>
          Stop re-solving.<br />
          <span style={{ color: "var(--accent)" }}>Start remembering.</span>
        </h1>
        <p style={s.subheading}>
          DSA Recall combines structured active recall with spaced repetition so you never let a coding pattern go cold.
        </p>
        <button onClick={onStart} style={s.ctaBtn} className="btn-press">
          Start Practicing Free →
        </button>
        <div style={{ fontSize: 12, color: "var(--caption)", marginTop: 10 }}>
          No accounts required · Local-first data
        </div>

        {/* Scroll indicator */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: 18, color: "var(--caption)", animation: "scrollBounce 2s ease-in-out infinite" }}>↓</span>
        </div>
      </section>

      {/* ─── Interactive Live Demo ────────────────────────────────────── */}
      <section style={s.section}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={s.sectionTitle}>Try the Core Workflow</h2>
          <p style={s.sectionSub}>Experience active recall in 10 seconds. Try this mock Two Sum card:</p>
        </div>

        <div style={s.demoWrapper}>
          <div style={s.demoCard} className="card-interactive">
            <span className="watermark" style={{ top: -10, right: 10 }}>O(N)</span>
            
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <span style={s.tagEasy}>Easy</span>
              <span style={s.tagPattern}>Hashing</span>
              <span style={s.tagPattern}>Two Pointers</span>
            </div>

            <h3 style={s.cardTitle}>1. Two Sum</h3>
            
            <div style={s.label}>Recall Trigger</div>
            <p style={s.cardTrigger}>
              Need a pair summing to target → store elements in hash map to check complement `target - x` in O(1) time.
            </p>

            {/* Step 1: Self explanation */}
            {!revealed && (
              <div className="animate-fadeIn" style={{ marginTop: 16 }}>
                <div style={s.label}>Active Recall Helper</div>
                <textarea
                  value={selfExplanation}
                  onChange={(e) => setSelfExplanation(e.target.value)}
                  placeholder="Outline the optimal strategy in your own words before revealing..."
                  style={s.textarea}
                  rows={2}
                />
                <button onClick={() => setRevealed(true)} style={s.revealBtn} className="btn-press">
                  Reveal Approaches →
                </button>
              </div>
            )}

            {/* Step 2: Checklist and Grading */}
            {revealed && (
              <div className="animate-fadeIn" style={{ marginTop: 16 }}>
                <div style={s.label}>Verify Your Recall</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {DEMO_APPROACHES.map((a) => {
                    const isChecked = recalled.includes(a.label);
                    return (
                      <div
                        key={a.label}
                        onClick={() => toggleRecall(a.label)}
                        style={{
                          ...s.approachRow,
                          ...(isChecked ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent-ink)" } : {}),
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="checkbox" checked={isChecked} readOnly style={{ cursor: "pointer" }} />
                            <span style={{ fontWeight: 600, fontSize: 12 }}>{a.label}</span>
                          </div>
                          <span className="numeral" style={{ fontSize: 11, opacity: 0.8 }}>{a.complexity}</span>
                        </div>
                        <p style={{ fontSize: 12, margin: "4px 0 0", lineHeight: 1.45, opacity: 0.9 }}>
                          {a.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {grade === null ? (
                  <div>
                    <div style={s.label}>Rate your recall:</div>
                    <div style={s.gradesRow}>
                      {DEMO_GRADES.map((g) => (
                        <button
                          key={g.val}
                          onClick={() => setGrade(g.val)}
                          style={{ ...s.gradeBtn, borderColor: g.color, color: g.color }}
                          className="btn-press"
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="animate-fadeIn" style={s.demoDone}>
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      🎉 You graded this session as <strong>{DEMO_GRADES.find(g => g.val === grade)?.label}</strong>!
                    </p>
                    <button onClick={handleResetDemo} style={s.resetBtn}>
                      Reset Demo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Comparison Grid ─────────────────────────────────────────── */}
      <section style={s.section}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={s.sectionTitle}>How We Compare</h2>
          <p style={s.sectionSub}>Why DSA Recall is built differently for coding interviews:</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr style={s.tableHeader}>
                <th style={s.th}>Feature</th>
                <th style={{ ...s.th, color: "var(--accent)", fontWeight: 700 }}>DSA Recall</th>
                <th style={s.th}>Anki</th>
                <th style={s.th}>LeetCode Premium</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISONS.map((c, i) => {
                const renderCell = (val: { yes: boolean; text: string }, isRecall?: boolean) => (
                  <td style={{ ...s.td, ...(isRecall ? { fontWeight: 600 } : {}) }}>
                    <span style={{
                      display: "inline-block",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 10,
                      marginRight: 6,
                      verticalAlign: "middle",
                      background: val.yes ? "var(--easy-soft)" : "var(--hard-soft)",
                      color: val.yes ? "var(--easy)" : "var(--hard)",
                    }}>
                      {val.yes ? "Yes" : "No"}
                    </span>
                    <span style={{ color: isRecall ? "var(--accent)" : "var(--ink-soft)" }}>{val.text}</span>
                  </td>
                );
                return (
                  <tr key={i} style={s.tableRow}>
                    <td style={{ ...s.td, fontWeight: 500 }}>{c.feature}</td>
                    {renderCell(c.recall, true)}
                    {renderCell(c.anki)}
                    {renderCell(c.leetcode)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Call to Action ──────────────────────────────────────────── */}
      <section style={s.ctaBlock}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 10px" }}>
          Start Building Coding Mastery
        </h2>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 20px", maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          Free forever. Ships pre-bundled with the Blind 75 starter pack. Import it instantly and configure your first smart review session now.
        </p>
        <button onClick={onStart} style={s.ctaBtnLarge} className="btn-press">
          Setup Your Library
        </button>
      </section>
    </div>
  );
}

const DEMO_APPROACHES = [
  { label: "Brute Force", complexity: "O(N²)", desc: "Iterate through each pair using nested loops." },
  { label: "Optimal (Hashing)", complexity: "O(N)", desc: "Scan array once, storing values in hash map for O(1) lookups." }
];

const DEMO_GRADES = [
  { val: 0, label: "Forgot", color: "var(--hard)" },
  { val: 1, label: "Vague", color: "var(--hard)" },
  { val: 3, label: "Hard", color: "var(--medium)" },
  { val: 4, label: "Good", color: "#3b6ea0" },
  { val: 5, label: "Easy", color: "var(--accent)" }
];

const COMPARISONS = [
  {
    feature: "Pedagogical DSA Template",
    recall: { yes: true, text: "Built-in (Brute → Optimal, intuition, complexities)" },
    anki: { yes: false, text: "Requires manual design" },
    leetcode: { yes: false, text: "Solution essays only" },
  },
  {
    feature: "Automatic Card Generation",
    recall: { yes: true, text: "AI extracts code details automatically" },
    anki: { yes: false, text: "Manual writing" },
    leetcode: { yes: false, text: "No cards exist" },
  },
  {
    feature: "Adaptive Spaced Repetition",
    recall: { yes: true, text: "Custom SM-2 scheduling" },
    anki: { yes: true, text: "Standard SuperMemo" },
    leetcode: { yes: false, text: "No scheduling" },
  },
  {
    feature: "Pattern Staleness Protection",
    recall: { yes: true, text: "Ensures DP/Graphs check-ins" },
    anki: { yes: false, text: "Only per-card cues" },
    leetcode: { yes: false, text: "No reviews" },
  },
  {
    feature: "Self-Explanation Prompts",
    recall: { yes: true, text: "Active recall drafting" },
    anki: { yes: false, text: "No text support" },
    leetcode: { yes: false, text: "No drafts" },
  },
];

const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 820,
    margin: "0 auto",
    padding: "2.5rem 1.25rem 4rem",
  },
  hero: {
    textAlign: "center",
    padding: "2rem 0 1.5rem",
  },
  badge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "4px 10px",
    background: "var(--accent-soft)",
    color: "var(--accent-ink)",
    borderRadius: 20,
    marginBottom: 16,
  },
  headline: {
    fontFamily: "var(--font-display)",
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.15,
    margin: "0 0 16px",
    color: "var(--ink)",
  },
  subheading: {
    fontSize: 15,
    color: "var(--ink-soft)",
    lineHeight: 1.6,
    maxWidth: 540,
    margin: "0 auto 26px",
  },
  ctaBtn: {
    padding: "12px 28px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "var(--shadow)",
  },
  ctaBtnLarge: {
    padding: "13px 32px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "var(--shadow-lg)",
  },
  section: {
    marginTop: 36,
    paddingTop: 28,
    borderTop: "1px solid var(--border)",
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    color: "var(--ink)",
  },
  sectionSub: {
    fontSize: 13,
    color: "var(--caption)",
    margin: "4px 0 0",
  },
  demoWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: 20,
  },
  demoCard: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "24px",
    maxWidth: 520,
    width: "100%",
    boxShadow: "var(--shadow-lg)",
    position: "relative",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 600,
    margin: "0 0 14px",
    color: "var(--ink)",
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--caption)",
    marginBottom: 4,
  },
  cardTrigger: {
    fontSize: 14,
    color: "var(--ink-soft)",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  textarea: {
    width: "100%",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 12px",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
    resize: "none",
    marginBottom: 10,
  },
  revealBtn: {
    width: "100%",
    padding: "10px 0",
    background: "var(--ink)",
    color: "var(--bg)",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  approachRow: {
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  gradesRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
    gap: 6,
    marginTop: 8,
  },
  gradeBtn: {
    padding: "8px 2px",
    background: "var(--bg-raised)",
    border: "1.5px solid",
    borderRadius: "var(--radius-sm)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center" as const,
  },
  demoDone: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--accent-soft)",
    padding: "12px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--accent)",
    color: "var(--accent-ink)",
    fontSize: 13,
  },
  resetBtn: {
    background: "none",
    border: "none",
    textDecoration: "underline",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--accent-ink)",
    cursor: "pointer",
    padding: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 20,
    fontSize: 13,
  },
  tableHeader: {
    borderBottom: "1.5px solid var(--border-strong)",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left" as const,
    color: "var(--caption)",
    fontWeight: 500,
  },
  tableRow: {
    borderBottom: "1px solid var(--border)",
  },
  td: {
    padding: "14px 16px",
    color: "var(--ink-soft)",
  },
  ctaBlock: {
    marginTop: 70,
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "36px 20px",
    textAlign: "center",
    boxShadow: "var(--shadow-sm)",
  },
  tagEasy: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 12,
    background: "var(--easy-soft)",
    color: "var(--easy)",
  },
  tagPattern: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 12,
    background: "var(--bg-sunken)",
    color: "var(--ink-soft)",
  },
};
