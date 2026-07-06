import { Link } from "react-router-dom";
import React from "react";

export function SupportPage() {
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
        <span className="font-mono" style={s.eyebrow}>Help Center</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h1 style={s.h1}>Support & Help</h1>
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.5 }}>
          Find answers to common questions or reach out for technical assistance.
        </p>
      </div>

      <div className="privacy-card">
        <section style={s.section}>
          <h2 style={s.sectionTitle}>1. Troubleshooting AI Generation</h2>
          <p style={s.paragraph}>
            If card generation is failing, verify that you have configured a valid API key for your active LLM provider (Google Gemini, Anthropic Claude, or Groq) in settings. You can access settings via the provider badge next to the Generate tab.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>2. Sync & Account Help</h2>
          <p style={s.paragraph}>
            DSA Recall is local-first. If you wish to sync across devices, sign in using the <strong>Sync</strong> button in the navigation header. Ensure both devices are signed in with the same account (GitHub OAuth or Email OTP).
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>3. Report Bugs / Request Features</h2>
          <p style={s.paragraph}>
            Encountered an issue or have a code suggestion? Open a ticket directly on our open-source{" "}
            <a href="https://github.com/MANASZ-WEBDEV/DSA-Revision/issues" target="_blank" rel="noreferrer" style={s.link}>
              GitHub Issues page
            </a>.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>4. Share Your Feedback</h2>
          <p style={s.paragraph}>
            We want to make DSA Recall as useful as possible. Please share your suggestions or general feedback using our quick{" "}
            <a href="mailto:manasrajanidy89@gmail.com?subject=DSA Recall Feedback" style={s.link}>
              Feedback Form
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
  link: {
    color: "var(--accent)",
    textDecoration: "underline",
    fontWeight: 500,
  },
};
