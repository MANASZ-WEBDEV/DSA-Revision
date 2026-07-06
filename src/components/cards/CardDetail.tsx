import { useState, useEffect, useRef } from "react";
import type { FlashCard, Approach } from "../../types";
import { PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";
import { nextReviewLabel, getBestBigO, formatRelativeTime } from "../../lib/sm2";

interface Props {
  card: FlashCard;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<FlashCard>) => boolean;
  onDelete: (id: string) => void;
}

const DIFFICULTY_VARS: Record<string, { bg: string; text: string }> = {
  Easy:   { bg: "var(--easy-soft)",   text: "var(--accent-ink)" },
  Medium: { bg: "var(--medium-soft)", text: "var(--medium)" },
  Hard:   { bg: "var(--hard-soft)",   text: "var(--urgent-ink)" },
};

export function CardDetail({ card, onBack, onUpdate, onDelete }: Props) {
  const [activeApproach, setActiveApproach] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Notes state
  const [notesText, setNotesText] = useState(card.notes || "");
  const [saveStatus, setSaveStatus] = useState("All changes saved locally");
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    setNotesText(card.notes || "");
    setSaveStatus("All changes saved locally");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, [card.id]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotesText(val);
    setSaveStatus("Saving...");

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const success = onUpdate(card.id, {
        notes: val || undefined,
        notes_updated_at: new Date().toISOString()
      });
      if (success) {
        setSaveStatus("Saved ✔");
      } else {
        setSaveStatus("Failed to save — storage full ⚠");
      }
    }, 600);
  };

  const approach: Approach = card.approaches[activeApproach];
  const diff = DIFFICULTY_VARS[card.difficulty] ?? DIFFICULTY_VARS.Medium;
  const bigO = getBestBigO(card);

  return (
    <div className="animate-fadeInUp" style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={onBack} style={s.backBtn}>← Library</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="numeral" style={{ fontSize: 12, color: "var(--caption)" }}>{nextReviewLabel(card)}</span>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={s.deleteBtn}>Delete</button>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { onDelete(card.id); onBack(); }} style={{ ...s.deleteBtn, background: "var(--hard-soft)", color: "var(--urgent)", borderColor: "var(--hard-soft)" }}>Confirm</button>
              <button onClick={() => setConfirmDelete(false)} style={s.deleteBtn}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...s.card, position: "relative", overflow: "hidden" }}>
        {bigO && <span className="watermark" style={{ fontSize: 80, top: -12 }}>{bigO}</span>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          <span style={{ ...s.badge, background: diff.bg, color: diff.text }}>{card.difficulty}</span>
          {card.deck && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: "var(--accent-soft)", color: "var(--accent)" }}>{card.deck}</span>}
          {card.patterns.map((p) => (
            <span key={p} style={{ ...s.badge, background: PATTERN_COLORS[p] ?? "var(--bg-sunken)", color: PATTERN_TEXT_COLORS[p] ?? "var(--ink-soft)" }}>{p}</span>
          ))}
        </div>
        <h1 style={{ fontSize: 21, fontWeight: 600, margin: "0 0 10px", color: "var(--ink)", fontFamily: "var(--font-display)" }}>{card.title}</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0, lineHeight: 1.65 }}>{card.problem_summary}</p>
      </div>

      <div style={s.recallBox}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--caption)", textTransform: "uppercase", marginBottom: 6 }}>
          Recall trigger
        </div>
        <p style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", margin: 0, lineHeight: 1.5 }}>
          {card.recall_trigger}
        </p>
      </div>

      <div style={{ marginTop: 26 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
          {card.approaches.map((a, i) => (
            <button
              key={i}
              onClick={() => { setActiveApproach(i); setShowHint(false); }}
              style={{ ...s.tab, ...(i === activeApproach ? s.tabActive : {}) }}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div style={s.approachCard}>
          <div style={s.approachRow}>
            <div style={s.approachBlock}>
              <div style={s.fieldLabel}>Intuition</div>
              <p style={s.fieldText}>{approach.intuition}</p>
            </div>
            <div style={s.approachBlock}>
              <div style={s.fieldLabel}>Key observation</div>
              <p style={s.fieldText}>{approach.key_observation}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, margin: "16px 0" }}>
            <div style={s.complexityPill}>
              <span style={s.complexityLabel}>Time</span>
              <code className="numeral" style={s.complexityValue}>{approach.complexity.time}</code>
            </div>
            <div style={s.complexityPill}>
              <span style={s.complexityLabel}>Space</span>
              <code className="numeral" style={s.complexityValue}>{approach.complexity.space}</code>
            </div>
          </div>

          <div style={s.hintSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showHint ? 10 : 0 }}>
              <div style={s.fieldLabel}>Code hint</div>
              <button onClick={() => setShowHint(!showHint)} style={s.revealBtn}>
                {showHint ? "Hide" : "Reveal pseudocode"}
              </button>
            </div>
            {showHint && <pre style={s.codeHint}>{approach.code_hint}</pre>}
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={s.fieldLabel}>
              {activeApproach < card.approaches.length - 1 ? "Why not this approach?" : "Why this is the ceiling"}
            </div>
            <p style={{ ...s.fieldText, color: "var(--caption)" }}>{approach.trade_off}</p>
          </div>
        </div>
      </div>

      {card.edge_cases.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={s.fieldLabel}>Edge cases to remember</div>
          <ul style={{ margin: "8px 0 0", paddingLeft: "1.2rem", lineHeight: 1.85, fontSize: 13, color: "var(--ink-soft)" }}>
            {card.edge_cases.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {card.similar_problems.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={s.fieldLabel}>Similar problems</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {card.similar_problems.map((p, i) => (
              <span key={i} style={{ fontSize: 12, padding: "4px 10px", background: "var(--bg-sunken)", borderRadius: 20, color: "var(--ink-soft)" }}>{p}</span>
            ))}
          </div>
        </div>
      )}
      {/* 📝 Personal Notes Section */}
      <div style={{ marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <div style={s.fieldLabel}>📝 Personal Study Notes</div>
        <textarea
          value={notesText}
          onChange={handleNotesChange}
          placeholder="Write your personal notes, base cases, similar problem links, or key warnings about this question here (autosaves)..."
          style={s.notesTextarea}
          rows={4}
        />
        <div style={{ fontSize: 11, color: "var(--caption)", marginTop: 6, fontStyle: "italic", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{saveStatus}</span>
          {card.notes_updated_at && (
            <span>Last edited {formatRelativeTime(new Date(card.notes_updated_at))}</span>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  backBtn:         { background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer" },
  deleteBtn:       { background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontSize: 12, color: "var(--caption)", cursor: "pointer" },
  card:            { background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 18px", boxShadow: "var(--shadow-sm)" },
  badge:           { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 },
  recallBox:       { marginTop: 16, padding: "14px 16px", background: "var(--medium-soft)", border: "1px solid color-mix(in srgb, var(--medium) 35%, transparent)", borderRadius: "var(--radius)" },
  tab:             { padding: "8px 16px", fontSize: 13, fontWeight: 500, background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", color: "var(--caption)", marginBottom: -1 },
  tabActive:       { color: "var(--ink)", borderBottomColor: "var(--accent)" },
  approachCard:    { background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 18px" },
  approachRow:     { display: "flex", gap: 16, flexWrap: "wrap" },
  approachBlock:   { flex: "1 1 240px" },
  fieldLabel:      { fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "var(--caption)", textTransform: "uppercase" as const, marginBottom: 4 },
  fieldText:       { fontSize: 13, color: "var(--ink-soft)", margin: 0, lineHeight: 1.65 },
  complexityPill:  { display: "flex", gap: 8, alignItems: "center", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px" },
  complexityLabel: { fontSize: 11, color: "var(--caption)", fontWeight: 600 },
  complexityValue: { fontSize: 13, color: "var(--ink)", fontWeight: 600 },
  hintSection:     { marginTop: 16, padding: "12px 14px", background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" },
  revealBtn:       { fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 },
  codeHint:        { margin: 0, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ink)", whiteSpace: "pre-wrap", lineHeight: 1.7, background: "var(--bg-sunken)", padding: "10px 12px", borderRadius: "var(--radius-sm)" },
  notesTextarea: {
    width: "100%",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
    resize: "vertical" as const,
    marginTop: 10,
    fontFamily: "inherit",
    lineHeight: 1.5,
  },
};
