import { useState } from "react";
import { generateFlashCard, PROVIDERS } from "../../lib/llm";
import type { ProviderId } from "../../lib/llm";
import { initSM2 } from "../../lib/sm2";
import type { FlashCard } from "../../types";

interface Props {
  providerId: ProviderId;
  model: string;
  apiKey: string;
  onCardCreated: (card: FlashCard) => void;
  onNeedApiKey: () => void;
}

export function GenerateCard({ providerId, model, apiKey, onCardCreated, onNeedApiKey }: Props) {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const provider = PROVIDERS.find((p) => p.id === providerId)!;

  async function handleGenerate() {
    if (!text.trim()) return;
    if (!apiKey) { onNeedApiKey(); return; }

    setLoading(true);
    setError(null);

    try {
      const partial = await generateFlashCard(text, providerId, apiKey, model);
      const card: FlashCard = {
        ...partial,
        id: crypto.randomUUID(),
        source_text: text,
        created_at: new Date().toISOString(),
        ...initSM2(),
      };
      onCardCreated(card);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <h2 style={styles.heading}>Generate a card</h2>
        {/* Active provider badge */}
        <div style={styles.providerBadge}>
          <span>{provider.logo}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}>{provider.name.split(" ")[0]}</span>
          <span style={{ fontSize: 10, color: "var(--caption)" }}>
            {provider.models.find((m) => m.id === model)?.label.split(" (")[0]}
          </span>
        </div>
      </div>
      <p style={styles.sub}>
        Paste a problem description — from LeetCode, Codeforces, or anywhere.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={12}
        style={styles.textarea}
        disabled={loading}
      />

      {error && (
        <div style={styles.error}>⚠ {error}</div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
        <button
          onClick={handleGenerate}
          disabled={loading || !text.trim()}
          style={{ ...styles.btn, opacity: loading || !text.trim() ? 0.5 : 1 }}
        >
          {loading ? "Generating…" : "Generate card →"}
        </button>
        <span style={{ fontSize: 12, color: "var(--caption)" }}>{provider.freeNote}</span>
      </div>

      <div style={styles.tip}>
        <strong>Tips for better cards</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "1.2rem", lineHeight: 1.8, fontSize: 13 }}>
          <li>Include constraints — they hint at the expected complexity</li>
          <li>Include examples — they help the model identify the pattern</li>
          <li>Paste the full problem description, not just the title</li>
        </ul>
      </div>
    </div>
  );
}

const PLACEHOLDER = `Example — paste something like:

Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Constraints: 2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9`;

const styles: Record<string, React.CSSProperties> = {
  heading:       { fontSize: 21, fontWeight: 600, margin: "0 0 6px", color: "var(--ink)", fontFamily: "var(--font-display)" },
  sub:           { fontSize: 14, color: "var(--caption)", margin: "0 0 20px", lineHeight: 1.6 },
  providerBadge: { display: "flex", alignItems: "center", gap: 5, background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "5px 10px" },
  textarea:      { width: "100%", boxSizing: "border-box" as const, padding: "12px 14px", fontSize: 13, fontFamily: "var(--font-mono)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius)", resize: "vertical" as const, outline: "none", lineHeight: 1.6, color: "var(--ink)", background: "var(--bg-raised)" },
  btn:           { padding: "10px 20px", background: "var(--ink)", color: "var(--bg-raised)", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  error:         { marginTop: 12, padding: "10px 14px", background: "var(--hard-soft)", border: "1px solid var(--hard-soft)", borderRadius: "var(--radius)", color: "var(--urgent)", fontSize: 14 },
  tip:           { marginTop: 24, padding: "14px 16px", background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--ink-soft)" },
};
