import { useState } from "react";
import { generateFlashCard, PROVIDERS } from "../../lib/llm";
import type { ProviderId } from "../../lib/llm";
import { initSM2 } from "../../lib/sm2";
import type { FlashCard } from "../../types";
import { checkDuplicateCard } from "../../lib/duplicateCheck";
import { ProviderIcon } from "../layout/ProviderIcon";

interface Props {
  cards: FlashCard[];
  providerId: ProviderId;
  model: string;
  apiKey: string;
  onCardCreated: (card: FlashCard) => void;
  onNeedApiKey: () => void;
}

export function GenerateCard({ cards, providerId, model, apiKey, onCardCreated, onNeedApiKey }: Props) {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [hint, setHint]       = useState<string | null>(null);
  
  // State for fuzzy match warnings
  const [pendingCard, setPendingCard] = useState<FlashCard | null>(null);
  const [fuzzyMatch, setFuzzyMatch] = useState<{ similarity: number; title: string } | null>(null);

  const provider = PROVIDERS.find((p) => p.id === providerId)!;

  async function handleGenerate() {
    if (!text.trim()) {
      setHint("Paste a problem description above to generate a card");
      return;
    }
    setHint(null);
    if (!apiKey) { onNeedApiKey(); return; }

    setLoading(true);
    setError(null);
    setPendingCard(null);
    setFuzzyMatch(null);

    try {
      const partial = await generateFlashCard(text, providerId, apiKey, model);
      const card: FlashCard = {
        ...partial,
        id: crypto.randomUUID(),
        source_text: text,
        created_at: new Date().toISOString(),
        ...initSM2(),
      };

      // Perform duplicate checking
      const dupCheck = checkDuplicateCard({ ...card, source_text: text }, cards);

      if (dupCheck.isExact) {
        setError(`Exact duplicate blocked: "${dupCheck.matchedCard?.title}" already exists in your library.`);
        setLoading(false);
        return;
      }

      if (dupCheck.isFuzzy && dupCheck.matchedCard) {
        setPendingCard(card);
        setFuzzyMatch({
          similarity: dupCheck.similarity || 0,
          title: dupCheck.matchedCard.title
        });
        setLoading(false);
        return;
      }

      onCardCreated(card);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fadeInUp generate-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <h2 style={styles.heading}>Generate a card</h2>
        {/* Active provider badge */}
        <div style={styles.providerBadge}>
          <ProviderIcon id={provider.id} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}>{provider.name.split(" ")[0]}</span>
          <span style={{ fontSize: 10, color: "var(--caption)" }}>
            {provider.models.find((m) => m.id === model)?.label.split(" (")[0]}
          </span>
        </div>
      </div>
      <p style={styles.sub}>
        Paste a problem description — from LeetCode, Codeforces, or anywhere.
      </p>

      {/* Fuzzy Duplicate Warning Dialog */}
      {fuzzyMatch && pendingCard && (
        <div className="animate-fadeIn" style={styles.warningContainer}>
          <h3 style={styles.warningTitle}>⚠️ Similar Card Found</h3>
          <p style={styles.warningText}>
            The generated card "<strong>{pendingCard.title}</strong>" appears to be a duplicate of an existing card in your library:
          </p>
          <div style={styles.matchCard}>
            <strong>{fuzzyMatch.title}</strong>
            <span style={styles.matchPercentage}>{fuzzyMatch.similarity}% match</span>
          </div>
          <p style={styles.warningText}>Do you still want to add this card?</p>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              onClick={() => {
                onCardCreated(pendingCard);
                setPendingCard(null);
                setFuzzyMatch(null);
                setText("");
              }}
              style={{ ...styles.btn, background: "var(--accent)", color: "#fff" }}
              className="btn-press"
            >
              Add Anyway
            </button>
            <button
              onClick={() => {
                setPendingCard(null);
                setFuzzyMatch(null);
              }}
              style={{ ...styles.btn, background: "none", border: "1px solid var(--border-strong)", color: "var(--ink-soft)" }}
              className="btn-press"
            >
              Discard Duplicate
            </button>
          </div>
        </div>
      )}

      {/* Main input generation controls */}
      {!fuzzyMatch && (
        <>
          <div style={{ position: "relative" }}>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); if (hint) setHint(null); }}
              placeholder={PLACEHOLDER}
              rows={8}
              style={{ ...styles.textarea, paddingTop: 32 }}
              disabled={loading}
            />
            {!text && !loading && (
              <button
                onClick={() => { setText(EXAMPLE_PROBLEM); setHint(null); }}
                style={styles.pasteExampleChip}
                className="btn-press"
              >
                Paste example
              </button>
            )}
          </div>

          {error && (
            <div style={styles.error}>⚠ {error}</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 12, marginTop: 0, alignItems: "center" }}>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  ...styles.btn,
                  ...(loading ? { opacity: 0.6, cursor: "wait" } : !text.trim() ? { background: "var(--border-strong)", color: "var(--caption)", cursor: "default" } : {}),
                }}
                className="btn-press"
              >
                {loading ? "Generating…" : "Generate card →"}
              </button>
              <span style={{ fontSize: 12, color: "var(--caption)" }}>{provider.freeNote}</span>
            </div>
            {hint && !text.trim() && (
              <div className="animate-fadeIn" style={styles.hint}>
                {hint}
              </div>
            )}
          </div>
        </>
      )}

      <div style={styles.tip}>
        <strong>Tips for better cards</strong>
        <ul style={{ margin: "4px 0 0", paddingLeft: "1.2rem", lineHeight: 1.7, fontSize: 13 }}>
          <li>Include constraints — they hint at the expected complexity</li>
          <li>Include examples — they help the model identify the pattern</li>
          <li>Paste the full problem description, not just the title</li>
        </ul>
      </div>
    </div>
  );
}

const PLACEHOLDER = `Paste a problem description here...

e.g. "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."`;

const EXAMPLE_PROBLEM = `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Constraints: 2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9`;

const styles: Record<string, React.CSSProperties> = {
  heading:       { fontSize: 21, fontWeight: 600, margin: "0 0 6px", color: "var(--ink)", fontFamily: "var(--font-display)" },
  sub:           { fontSize: 14, color: "var(--caption)", margin: "0 0 12px", lineHeight: 1.6 },
  providerBadge: { display: "flex", alignItems: "center", gap: 5, background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "5px 10px" },
  textarea:      { width: "100%", boxSizing: "border-box" as const, padding: "12px 14px", fontSize: 13, fontFamily: "var(--font-mono)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius)", resize: "none" as const, outline: "none", lineHeight: 1.6, color: "var(--ink)", background: "var(--bg-raised)" },
  btn:           { padding: "10px 20px", background: "var(--ink)", color: "var(--bg-raised)", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  error:         { marginTop: 12, padding: "10px 14px", background: "var(--hard-soft)", border: "1px solid var(--hard-soft)", borderRadius: "var(--radius)", color: "var(--urgent)", fontSize: 14 },
  tip:           { marginTop: 16, padding: "14px 16px", background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--ink-soft)" },
  warningContainer: { display: "flex", flexDirection: "column", gap: 12, background: "var(--bg-raised)", border: "1px solid var(--medium)", borderRadius: "var(--radius-lg)", padding: "20px", margin: "12px 0", boxShadow: "var(--shadow-lg)" },
  warningTitle: { fontSize: 16, fontWeight: 600, color: "var(--urgent)", margin: 0 },
  warningText: { fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 },
  matchCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-sunken)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius)", padding: "10px 14px", fontSize: 13.5 },
  matchPercentage: { fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: 12 },
  hint: { fontSize: 13, color: "var(--medium)", padding: "8px 12px", background: "var(--medium-soft)", borderRadius: "var(--radius-sm)", border: "1px solid var(--medium)", lineHeight: 1.4 },
  pasteExampleChip: { position: "absolute" as const, top: 8, right: 8, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, border: "1px solid var(--border-strong)", background: "var(--bg-sunken)", color: "var(--ink-soft)", cursor: "pointer", transition: "background 0.15s ease", zIndex: 1 }
};
