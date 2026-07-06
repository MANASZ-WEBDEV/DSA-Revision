import type { FlashCard } from "../types";

/**
 * Normalizes a problem title or slug by stripping leading digits,
 * lowercasing, and keeping only alphanumeric characters.
 */
export function normalizeTitle(title: string): string {
  return title
    .replace(/^\d+[\.\s\-]+/, "") // strip leading numbers like "1.", "1 - ", "01."
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // keep only alphanumeric
}

/**
 * Simple non-cryptographic string hash (djb2) to generate an unsigned hex string.
 */
export function getTitleHash(title: string): string {
  const normalized = normalizeTitle(title);
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Extracts word tokens from a text for similarity check (filters out short/common words).
 */
function getWordTokens(text: string): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(word => word.length > 2)
  );
}

/**
 * Computes Jaccard similarity coefficient (intersection over union) between two texts.
 */
export function computeJaccardSimilarity(textA: string, textB: string): number {
  const tokensA = getWordTokens(textA);
  const tokensB = getWordTokens(textB);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionSize = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionSize++;
    }
  }
  const unionSize = tokensA.size + tokensB.size - intersectionSize;
  return intersectionSize / unionSize;
}

interface DuplicateCheckResult {
  isExact: boolean;
  isFuzzy: boolean;
  similarity?: number; // percentage (0-100)
  matchedCard?: FlashCard;
}

/**
 * Performs a two-pass check for duplicate cards.
 * 1. Exact slug/title hash check.
 * 2. Fuzzy text similarity check (compares title and source_text/description).
 */
export function checkDuplicateCard(
  newCard: Partial<FlashCard> & { title: string; source_text?: string },
  existingCards: FlashCard[]
): DuplicateCheckResult {
  const newHash = getTitleHash(newCard.title);

  // Pass 1: Exact check
  const exactMatch = existingCards.find(c => getTitleHash(c.title) === newHash);
  if (exactMatch) {
    return { isExact: true, isFuzzy: false, matchedCard: exactMatch, similarity: 100 };
  }

  // Pass 2: Fuzzy check
  let bestMatch: FlashCard | undefined = undefined;
  let maxSimilarity = 0;

  for (const card of existingCards) {
    // 1. Check title similarity
    const titleSim = computeJaccardSimilarity(newCard.title, card.title);
    // 2. Check source text similarity (if available)
    const descSim = (newCard.source_text && card.source_text)
      ? computeJaccardSimilarity(newCard.source_text, card.source_text)
      : 0;

    const combinedSim = Math.max(titleSim, descSim);
    if (combinedSim > maxSimilarity) {
      maxSimilarity = combinedSim;
      bestMatch = card;
    }
  }

  // Thresholds: title similarity > 70% OR source_text similarity > 65%
  const fuzzyThreshold = 0.65;
  if (maxSimilarity >= fuzzyThreshold && bestMatch) {
    return {
      isExact: false,
      isFuzzy: true,
      similarity: Math.round(maxSimilarity * 100),
      matchedCard: bestMatch,
    };
  }

  return { isExact: false, isFuzzy: false };
}
