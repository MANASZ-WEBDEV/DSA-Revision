import { useState, useMemo } from "react";
import type { FlashCard, StudyNote } from "../../types";
import { migrateNote, hasNoteContent } from "../../types";
import Markdown from "react-markdown";

interface Props {
  cards: FlashCard[];
  onSelectCard: (id: string) => void;
  onBack: () => void;
}

export function NotesExplorer({ cards, onSelectCard, onBack }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  // Get all cards with notes
  const cardsWithNotes = useMemo(() => {
    return cards
      .filter((c) => hasNoteContent(c.notes))
      .map((c) => ({
        card: c,
        note: migrateNote(c.notes, c.notes_updated_at)!,
      }))
      .sort((a, b) => {
        // Sort by most recently edited
        const aTime = new Date(a.note.updatedAt).getTime();
        const bTime = new Date(b.note.updatedAt).getTime();
        return bTime - aTime;
      });
  }, [cards]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return cardsWithNotes;
    const q = searchQuery.toLowerCase();
    return cardsWithNotes.filter(({ card, note }) => {
      return (
        card.title.toLowerCase().includes(q) ||
        card.patterns.some((p) => p.toLowerCase().includes(q)) ||
        note.keyInsight?.toLowerCase().includes(q) ||
        note.stuckPoint?.toLowerCase().includes(q) ||
        note.mistakeToAvoid?.toLowerCase().includes(q) ||
        note.freeform?.toLowerCase().includes(q)
      );
    });
  }, [cardsWithNotes, searchQuery]);

  // Generate markdown export
  const generateMarkdownExport = (): string => {
    const lines: string[] = [
      "# My DSA Study Notes",
      "",
      `*Exported ${new Date().toLocaleDateString()} · ${cardsWithNotes.length} cards with notes*`,
      "",
      "---",
      "",
    ];

    for (const { card, note } of cardsWithNotes) {
      lines.push(`## ${card.title}`);
      lines.push("");
      lines.push(`**Difficulty:** ${card.difficulty} · **Patterns:** ${card.patterns.join(", ")}`);
      lines.push("");
      if (note.keyInsight?.trim()) {
        lines.push(`💡 **Key Insight:** ${note.keyInsight}`);
        lines.push("");
      }
      if (note.stuckPoint?.trim()) {
        lines.push(`🧱 **Where I Got Stuck:** ${note.stuckPoint}`);
        lines.push("");
      }
      if (note.mistakeToAvoid?.trim()) {
        lines.push(`⚠️ **Mistake to Avoid:** ${note.mistakeToAvoid}`);
        lines.push("");
      }
      if (note.freeform?.trim()) {
        lines.push(note.freeform);
        lines.push("");
      }
      lines.push("---");
      lines.push("");
    }

    return lines.join("\n");
  };

  const handleCopyAll = async () => {
    const md = generateMarkdownExport();
    try {
      await navigator.clipboard.writeText(md);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      // Fallback for clipboard API failure
      const textarea = document.createElement("textarea");
      textarea.value = md;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  return (
    <div className="animate-fadeInUp" style={{ maxWidth: 760, margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <button onClick={onBack} style={s.backBtn}>← Library</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="numeral" style={{ fontSize: 12, color: "var(--caption)" }}>
            {cardsWithNotes.length} card{cardsWithNotes.length !== 1 ? "s" : ""} with notes
          </span>
          {cardsWithNotes.length > 0 && (
            <button
              onClick={handleCopyAll}
              style={{
                ...s.exportBtn,
                ...(copiedAll ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" } : {}),
              }}
              className="btn-press"
            >
              {copiedAll ? "✔ Copied!" : "📋 Copy all as Markdown"}
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div style={s.searchContainer}>
        <span style={s.searchIcon}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search across all notes — title, pattern, insight, mistake…"
          style={s.searchInput}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} style={s.clearBtn}>×</button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
          {cardsWithNotes.length === 0 ? (
            <>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px", fontFamily: "var(--font-display)" }}>No notes yet</h3>
              <p style={{ fontSize: 14, color: "var(--caption)", margin: 0, lineHeight: 1.6 }}>
                Open any card and add personal study notes — they'll appear here for quick review.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px", fontFamily: "var(--font-display)" }}>No matches</h3>
              <p style={{ fontSize: 14, color: "var(--caption)", margin: 0 }}>
                No notes match "{searchQuery}"
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(({ card, note }) => (
            <NoteCard key={card.id} card={card} note={note} onSelectCard={onSelectCard} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Individual Note Card ───────────────────────────────────────────────────
function NoteCard({
  card,
  note,
  onSelectCard,
}: {
  card: FlashCard;
  note: StudyNote;
  onSelectCard: (id: string) => void;
}) {
  const hasStructured = !!(note.keyInsight?.trim() || note.stuckPoint?.trim() || note.mistakeToAvoid?.trim());

  return (
    <div
      style={s.noteCard}
      className="card-interactive"
      onClick={() => onSelectCard(card.id)}
    >
      {/* Card header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px", color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            {card.title}
          </h3>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 20,
              background: card.difficulty === "Easy" ? "var(--easy-soft)" : card.difficulty === "Hard" ? "var(--hard-soft)" : "var(--medium-soft)",
              color: card.difficulty === "Easy" ? "var(--accent-ink)" : card.difficulty === "Hard" ? "var(--urgent-ink)" : "var(--medium)",
            }}>
              {card.difficulty}
            </span>
            {card.patterns.slice(0, 2).map((p) => (
              <span key={p} style={{ fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 20, background: "var(--bg-sunken)", color: "var(--ink-soft)" }}>
                {p}
              </span>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 11, color: "var(--caption)", flexShrink: 0 }}>
          {new Date(note.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Structured fields */}
      {hasStructured && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: note.freeform?.trim() ? 10 : 0 }}>
          {note.keyInsight?.trim() && (
            <div style={s.inlineField}>
              <span style={s.inlineIcon}>💡</span>
              <span style={s.inlineLabel}>Key Insight:</span>
              <span style={s.inlineValue}>{note.keyInsight}</span>
            </div>
          )}
          {note.mistakeToAvoid?.trim() && (
            <div style={s.inlineField}>
              <span style={s.inlineIcon}>⚠️</span>
              <span style={s.inlineLabel}>Mistake:</span>
              <span style={s.inlineValue}>{note.mistakeToAvoid}</span>
            </div>
          )}
          {note.stuckPoint?.trim() && (
            <div style={s.inlineField}>
              <span style={s.inlineIcon}>🧱</span>
              <span style={s.inlineLabel}>Stuck:</span>
              <span style={s.inlineValue}>{note.stuckPoint}</span>
            </div>
          )}
        </div>
      )}

      {/* Freeform with markdown */}
      {note.freeform?.trim() && (
        <div style={s.freeformPreview}>
          <Markdown
            components={{
              p: ({ children }) => <p style={{ margin: "0 0 4px", lineHeight: 1.5 }}>{children}</p>,
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                return isBlock
                  ? <pre style={{ margin: "4px 0", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ink)", whiteSpace: "pre-wrap" as const, background: "var(--bg-raised)", padding: "6px 8px", borderRadius: 4 }}><code>{children}</code></pre>
                  : <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 3, padding: "0px 4px", color: "var(--accent)" }}>{children}</code>;
              },
              ul: ({ children }) => <ul style={{ margin: "2px 0", paddingLeft: "1rem" }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: "2px 0", paddingLeft: "1rem" }}>{children}</ol>,
              li: ({ children }) => <li style={{ fontSize: 13 }}>{children}</li>,
              strong: ({ children }) => <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{children}</strong>,
              em: ({ children }) => <em style={{ color: "var(--accent)" }}>{children}</em>,
            }}
          >
            {note.freeform}
          </Markdown>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  backBtn: {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "6px 12px",
    fontSize: 13,
    color: "var(--ink-soft)",
    cursor: "pointer",
  },
  exportBtn: {
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 500,
    background: "var(--bg-raised)",
    color: "var(--ink-soft)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  searchContainer: {
    position: "relative" as const,
    marginBottom: 20,
  },
  searchIcon: {
    position: "absolute" as const,
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    pointerEvents: "none" as const,
  },
  searchInput: {
    width: "100%",
    padding: "11px 36px 11px 40px",
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: 14,
    color: "var(--ink)",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s ease",
  },
  clearBtn: {
    position: "absolute" as const,
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: 18,
    color: "var(--caption)",
    cursor: "pointer",
    padding: "4px 8px",
  },
  noteCard: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "14px 16px",
    cursor: "pointer",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
  inlineField: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    fontSize: 13,
    lineHeight: 1.5,
  },
  inlineIcon: {
    fontSize: 12,
    flexShrink: 0,
  },
  inlineLabel: {
    fontWeight: 600,
    color: "var(--accent)",
    fontSize: 12,
    flexShrink: 0,
  },
  inlineValue: {
    color: "var(--ink-soft)",
  },
  freeformPreview: {
    borderTop: "1px solid var(--border)",
    paddingTop: 8,
    fontSize: 13,
    color: "var(--ink-soft)",
    lineHeight: 1.5,
  },
};
