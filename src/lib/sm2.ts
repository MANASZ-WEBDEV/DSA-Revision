import type { FlashCard, ReviewQuality } from "../types";

// ─── SM-2 Algorithm ───────────────────────────────────────────────────────────
//
// The SuperMemo 2 algorithm schedules the next review based on:
//   - quality: how well you recalled (0–5)
//   - ease_factor (EF): how easy the card is (starts 2.5, min 1.3)
//   - interval: days until next review (starts 1 → 6 → EF * prev_interval)
//
// Quality scale used in this app:
//   5 = Instant recall, no hesitation         → "Easy"
//   4 = Recalled correctly with slight pause  → "Good"
//   3 = Recalled correctly but took effort    → "Hard"
//   0 = Couldn't recall / wrong               → "Forgot"
//
// If quality < 3, the card resets to interval=1 (relearn from scratch).

export function sm2(card: FlashCard, quality: ReviewQuality): Partial<FlashCard> {
  const q = quality;
  let { ease_factor, interval_days, repetitions } = card;

  if (q >= 3) {
    // Correct recall — advance interval
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  } else {
    // Incorrect — reset to relearn
    repetitions = 0;
    interval_days = 1;
  }

  // Update ease factor (never below 1.3)
  ease_factor = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  // Calculate next review date
  const next = new Date();
  next.setDate(next.getDate() + interval_days);

  return {
    ease_factor: parseFloat(ease_factor.toFixed(2)),
    interval_days,
    repetitions,
    next_review: next.toISOString(),
    last_quality: q,
  };
}

// ─── Initialize a new card's SM-2 fields ────────────────────────────────────
export function initSM2(): Pick<FlashCard, "next_review" | "interval_days" | "ease_factor" | "repetitions" | "last_quality"> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    next_review: tomorrow.toISOString(),
    interval_days: 1,
    ease_factor: 2.5,
    repetitions: 0,
    last_quality: null,
  };
}

// ─── Is this card due for review today? ─────────────────────────────────────
export function isDue(card: FlashCard): boolean {
  return new Date(card.next_review) <= new Date();
}

// ─── Get all due cards sorted by most overdue first ─────────────────────────
export function getDueCards(cards: FlashCard[]): FlashCard[] {
  return cards
    .filter(isDue)
    .sort(
      (a, b) =>
        new Date(a.next_review).getTime() - new Date(b.next_review).getTime()
    );
}

// ─── Human-readable next review label ────────────────────────────────────────
export function nextReviewLabel(card: FlashCard): string {
  const now = new Date();
  const next = new Date(card.next_review);
  const diffMs = next.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Due now";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.floor(diffDays / 7)}w`;
  return `In ${Math.floor(diffDays / 30)}mo`;
}

// ─── Extract best Big-O for watermark ────────────────────────────────────────
export function getBestBigO(card: FlashCard): string | null {
  if (!card.approaches || card.approaches.length === 0) return null;
  const optimal = card.approaches.find((a) => a.label === "Optimal") ?? card.approaches[card.approaches.length - 1];
  return optimal?.complexity?.time ?? null;
}

// ─── Stats for the library header ────────────────────────────────────────────
export function getStats(cards: FlashCard[]) {
  const due = cards.filter(isDue).length;
  const mastered = cards.filter((c) => c.interval_days >= 21).length;
  const new_cards = cards.filter((c) => c.repetitions === 0).length;
  return { due, mastered, new_cards, total: cards.length };
}
