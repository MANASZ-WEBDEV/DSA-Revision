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
    <div className="animate-fadeIn landing-container">
      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-badge">For FAANG Interview Prep</div>
        <h1 className="landing-headline">
          Stop re-solving.<br />
          <span style={{ color: "var(--accent)" }}>Start remembering.</span>
        </h1>
        <p className="landing-subheading">
          DSA Recall combines structured active recall with spaced repetition so you never let a coding pattern go cold.
        </p>
        <button onClick={onStart} className="landing-cta-btn btn-press">
          Start Practicing Free →
        </button>
        <div style={{ fontSize: 12, color: "var(--caption)", marginTop: 10 }}>
          No accounts required · Local-first data
        </div>

        {/* Scroll indicator */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: 18, color: "var(--caption)", animation: "scrollBounce 2s ease-in-out infinite" }}>↓</span>
        </div>
      </section>

      {/* ─── Starter Decks & Features Trust Badges ─────────────────────── */}
      <div className="landing-features-row">
        <div className="landing-feature-badge">
          <span className="landing-feature-icon">🎯</span>
          <div>
            <h4 style={{ margin: 0 }} className="landing-feature-title">Pre-loaded Blind 75</h4>
            <span className="landing-feature-desc">Start reviewing the essential 75 curated coding patterns immediately.</span>
          </div>
        </div>

        <div className="landing-feature-badge">
          <span className="landing-feature-icon">🔑</span>
          <div>
            <h4 style={{ margin: 0 }} className="landing-feature-title">Bring Your Own Key</h4>
            <span className="landing-feature-desc">Connect Claude, Gemini, or Llama for custom flashcard generation.</span>
          </div>
        </div>

        <div className="landing-feature-badge">
          <span className="landing-feature-icon">⚡</span>
          <div>
            <h4 style={{ margin: 0 }} className="landing-feature-title">100% Free & Local-First</h4>
            <span className="landing-feature-desc">Your cards, notes, and progress stay securely stored in your browser.</span>
          </div>
        </div>
      </div>

      {/* ─── Interactive Live Demo ────────────────────────────────────── */}
      <section className="landing-section">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 className="landing-section-title">Try the Core Workflow</h2>
          <p className="landing-section-sub">Experience active recall in 10 seconds. Try this mock Two Sum card:</p>
        </div>

        <div className="landing-demo-wrapper">
          <div className="landing-demo-card card-interactive">
            <span className="watermark" style={{ top: -10, right: 10 }}>O(N)</span>
            
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <span className="landing-tag-easy">Easy</span>
              <span className="landing-tag-pattern">Hashing</span>
              <span className="landing-tag-pattern">Two Pointers</span>
            </div>

            <h3 className="landing-card-title">1. Two Sum</h3>
            
            <div className="landing-label">Recall Trigger</div>
            <p className="landing-card-trigger">
              Need a pair summing to target → store elements in hash map to check complement `target - x` in O(1) time.
            </p>

            {/* Step 1: Self explanation */}
            {!revealed && (
              <div className="animate-fadeIn" style={{ marginTop: 16 }}>
                <label htmlFor="landing-demo-recall" className="landing-label" style={{ display: "block" }}>Active Recall Helper</label>
                <textarea
                  id="landing-demo-recall"
                  name="landing_demo_recall"
                  value={selfExplanation}
                  onChange={(e) => setSelfExplanation(e.target.value)}
                  placeholder="Outline the optimal strategy in your own words before revealing..."
                  className="landing-textarea"
                  rows={2}
                />
                <button onClick={() => setRevealed(true)} className="landing-reveal-btn btn-press">
                  Reveal Approaches →
                </button>
              </div>
            )}

            {/* Step 2: Checklist and Grading */}
            {revealed && (
              <div className="animate-fadeInUp" style={{ marginTop: 16 }}>
                <div className="landing-label">Verify Your Recall</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {DEMO_APPROACHES.map((a) => {
                    const isChecked = recalled.includes(a.label);
                    const safeId = `landing-approach-${a.label.toLowerCase().replace(/\s+/g, "-")}`;
                    return (
                      <div
                        key={a.label}
                        onClick={() => toggleRecall(a.label)}
                        className="landing-approach-row"
                        style={isChecked ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent-ink)" } : {}}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              id={safeId}
                              name={`landing_approach_${a.label.toLowerCase().replace(/\s+/g, "_")}`}
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              style={{ cursor: "pointer" }}
                            />
                            <label
                              htmlFor={safeId}
                              style={{ fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                            >
                              {a.label}
                            </label>
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
                    <div className="landing-label">Rate your recall:</div>
                    <div className="landing-grades-row">
                      {DEMO_GRADES.map((g) => (
                        <button
                          key={g.val}
                          onClick={() => setGrade(g.val)}
                          className="landing-grade-btn btn-press"
                          style={{ borderColor: g.color, color: g.color }}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="animate-fadeIn landing-demo-done">
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      🎉 You graded this session as <strong>{DEMO_GRADES.find(g => g.val === grade)?.label}</strong>!
                    </p>
                    <button onClick={handleResetDemo} className="landing-reset-btn">
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
      <section className="landing-section">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 className="landing-section-title">How We Compare</h2>
          <p className="landing-section-sub">Why DSA Recall is built differently for coding interviews:</p>
        </div>

        <div className="table-scroll-hint" style={{ overflowX: "auto", position: "relative" }}>
          <table className="landing-table">
            <thead>
              <tr className="landing-table-header">
                <th className="landing-th">Feature</th>
                <th className="landing-th" style={{ color: "var(--accent)", fontWeight: 700, background: "var(--accent-soft)", borderLeft: "2px solid var(--accent)" }}>DSA Recall</th>
                <th className="landing-th">Anki</th>
                <th className="landing-th">LeetCode Premium</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISONS.map((c, i) => {
                const renderCell = (val: { yes: boolean; text: string }, isRecall?: boolean) => (
                  <td className="landing-td" style={isRecall ? { fontWeight: 600, background: "var(--accent-soft)", borderLeft: "2px solid var(--accent)" } : {}}>
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
                  <tr key={i} className="landing-table-row">
                    <td className="landing-td" style={{ fontWeight: 500 }}>{c.feature}</td>
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
      <section className="landing-cta-block">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 10px" }}>
          Start Building Coding Mastery
        </h2>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 20px", maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          Free forever. Ships pre-bundled with the Blind 75 starter pack. Import it instantly and configure your first smart review session now.
        </p>
        <button onClick={onStart} className="landing-cta-btn-large btn-press">
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


