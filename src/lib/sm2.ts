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
  const next = new Date(card.next_review);
  next.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return next <= today;
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
  now.setHours(0, 0, 0, 0);
  const next = new Date(card.next_review);
  next.setHours(0, 0, 0, 0);
  const diffMs = next.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

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

// ─── Daily Revision Plan ──────────────────────────────────────────────────────
//
// Pure SM-2 schedules individual cards but provides no guarantee at the PATTERN
// level — a pattern with only 1-2 cards and a high ease factor can silently go
// unreviewed for months once its interval stretches out. The user has no signal
// that a whole technique is decaying.
//
// getDailySession() layers three rules on top of raw SM-2 due-dates:
//
//   1. DUE CARDS FIRST — all SM-2-due cards are included, always, sorted most
//      overdue first. Non-negotiable; these are on the verge of being forgotten.
//
//   2. PATTERN-STALENESS TOP-UP — if a pattern tag hasn't been touched (reviewed
//      OR currently due) in PATTERN_STALE_DAYS, its single most-overdue card is
//      pulled into today's session even if SM-2 says it isn't due yet. This is
//      the actual "never forget a pattern" guarantee — independent of how well
//      any one card's ease factor has grown. Capped at MAX_STALENESS_TOPUPS/day
//      so it can't balloon session size.
//
//   3. NEW CARD DRIP-FEED — up to NEW_CARDS_PER_DAY unseen cards are introduced,
//      but only if the queue so far is under SESSION_SIZE_CAP. New cards never
//      crowd out reviews.
//
// Session size is hard-capped at SESSION_SIZE_CAP. If true due cards exceed it,
// the most overdue are shown and the rest roll into tomorrow — this protects
// against a missed week turning into an abandoned 200-card pile.

export const PATTERN_STALE_DAYS = 14;
export const MAX_STALENESS_TOPUPS = 3;
export const NEW_CARDS_PER_DAY = 5;
export const SESSION_SIZE_CAP = 25;

export interface DailySessionResult {
  cards: FlashCard[];
  dueCount: number;          // how many are "true" SM-2 due
  staleTopUpCount: number;   // how many were pulled in purely for pattern coverage
  newCardCount: number;      // how many are brand-new (repetitions === 0)
  rolledOverCount: number;   // due cards that didn't fit and roll to tomorrow
  staleTags: string[];       // which patterns triggered a top-up, for UI messaging
}

export function getDailySession(cards: FlashCard[]): DailySessionResult {
  const now = Date.now();
  const staleThresholdMs = PATTERN_STALE_DAYS * 24 * 60 * 60 * 1000;

  // 1. True due cards, most overdue first
  const due = getDueCards(cards);
  const dueIds = new Set(due.map((c) => c.id));

  // Respect the session cap on due cards alone first — these always win the slots
  const dueForSession = due.slice(0, SESSION_SIZE_CAP);
  const rolledOverCount = Math.max(0, due.length - dueForSession.length);

  const sessionIds = new Set(dueForSession.map((c) => c.id));
  let remaining = SESSION_SIZE_CAP - dueForSession.length;

  // 2. Pattern-staleness top-up — only runs if there's room left
  const staleTags: string[] = [];
  const staleTopUps: FlashCard[] = [];

  if (remaining > 0) {
    // A pattern is "stale" if every card carrying that tag was created/touched
    // more than PATTERN_STALE_DAYS ago, and none of its cards are already due.
    const patternToCards = new Map<string, FlashCard[]>();
    for (const c of cards) {
      for (const p of c.patterns) {
        if (!patternToCards.has(p)) patternToCards.set(p, []);
        patternToCards.get(p)!.push(c);
      }
    }

    for (const [pattern, patternCards] of patternToCards) {
      if (staleTopUps.length >= MAX_STALENESS_TOPUPS || remaining <= 0) break;

      // Pattern already represented in today's session via a due card — covered, skip
      const alreadyCovered = patternCards.some((c) => dueIds.has(c.id));
      if (alreadyCovered) continue;

      // Find the most recent "touch" for this pattern: latest updated_at or created_at across its cards
      const mostRecentTouch = Math.max(
        ...patternCards.map((c) => new Date(c.updated_at || c.created_at).getTime())
      );
      const isStale = now - mostRecentTouch > staleThresholdMs;
      if (!isStale) continue;

      // Pull the single most-overdue (or soonest-due) card for this pattern
      const candidate = [...patternCards].sort(
        (a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime()
      )[0];

      if (candidate && !sessionIds.has(candidate.id)) {
        staleTopUps.push(candidate);
        sessionIds.add(candidate.id);
        staleTags.push(pattern);
        remaining -= 1;
      }
    }
  }

  // 3. New card drip-feed — only fills genuinely leftover room
  const newCards: FlashCard[] = [];
  if (remaining > 0) {
    const unseen = cards
      .filter((c) => c.repetitions === 0 && !sessionIds.has(c.id))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const c of unseen) {
      if (newCards.length >= NEW_CARDS_PER_DAY || remaining <= 0) break;
      newCards.push(c);
      sessionIds.add(c.id);
      remaining -= 1;
    }
  }

  return {
    cards: [...dueForSession, ...staleTopUps, ...newCards],
    dueCount: dueForSession.length,
    staleTopUpCount: staleTopUps.length,
    newCardCount: newCards.length,
    rolledOverCount,
    staleTags,
  };
}
