import { Link } from "react-router-dom";
import React from "react";

export function PrivacyPage() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="animate-fadeInUp" style={s.container}>
      <Link to="/" style={s.backLink} className="btn-press">
        ← Back to dashboard
      </Link>

      <div style={{ marginBottom: 28, marginTop: 12 }}>
        <span className="font-mono" style={s.eyebrow}>Legal & Compliance</span>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.55 }}>
          Last updated: July 6, 2026. Your privacy and trust are our top priorities.
        </p>
      </div>

      <div style={s.card}>
        <section style={s.section}>
          <h2 style={s.sectionTitle}>1. Data We Collect & How We Use It</h2>
          <p style={s.paragraph}>
            DSA Recall is designed as a local-first application. This means you can use the core features (flashcard creation, spaced repetition, and review statistics) without creating an account or providing any personal information.
          </p>
          <ul style={s.list}>
            <li>
              <strong>Email Address:</strong> If you choose to register and sign in (via GitHub or email authentication), we collect and store your email address to authenticate your identity, secure your data, and link your records.
            </li>
            <li>
              <strong>Study Metrics:</strong> When logged in, your cards, review history, streaks, and session reflect logs are securely synced to our databases so you can access them across multiple devices.
            </li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>2. API Keys & AI Providers</h2>
          <p style={s.paragraph}>
            Our generation tool is powered by external LLM providers (Google Gemini, Anthropic Claude, and Groq). 
          </p>
          <ul style={s.list}>
            <li>
              Your API keys are stored **locally in your browser's private storage** and are never sent to our servers.
            </li>
            <li>
              When you generate a card, your study query is transmitted directly to the API endpoint of the provider you select. Please consult their respective privacy policies regarding how they handle inputs.
            </li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>3. Cookies & Analytics</h2>
          <p style={s.paragraph}>
            We do not use tracking cookies or sell your activity data to third-party advertisers. We use Vercel Web Analytics to collect minimal, privacy-friendly, anonymized traffic data (such as page views and browser types) to optimize performance.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>4. Contact Us</h2>
          <p style={s.paragraph}>
            If you have any questions or feedback regarding how we handle user data, please feel free to open an issue or reach out via our open-source repository on{" "}
            <a href="https://github.com/MANASZ-WEBDEV/DSA-Revision" target="_blank" rel="noreferrer" style={s.link}>
              GitHub
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "1.5rem 1rem 4rem",
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
    margin: "4px 0 0",
    color: "var(--ink)",
    letterSpacing: "-0.01em",
  },
  card: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "24px 28px",
    boxShadow: "var(--shadow-sm)",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
    color: "var(--ink)",
  },
  paragraph: {
    fontSize: 13.5,
    color: "var(--ink-soft)",
    lineHeight: 1.6,
    margin: 0,
  },
  list: {
    margin: "4px 0 0 16px",
    padding: 0,
    fontSize: 13.5,
    color: "var(--ink-soft)",
    lineHeight: 1.6,
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
