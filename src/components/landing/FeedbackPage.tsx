import { Link, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";

export function FeedbackPage() {
  const { user } = useAuth();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const queryCategory = queryParams.get("category");

  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState(location.state?.category || queryCategory || "general");
  const [message, setMessage] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Prefill email once the user session loads asynchronously
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user]);

  // Focus and position cursor at the end of the text on mount if prefilled
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const valLength = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(valLength, valLength);
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

    // Prepend Category and optional Email to the message field to align with the database schema
    const formattedMessage = `Category: ${category}\n${email.trim() ? `Email: ${email.trim()}\n` : ""}\nMessage:\n${message.trim()}`;

    try {
      const { error: insertError } = await supabase.from("feedback").insert({
        user_id: user?.id || null,
        message: formattedMessage,
        page_context: "Feedback Page",
      });

      if (insertError) {
        throw insertError;
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      setError(err?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeInUp privacy-container" style={{ maxWidth: 600 }}>
      <div style={s.header}>
        <Link to="/" style={s.backLink} className="btn-press">
          ← Back to dashboard
        </Link>
        <span className="font-mono" style={s.eyebrow}>Share Your Thoughts</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h1 style={s.h1}>Send Feedback</h1>
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.5 }}>
          Help us shape the future of DSA Recall. We read every submission.
        </p>
      </div>

      <div className="privacy-card">
        {submitted ? (
          <div className="animate-fadeIn" style={s.successContainer}>
            <div style={s.successIcon}>✓</div>
            <h2 style={s.successTitle}>Thank You!</h2>
            <p style={s.successText}>
              Your feedback has been logged. We appreciate you taking the time to help improve DSA Recall.
            </p>
            <button onClick={() => { setSubmitted(false); setMessage(""); setError(null); }} style={s.resetBtn} className="btn-press">
              Send another response
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.form}>
            {error && (
              <div style={s.errorBanner}>
                {error}
              </div>
            )}

            <div style={s.formGroup}>
              <label htmlFor="email" style={s.label}>
                Email Address <span style={{ color: "var(--caption)" }}>(Optional)</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                style={s.input}
              />
            </div>

            <div style={s.formGroup}>
              <label htmlFor="category" style={s.label}>Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                style={s.select}
              >
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="praise">Praise</option>
              </select>
            </div>

            <div style={s.formGroup}>
              <label htmlFor="message" style={s.label}>Your Message</label>
              <textarea
                id="message"
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?..."
                rows={4}
                style={s.textarea}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              style={{ ...s.submitBtn, opacity: (loading || !message.trim()) ? 0.5 : 1 }}
              className="btn-press"
            >
              {loading ? "Submitting..." : "Submit Feedback →"}
            </button>
          </form>
        )}
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
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink-soft)",
  },
  input: {
    width: "100%",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    fontSize: 13.5,
    color: "var(--ink)",
    outline: "none",
  },
  select: {
    width: "100%",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    fontSize: 13.5,
    color: "var(--ink)",
    outline: "none",
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    fontSize: 13.5,
    color: "var(--ink)",
    outline: "none",
    resize: "none",
    lineHeight: 1.5,
  },
  submitBtn: {
    width: "100%",
    padding: "11px 0",
    background: "var(--ink)",
    color: "var(--bg-raised)",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  successContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "20px 10px",
  },
  successIcon: {
    fontSize: 32,
    color: "var(--accent-ink)",
    background: "var(--accent-soft)",
    width: 60,
    height: 60,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 600,
    margin: "0 0 8px",
    color: "var(--ink)",
  },
  successText: {
    fontSize: 14,
    color: "var(--ink-soft)",
    margin: "0 0 20px",
    lineHeight: 1.5,
  },
  resetBtn: {
    padding: "8px 16px",
    background: "none",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius)",
    fontSize: 12.5,
    fontWeight: 500,
    color: "var(--ink-soft)",
    cursor: "pointer",
  },
  errorBanner: {
    background: "var(--hard-soft, #fce8e6)",
    color: "var(--hard, #c5221f)",
    border: "1px solid var(--hard)",
    borderRadius: "var(--radius)",
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 500,
  },
};
