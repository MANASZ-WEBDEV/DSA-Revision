import { useState, useEffect, useRef, useCallback } from "react";
import type { FlashCard, Approach, StudyNote, PatternTag } from "../../types";
import { migrateNote } from "../../types";
import { PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";
import { nextReviewLabel, getBestBigO, formatRelativeTime } from "../../lib/sm2";
import Markdown from "react-markdown";
import { PatternSelector } from "../shared/PatternSelector";

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

// ─── Structured Note Fields Config ──────────────────────────────────────────
const NOTE_FIELDS: { key: keyof Omit<StudyNote, "updatedAt">; label: string; placeholder: string; icon: string }[] = [
  { key: "keyInsight",     label: "Key Insight",        placeholder: "The trick I'd forget — the single 'aha' that unlocks this problem…", icon: "💡" },
  { key: "stuckPoint",     label: "Where I Got Stuck",  placeholder: "I kept trying to… / My reasoning broke down when…",                  icon: "🧱" },
  { key: "mistakeToAvoid", label: "Mistake to Avoid",   placeholder: "Don't forget to handle… / Watch out for…",                           icon: "⚠️" },
];

export function CardDetail({ card, onBack, onUpdate, onDelete }: Props) {
  const [activeApproach, setActiveApproach] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingPatterns, setEditingPatterns] = useState(false);

  // ─── Edit Mode State ───────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<FlashCard["difficulty"]>("Medium");
  const [editSummary, setEditSummary] = useState("");
  const [editTrigger, setEditTrigger] = useState("");
  const [editApproaches, setEditApproaches] = useState<Approach[]>([]);
  const [editPatterns, setEditPatternsState] = useState<PatternTag[]>([]);

  const resetEditStates = useCallback(() => {
    setEditTitle(card.title);
    setEditDifficulty(card.difficulty);
    setEditSummary(card.problem_summary);
    setEditTrigger(card.recall_trigger);
    setEditApproaches(JSON.parse(JSON.stringify(card.approaches)));
    setEditPatternsState([...card.patterns]);
  }, [card]);

  useEffect(() => {
    resetEditStates();
  }, [card, resetEditStates]);

  const handleSaveEdit = () => {
    const success = onUpdate(card.id, {
      title: editTitle,
      difficulty: editDifficulty,
      problem_summary: editSummary,
      recall_trigger: editTrigger,
      approaches: editApproaches,
      patterns: editPatterns,
    });
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    resetEditStates();
    setIsEditing(false);
  };

  // ─── Structured notes state ───────────────────────────────────────────────
  const migrated = migrateNote(card.notes, card.notes_updated_at);
  const [noteFields, setNoteFields] = useState<Partial<StudyNote>>(() => migrated ?? {});
  const [freeformText, setFreeformText] = useState(migrated?.freeform ?? "");
  const [freeformFocused, setFreeformFocused] = useState(false);
  const [saveStatus, setSaveStatus] = useState("All changes saved locally");
  const saveTimeoutRef = useRef<any>(null);

  // Reset notes when card changes
  useEffect(() => {
    const m = migrateNote(card.notes, card.notes_updated_at);
    setNoteFields(m ?? {});
    setFreeformText(m?.freeform ?? "");
    setSaveStatus("All changes saved locally");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, [card.id]);

  // Persist a merged StudyNote to storage
  const persistNote = useCallback((fields: Partial<StudyNote>, freeform: string) => {
    setSaveStatus("Saving…");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const now = new Date().toISOString();
      const note: StudyNote = {
        keyInsight: fields.keyInsight || undefined,
        stuckPoint: fields.stuckPoint || undefined,
        mistakeToAvoid: fields.mistakeToAvoid || undefined,
        freeform: freeform || undefined,
        updatedAt: now,
      };

      // Check if note is entirely empty
      const isEmpty = !note.keyInsight && !note.stuckPoint && !note.mistakeToAvoid && !note.freeform;

      const success = onUpdate(card.id, {
        notes: isEmpty ? undefined : note,
        notes_updated_at: now,
      });
      setSaveStatus(success ? "Saved ✔" : "Failed to save — storage full ⚠");
    }, 600);
  }, [card.id, onUpdate]);

  const handleFieldChange = (key: keyof Omit<StudyNote, "updatedAt">, value: string) => {
    const updated = { ...noteFields, [key]: value };
    setNoteFields(updated);
    persistNote(updated, freeformText);
  };

  const handleFreeformChange = (value: string) => {
    setFreeformText(value);
    persistNote(noteFields, value);
  };

  const approach: Approach = card.approaches[activeApproach];
  const diff = DIFFICULTY_VARS[card.difficulty] ?? DIFFICULTY_VARS.Medium;
  const bigO = getBestBigO(card);

  // Get the latest updatedAt from the note
  const noteUpdatedAt = (typeof card.notes === "object" && card.notes?.updatedAt) 
    ? card.notes.updatedAt 
    : card.notes_updated_at;

  return (
    <div className="animate-fadeInUp" style={{ 
      maxWidth: 720, 
      margin: "0 auto", 
      padding: "1.5rem 1rem", 
      viewTransitionName: `card-${card.id}` as any
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={onBack} style={s.backBtn}>← Library</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="numeral" style={{ fontSize: 12, color: "var(--caption)" }}>{nextReviewLabel(card)}</span>
          {card.is_leech && !isEditing && (
            <button
              onClick={() => {
                onUpdate(card.id, { leech_count: 0, is_leech: false });
              }}
              style={s.unleechBtn}
              className="btn-press"
            >
              🔄 Un-leech
            </button>
          )}
          {isEditing ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSaveEdit} style={s.saveBtn} className="btn-press">Save</button>
              <button onClick={handleCancelEdit} style={s.cancelBtn} className="btn-press">Cancel</button>
            </div>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} style={s.editBtn} className="btn-press">Edit</button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} style={s.deleteBtn}>Delete</button>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { onDelete(card.id); onBack(); }} style={{ ...s.deleteBtn, background: "var(--hard-soft)", color: "var(--urgent)", borderColor: "var(--hard-soft)" }}>Confirm</button>
                  <button onClick={() => setConfirmDelete(false)} style={s.deleteBtn}>Cancel</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", margin: "0 0 10px", fontFamily: "var(--font-display)" }}>Edit Card Details</h2>
          
          <div style={s.editFieldGroup}>
            <label style={s.editLabel}>Problem Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={s.editInput}
            />
          </div>

          <div style={s.editFieldGroup}>
            <label style={s.editLabel}>Difficulty</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["Easy", "Medium", "Hard"] as const).map((diffOption) => {
                const active = editDifficulty === diffOption;
                const diffStyles = DIFFICULTY_VARS[diffOption];
                return (
                  <button
                    key={diffOption}
                    type="button"
                    onClick={() => setEditDifficulty(diffOption)}
                    style={{
                      ...s.diffChip,
                      ...(active ? { background: diffStyles.bg, color: diffStyles.text, borderColor: "var(--border-strong)" } : {})
                    }}
                    className="btn-press"
                  >
                    {diffOption}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={s.editFieldGroup}>
            <label style={s.editLabel}>Patterns</label>
            <PatternSelector
              selectedPatterns={editPatterns}
              onToggle={(pattern: string) => {
                setEditPatternsState((prev) =>
                  prev.includes(pattern as PatternTag)
                    ? prev.filter((p) => p !== pattern)
                    : [...prev, pattern as PatternTag]
                );
              }}
              showGridByDefault={true}
            />
          </div>

          <div style={s.editFieldGroup}>
            <label style={s.editLabel}>Problem Summary</label>
            <textarea
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              rows={3}
              style={s.editTextarea}
            />
          </div>

          <div style={s.editFieldGroup}>
            <label style={s.editLabel}>Recall Trigger</label>
            <input
              type="text"
              value={editTrigger}
              onChange={(e) => setEditTrigger(e.target.value)}
              style={s.editInput}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={s.editLabel}>Approaches</label>
            <div className="approach-tabs-pill" style={{ margin: "6px 0 12px" }}>
              {editApproaches.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveApproach(i)}
                  className={`approach-tab-pill ${i === activeApproach ? "active" : ""}`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {editApproaches[activeApproach] && (
              <div style={s.editApproachContainer}>
                <div style={s.editApproachRow}>
                  <div style={s.editApproachBlock}>
                    <label style={s.editLabel}>Intuition</label>
                    <textarea
                      value={editApproaches[activeApproach].intuition}
                      onChange={(e) => {
                        const next = [...editApproaches];
                        next[activeApproach] = { ...next[activeApproach], intuition: e.target.value };
                        setEditApproaches(next);
                      }}
                      rows={3}
                      style={s.editTextarea}
                    />
                  </div>
                  <div style={s.editApproachBlock}>
                    <label style={s.editLabel}>Key Observation</label>
                    <textarea
                      value={editApproaches[activeApproach].key_observation}
                      onChange={(e) => {
                        const next = [...editApproaches];
                        next[activeApproach] = { ...next[activeApproach], key_observation: e.target.value };
                        setEditApproaches(next);
                      }}
                      rows={3}
                      style={s.editTextarea}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, margin: "8px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <label style={s.editLabel}>Time Complexity</label>
                    <input
                      type="text"
                      value={editApproaches[activeApproach].complexity.time}
                      onChange={(e) => {
                        const next = [...editApproaches];
                        next[activeApproach] = {
                          ...next[activeApproach],
                          complexity: { ...next[activeApproach].complexity, time: e.target.value }
                        };
                        setEditApproaches(next);
                      }}
                      style={s.editInput}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <label style={s.editLabel}>Space Complexity</label>
                    <input
                      type="text"
                      value={editApproaches[activeApproach].complexity.space}
                      onChange={(e) => {
                        const next = [...editApproaches];
                        next[activeApproach] = {
                          ...next[activeApproach],
                          complexity: { ...next[activeApproach].complexity, space: e.target.value }
                        };
                        setEditApproaches(next);
                      }}
                      style={s.editInput}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  <label style={s.editLabel}>Code Hint</label>
                  <textarea
                    value={editApproaches[activeApproach].code_hint}
                    onChange={(e) => {
                      const next = [...editApproaches];
                      next[activeApproach] = { ...next[activeApproach], code_hint: e.target.value };
                      setEditApproaches(next);
                    }}
                    rows={6}
                    style={{ ...s.editTextarea, fontFamily: "var(--font-mono)", fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  <label style={s.editLabel}>{activeApproach < editApproaches.length - 1 ? "Why not this approach?" : "Why this is the ceiling"}</label>
                  <textarea
                    value={editApproaches[activeApproach].trade_off}
                    onChange={(e) => {
                      const next = [...editApproaches];
                      next[activeApproach] = { ...next[activeApproach], trade_off: e.target.value };
                      setEditApproaches(next);
                    }}
                    rows={3}
                    style={s.editTextarea}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ ...s.card, position: "relative", overflow: "hidden" }}>
            {bigO && <span className="watermark" style={{ fontSize: 80, top: -12 }}>{bigO}</span>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
              <span style={{ ...s.badge, background: diff.bg, color: diff.text }}>{card.difficulty}</span>
              {card.is_leech && (
                <span style={{ ...s.badge, background: "var(--hard-soft)", color: "var(--hard)", border: "1px solid var(--hard)" }}>
                  ⚠️ Leech (Needs Re-learning)
                </span>
              )}
              {card.deck && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: "var(--accent-soft)", color: "var(--accent)" }}>{card.deck}</span>}
              {!editingPatterns && (
                <>
                  {card.patterns.map((p) => (
                    <span key={p} style={{ ...s.badge, background: PATTERN_COLORS[p] ?? "var(--bg-sunken)", color: PATTERN_TEXT_COLORS[p] ?? "var(--ink-soft)" }}>{p}</span>
                  ))}
                  <button
                    onClick={() => setEditingPatterns(true)}
                    style={s.editPatternsBtn}
                    className="btn-press"
                    title="Edit patterns"
                  >
                    ✎
                  </button>
                </>
              )}
            </div>
            {editingPatterns && (
              <div style={{ marginBottom: 10 }}>
                <PatternSelector
                  selectedPatterns={[...card.patterns]}
                  onToggle={(pattern: string) => {
                    const current = card.patterns || [];
                    const updated = current.includes(pattern as PatternTag)
                      ? current.filter(p => p !== pattern)
                      : [...current, pattern as PatternTag];
                    onUpdate(card.id, { patterns: updated });
                  }}
                  showGridByDefault={true}
                />
                <button
                  onClick={() => setEditingPatterns(false)}
                  style={s.doneEditingBtn}
                  className="btn-press"
                >
                  Done
                </button>
              </div>
            )}
            <h1 style={{ fontSize: 21, fontWeight: 600, margin: "0 0 10px", color: "var(--ink)", fontFamily: "var(--font-display)" }}>{card.title}</h1>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0, lineHeight: 1.65 }}>{card.problem_summary}</p>
            {(card.last_approach_recall || card.last_implementation_recall) && (
              <div style={{ display: "flex", gap: 12, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--caption)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Last Review:
                </span>
                {card.last_approach_recall && (
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    Approach: <strong style={{ textTransform: "capitalize", color: card.last_approach_recall === "yes" ? "var(--easy)" : card.last_approach_recall === "partial" ? "var(--medium)" : "var(--hard)" }}>{card.last_approach_recall}</strong>
                  </span>
                )}
                {card.last_implementation_recall && (
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    Implementation: <strong style={{ textTransform: "capitalize", color: card.last_implementation_recall === "yes" ? "var(--easy)" : card.last_implementation_recall === "partial" ? "var(--medium)" : "var(--hard)" }}>{card.last_implementation_recall}</strong>
                  </span>
                )}
              </div>
            )}
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
            <div className="approach-tabs-pill">
              {card.approaches.map((a, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveApproach(i); setShowHint(false); }}
                  className={`approach-tab-pill ${i === activeApproach ? "active" : ""}`}
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
                {showHint && (
                  <div style={{ marginTop: 8 }}>
                    <Markdown
                      components={{
                        p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
                        code: ({ children, className }) => {
                          const isBlock = className?.includes("language-") || !className;
                          return isBlock
                            ? <pre style={s.codeHint}><code>{children}</code></pre>
                            : <code style={s.inlineCode}>{children}</code>;
                        },
                        pre: ({ children }) => <>{children}</>
                      }}
                    >
                      {approach.code_hint.startsWith("```") ? approach.code_hint : `\`\`\`\n${approach.code_hint}\n\`\`\``}
                    </Markdown>
                  </div>
                )}
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

          {/* ─── Structured Personal Study Notes ─────────────────────────────────── */}
          <div style={s.notesSection}>
            <div style={s.notesSectionHeader}>
              <div style={s.fieldLabel}>📝 Personal Study Notes</div>
            </div>

            {/* Structured fields: Key Insight, Stuck Point, Mistake to Avoid */}
            <div style={s.structuredFieldsGrid}>
              {NOTE_FIELDS.map(({ key, label, placeholder, icon }) => (
                <div key={key} style={s.structuredField}>
                  <label htmlFor={`note-${key}`} style={s.structuredLabel}>
                    <span>{icon}</span> {label}
                  </label>
                  <input
                    id={`note-${key}`}
                    name={`note_${key}`}
                    type="text"
                    value={(noteFields[key] as string) ?? ""}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    placeholder={placeholder}
                    style={s.structuredInput}
                  />
                </div>
              ))}
            </div>

            {/* Freeform / Additional notes with markdown rendering */}
            <div style={s.freeformSection}>
              <label htmlFor="note-additional" style={s.structuredLabel}>
                <span>📄</span> Additional Notes
              </label>
              {freeformFocused ? (
                <textarea
                  id="note-additional"
                  name="note_additional"
                  autoFocus
                  value={freeformText}
                  onChange={(e) => handleFreeformChange(e.target.value)}
                  onBlur={() => setFreeformFocused(false)}
                  placeholder="Anything else — formulas, code snippets, related links… (supports markdown)"
                  style={s.notesTextarea}
                  rows={5}
                />
              ) : freeformText.trim() ? (
                <div
                  onClick={() => setFreeformFocused(true)}
                  style={s.markdownPreview}
                  title="Click to edit"
                >
                  <Markdown
                    components={{
                      p: ({ children }) => <p style={{ margin: "0 0 8px", lineHeight: 1.6 }}>{children}</p>,
                      code: ({ children, className }) => {
                        const isBlock = className?.includes("language-");
                        return isBlock
                          ? <pre style={s.codeHint}><code>{children}</code></pre>
                          : <code style={s.inlineCode}>{children}</code>;
                      },
                      ul: ({ children }) => <ul style={{ margin: "4px 0", paddingLeft: "1.2rem" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "4px 0", paddingLeft: "1.2rem" }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 2, fontSize: 13 }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{children}</strong>,
                      em: ({ children }) => <em style={{ color: "var(--accent)" }}>{children}</em>,
                      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener" style={{ color: "var(--accent)", textDecoration: "underline" }}>{children}</a>,
                    }}
                  >
                    {freeformText}
                  </Markdown>
                </div>
              ) : (
                <div
                  onClick={() => setFreeformFocused(true)}
                  style={{ ...s.markdownPreview, color: "var(--caption)", fontStyle: "italic", cursor: "text" }}
                >
                  Click to add additional notes (supports markdown)…
                </div>
              )}
            </div>

            {/* Save status + timestamp */}
            <div style={s.notesFooter}>
              <span>{saveStatus}</span>
              {noteUpdatedAt && (
                <span>Last edited {formatRelativeTime(new Date(noteUpdatedAt))}</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  backBtn:         { background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer" },
  deleteBtn:       { background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontSize: 12, color: "var(--caption)", cursor: "pointer" },
  card:            { background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 18px", boxShadow: "var(--shadow-sm)" },
  badge:           { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 },
  recallBox:       { marginTop: 16, padding: "14px 16px", background: "var(--medium-soft)", border: "1px solid color-mix(in srgb, var(--medium) 35%, transparent)", borderRadius: "var(--radius)" },

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

  // ─── Structured Notes Styles ──────────────────────────────────────────────
  notesSection: {
    marginTop: 28,
    borderTop: "1px solid var(--border)",
    paddingTop: 20,
  },
  notesSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  structuredFieldsGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    marginBottom: 14,
  },
  structuredField: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  structuredLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink-soft)",
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  structuredInput: {
    width: "100%",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 12px",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
  freeformSection: {
    marginTop: 4,
  },
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
    marginTop: 6,
    fontFamily: "inherit",
    lineHeight: 1.5,
  },
  markdownPreview: {
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    fontSize: 13,
    color: "var(--ink-soft)",
    lineHeight: 1.5,
    cursor: "pointer",
    marginTop: 6,
    minHeight: 42,
    transition: "border-color 0.15s ease",
  },
  inlineCode: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "1px 5px",
    color: "var(--accent)",
  },
  notesFooter: {
    fontSize: 11,
    color: "var(--caption)",
    marginTop: 8,
    fontStyle: "italic",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unleechBtn: {
    background: "var(--easy-soft)",
    border: "1px solid var(--easy)",
    borderRadius: "var(--radius-sm)",
    padding: "6px 12px",
    fontSize: 12,
    color: "var(--easy)",
    cursor: "pointer",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    transition: "transform 0.1s ease",
  },
  editPatternsBtn: {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "2px 8px",
    fontSize: 12,
    color: "var(--caption)",
    cursor: "pointer",
    lineHeight: 1,
    transition: "color 0.15s ease, border-color 0.15s ease",
  },
  doneEditingBtn: {
    marginTop: 8,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
  },
  editBtn: {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "6px 12px",
    fontSize: 12,
    color: "var(--ink-soft)",
    cursor: "pointer",
  },
  saveBtn: {
    background: "var(--accent)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    padding: "6px 14px",
    fontSize: 12,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  cancelBtn: {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "6px 12px",
    fontSize: 12,
    color: "var(--caption)",
    cursor: "pointer",
  },
  editFieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--caption)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  editInput: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "10px 12px",
    fontSize: 13,
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-sm)",
    outline: "none",
    color: "var(--ink)",
    background: "var(--bg-sunken)",
  },
  editTextarea: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "10px 12px",
    fontSize: 13,
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-sm)",
    resize: "vertical" as const,
    outline: "none",
    color: "var(--ink)",
    background: "var(--bg-sunken)",
    lineHeight: 1.5,
  },
  editApproachContainer: {
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  editApproachRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap" as const,
  },
  editApproachBlock: {
    flex: "1 1 240px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  diffChip: {
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 20,
    border: "1px solid var(--border-strong)",
    background: "var(--bg-sunken)",
    color: "var(--ink-soft)",
    cursor: "pointer",
    transition: "all 0.12s ease",
  },
};
