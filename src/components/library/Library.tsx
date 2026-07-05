import type { FlashCard } from "../../types";
import { PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";
import { isDue, nextReviewLabel, getStats, getBestBigO } from "../../lib/sm2";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Props {
  cards: FlashCard[];
  onSelectCard: (id: string) => void;
  onStartReview: () => void;
  onGenerate: () => void;
  onGoStarterPacks: () => void;
}

const DIFF_VARS = {
  Easy:   { bg: "var(--easy-soft)",   text: "var(--accent-ink)" },
  Medium: { bg: "var(--medium-soft)", text: "var(--medium)" },
  Hard:   { bg: "var(--hard-soft)",   text: "var(--urgent-ink)" },
};

type DeckFilter = "all" | "my-cards" | string; // string = specific deck name

export function Library({ cards, onSelectCard, onStartReview, onGenerate, onGoStarterPacks }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const patternParam = searchParams.get("pattern");

  const [filterPattern, setFilterPattern] = useState<string | null>(patternParam);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [filterDeck, setFilterDeck] = useState<DeckFilter>("all");

  const handleSelectPattern = (p: string | null) => {
    setFilterPattern(p);
    if (p) {
      setSearchParams({ pattern: p });
    } else {
      searchParams.delete("pattern");
      setSearchParams(searchParams);
    }
  };
  const stats = getStats(cards);

  // Get unique deck names from cards
  const deckNames = [...new Set(cards.filter(c => c.deck).map(c => c.deck!))].sort();

  const filtered = cards.filter((c) => {
    const matchPattern = !filterPattern || c.patterns.includes(filterPattern as any);
    const matchDiff = !filterDifficulty || c.difficulty === filterDifficulty;
    const matchDeck =
      filterDeck === "all" ? true :
      filterDeck === "my-cards" ? c.deck === null || c.deck === undefined :
      c.deck === filterDeck;
    return matchPattern && matchDiff && matchDeck;
  });

  const usedPatterns = [...new Set(cards.flatMap((c) => c.patterns))].sort();

  if (cards.length === 0) {
    return (
      <div className="animate-fadeInUp" style={{ maxWidth: 560, margin: "4rem auto", textAlign: "center", padding: "0 1rem" }}>
        <div className="bigstat" style={{ fontSize: 40, color: "var(--accent)", marginBottom: 16 }}>{"{ }"}</div>
        <h2 style={{ fontSize: 21, fontWeight: 600, margin: "0 0 10px", fontFamily: "var(--font-display)" }}>No cards yet</h2>
        <p style={{ fontSize: 14, color: "var(--caption)", margin: "0 0 24px", lineHeight: 1.65 }}>
          Start with the Blind 75 deck or paste a problem description to generate your first flashcard.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onGoStarterPacks} style={s.primaryBtn} className="btn-press">📦 Get Blind 75</button>
          <button onClick={onGenerate} style={s.addBtn} className="btn-press">✦ Generate card</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp" style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Stats + actions row */}
      <div style={s.statsRow}>
        <div style={s.statBox}>
          <span className="bigstat" style={{ fontSize: 22, color: "var(--ink)" }}>{stats.due}</span>
          <span style={s.statLabel}>due now</span>
        </div>
        <div style={s.statBox}>
          <span className="bigstat" style={{ fontSize: 22, color: "var(--ink)" }}>{stats.total}</span>
          <span style={s.statLabel}>total</span>
        </div>
        <div style={s.statBox}>
          <span className="bigstat" style={{ fontSize: 22, color: "var(--accent)" }}>{stats.mastered}</span>
          <span style={s.statLabel}>mastered</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {stats.due > 0 && (
            <button onClick={onStartReview} style={s.reviewBtn} className="btn-press">Review {stats.due} →</button>
          )}
          <button onClick={onGenerate} style={s.addBtn} className="btn-press">+ Add card</button>
        </div>
      </div>

      {/* Deck filter tabs */}
      {deckNames.length > 0 && (
        <div style={{ display: "flex", gap: 2, margin: "16px 0 0", background: "var(--bg-sunken)", borderRadius: "var(--radius-sm)", padding: 3, width: "fit-content" }}>
          <button
            onClick={() => setFilterDeck("all")}
            style={{ ...s.deckTab, ...(filterDeck === "all" ? s.deckTabActive : {}) }}
          >
            All ({cards.length})
          </button>
          <button
            onClick={() => setFilterDeck("my-cards")}
            style={{ ...s.deckTab, ...(filterDeck === "my-cards" ? s.deckTabActive : {}) }}
          >
            My Cards ({cards.filter(c => !c.deck).length})
          </button>
          {deckNames.map(dn => (
            <button
              key={dn}
              onClick={() => setFilterDeck(filterDeck === dn ? "all" : dn)}
              style={{ ...s.deckTab, ...(filterDeck === dn ? s.deckTabActive : {}) }}
            >
              {dn} ({cards.filter(c => c.deck === dn).length})
            </button>
          ))}
        </div>
      )}

      {/* Pattern + difficulty filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "14px 0" }}>
        {["Easy", "Medium", "Hard"].map((d) => (
          <button
            key={d}
            onClick={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
            style={{
              ...s.filterChip,
              background: filterDifficulty === d ? DIFF_VARS[d as keyof typeof DIFF_VARS].bg : "var(--bg-sunken)",
              color: filterDifficulty === d ? DIFF_VARS[d as keyof typeof DIFF_VARS].text : "var(--ink-soft)",
              borderColor: filterDifficulty === d ? "transparent" : "var(--border)",
            }}
          >
            {d}
          </button>
        ))}
        <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
        {usedPatterns.map((p) => (
          <button
            key={p}
            onClick={() => handleSelectPattern(filterPattern === p ? null : p)}
            style={{
              ...s.filterChip,
              background: filterPattern === p ? (PATTERN_COLORS[p] ?? "var(--accent-soft)") : "var(--bg-sunken)",
              color: filterPattern === p ? (PATTERN_TEXT_COLORS[p] ?? "var(--accent-ink)") : "var(--ink-soft)",
              borderColor: filterPattern === p ? "transparent" : "var(--border)",
            }}
          >
            {p}
          </button>
        ))}
        {(filterPattern || filterDifficulty) && (
          <button onClick={() => { handleSelectPattern(null); setFilterDifficulty(null); }} style={{ ...s.filterChip, color: "var(--caption)" }}>
            Clear ×
          </button>
        )}
      </div>

      {/* Card grid */}
      <div className="stagger-list" style={s.grid}>
        {filtered.map((card) => {
          const due = isDue(card);
          const diff = DIFF_VARS[card.difficulty] ?? DIFF_VARS.Medium;
          const bigO = getBestBigO(card);
          return (
            <div
              key={card.id}
              onClick={() => onSelectCard(card.id)}
              className="card-interactive"
              style={{ ...s.cardItem, ...(due ? s.cardDue : {}), position: "relative", overflow: "hidden" }}
            >
              {/* O(n) Watermark */}
              {bigO && <span className="watermark">{bigO}</span>}

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ ...s.diffBadge, background: diff.bg, color: diff.text }}>{card.difficulty}</span>
                  {card.deck && <span style={s.deckBadge}>{card.deck}</span>}
                  {card.notes && <span style={{ fontSize: 11, marginLeft: 2 }} title="Has personal study notes">📝</span>}
                </div>
                <span className="numeral" style={{ fontSize: 11, color: due ? "var(--urgent)" : "var(--caption)", fontWeight: due ? 600 : 400 }}>
                  {nextReviewLabel(card)}
                </span>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: "var(--ink)", lineHeight: 1.35 }}>{card.title}</h3>
              <p style={{ fontSize: 12, color: "var(--caption)", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                {card.recall_trigger}
              </p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {card.patterns.slice(0, 2).map((p) => (
                  <span key={p} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: PATTERN_COLORS[p] ?? "var(--bg-sunken)", color: PATTERN_TEXT_COLORS[p] ?? "var(--ink-soft)" }}>
                    {p}
                  </span>
                ))}
                {card.patterns.length > 2 && (
                  <span style={{ fontSize: 10, color: "var(--caption)" }}>+{card.patterns.length - 2}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--caption)", fontSize: 14, marginTop: 32 }}>
          No cards match these filters.
        </p>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  statsRow:   { display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" },
  statBox:    { display: "flex", flexDirection: "column", alignItems: "center" },
  statLabel:  { fontSize: 11, color: "var(--caption)", marginTop: 2 },
  reviewBtn:  { padding: "8px 16px", background: "var(--urgent)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  addBtn:     { padding: "8px 14px", background: "var(--bg-raised)", color: "var(--ink-soft)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" },
  filterChip: { fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 20, border: "1px solid", cursor: "pointer", background: "var(--bg-sunken)" },
  grid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  cardItem:   { background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "14px", cursor: "pointer" },
  cardDue:    { borderColor: "var(--medium)", background: "color-mix(in srgb, var(--medium-soft) 50%, var(--bg-raised))" },
  diffBadge:  { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 },
  deckBadge:  { fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: "var(--accent-soft)", color: "var(--accent)", letterSpacing: "0.02em" },
  primaryBtn: { padding: "10px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  deckTab:    { fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: "var(--ink-soft)", cursor: "pointer", transition: "background 0.15s ease, color 0.15s ease" },
  deckTabActive: { background: "var(--bg-raised)", color: "var(--ink)", boxShadow: "var(--shadow-sm)", fontWeight: 600 },
};
