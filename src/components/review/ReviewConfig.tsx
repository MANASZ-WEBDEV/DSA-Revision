import { useState, useMemo } from "react";
import type { PatternTag, SessionConfig, FlashCard } from "../../types";
import { PATTERN_TAGS } from "../../types";
import { PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";

interface Props {
  cards: FlashCard[];
  initialConfig: SessionConfig;
  onStartReview: (config: SessionConfig) => void;
  onCancel: () => void;
}

export function ReviewConfig({ cards, initialConfig, onStartReview, onCancel }: Props) {
  const [config, setConfig] = useState<SessionConfig>(initialConfig);

  // 1. Get unique decks in library
  const availableDecks = useMemo(() => {
    const decks = new Set<string>();
    cards.forEach((c) => {
      if (c.deck) {
        decks.add(c.deck);
      } else {
        decks.add("My Cards");
      }
    });
    return Array.from(decks);
  }, [cards]);

  // 2. Count cards matching various filters to show helper badges
  const stats = useMemo(() => {
    const counts = {
      total: cards.length,
      easy: cards.filter(c => c.difficulty === "Easy").length,
      medium: cards.filter(c => c.difficulty === "Medium").length,
      hard: cards.filter(c => c.difficulty === "Hard").length,
      byPattern: {} as Record<PatternTag, number>,
      byDeck: {} as Record<string, number>,
    };

    PATTERN_TAGS.forEach((tag) => {
      counts.byPattern[tag] = cards.filter(c => c.patterns.includes(tag)).length;
    });

    cards.forEach((c) => {
      const dKey = c.deck || "My Cards";
      counts.byDeck[dKey] = (counts.byDeck[dKey] || 0) + 1;
    });

    return counts;
  }, [cards]);

  const togglePattern = (pattern: PatternTag) => {
    setConfig((prev) => {
      const isSelected = prev.patterns.includes(pattern);
      const patterns = isSelected
        ? prev.patterns.filter((p) => p !== pattern)
        : [...prev.patterns, pattern];
      return { ...prev, patterns };
    });
  };

  const toggleDifficulty = (difficulty: "Easy" | "Medium" | "Hard") => {
    setConfig((prev) => {
      const isSelected = prev.difficulties.includes(difficulty);
      const difficulties = isSelected
        ? prev.difficulties.filter((d) => d !== difficulty)
        : [...prev.difficulties, difficulty];
      return { ...prev, difficulties };
    });
  };

  const toggleDeck = (deck: string) => {
    setConfig((prev) => {
      const isSelected = prev.decks.includes(deck);
      const decks = isSelected
        ? prev.decks.filter((d) => d !== deck)
        : [...prev.decks, deck];
      return { ...prev, decks };
    });
  };

  const selectAllPatterns = () => {
    setConfig((prev) => ({ ...prev, patterns: [] }));
  };

  // Filter cards to count how many will be in the candidate pool
  const filteredCount = useMemo(() => {
    return cards.filter((card) => {
      // 1. Deck filter
      if (config.decks.length > 0) {
        const dKey = card.deck || "My Cards";
        if (!config.decks.includes(dKey)) return false;
      }
      // 2. Difficulty filter
      if (config.difficulties.length > 0) {
        if (!config.difficulties.includes(card.difficulty)) return false;
      }
      // 3. Pattern filter
      if (config.patterns.length > 0) {
        if (!card.patterns.some((p) => config.patterns.includes(p))) return false;
      }
      return true;
    }).length;
  }, [cards, config]);

  return (
    <div className="animate-fadeIn" style={s.container}>
      <div style={{ marginBottom: 28 }}>
        <span className="font-mono" style={s.eyebrow}>Active Recall Configuration</span>
        <h1 style={s.h1}>Configure Session</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "6px 0 0", lineHeight: 1.55 }}>
          Customize your revision parameters. Smart adaptive revision includes due cards, stale patterns, and brand-new cards.
        </p>
      </div>

      <div style={s.sectionsGrid}>
        {/* Left column: Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Deck Select */}
          {availableDecks.length > 1 && (
            <div style={s.cardSection}>
              <h3 style={s.sectionTitle}>Filter by Deck</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <button
                  onClick={() => setConfig((p) => ({ ...p, decks: [] }))}
                  style={{
                    ...s.filterBadge,
                    ...(config.decks.length === 0 ? s.filterBadgeActive : {}),
                  }}
                >
                  All Decks ({stats.total})
                </button>
                {availableDecks.map((deck) => {
                  const isActive = config.decks.includes(deck);
                  return (
                    <button
                      key={deck}
                      onClick={() => toggleDeck(deck)}
                      style={{
                        ...s.filterBadge,
                        ...(isActive ? s.filterBadgeActive : {}),
                      }}
                    >
                      {deck} ({stats.byDeck[deck] || 0})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Difficulty Select */}
          <div style={s.cardSection}>
            <h3 style={s.sectionTitle}>Filter by Difficulty</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              <button
                onClick={() => setConfig((p) => ({ ...p, difficulties: [] }))}
                style={{
                  ...s.filterBadge,
                  ...(config.difficulties.length === 0 ? s.filterBadgeActive : {}),
                }}
              >
                All Difficulties
              </button>
              {(["Easy", "Medium", "Hard"] as const).map((diff) => {
                const isActive = config.difficulties.includes(diff);
                const count = diff === "Easy" ? stats.easy : diff === "Medium" ? stats.medium : stats.hard;
                return (
                  <button
                    key={diff}
                    onClick={() => toggleDifficulty(diff)}
                    style={{
                      ...s.filterBadge,
                      ...(isActive ? s.filterBadgeActive : {}),
                    }}
                  >
                    {diff} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patterns Select */}
          <div style={s.cardSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={s.sectionTitle}>Filter by Patterns</h3>
              <button onClick={selectAllPatterns} style={s.textLink}>
                Clear filters
              </button>
            </div>
            <div style={s.patternsGrid}>
              {PATTERN_TAGS.map((tag) => {
                const count = stats.byPattern[tag] || 0;
                if (count === 0) return null; // hide tags with 0 cards

                const isSelected = config.patterns.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => togglePattern(tag)}
                    style={{
                      ...s.patternCheckbox,
                      ...(isSelected ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent-ink)" } : {}),
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{tag}</span>
                    <span className="numeral" style={{ fontSize: 11, opacity: 0.75 }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Session parameters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Smart Session Toggle */}
          <div style={s.cardSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={s.sectionTitle}>Smart Revision Plan</h3>
                <p style={s.sectionSubtitle}>
                  Ensures pattern-staleness check-ins and drip-feeds brand new cards so no techniques go cold. Capped at session size.
                </p>
              </div>
              <label style={s.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={config.useSmartSession}
                  onChange={(e) => setConfig((p) => ({ ...p, useSmartSession: e.target.checked }))}
                  style={s.toggleInput}
                  className="toggle-switch-input"
                />
                <span style={{
                  ...s.toggleSlider,
                  ...(config.useSmartSession ? s.toggleSliderActive : {}),
                }} className="toggle-switch-slider" />
              </label>
            </div>
          </div>

          {/* Session Size */}
          <div style={s.cardSection}>
            <h3 style={s.sectionTitle}>Session Size</h3>
            <p style={s.sectionSubtitle}>Limit the number of cards in this single session.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {([5, 10, 15, 20, 25, 50, 100] as const).map((size) => {
                const isActive = config.sessionSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setConfig((p) => ({ ...p, sessionSize: size }))}
                    style={{
                      ...s.sizeBtn,
                      ...(isActive ? s.sizeBtnActive : {}),
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timer controls */}
          <div style={s.cardSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h3 style={s.sectionTitle}>Recall Timer</h3>
                <p style={s.sectionSubtitle}>Adds a visual countdown per card to simulate high-pressure interviews.</p>
              </div>
              <label style={s.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={config.timerEnabled}
                  onChange={(e) => setConfig((p) => ({ ...p, timerEnabled: e.target.checked }))}
                  style={s.toggleInput}
                  className="toggle-switch-input"
                />
                <span style={{
                  ...s.toggleSlider,
                  ...(config.timerEnabled ? s.toggleSliderActive : {}),
                }} className="toggle-switch-slider" />
              </label>
            </div>

            {config.timerEnabled && (
              <div className="animate-fadeIn" style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--caption)" }}>Seconds per card</span>
                  <span className="numeral" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>
                    {config.timerSeconds}s
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={config.timerSeconds}
                  onChange={(e) => setConfig((p) => ({ ...p, timerSeconds: Number(e.target.value) }))}
                  style={s.rangeSlider}
                />
              </div>
            )}
          </div>

          {/* Start Actions */}
          <div style={s.actionsWrapper}>
            <div style={s.summaryStats}>
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Candidate Pool:</span>
              <span className="numeral" style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>
                {filteredCount} card{filteredCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button onClick={onCancel} style={s.cancelBtn} className="btn-press">
                Cancel
              </button>
              <button
                onClick={() => onStartReview(config)}
                disabled={filteredCount === 0}
                style={{
                  ...s.startBtn,
                  ...(filteredCount === 0 ? s.startBtnDisabled : {}),
                }}
                className="btn-press"
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "1.75rem 1rem 3rem",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--accent)",
  },
  h1: {
    fontSize: 26,
    fontWeight: 700,
    fontFamily: "var(--font-display)",
    margin: "4px 0 0",
    color: "var(--ink)",
  },
  sectionsGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "24px",
    marginTop: 20,
  },
  cardSection: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 22px",
    boxShadow: "var(--shadow-sm)",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
    color: "var(--ink)",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "var(--caption)",
    margin: "4px 0 0",
    lineHeight: 1.45,
  },
  textLink: {
    background: "none",
    border: "none",
    fontSize: 12,
    color: "var(--caption)",
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
  },
  filterBadge: {
    padding: "6px 12px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--ink-soft)",
    borderRadius: "20px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  filterBadgeActive: {
    background: "var(--accent)",
    borderColor: "var(--accent)",
    color: "var(--bg)",
  },
  patternsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 14,
    maxHeight: 280,
    overflowY: "auto",
    paddingRight: 4,
  },
  patternCheckbox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    border: "1px solid var(--border)",
    background: "var(--bg-raised)",
    color: "var(--ink)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.1s ease",
  },
  toggleSwitch: {
    position: "relative",
    display: "inline-block",
    width: 44,
    height: 24,
    flexShrink: 0,
  },
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleSlider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "var(--border-strong)",
    transition: ".2s",
    borderRadius: 24,
  },
  toggleSliderActive: {
    backgroundColor: "var(--accent)",
  },
  sizeBtn: {
    flex: 1,
    padding: "8px 0",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--ink-soft)",
    borderRadius: "var(--radius-sm)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.1s ease",
  },
  sizeBtnActive: {
    background: "var(--accent)",
    borderColor: "var(--accent)",
    color: "var(--bg)",
  },
  rangeSlider: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    background: "var(--border-strong)",
    outline: "none",
    marginTop: 8,
    cursor: "pointer",
  },
  actionsWrapper: {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 22px",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  summaryStats: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border)",
    paddingBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: "11px 0",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    color: "var(--ink-soft)",
  },
  startBtn: {
    flex: 2,
    padding: "11px 0",
    background: "var(--ink)",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    color: "var(--bg)",
  },
  startBtnDisabled: {
    background: "var(--border-strong)",
    color: "var(--caption)",
    cursor: "not-allowed",
  },
};

// Add standard stylesheet override for the toggle slider dot (using system transition)
if (typeof document !== "undefined") {
  const styleId = "dsa-toggle-styles";
  if (!document.getElementById(styleId)) {
    const sheet = document.createElement("style");
    sheet.id = styleId;
    sheet.innerHTML = `
      .toggle-switch-slider::before {
        content: "";
        position: absolute;
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: var(--bg-raised);
        transition: .2s;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      }
      .toggle-switch-input:checked + .toggle-switch-slider::before {
        transform: translateX(20px);
      }
    `;
    document.head.appendChild(sheet);
  }
}
