// ─── Approach: one per complexity tier (brute → better → optimal) ───────────
export interface Approach {
  label: "Brute Force" | "Better" | "Optimal";
  intuition: string;         // Why does this approach work?
  key_observation: string;   // The single insight that enables this approach
  complexity: {
    time: string;
    space: string;
  };
  code_hint: string;         // Pseudocode / key lines — NOT full solution
  trade_off: string;         // Why you'd reject this for the next tier
}

// ─── Structured personal study notes ─────────────────────────────────────────
export interface StudyNote {
  keyInsight?: string;       // "the trick I'd forget"
  stuckPoint?: string;       // where reasoning broke down
  mistakeToAvoid?: string;   // specific trap for this problem
  freeform?: string;         // anything else, markdown-capable
  updatedAt: string;         // ISO timestamp
}

/** Safely upgrade legacy string notes → structured StudyNote on read */
export function migrateNote(
  raw: string | StudyNote | undefined,
  fallbackTimestamp?: string
): StudyNote | undefined {
  if (!raw) return undefined;
  if (typeof raw === "object" && "updatedAt" in raw) return raw; // already migrated
  // Legacy string → wrap into freeform
  return {
    freeform: raw as string,
    updatedAt: fallbackTimestamp || new Date().toISOString(),
  };
}

/** Check if a StudyNote has any actual content */
export function hasNoteContent(note: string | StudyNote | undefined): boolean {
  if (!note) return false;
  if (typeof note === "string") return note.trim().length > 0;
  return !!(note.keyInsight?.trim() || note.stuckPoint?.trim() || note.mistakeToAvoid?.trim() || note.freeform?.trim());
}

// ─── DSA-aware grading types ─────────────────────────────────────────────────
export type ApproachRecall = "yes" | "partial" | "no";
export type ImplementationRecall = "yes" | "partial" | "no" | null;

export interface GradeInput {
  approachRecall: ApproachRecall;
  implementationRecall: ImplementationRecall;
}

// ─── The full flashcard ──────────────────────────────────────────────────────
export interface FlashCard {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  patterns: PatternTag[];
  problem_summary: string;   // 1-2 sentence restatement in your own words
  recall_trigger: string;    // The single cue that should fire when you see this
  approaches: Approach[];    // 1–3 approaches
  edge_cases: string[];      // Common gotchas
  similar_problems: string[];
  source_text: string;       // Original paste

  // ─── Deck membership (Anki-style) ──────────────────────────────────────────
  deck: string | null;       // null = self-generated, "Blind 75" = imported from starter pack

  created_at: string;
  updated_at: string;

  // ─── SM-2 spaced repetition fields ──────────────────────────────────────
  next_review: string;       // ISO date string
  interval_days: number;     // Current interval
  ease_factor: number;       // EF, starts at 2.5
  repetitions: number;       // How many times reviewed
  last_quality: number | null; // 0–5 last rating
  notes?: string | StudyNote; // User's personal notes — string = legacy, StudyNote = structured
  notes_updated_at?: string; // Last edited timestamp of notes (legacy, kept for compat)
  dirty?: boolean;           // Local change dirty flag for syncing

  // ─── DSA-aware grading + leech fields ──────────────────────────────────
  leech_count: number;
  is_leech: boolean;
  last_approach_recall: ApproachRecall | null;
  last_implementation_recall: ImplementationRecall;
}

// ─── Deck metadata ──────────────────────────────────────────────────────────
export interface Deck {
  id: string;
  name: string;
  description: string;
  count: number;
  isBuiltin: boolean;        // true for Blind 75, false for user-created/shared
  icon: string;              // emoji or icon identifier
}

// ─── SM-2 review quality ratings ────────────────────────────────────────────
export type ReviewQuality =
  | 0  // Complete blackout
  | 1  // Wrong, but remembered on seeing answer
  | 2  // Wrong, easy to recall after
  | 3  // Correct with significant difficulty
  | 4  // Correct after hesitation
  | 5; // Perfect recall

// ─── Canonical pattern tags ──────────────────────────────────────────────────
export const PATTERN_TAGS = [
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "BFS",
  "DFS",
  "Backtracking",
  "DP: Linear",
  "DP: Knapsack",
  "DP: Interval",
  "DP: Grid",
  "Monotonic Stack",
  "Heap / Priority Queue",
  "Union Find",
  "Trie",
  "Greedy",
  "Topological Sort",
  "Divide and Conquer",
  "Prefix Sum",
  "Bit Manipulation",
  "Hashing",
] as const;

export type PatternTag = (typeof PATTERN_TAGS)[number];

// ─── App route paths ─────────────────────────────────────────────────────────
export const ROUTES = {
  DASHBOARD: "/",
  LIBRARY: "/library",
  GENERATE: "/generate",
  REVIEW: "/review",
  CARD_DETAIL: "/card/:id",
  STARTER_PACKS: "/starter-packs",
} as const;

// ─── Review history (for heatmap + streaks + pattern mastery) ───────────────
export interface ReviewEvent {
  card_id: string;
  patterns: PatternTag[];
  quality: ReviewQuality;
  reviewed_at: string; // ISO date string
}

export interface StreakData {
  current: number;
  longest: number;
  last_review_date: string | null; // YYYY-MM-DD, local date
}

// ─── Session configuration ───────────────────────────────────────────────────
export interface SessionConfig {
  patterns: PatternTag[];
  difficulties: ("Easy" | "Medium" | "Hard")[];
  decks: string[];
  sessionSize: number;         // e.g. 5, 10, 15, 20, 25, 100
  timerEnabled: boolean;
  timerSeconds: number;        // e.g. 30, 60, 90, 120
  useSmartSession: boolean;    // true = getDailySession, false = getDueCards
}

// ─── Session analytics ────────────────────────────────────────────────────────
export interface SessionAnalytics {
  totalCards: number;
  results: {
    cardId: string;
    cardTitle: string;
    quality: ReviewQuality;
    timeMs: number;
    recalledApproaches: string[];
    isSelfExplained: boolean;
    approachRecall?: ApproachRecall;
    implementationRecall?: ImplementationRecall;
  }[];
  startedAt: string;
  completedAt: string;
  reflection?: string;
}

