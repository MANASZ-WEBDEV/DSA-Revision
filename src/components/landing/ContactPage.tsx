import { Link } from "react-router-dom";
import React from "react";

export function ContactPage() {
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
        <span className="font-mono" style={s.eyebrow}>Get In Touch</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h1 style={s.h1}>Contact Us</h1>
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.5 }}>
          Have questions, feedback, or need help? We would love to hear from you.
        </p>
      </div>

      <div className="privacy-card">
        <section style={s.section}>
          <h2 style={s.sectionTitle}>1. GitHub Community</h2>
          <p style={s.paragraph}>
            Since DSA Recall is open-source, the best place to report bugs, suggest features, or contribute is via our repository. Feel free to open a ticket on our{" "}
            <a href="https://github.com/MANASZ-WEBDEV/DSA-Revision/issues" target="_blank" rel="noreferrer" style={s.link}>
              GitHub Issues page
            </a>.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>2. Email Support</h2>
          <p style={s.paragraph}>
            For private inquiries, account-specific issues, or support requests regarding cross-device sync, you can contact us at{" "}
            <a href="mailto:manasrajanidy89@gmail.com" style={s.link}>
              manasrajanidy89@gmail.com
            </a>. We'll get back to you as soon as possible.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>3. Social Media</h2>
          <p style={s.paragraph}>
            Follow us or send a direct message on our social channels for updates and tips:
          </p>
          <ul style={s.list}>
            <li>
              <strong>Twitter / X:</strong>{" "}
              <a href="https://x.com/ManasDynamic" target="_blank" rel="noreferrer" style={s.link}>
                @ManasDynamic
              </a>
            </li>
            <li>
              <strong>LinkedIn:</strong>{" "}
              <a href="https://www.linkedin.com/in/manas-rajani/" target="_blank" rel="noreferrer" style={s.link}>
                Manas Rajani
              </a>
            </li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>4. Direct Message to Creator</h2>
          <p style={s.paragraph}>
            DSA Recall is built and maintained by Manas Rajani. You can view projects or connect directly via{" "}
            <a href="https://github.com/MANASZ-WEBDEV" target="_blank" rel="noreferrer" style={s.link}>
              GitHub profile
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
