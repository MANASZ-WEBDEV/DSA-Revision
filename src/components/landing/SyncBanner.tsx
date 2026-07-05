import { useState } from "react";

interface Props {
  onSignInClick: () => void;
}

export function SyncBanner({ onSignInClick }: Props) {
  const [visible, setVisible] = useState(() => {
    return localStorage.getItem("dsa_sync_banner_dismissed_v1") !== "true";
  });

  if (!visible) return null;

  function handleDismiss() {
    localStorage.setItem("dsa_sync_banner_dismissed_v1", "true");
    setVisible(false);
  }

  return (
    <div style={s.banner} className="animate-fadeIn">
      <div style={s.content}>
        <span style={{ fontSize: 18 }}>☁️</span>
        <div>
          <h4 style={s.title}>Sync & Backup Your Progress</h4>
          <p style={s.text}>
            Sign in to access your flashcards, history, and streak metrics across multiple devices.
          </p>
        </div>
      </div>
      <div style={s.actions}>
        <button onClick={onSignInClick} style={s.signInBtn} className="btn-press">
          Sign In
        </button>
        <button onClick={handleDismiss} style={s.dismissBtn} aria-label="Dismiss banner">
          ✕
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  banner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "var(--accent-soft)",
    border: "1px solid var(--accent)",
    borderRadius: "var(--radius-lg)",
    padding: "16px 20px",
    marginTop: 20,
    marginBottom: 20,
    boxShadow: "var(--shadow-sm)",
    flexWrap: "wrap",
    gap: 12,
  },
  content: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  title: {
    margin: "0 0 2px 0",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--accent-ink)",
  },
  text: {
    margin: 0,
    fontSize: 13,
    color: "var(--accent-ink)",
    opacity: 0.9,
    lineHeight: 1.4,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  signInBtn: {
    padding: "8px 16px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  dismissBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "var(--accent-ink)",
    opacity: 0.7,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "var(--radius-sm)",
    transition: "opacity 0.15s ease",
  },
};
