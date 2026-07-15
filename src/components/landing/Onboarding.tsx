import { useState } from "react";
import { useCardStore, useProviderStore } from "../../hooks/useStore";
import { PROVIDERS } from "../../lib/llm";
import type { ProviderId } from "../../lib/llm";
import { initSM2 } from "../../lib/sm2";

interface Props {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const { importCards, markDeckImported } = useCardStore();
  const { providerId, currentKey, keys, setProvider, setKey } = useProviderStore();
  const [importingBlind75, setImportingBlind75] = useState(false);

  const currentProvider = PROVIDERS.find((p) => p.id === providerId)!;

  const handleImportBlind75 = async () => {
    setImportingBlind75(true);
    try {
      const mod = await import("../../data/blind75.json");
      const blind75Data = (mod.default ?? mod) as any[];
      const cards = blind75Data.map((card) => ({
        ...card,
        deck: "Blind 75",
        source_text: "",
        ...initSM2(),
        id: `blind75-${card.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
        created_at: new Date().toISOString(),
      }));

      importCards(cards);
      markDeckImported("blind-75");
      onComplete();
    } finally {
      setImportingBlind75(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={s.container}>
      {/* Progress header */}
      <div style={s.header}>
        <span className="font-mono" style={s.eyebrow}>Getting Started</span>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      {/* Step 1: Spaced Repetition Basics */}
      {step === 1 && (
        <div className="animate-fadeIn">
          <h1 style={s.h1}>The Core Philosophy</h1>
          <p style={s.p}>
            Most SWE candidates study by solving 300+ LeetCode problems, only to forget the exact patterns and intuition 3 weeks later.
          </p>
          <div style={s.box}>
            <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>Active Recall + Spaced Repetition</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              Instead of re-solving code from scratch, DSA Recall helps you review **intuitions, optimal complexities, and trade-offs** at mathematically computed intervals right before you forget them.
            </p>
          </div>
          <button onClick={() => setStep(2)} style={s.primaryBtn} className="btn-press">
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: API Keys setup */}
      {step === 2 && (
        <div className="animate-fadeIn">
          <h1 style={s.h1}>Configure AI Generator</h1>
          <p style={s.p}>
            DSA Recall uses AI (Gemini, Claude, or Groq) to automatically generate structured recall cards from any LeetCode problem description.
          </p>

          <div style={s.configPanel}>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  style={{
                    ...s.providerBtn,
                    ...(providerId === p.id ? s.providerBtnActive : {}),
                  }}
                >
                  <span style={{ fontSize: 16 }}>{p.logo}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    {p.id === "anthropic" ? "Claude" : p.id === "gemini" ? "Gemini" : "Groq"}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label htmlFor={`onboarding-api-key-${providerId}`} style={s.label}>API Key for {currentProvider.name}</label>
              <input
                id={`onboarding-api-key-${providerId}`}
                name={`onboarding_api_key_${providerId}`}
                type="password"
                value={keys[providerId]}
                onChange={(e) => setKey(providerId, e.target.value)}
                placeholder={`Enter your ${currentProvider.name} API key...`}
                style={s.input}
              />
              <p style={{ fontSize: 11, color: "var(--caption)", margin: "4px 0 0", lineHeight: 1.4 }}>
                {providerId === "gemini" 
                  ? "💡 Highly recommended: Gemini offers a generous free tier API key. Get one from Google AI Studio."
                  : `Your API key is saved locally in your browser storage.`}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => setStep(1)} style={s.secondaryBtn} className="btn-press">
              Back
            </button>
            <button onClick={() => setStep(3)} style={s.primaryBtn} className="btn-press">
              Continue
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button onClick={() => setStep(3)} style={s.skipLink}>
              I will configure keys later
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Starter pack import */}
      {step === 3 && (
        <div className="animate-fadeIn">
          <h1 style={s.h1}>Setup Your Library</h1>
          <p style={s.p}>
            You are ready to go! We highly recommend starting with the **Blind 75 Starter Pack** so you have cards to review immediately.
          </p>

          <div style={s.boxAccent}>
            <span style={{ fontSize: 24, marginBottom: 8, display: "block" }}>🎯</span>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>Blind 75 Starter Deck</h3>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              75 essential problems curated for technical interviews (Arrays, Trees, Graphs, DP, Intervals, Greedy, and more).
            </p>
            <button onClick={handleImportBlind75} disabled={importingBlind75} style={s.importBtn} className="btn-press">
              {importingBlind75 ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Importing…
                </span>
              ) : (
                "📥 Import Blind 75 & Start Free"
              )}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => setStep(2)} style={s.secondaryBtn} className="btn-press">
              Back
            </button>
            <button onClick={onComplete} style={s.primaryBtn} className="btn-press">
              Start Empty Library →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 480,
    margin: "4rem auto",
    padding: "0 1.25rem 3rem",
  },
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--accent)",
  },
  progressTrack: {
    height: 4,
    background: "var(--border)",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "var(--accent)",
    transition: "width 0.3s ease",
  },
  h1: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    fontWeight: 600,
    margin: "0 0 10px",
    color: "var(--ink)",
  },
  p: {
    fontSize: 14,
    color: "var(--ink-soft)",
    lineHeight: 1.6,
    margin: "0 0 20px",
  },
  box: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "16px 18px",
    marginBottom: 24,
    boxShadow: "var(--shadow-sm)",
  },
  boxAccent: {
    background: "var(--accent-soft)",
    border: "1px solid var(--accent)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 18px",
    marginBottom: 24,
    textAlign: "center" as const,
  },
  primaryBtn: {
    flex: 1,
    width: "100%",
    padding: "12px 0",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "12px 24px",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    color: "var(--ink-soft)",
  },
  skipLink: {
    background: "none",
    border: "none",
    fontSize: 12,
    color: "var(--caption)",
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
  },
  configPanel: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "18px",
    marginBottom: 16,
    boxShadow: "var(--shadow-sm)",
  },
  providerBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 0",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    background: "var(--bg)",
    cursor: "pointer",
  },
  providerBtnActive: {
    borderColor: "var(--accent)",
    background: "var(--accent-soft)",
    color: "var(--accent-ink)",
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--caption)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
  },
  importBtn: {
    width: "100%",
    padding: "12px 0",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "var(--shadow)",
  },
};
