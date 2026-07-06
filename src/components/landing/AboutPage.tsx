import { Link } from "react-router-dom";
import React from "react";

export function AboutPage() {
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

  return (
    <div className="animate-fadeInUp privacy-container">
      <div style={s.header}>
        <Link to="/" style={s.backLink} className="btn-press">
          ← Back to dashboard
        </Link>
        <span className="font-mono" style={s.eyebrow}>Our Story & Mission</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h1 style={s.h1}>About DSA Recall</h1>
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.5 }}>
          A modern spaced repetition system designed to help you master patterns, not just memorize solutions.
        </p>
      </div>

      <div className="privacy-card">
        <section style={s.section}>
          <h2 style={s.sectionTitle}>1. The Spaced Repetition Approach</h2>
          <p style={s.paragraph}>
            DSA Recall uses a customized version of the SM-2 algorithm to schedule card reviews. By reviewing cards right when you are about to forget them, you lock key data structures and algorithmic patterns into your long-term memory.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>2. Local-First Philosophy</h2>
          <p style={s.paragraph}>
            We believe your data belongs to you. DSA Recall is built local-first: all cards, streaks, and review logs are stored securely in your browser's local database, allowing you to study completely offline.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>3. AI-Assisted Creation</h2>
          <p style={s.paragraph}>
            Creating cards is friction-free. Simply paste any LeetCode or Codeforces problem description, and our AI card generator will extract the core concepts, base cases, and optimal approaches using your own LLM API keys.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>4. Open Source & Extensible</h2>
          <p style={s.paragraph}>
            Built with transparency in mind, DSA Recall is open-source. Software engineers can inspect the codebase, suggest optimizations, or host their own version via our project repository on GitHub.
          </p>
        </section>
      </div>
    </div>
  );
}

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
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 17.5,
    fontWeight: 600,
    margin: 0,
    color: "var(--ink)",
  },
  paragraph: {
    fontSize: 14.5,
    color: "var(--ink-soft)",
    lineHeight: 1.55,
    margin: 0,
  },
  link: {
    color: "var(--accent)",
    textDecoration: "underline",
    fontWeight: 500,
  },
};
