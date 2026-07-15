import { Link } from "react-router-dom";
import React, { useState } from "react";

export function HowToUsePage() {
  React.useEffect(() => {
    window.scrollTo(0, 0);

    // Apply overflow: hidden to body to prevent body-level scrolling on desktop
    const isDesktop = window.innerWidth > 768;
    const originalOverflow = document.body.style.overflow;
    
    if (isDesktop) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
    <div className="animate-fadeInUp privacy-container">
      <div style={s.header}>
        <Link to="/" style={s.backLink} className="btn-press">
          ← Back to dashboard
        </Link>
        <span className="font-mono" style={s.eyebrow}>User Guide</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h1 style={s.h1}>How to Use DSA Recall</h1>
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.5 }}>
          Master coding patterns using active recall and spaced repetition. Try the live demo card below.
        </p>
      </div>

      <div className="privacy-card" style={{ gap: 18 }}>
        <div style={s.instructionSection}>
          <h2 style={s.sectionTitle}>The Spaced Repetition Workflow</h2>
          <ol style={s.olList}>
            <li><strong>Recall & Draft:</strong> Read the card cue, then draft your solution strategy in the text area before revealing.</li>
            <li><strong>Verify Approaches:</strong> Check the box for each complexity tier you successfully recalled.</li>
            <li><strong>Rate Your Recall:</strong> Grade your performance. The system will reschedule your next review accordingly.</li>
          </ol>
        </div>

        <div style={s.demoWrapper}>
          <div style={s.demoCard} className="card-interactive">
            <span className="watermark" style={{ top: -10, right: 10 }}>O(N)</span>
            
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
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
              <div className="animate-fadeIn" style={{ marginTop: 12 }}>
                <label htmlFor="howtouse-demo-recall" style={s.label}>Active Recall Helper</label>
                <textarea
                  id="howtouse-demo-recall"
                  name="howtouse_demo_recall"
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
              <div className="animate-fadeIn" style={{ marginTop: 12 }}>
                <div style={s.label}>Verify Your Recall</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {DEMO_APPROACHES.map((a) => {
                    const isChecked = recalled.includes(a.label);
                    const safeId = `howtouse-approach-${a.label.toLowerCase().replace(/\s+/g, "-")}`;
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
                            <input
                              id={safeId}
                              name={`howtouse_approach_${a.label.toLowerCase().replace(/\s+/g, "_")}`}
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
                      🎉 Graded as: <strong>{DEMO_GRADES.find(g => g.val === grade)?.label}</strong>!
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
      </div>
    </div>
  );
}

const DEMO_APPROACHES = [
  { label: "Brute Force", complexity: "O(N²)", desc: "Iterate through each pair using nested loops." },
  { label: "Optimal (Hashing)", complexity: "O(N)", desc: "Scan array once, storing values in hash map for O(1) complement check." }
];

const DEMO_GRADES = [
  { val: 0, label: "Forgot", color: "var(--hard)" },
  { val: 1, label: "Vague", color: "var(--hard)" },
  { val: 3, label: "Hard", color: "var(--medium)" },
  { val: 4, label: "Good", color: "#3b6ea0" },
  { val: 5, label: "Easy", color: "var(--accent)" }
];

const s: Record<string, React.CSSProperties> = {
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
    fontSize: 26,
    fontWeight: 600,
    margin: 0,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
  },
  instructionSection: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 17.5,
    fontWeight: 600,
    margin: 0,
    color: "var(--ink)",
  },
  olList: {
    margin: "4px 0 0 16px",
    padding: 0,
    fontSize: 14,
    color: "var(--ink-soft)",
    lineHeight: 1.55,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  demoWrapper: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  demoCard: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 24px",
    maxWidth: 480,
    width: "100%",
    boxShadow: "var(--shadow)",
    position: "relative",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: "0 0 10px",
    color: "var(--ink)",
  },
  label: {
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--caption)",
    marginBottom: 4,
  },
  cardTrigger: {
    fontSize: 13.5,
    color: "var(--ink-soft)",
    margin: "0 0 12px",
    lineHeight: 1.5,
  },
  textarea: {
    width: "100%",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 12px",
    fontSize: 12.5,
    color: "var(--ink)",
    outline: "none",
    resize: "none",
    marginBottom: 8,
  },
  revealBtn: {
    width: "100%",
    padding: "9px 0",
    background: "var(--ink)",
    color: "var(--bg)",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  approachRow: {
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 10px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  gradesRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
    gap: 6,
    marginTop: 6,
  },
  gradeBtn: {
    padding: "6px 2px",
    background: "var(--bg-raised)",
    border: "1.5px solid",
    borderRadius: "var(--radius-sm)",
    fontSize: 10.5,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center" as const,
  },
  demoDone: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--accent-soft)",
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--accent)",
    color: "var(--accent-ink)",
    fontSize: 12.5,
  },
  resetBtn: {
    background: "none",
    border: "none",
    textDecoration: "underline",
    fontSize: 10.5,
    fontWeight: 600,
    color: "var(--accent-ink)",
    cursor: "pointer",
    padding: 0,
  },
  tagEasy: {
    fontSize: 9.5,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 12,
    background: "var(--easy-soft)",
    color: "var(--easy)",
  },
  tagPattern: {
    fontSize: 9.5,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 12,
    background: "var(--bg-sunken)",
    color: "var(--ink-soft)",
  },
};
