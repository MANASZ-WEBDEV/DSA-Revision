import { useState } from "react";
import type { FlashCard, ReviewQuality } from "../../types";
import { sm2, getDueCards, getBestBigO } from "../../lib/sm2";
import { PATTERN_COLORS, PATTERN_TEXT_COLORS } from "../../lib/llm";

interface Props {
  cards: FlashCard[];
  onUpdate: (id: string, updates: Partial<FlashCard>) => void;
  onRecordReview: (card: FlashCard, quality: ReviewQuality) => void;
  onDone: () => void;
}

export function ReviewSession({ cards, onUpdate, onRecordReview, onDone }: Props) {
  const due = getDueCards(cards);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ quality: ReviewQuality; title: string }[]>([]);
  const [done, setDone] = useState(false);

  if (due.length === 0) {
    return (
      <div style={s.empty}>
        <div className="bigstat" style={{ fontSize: 38, color: "var(--accent)", marginBottom: 14 }}>O(1)</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 600, fontFamily: "var(--font-display)" }}>All caught up</h2>
        <p style={{ color: "var(--caption)", fontSize: 14, margin: "0 0 22px" }}>No cards due for review right now.</p>
        <button onClick={onDone} style={s.primaryBtn}>Back to library</button>
      </div>
    );
  }

  if (done) {
    const perfect = sessionResults.filter((r) => r.quality >= 4).length;
    const struggled = sessionResults.filter((r) => r.quality <= 2).length;
    return (
      <div style={s.empty}>
        <div className="bigstat" style={{ fontSize: 38, color: "var(--accent)", marginBottom: 14 }}>
          {sessionResults.length}
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 600, fontFamily: "var(--font-display)" }}>Session complete</h2>
        <p style={{ color: "var(--caption)", fontSize: 14, margin: "0 0 16px" }}>
          {perfect} easy · {struggled} struggled
        </p>
        {struggled > 0 && (
          <p style={{ fontSize: 13, color: "var(--urgent)", marginBottom: 20 }}>
            {struggled} card{struggled > 1 ? "s" : ""} reset — you'll see them again tomorrow.
          </p>
        )}
        <button onClick={onDone} style={s.primaryBtn}>Back to library</button>
      </div>
    );
  }

  const card = due[index];

  function submitQuality(q: ReviewQuality) {
    const updates = sm2(card, q);
    onUpdate(card.id, updates);
    onRecordReview(card, q);
    setSessionResults((prev) => [...prev, { quality: q, title: card.title }]);

    if (index + 1 >= due.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span className="numeral" style={{ fontSize: 13, color: "var(--caption)" }}>{index + 1} / {due.length} due</span>
        <button onClick={onDone} style={{ background: "none", border: "none", fontSize: 13, color: "var(--caption)", cursor: "pointer" }}>
          End session
        </button>
      </div>
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${(index / due.length) * 100}%` }} />
      </div>

      {/* Recall trigger (front of card) */}
      <div style={{ ...s.front, position: "relative", overflow: "hidden" }}>
        {getBestBigO(card) && <span className="watermark">{getBestBigO(card)}</span>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {card.patterns.map((p) => (
            <span key={p} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: PATTERN_COLORS[p] ?? "var(--bg-sunken)", color: PATTERN_TEXT_COLORS[p] ?? "var(--ink-soft)" }}>{p}</span>
          ))}
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 18px", color: "var(--ink)", fontFamily: "var(--font-display)" }}>{card.title}</h2>
        <div style={s.triggerLabel}>Recall trigger</div>
        <p style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", margin: 0, lineHeight: 1.55 }}>
          {card.recall_trigger}
        </p>
      </div>

      {/* Reveal / Quality buttons */}
      {!revealed ? (
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <p style={{ fontSize: 13, color: "var(--caption)", marginBottom: 14 }}>
            Think through all approaches before revealing
          </p>
          <button onClick={() => setRevealed(true)} style={s.revealBtn}>
            Reveal approaches →
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            {card.approaches.map((a, i) => (
              <div key={i} style={s.approachRow}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{a.label}</span>
                  <span className="numeral" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {a.complexity.time} · {a.complexity.space}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0, lineHeight: 1.55 }}>{a.key_observation}</p>
              </div>
            ))}
          </div>

          <div style={s.qualityLabel}>How well did you recall this?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
            {QUALITY_OPTIONS.map(({ q, label, sub, color }) => (
              <button
                key={q}
                onClick={() => submitQuality(q as ReviewQuality)}
                style={{ ...s.qualityBtn, borderColor: color, color }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 11, color: "var(--caption)", marginTop: 2 }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const QUALITY_OPTIONS = [
  { q: 0, label: "Forgot", sub: "Blank",           color: "var(--hard)" },
  { q: 3, label: "Hard",   sub: "Got it, barely",  color: "var(--medium)" },
  { q: 4, label: "Good",   sub: "Some hesitation", color: "#3b6ea0" },
  { q: 5, label: "Easy",   sub: "Instant recall",  color: "var(--accent)" },
];

const s: Record<string, React.CSSProperties> = {
  empty:        { maxWidth: 420, margin: "4rem auto", textAlign: "center", padding: "0 1rem" },
  primaryBtn:   { padding: "10px 22px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  progressBar:  { height: 3, background: "var(--border)", borderRadius: 4, marginBottom: 26, overflow: "hidden" },
  progressFill: { height: "100%", background: "var(--accent)", borderRadius: 4, transition: "width 0.3s ease" },
  front:        { background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "22px 24px", boxShadow: "var(--shadow)" },
  triggerLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "var(--caption)", textTransform: "uppercase" as const, marginBottom: 8 },
  revealBtn:    { padding: "12px 28px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  approachRow:  { background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px" },
  qualityLabel: { fontSize: 12, fontWeight: 600, color: "var(--caption)", textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  qualityBtn:   { display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "12px 8px", background: "var(--bg-raised)", border: "1.5px solid", borderRadius: "var(--radius)", cursor: "pointer" },
};
