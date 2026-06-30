import { useState, useEffect, useCallback } from "react";
import type { FlashCard, ReviewEvent, StreakData, ReviewQuality, SessionConfig } from "../types";
import type { ProviderId } from "../lib/llm";
import { PROVIDERS } from "../lib/llm";
import { Storage } from "../lib/storage";

const PROVIDER_KEY = "dsa_provider";
const MODEL_KEY = "dsa_model";
const keyStorageId = (p: ProviderId) => `dsa_key_${p}`;

// Local YYYY-MM-DD (not UTC) so streaks track the user's actual day
function localDateStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

// ─── Card store ───────────────────────────────────────────────────────────────
export function useCardStore() {
  const [cards, setCards] = useState<FlashCard[]>(() => Storage.getCards());

  useEffect(() => {
    Storage.saveCards(cards);
  }, [cards]);

  const addCard    = useCallback((card: FlashCard) => setCards((p) => [card, ...p]), []);
  const updateCard = useCallback((id: string, updates: Partial<FlashCard>) =>
    setCards((p) => p.map((c) => (c.id === id ? { ...c, ...updates } : c))), []);
  const deleteCard = useCallback((id: string) =>
    setCards((p) => p.filter((c) => c.id !== id)), []);

  // Import a batch of cards (for starter packs / shared decks)
  // Deduplicates by card title + deck name to prevent double-imports
  const importCards = useCallback((newCards: FlashCard[]) => {
    setCards((prev) => {
      const existingKeys = new Set(prev.map((c) => `${c.deck}::${c.title}`));
      const unique = newCards.filter((c) => !existingKeys.has(`${c.deck}::${c.title}`));
      return [...unique, ...prev];
    });
  }, []);

  // Delete all cards belonging to a specific deck
  const deleteDeck = useCallback((deckName: string) => {
    setCards((p) => p.filter((c) => c.deck !== deckName));
  }, []);

  // Check if a deck has already been imported
  const isDeckImported = useCallback((deckId: string): boolean => {
    return Storage.getImportedDecks().includes(deckId);
  }, []);

  // Mark a deck as imported
  const markDeckImported = useCallback((deckId: string) => {
    const imported = Storage.getImportedDecks();
    if (!imported.includes(deckId)) {
      Storage.saveImportedDecks([...imported, deckId]);
    }
  }, []);

  return { cards, addCard, updateCard, deleteCard, importCards, deleteDeck, isDeckImported, markDeckImported };
}

// ─── Provider + model + per-provider key store ────────────────────────────────
export function useProviderStore() {
  const defaultProvider = (localStorage.getItem(PROVIDER_KEY) as ProviderId) ?? "gemini";
  const defaultModel    = localStorage.getItem(MODEL_KEY)
    ?? PROVIDERS.find((p) => p.id === defaultProvider)!.models[0].id;

  const [providerId, setProviderIdState] = useState<ProviderId>(defaultProvider);
  const [model, setModelState]           = useState<string>(defaultModel);

  // Each provider remembers its own key
  const [keys, setKeys] = useState<Record<ProviderId, string>>(() => ({
    anthropic: localStorage.getItem(keyStorageId("anthropic")) ?? "",
    gemini:    localStorage.getItem(keyStorageId("gemini"))    ?? "",
    groq:      localStorage.getItem(keyStorageId("groq"))      ?? "",
  }));

  const currentKey = keys[providerId];

  const setProvider = useCallback((id: ProviderId) => {
    localStorage.setItem(PROVIDER_KEY, id);
    setProviderIdState(id);
    // Switch to first model of the new provider
    const firstModel = PROVIDERS.find((p) => p.id === id)!.models[0].id;
    localStorage.setItem(MODEL_KEY, firstModel);
    setModelState(firstModel);
  }, []);

  const setModel = useCallback((m: string) => {
    localStorage.setItem(MODEL_KEY, m);
    setModelState(m);
  }, []);

  const setKey = useCallback((id: ProviderId, key: string) => {
    const trimmed = key.trim();
    localStorage.setItem(keyStorageId(id), trimmed);
    setKeys((prev) => ({ ...prev, [id]: trimmed }));
  }, []);

  return { providerId, model, currentKey, keys, setProvider, setModel, setKey };
}

// ─── Review history + streak store ─────────────────────────────────────────────
export function useReviewHistory() {
  const [events, setEvents] = useState<ReviewEvent[]>(() => Storage.getReviewHistory());
  const [streak, setStreak] = useState<StreakData>(() => Storage.getStreak());

  useEffect(() => {
    Storage.saveReviewHistory(events);
  }, [events]);

  useEffect(() => {
    Storage.saveStreak(streak);
  }, [streak]);

  // Records one card review + updates streak (call once per card graded)
  const recordReview = useCallback((card: FlashCard, quality: ReviewQuality) => {
    const now = new Date();
    const todayStr = localDateStr(now);

    setEvents((prev) => [
      ...prev,
      { card_id: card.id, patterns: card.patterns, quality, reviewed_at: now.toISOString() },
    ]);

    setStreak((prev) => {
      // Already reviewed today — streak unaffected, just keep as-is
      if (prev.last_review_date === todayStr) return prev;

      const isConsecutive = prev.last_review_date
        ? daysBetween(prev.last_review_date, todayStr) === 1
        : false;

      const nextCurrent = isConsecutive ? prev.current + 1 : 1;
      return {
        current: nextCurrent,
        longest: Math.max(prev.longest, nextCurrent),
        last_review_date: todayStr,
      };
    });
  }, []);

  return { events, streak, recordReview };
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  patterns: [],
  difficulties: [],
  decks: [],
  sessionSize: 20,
  timerEnabled: false,
  timerSeconds: 60,
  useSmartSession: true,
};

export function useSessionConfig() {
  const [config, setConfigState] = useState<SessionConfig>(() => {
    return Storage.getSessionConfig() ?? DEFAULT_SESSION_CONFIG;
  });

  const setConfig = useCallback((newConfig: SessionConfig) => {
    Storage.saveSessionConfig(newConfig);
    setConfigState(newConfig);
  }, []);

  return { config, setConfig };
}

