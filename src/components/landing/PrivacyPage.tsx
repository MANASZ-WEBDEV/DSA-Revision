import { Link } from "react-router-dom";
import React from "react";

export function PrivacyPage() {
  React.useEffect(() => {
    window.scrollTo(0, 0);

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
        <span className="font-mono" style={s.eyebrow}>Legal & Compliance</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.5 }}>
          Last updated: July 6, 2026. Your privacy and trust are our top priorities.
        </p>
      </div>

      <div className="privacy-card">
        <section style={s.section}>
          <h2 style={s.sectionTitle}>1. Data We Collect & How We Use It</h2>
          <p style={s.paragraph}>
            DSA Recall is a <strong>local-first</strong> application. You can use all core features (flashcards, spaced repetition, and review statistics) offline without creating an account.
          </p>
          <ul style={s.list}>
            <li>
              <strong>Email Address:</strong> If you sign in via GitHub or email, we store your email address to secure and link your records.
            </li>
            <li>
              <strong>Study Metrics:</strong> When logged in, your cards, progress history, and streaks sync securely to enable seamless cross-device study.
            </li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>2. API Keys & AI Providers</h2>
          <p style={s.paragraph}>
            Card generation is powered by external LLM providers (Google Gemini, Anthropic Claude, and Groq).
          </p>
          <ul style={s.list}>
            <li>
              Your API keys are stored <strong>locally in your browser</strong> and are never sent to or stored on our servers.
            </li>
            <li>
              Study queries are sent directly to your selected provider. Please consult their respective privacy policies.
            </li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>3. Cookies & Analytics</h2>
          <p style={s.paragraph}>
            We do not use tracking cookies or sell your activity data. We use privacy-friendly Vercel Web Analytics to collect anonymized traffic metrics to optimize performance.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>4. Contact Us</h2>
          <p style={s.paragraph}>
            Have questions or feedback? Feel free to open an issue or reach out via our open-source{" "}
            <a href="https://github.com/MANASZ-WEBDEV/DSA-Revision" target="_blank" rel="noreferrer" style={s.link}>
              GitHub repository
            </a>.
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
  list: {
    margin: "2px 0 0 16px",
    padding: 0,
    fontSize: 14.5,
    color: "var(--ink-soft)",
    lineHeight: 1.55,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  link: {
    color: "var(--accent)",
    textDecoration: "underline",
    fontWeight: 500,
  },
};
