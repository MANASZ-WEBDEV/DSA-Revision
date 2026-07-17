import { useState } from "react";
import { generateFlashCard, PROVIDERS, PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";
import type { ProviderId, ComplexityCorrection } from "../../lib/llm";
import type { CodeLanguage } from "../layout/LanguageIcon";
import { initSM2 } from "../../lib/sm2";
import type { FlashCard, PatternTag } from "../../types";
import { checkDuplicateCard } from "../../lib/duplicateCheck";
import { ProviderIcon } from "../layout/ProviderIcon";

interface Props {
  cards: FlashCard[];
  providerId: ProviderId;
  model: string;
  apiKey: string;
  codeLanguage: CodeLanguage;
  onCardCreated: (card: FlashCard) => void;
  onNeedApiKey: () => void;
}

const DIFFICULTY_OPTIONS: FlashCard["difficulty"][] = ["Easy", "Medium", "Hard"];

export function GenerateCard({ cards, providerId, model, apiKey, codeLanguage, onCardCreated, onNeedApiKey }: Props) {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [hint, setHint]       = useState<string | null>(null);
  const [lastText, setLastText] = useState<string | null>(null); // for Regenerate
  
  // Preview and customization state
  const [pendingCard, setPendingCard] = useState<FlashCard | null>(null);
  const [fuzzyMatch, setFuzzyMatch] = useState<{ similarity: number; title: string } | null>(null);
  const [showPatternSelector, setShowPatternSelector] = useState(false);
  const [complexityCorrections, setComplexityCorrections] = useState<ComplexityCorrection[]>([]);

  const provider = PROVIDERS.find((p) => p.id === providerId)!;

  async function handleGenerate(inputText?: string) {
    const problem = inputText ?? text;
    if (!problem.trim()) {
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
      const { card: partial, corrections } = await generateFlashCard(problem, providerId, apiKey, model, codeLanguage);
      const card: FlashCard = {
        ...partial,
        id: crypto.randomUUID(),
        source_text: problem,
        created_at: new Date().toISOString(),
        ...initSM2(),
      } as FlashCard;

      setComplexityCorrections(corrections);

      // Perform duplicate checking
      const dupCheck = checkDuplicateCard({ ...card, source_text: problem }, cards);

      if (dupCheck.isExact) {
        setError(`Exact duplicate blocked: "${dupCheck.matchedCard?.title}" already exists in your library.`);
        setLoading(false);
        return;
      }

      if (dupCheck.isFuzzy && dupCheck.matchedCard) {
        setFuzzyMatch({
          similarity: dupCheck.similarity || 0,
          title: dupCheck.matchedCard.title
        });
      }

      setPendingCard(card);
      setLastText(problem); // save for regenerate
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const handleUpdatePendingField = (field: keyof FlashCard, value: any) => {
    if (!pendingCard) return;
    setPendingCard({
      ...pendingCard,
      [field]: value
    });
  };

  const handleTogglePattern = (pattern: string) => {
    if (!pendingCard) return;
    const current = pendingCard.patterns || [];
    const updated = current.includes(pattern as PatternTag)
      ? current.filter(p => p !== pattern)
      : [...current, pattern as PatternTag];
    handleUpdatePendingField("patterns", updated);
  };

  const handleSaveCard = () => {
    if (!pendingCard) return;
    onCardCreated(pendingCard);
    setPendingCard(null);
    setFuzzyMatch(null);
  };

  return (
    <div className="animate-fadeInUp generate-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <h2 style={styles.heading}>{pendingCard ? "Verify & Customize Card" : "Generate a card"}</h2>
        {/* Active provider badge */}
        {!pendingCard && (
          <div style={styles.providerBadge}>
            <ProviderIcon id={provider.id} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}>
              {(() => {
                const providerShortName = provider.name.split(" ")[0]; // e.g. "Claude", "Gemini", "Groq"
                const modelLabel = provider.models.find((m) => m.id === model)?.label.split(" (")[0] || "";
                if (modelLabel.toLowerCase().startsWith(providerShortName.toLowerCase())) {
                  return modelLabel;
                }
                return `${providerShortName} ${modelLabel}`;
              })()}
            </span>
          </div>
        )}
      </div>

      {pendingCard ? (
        /* Preview & Customize Mode */
        <div className="animate-fadeIn" style={styles.previewContainer}>
          {fuzzyMatch ? (
            <div style={styles.warningBanner}>
              <strong>⚠️ Similar Card Found ({fuzzyMatch.similarity}% match):</strong> "{fuzzyMatch.title}" already exists in your library.
            </div>
          ) : (
            <div style={styles.successBanner}>
              <strong>🎉 Generation complete!</strong> Verify details and customize tags/difficulty before saving.
            </div>
          )}

          {complexityCorrections.length > 0 && (
            <div style={styles.correctionBanner}>
              <strong>⚡ Complexity corrected:</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: "1.2rem", lineHeight: 1.6 }}>
                {complexityCorrections.map((c, i) => (
                  <li key={i}>
                    {c.approachLabel} {c.field}: <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{c.original}</span> → <strong>{c.corrected}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={styles.previewForm}>
            {/* Title */}
            <div style={styles.fieldRow}>
              <label htmlFor="preview-title" style={styles.fieldLabel}>Problem Title</label>
              <input
                id="preview-title"
                name="preview_title"
                type="text"
                value={pendingCard.title}
                onChange={(e) => handleUpdatePendingField("title", e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Difficulty */}
            <div style={styles.fieldRow}>
              <label style={styles.fieldLabel}>Difficulty</label>
              <div style={{ display: "flex", gap: 8 }}>
                {DIFFICULTY_OPTIONS.map((diff) => {
                  const active = pendingCard.difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => handleUpdatePendingField("difficulty", diff)}
                      style={{
                        ...styles.diffChip,
                        ...(active ? styles.diffChipActive[diff] : {})
                      }}
                      className="btn-press"
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pattern Tags */}
            <div style={styles.fieldRow}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={styles.fieldLabel}>Patterns</label>
                <button
                  type="button"
                  onClick={() => setShowPatternSelector(!showPatternSelector)}
                  style={styles.toggleTagsBtn}
                >
                  {showPatternSelector ? "Hide All Patterns" : "+ Manage Patterns"}
                </button>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {pendingCard.patterns.map((p) => (
                  <span
                    key={p}
                    onClick={() => handleTogglePattern(p)}
                    style={{
                      ...styles.patternBadge,
                      background: PATTERN_COLORS[p] ?? "var(--bg-sunken)",
                      color: PATTERN_TEXT_COLORS[p] ?? "var(--ink-soft)",
                      cursor: "pointer"
                    }}
                    title="Click to remove"
                  >
                    {p} ✕
                  </span>
                ))}
                {pendingCard.patterns.length === 0 && (
                  <span style={{ fontSize: 12, color: "var(--caption)", fontStyle: "italic" }}>No patterns selected</span>
                )}
              </div>

              {showPatternSelector && (
                <div style={styles.patternGrid}>
                  {Object.keys(PATTERN_COLORS).map((p) => {
                    const selected = pendingCard.patterns.includes(p as PatternTag);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleTogglePattern(p)}
                        style={{
                          ...styles.gridPatternBadge,
                          ...(selected ? {
                            background: PATTERN_COLORS[p],
                            color: PATTERN_TEXT_COLORS[p],
                            borderColor: PATTERN_TEXT_COLORS[p]
                          } : {})
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recall Trigger */}
            <div style={styles.fieldRow}>
              <label htmlFor="preview-trigger" style={styles.fieldLabel}>Recall Trigger</label>
              <input
                id="preview-trigger"
                name="preview_trigger"
                type="text"
                value={pendingCard.recall_trigger}
                onChange={(e) => handleUpdatePendingField("recall_trigger", e.target.value)}
                style={styles.input}
                placeholder="The single cue/trigger word/phrase that reminds you of this problem..."
              />
            </div>

            {/* Summary */}
            <div style={styles.fieldRow}>
              <label htmlFor="preview-summary" style={styles.fieldLabel}>Problem Summary</label>
              <textarea
                id="preview-summary"
                name="preview_summary"
                value={pendingCard.problem_summary}
                onChange={(e) => handleUpdatePendingField("problem_summary", e.target.value)}
                rows={3}
                style={styles.textarea}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              onClick={handleSaveCard}
              style={{ ...styles.btn, background: "var(--accent)", color: "#fff" }}
              className="btn-press"
            >
              Save Card & Add to Library
            </button>
            <button
              onClick={() => {
                setPendingCard(null);
                setFuzzyMatch(null);
              }}
              style={{ ...styles.btn, background: "none", border: "1px solid var(--border-strong)", color: "var(--ink-soft)" }}
              className="btn-press"
            >
              Discard Card
            </button>
          </div>
        </div>
      ) : (
        /* Regular input view */
        <>
          <p style={styles.sub}>
            Paste a problem description — from LeetCode, Codeforces, or anywhere.
          </p>

          <div style={{ position: "relative" }}>
            <textarea
              id="problem-description"
              name="problem_description"
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
                onClick={() => handleGenerate()}
                disabled={loading}
                style={{
                  ...styles.btn,
                  ...(loading ? { opacity: 0.6, cursor: "wait" } : !text.trim() ? { background: "var(--border-strong)", color: "var(--caption)", cursor: "default" } : {}),
                }}
                className="btn-press"
              >
                {loading ? "Generating…" : "Generate card →"}
              </button>
              {!loading && !text.trim() && lastText && (
                <button
                  onClick={() => handleGenerate(lastText)}
                  style={styles.regenBtn}
                  className="btn-press"
                  title="Re-generate a card from the last problem"
                >
                  ↻ Regenerate
                </button>
              )}
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

const styles: Record<string, any> = {
  heading:       { fontSize: 21, fontWeight: 600, margin: "0 0 6px", color: "var(--ink)", fontFamily: "var(--font-display)" },
  sub:           { fontSize: 14, color: "var(--caption)", margin: "0 0 12px", lineHeight: 1.6 },
  providerBadge: { display: "flex", alignItems: "center", gap: 5, background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "5px 10px" },
  textarea:      { width: "100%", boxSizing: "border-box" as const, padding: "12px 14px", fontSize: 13, border: "1px solid var(--border-strong)", borderRadius: "var(--radius)", resize: "none" as const, outline: "none", lineHeight: 1.6, color: "var(--ink)", background: "var(--bg-raised)" },
  input:         { width: "100%", boxSizing: "border-box" as const, padding: "10px 12px", fontSize: 13, border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", outline: "none", color: "var(--ink)", background: "var(--bg-raised)" },
  btn:           { padding: "10px 20px", background: "var(--ink)", color: "var(--bg-raised)", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  regenBtn:      { padding: "10px 16px", background: "none", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  error:         { marginTop: 12, padding: "10px 14px", background: "var(--hard-soft)", border: "1px solid var(--hard-soft)", borderRadius: "var(--radius)", color: "var(--urgent)", fontSize: 14 },
  tip:           { marginTop: 16, padding: "14px 16px", background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--ink-soft)" },
  hint: { fontSize: 13, color: "var(--medium)", padding: "8px 12px", background: "var(--medium-soft)", borderRadius: "var(--radius-sm)", border: "1px solid var(--medium)", lineHeight: 1.4 },
  pasteExampleChip: { position: "absolute" as const, top: 8, right: 8, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, border: "1px solid var(--border-strong)", background: "var(--bg-sunken)", color: "var(--ink-soft)", cursor: "pointer", transition: "background 0.15s ease", zIndex: 1 },

  // Preview & Customize styles
  previewContainer: { display: "flex", flexDirection: "column", gap: 16, background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", margin: "12px 0", boxShadow: "var(--shadow-lg)" },
  warningBanner: { padding: "10px 14px", background: "var(--hard-soft)", border: "1px solid color-mix(in srgb, var(--urgent) 30%, transparent)", borderRadius: "var(--radius-sm)", color: "var(--urgent)", fontSize: 13.5, lineHeight: 1.5 },
  successBanner: { padding: "10px 14px", background: "var(--easy-soft)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius: "var(--radius-sm)", color: "var(--accent-ink)", fontSize: 13.5, lineHeight: 1.5 },
  correctionBanner: { padding: "10px 14px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "var(--radius-sm)", color: "#1e40af", fontSize: 13, lineHeight: 1.5 },
  previewForm: { display: "flex", flexDirection: "column", gap: 14 },
  fieldRow: { display: "flex", flexDirection: "column" as const, gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: 600, color: "var(--caption)", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  
  diffChip: { padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 20, border: "1px solid var(--border-strong)", background: "var(--bg-sunken)", color: "var(--ink-soft)", cursor: "pointer", transition: "all 0.12s ease" },
  diffChipActive: {
    Easy: { background: "var(--easy-soft)", color: "var(--accent-ink)", borderColor: "var(--accent)" },
    Medium: { background: "var(--medium-soft)", color: "var(--medium)", borderColor: "var(--medium)" },
    Hard: { background: "var(--hard-soft)", color: "var(--urgent-ink)", borderColor: "var(--urgent)" }
  },
  toggleTagsBtn: { fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" },
  patternBadge: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4 },
  patternGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 6, maxHeight: 180, overflowY: "auto" as const, padding: 8, background: "var(--bg-sunken)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" },
  gridPatternBadge: { fontSize: 11, fontWeight: 500, padding: "5px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-raised)", color: "var(--ink-soft)", cursor: "pointer", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" as const, textAlign: "left" as const, transition: "all 0.12s ease" }
};
