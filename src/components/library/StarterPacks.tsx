import { useState } from "react";
import type { FlashCard } from "../../types";
import { initSM2 } from "../../lib/sm2";
import blind75Data from "../../data/blind75.json";

interface Props {
  existingCards: FlashCard[];
  onImportDeck: (cards: FlashCard[]) => void;
  onGoLibrary: () => void;
}

interface DeckInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  cardCount: number;
  categories: string[];
  getData: () => FlashCard[];
}

function prepareBlind75(): FlashCard[] {
  return (blind75Data as any[]).map((card) => ({
    ...card,
    deck: "Blind 75",
    source_text: "",
    ...initSM2(),
    id: `blind75-${card.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
    created_at: new Date().toISOString(),
  }));
}

const AVAILABLE_DECKS: DeckInfo[] = [
  {
    id: "blind-75",
    name: "Blind 75",
    description: "The essential 75 LeetCode problems curated for FAANG interviews (plus Trapping Rain Water as a bonus!). Covers arrays, strings, trees, graphs, DP, and more. The minimum viable prep for any SWE interview.",
    icon: "🎯",
    cardCount: blind75Data.length,
    categories: [
      `Arrays & Hashing (${blind75Data.filter((c: any) => c.patterns?.includes("Hashing")).length})`,
      `Two Pointers (${blind75Data.filter((c: any) => c.patterns?.includes("Two Pointers")).length})`,
      `Trees & Graphs (${blind75Data.filter((c: any) => c.patterns?.some((p: string) => ["BFS", "DFS"].includes(p))).length})`,
      `Dynamic Programming (${blind75Data.filter((c: any) => c.patterns?.some((p: string) => p.startsWith("DP"))).length})`,
    ],
    getData: prepareBlind75,
  },
];

export function StarterPacks({ existingCards, onImportDeck, onGoLibrary }: Props) {
  const [importedDecks, setImportedDecks] = useState<Set<string>>(() => {
    // Check which decks are already imported by looking at existing cards
    const decks = new Set<string>();
    existingCards.forEach(c => { if (c.deck) decks.add(c.deck); });
    return decks;
  });

  const [importing, setImporting] = useState<string | null>(null);
  const [justImported, setJustImported] = useState<string | null>(null);

  function handleImport(deck: DeckInfo) {
    setImporting(deck.id);

    // Small delay for visual feedback
    setTimeout(() => {
      const cards = deck.getData();
      onImportDeck(cards);
      setImportedDecks(prev => new Set(prev).add(deck.name));
      setImporting(null);
      setJustImported(deck.id);
    }, 600);
  }

  const isImported = (deck: DeckInfo) => importedDecks.has(deck.name);

  return (
    <div className="animate-fadeInUp" style={{ maxWidth: 720, margin: "0 auto", padding: "1.75rem 1rem 3rem" }}>
      <div style={{ marginBottom: 28 }}>
        <div className="font-mono" style={s.eyebrow}>Starter Packs</div>
        <h1 style={s.h1}>Ready-made decks</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "8px 0 0", lineHeight: 1.6 }}>
          Pre-built flashcard decks reviewed by engineers. Import any deck to start reviewing immediately — no API key needed.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {AVAILABLE_DECKS.map((deck) => {
          const imported = isImported(deck);
          const isImporting = importing === deck.id;
          const wasJustImported = justImported === deck.id;

          return (
            <div key={deck.id} style={s.deckCard} className="card-interactive">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 32 }}>{deck.icon}</span>
                  <div>
                    <h2 style={s.deckName}>{deck.name}</h2>
                    <span className="numeral" style={{ fontSize: 12, color: "var(--caption)" }}>
                      {deck.cardCount} cards
                    </span>
                  </div>
                </div>

                {imported ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {wasJustImported && (
                      <button onClick={onGoLibrary} style={s.viewBtn} className="btn-press animate-fadeIn">
                        View in library →
                      </button>
                    )}
                    <span style={s.importedBadge}>
                      ✓ Imported
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleImport(deck)}
                    disabled={isImporting}
                    style={s.importBtn}
                    className="btn-press"
                  >
                    {isImporting ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                        Importing...
                      </span>
                    ) : (
                      "Import deck →"
                    )}
                  </button>
                )}
              </div>

              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 14px", lineHeight: 1.6 }}>
                {deck.description}
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {deck.categories.map((cat) => (
                  <span key={cat} style={s.categoryChip}>{cat}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coming soon placeholder */}
      <div style={s.comingSoon}>
        <span className="bigstat" style={{ fontSize: 20, color: "var(--caption)" }}>O(n)</span>
        <div style={{ marginLeft: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>More packs coming soon</span>
          <p style={{ fontSize: 12, color: "var(--caption)", margin: "2px 0 0" }}>
            Striver SDE Sheet, NeetCode 150, and community-curated decks
          </p>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  eyebrow:      { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--accent)", textTransform: "uppercase" as const, marginBottom: 4 },
  h1:           { fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, margin: 0, color: "var(--ink)", letterSpacing: "-0.01em" },
  deckCard:     { background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", boxShadow: "var(--shadow-sm)" },
  deckName:     { fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" },
  importBtn:    { padding: "8px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const },
  viewBtn:      { padding: "6px 14px", background: "none", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "var(--radius)", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" as const },
  importedBadge:{ fontSize: 12, fontWeight: 600, color: "var(--accent)", padding: "6px 14px", background: "var(--accent-soft)", borderRadius: "var(--radius)", whiteSpace: "nowrap" as const },
  categoryChip: { fontSize: 11, fontWeight: 500, padding: "4px 10px", background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 20, color: "var(--ink-soft)" },
  comingSoon:   { display: "flex", alignItems: "center", marginTop: 20, padding: "16px 18px", background: "var(--bg-sunken)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius)" },
};
