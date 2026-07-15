import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  onClose: () => void;
}

export function LoginModal({ onClose }: Props) {
  const { signInWithGitHub, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGitHubLogin() {
    setLoading(true);
    setError(null);
    const { error: err } = await signInWithGitHub();
    if (err) {
      setError(err.message || "Failed to initiate GitHub login.");
      setLoading(false);
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: err } = await signInWithMagicLink(email);
    setLoading(false);
    if (err) {
      setError(err.message || "Failed to send magic link.");
    } else {
      setMessage("✓ Magic link sent! Check your inbox.");
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={s.title}>Sync Your Library</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        <p style={s.intro}>
          Sign in to synchronize your flashcard collection, review history, and daily streak metrics automatically across all your devices.
        </p>

        {error && (
          <div style={s.errorBox}>
            {error}
          </div>
        )}

        {message && (
          <div style={s.successBox}>
            {message}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {/* GitHub OAuth Button */}
          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            style={s.githubBtn}
            className="btn-press"
          >
            <svg style={{ width: 18, height: 18, fill: "currentColor" }} viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div style={s.dividerContainer}>
          <div style={s.dividerLine}></div>
          <span style={s.dividerText}>or</span>
          <div style={s.dividerLine}></div>
        </div>

        {/* Magic Link Form */}
        <form onSubmit={handleMagicLinkSubmit} style={{ marginTop: 16 }}>
          <label htmlFor="login-email-address" style={s.label}>Email Address</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              id="login-email-address"
              name="login_email_address"
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              style={s.input}
            />
            <button
              type="submit"
              disabled={loading || !email}
              style={s.submitBtn}
              className="btn-press"
            >
              {loading ? "Sending..." : "Send link"}
            </button>
          </div>
          <p style={s.subText}>We'll email you a magic passwordless login link.</p>
        </form>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onClose} style={s.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(20, 18, 14, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "1rem",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  modal: {
    background: "var(--bg-raised)",
    borderRadius: 14,
    padding: "24px 28px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "var(--shadow-lg)",
    border: "1px solid var(--border)",
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: "var(--ink)",
    fontFamily: "var(--font-display)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 16,
    color: "var(--caption)",
    cursor: "pointer",
    padding: "4px 6px",
  },
  intro: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "var(--ink-soft)",
    margin: "0 0 20px 0",
  },
  githubBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "11px 0",
    background: "var(--ink)",
    color: "var(--bg)",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
  dividerContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: "var(--caption)",
    fontSize: 12,
    margin: "16px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "var(--border)",
  },
  dividerText: {
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  label: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--caption)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  input: {
    flex: 1,
    padding: "9px 12px",
    fontSize: 13,
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-sm)",
    outline: "none",
    background: "var(--bg-sunken)",
    color: "var(--ink)",
  },
  submitBtn: {
    padding: "9px 16px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  subText: {
    fontSize: 11,
    color: "var(--caption)",
    margin: "6px 0 0 0",
  },
  errorBox: {
    padding: "10px 14px",
    background: "var(--hard-soft)",
    color: "var(--hard)",
    border: "1px solid var(--hard)",
    borderRadius: "var(--radius-sm)",
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 1.4,
  },
  successBox: {
    padding: "10px 14px",
    background: "var(--easy-soft)",
    color: "var(--easy)",
    border: "1px solid var(--easy)",
    borderRadius: "var(--radius-sm)",
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 1.4,
  },
  cancelBtn: {
    padding: "8px 16px",
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: 13,
    cursor: "pointer",
    color: "var(--ink-soft)",
  },
};
