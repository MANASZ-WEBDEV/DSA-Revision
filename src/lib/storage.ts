import type { FlashCard, ReviewEvent, StreakData, SessionConfig, SessionAnalytics } from "../types";
import { supabase } from "./supabaseClient";

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
      throw e;
    }
  },

  getReviewHistory(): ReviewEvent[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) as ReviewEvent[] : [];
      const seen = new Set<string>();
      const deduped: ReviewEvent[] = [];
      for (const item of parsed) {
        if (!item.card_id || !item.reviewed_at) continue;
        const timestamp = new Date(item.reviewed_at).getTime();
        const key = `${item.card_id}::${timestamp}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }
      return deduped;
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
      const parsed = raw ? JSON.parse(raw) as SessionAnalytics[] : [];
      const seen = new Set<string>();
      const deduped: SessionAnalytics[] = [];
      for (const item of parsed) {
        if (!item.startedAt || !item.completedAt) continue;
        const key = `${new Date(item.startedAt).getTime()}::${new Date(item.completedAt).getTime()}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }
      return deduped;
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
  },

  async migrateLocalToSupabase(userId: string): Promise<boolean> {
    const migratedFlag = localStorage.getItem("dsa_migrated_v1");
    if (migratedFlag === "true") return true;

    try {
      const localCards = this.getCards();
      const localHistory = this.getReviewHistory();
      const localSessions = this.getSessionHistory();

      // Upsert profile
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from("profiles").upsert({
          id: userId,
          email: userData.user.email,
          github_username: userData.user.user_metadata?.user_name || null,
        });
      }

      // Sync cards
      if (localCards.length > 0) {
        const { error: cardsErr } = await supabase
          .from("cards")
          .upsert(
            localCards.map(c => ({
              user_id: userId,
              local_id: c.id,
              deck: c.deck,
              title: c.title,
              difficulty: c.difficulty,
              patterns: c.patterns,
              problem_summary: c.problem_summary,
              recall_trigger: c.recall_trigger,
              approaches: c.approaches,
              edge_cases: c.edge_cases,
              similar_problems: c.similar_problems,
              source_text: c.source_text,
              ease_factor: c.ease_factor,
              repetitions: c.repetitions,
              interval_days: c.interval_days,
              next_review: c.next_review,
              last_quality: c.last_quality,
              notes: c.notes,
              created_at: c.created_at,
              updated_at: c.updated_at || c.created_at,
            })),
            { onConflict: "user_id,local_id" }
          );
        if (cardsErr) throw cardsErr;
      }

      // Sync review history
      if (localHistory.length > 0) {
        const { error: histErr } = await supabase
          .from("review_history")
          .insert(
            localHistory.map(h => ({
              user_id: userId,
              card_local_id: h.card_id,
              patterns: h.patterns,
              quality: h.quality,
              reviewed_at: h.reviewed_at,
            }))
          );
        if (histErr) throw histErr;
      }

      // Sync session history
      if (localSessions.length > 0) {
        const { error: sessErr } = await supabase
          .from("session_history")
          .insert(
            localSessions.map(s => ({
              user_id: userId,
              started_at: s.startedAt,
              completed_at: s.completedAt,
              total_cards: s.totalCards,
              results: s.results,
              reflection: s.reflection,
            }))
          );
        if (sessErr) throw sessErr;
      }

      localStorage.setItem("dsa_migrated_v1", "true");
      return true;
    } catch (e) {
      console.error("Migration failed:", e);
      return false;
    }
  },

  async syncWithSupabase(userId: string): Promise<{ success: boolean; cards?: FlashCard[] }> {
    try {
      // 1. Fetch remote cards
      const { data: remoteCards, error: remoteErr } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", userId);
      
      if (remoteErr) throw remoteErr;

      const localCards = this.getCards();
      const localMap = new Map(localCards.map(c => [c.id, c]));
      const remoteMap = new Map((remoteCards || []).map(r => [r.local_id, r]));

      const mergedCards: FlashCard[] = [];
      const cardsToUpsertToRemote: any[] = [];

      // Reconcile cards
      for (const local of localCards) {
        const remote = remoteMap.get(local.id);
        if (!remote) {
          // Present locally, not remotely -> push to remote
          cardsToUpsertToRemote.push(mapLocalToRemote(local, userId));
          mergedCards.push(local);
        } else {
          // Present in both -> compare updated_at
          const localUpdated = new Date(local.updated_at || local.created_at).getTime();
          const remoteUpdated = new Date(remote.updated_at || remote.created_at).getTime();

          if (local.dirty || localUpdated > remoteUpdated) {
            // Local is newer or dirty -> push to remote
            cardsToUpsertToRemote.push(mapLocalToRemote({ ...local, dirty: undefined }, userId));
            mergedCards.push({ ...local, dirty: undefined });
          } else {
            // Remote is newer -> pull to local
            const pulled = mapRemoteToLocal(remote);
            if (local.notes === pulled.notes) {
              pulled.notes_updated_at = local.notes_updated_at;
            }
            mergedCards.push(pulled);
          }
        }
      }

      // Check remote cards not in local
      for (const remote of remoteCards || []) {
        if (!localMap.has(remote.local_id)) {
          // Present remotely, not locally -> pull to local
          mergedCards.push(mapRemoteToLocal(remote));
        }
      }

      // 2. Push dirty/new cards to remote
      if (cardsToUpsertToRemote.length > 0) {
        const { error: pushErr } = await supabase
          .from("cards")
          .upsert(cardsToUpsertToRemote, { onConflict: "user_id,local_id" });
        if (pushErr) throw pushErr;
      }

      // 3. Save resolved cards locally (clears dirty flags)
      this.saveCards(mergedCards);

      // 4. Fetch and reconcile review history
      const { data: remoteHistory, error: histErr } = await supabase
        .from("review_history")
        .select("*")
        .eq("user_id", userId);
      if (histErr) throw histErr;

      const localHistory = this.getReviewHistory();
      const localHistKeys = new Set(localHistory.map(h => `${h.card_id}::${new Date(h.reviewed_at).getTime()}`));
      const remoteHistKeys = new Set((remoteHistory || []).map(r => `${r.card_local_id}::${new Date(r.reviewed_at).getTime()}`));

      const historyToPush: any[] = [];
      const mergedHistory = [...localHistory];

      // Local events not in remote -> push
      for (const local of localHistory) {
        const key = `${local.card_id}::${new Date(local.reviewed_at).getTime()}`;
        if (!remoteHistKeys.has(key)) {
          historyToPush.push({
            user_id: userId,
            card_local_id: local.card_id,
            patterns: local.patterns,
            quality: local.quality,
            reviewed_at: local.reviewed_at,
          });
          remoteHistKeys.add(key);
        }
      }

      // Remote events not in local -> pull
      for (const remote of remoteHistory || []) {
        const key = `${remote.card_local_id}::${new Date(remote.reviewed_at).getTime()}`;
        if (!localHistKeys.has(key)) {
          mergedHistory.push({
            card_id: remote.card_local_id,
            patterns: remote.patterns,
            quality: remote.quality,
            reviewed_at: remote.reviewed_at,
          });
          localHistKeys.add(key);
        }
      }

      // Push history
      if (historyToPush.length > 0) {
        const { error: pushHistErr } = await supabase
          .from("review_history")
          .insert(historyToPush);
        if (pushHistErr) throw pushHistErr;
      }

      // Save resolved history locally
      this.saveReviewHistory(mergedHistory);

      // 5. Fetch and reconcile session history
      const { data: remoteSessions, error: sessErr } = await supabase
        .from("session_history")
        .select("*")
        .eq("user_id", userId);
      if (sessErr) throw sessErr;

      const localSessions = this.getSessionHistory();
      const localSessKeys = new Set(localSessions.map(s => `${new Date(s.startedAt).getTime()}::${new Date(s.completedAt).getTime()}`));
      const remoteSessKeys = new Set((remoteSessions || []).map(r => `${new Date(r.started_at).getTime()}::${new Date(r.completed_at).getTime()}`));

      const sessionsToPush: any[] = [];
      const mergedSessions = [...localSessions];

      // Local sessions not in remote -> push
      for (const local of localSessions) {
        const key = `${new Date(local.startedAt).getTime()}::${new Date(local.completedAt).getTime()}`;
        if (!remoteSessKeys.has(key)) {
          sessionsToPush.push({
            user_id: userId,
            started_at: local.startedAt,
            completed_at: local.completedAt,
            total_cards: local.totalCards,
            results: local.results,
            reflection: local.reflection,
          });
          remoteSessKeys.add(key);
        }
      }

      // Remote sessions not in local -> pull
      for (const remote of remoteSessions || []) {
        const key = `${new Date(remote.started_at).getTime()}::${new Date(remote.completed_at).getTime()}`;
        if (!localSessKeys.has(key)) {
          mergedSessions.push({
            startedAt: remote.started_at,
            completedAt: remote.completed_at,
            totalCards: remote.total_cards,
            results: remote.results,
            reflection: remote.reflection,
          });
          localSessKeys.add(key);
        }
      }

      // Push sessions
      if (sessionsToPush.length > 0) {
        const { error: pushSessErr } = await supabase
          .from("session_history")
          .insert(sessionsToPush);
        if (pushSessErr) throw pushSessErr;
      }

      // Save resolved sessions locally
      this.saveSessionHistory(mergedSessions);

      return { success: true, cards: mergedCards };
    } catch (e) {
      console.error("Sync failed:", e);
      return { success: false };
    }
  }
};

function mapLocalToRemote(local: FlashCard, userId: string) {
  return {
    user_id: userId,
    local_id: local.id,
    deck: local.deck,
    title: local.title,
    difficulty: local.difficulty,
    patterns: local.patterns,
    problem_summary: local.problem_summary,
    recall_trigger: local.recall_trigger,
    approaches: local.approaches,
    edge_cases: local.edge_cases,
    similar_problems: local.similar_problems,
    source_text: local.source_text,
    ease_factor: local.ease_factor,
    repetitions: local.repetitions,
    interval_days: local.interval_days,
    next_review: local.next_review,
    last_quality: local.last_quality,
    notes: local.notes,
    notes_updated_at: local.notes_updated_at,
    created_at: local.created_at,
    updated_at: local.updated_at || local.created_at,
  };
}

function mapRemoteToLocal(remote: any): FlashCard {
  return {
    id: remote.local_id,
    deck: remote.deck,
    title: remote.title,
    difficulty: remote.difficulty,
    patterns: remote.patterns,
    problem_summary: remote.problem_summary,
    recall_trigger: remote.recall_trigger,
    approaches: remote.approaches,
    edge_cases: remote.edge_cases,
    similar_problems: remote.similar_problems,
    source_text: remote.source_text,
    ease_factor: remote.ease_factor,
    repetitions: remote.repetitions,
    interval_days: remote.interval_days,
    next_review: remote.next_review,
    last_quality: remote.last_quality,
    notes: remote.notes,
    notes_updated_at: remote.notes_updated_at,
    created_at: remote.created_at,
    updated_at: remote.updated_at,
  };
}


