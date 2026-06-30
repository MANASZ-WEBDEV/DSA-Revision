import type { FlashCard, ReviewEvent, StreakData, SessionConfig, SessionAnalytics } from "../types";

const CARDS_KEY = "dsa_flashcards_v1";
const HISTORY_KEY = "dsa_review_history_v1";
const STREAK_KEY = "dsa_streak_v1";
const IMPORTED_KEY = "dsa_imported_decks_v1";

export const Storage = {
  getCards(): FlashCard[] {
    try {
      const raw = localStorage.getItem(CARDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveCards(cards: FlashCard[]): void {
    try {
      localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error("Failed to save cards to storage", e);
    }
  },

  getReviewHistory(): ReviewEvent[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveReviewHistory(events: ReviewEvent[]): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(events));
    } catch (e) {
      console.error("Failed to save review history to storage", e);
    }
  },

  getStreak(): StreakData {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      return raw ? JSON.parse(raw) : { current: 0, longest: 0, last_review_date: null };
    } catch {
      return { current: 0, longest: 0, last_review_date: null };
    }
  },

  saveStreak(streak: StreakData): void {
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    } catch (e) {
      console.error("Failed to save streak to storage", e);
    }
  },

  getImportedDecks(): string[] {
    try {
      const raw = localStorage.getItem(IMPORTED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveImportedDecks(decks: string[]): void {
    try {
      localStorage.setItem(IMPORTED_KEY, JSON.stringify(decks));
    } catch (e) {
      console.error("Failed to save imported decks to storage", e);
    }
  },

  getSessionConfig(): SessionConfig | null {
    try {
      const raw = localStorage.getItem("dsa_session_config_v1");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveSessionConfig(config: SessionConfig): void {
    try {
      localStorage.setItem("dsa_session_config_v1", JSON.stringify(config));
    } catch (e) {
      console.error("Failed to save session config to storage", e);
    }
  },

  getSessionHistory(): SessionAnalytics[] {
    try {
      const raw = localStorage.getItem("dsa_session_history_v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveSessionHistory(history: SessionAnalytics[]): void {
    try {
      // Limit history to last 30 sessions to prevent storage bloat
      const trimmed = history.slice(-30);
      localStorage.setItem("dsa_session_history_v1", JSON.stringify(trimmed));
    } catch (e) {
      console.error("Failed to save session history to storage", e);
    }
  }
};

