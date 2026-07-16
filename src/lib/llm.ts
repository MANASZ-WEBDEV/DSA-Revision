import type { FlashCard } from "../types";
import type { CodeLanguage } from "../components/layout/LanguageIcon";
import { LANGUAGES } from "../components/layout/LanguageIcon";

// ─── Provider definitions ─────────────────────────────────────────────────────

export type ProviderId = "anthropic" | "gemini" | "groq";

export interface Provider {
  id: ProviderId;
  name: string;
  logo: string;           // legacy emoji (UI uses ProviderIcon SVGs instead)
  models: { id: string; label: string }[];
  keyPrefix: string;      // for basic validation
  keyPlaceholder: string;
  keyUrl: string;
  keyUrlLabel: string;
  freeNote: string;
}

export const PROVIDERS: Provider[] = [
  {
    id: "anthropic",
    name: "Claude (Anthropic)",
    logo: "🟠",
    models: [
      { id: "claude-sonnet-4-6",   label: "Claude Sonnet 4.6 (best)" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (faster)" },
    ],
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-api03-...",
    keyUrl: "https://console.anthropic.com",
    keyUrlLabel: "console.anthropic.com",
    freeNote: "~₹0.60/card · $5 lasts months",
  },
  {
    id: "gemini",
    name: "Gemini (Google AI Studio)",
    logo: "🔵",
    models: [
      { id: "gemini-2.0-flash",     label: "Gemini 2.0 Flash (free tier)" },
      { id: "gemini-1.5-flash",     label: "Gemini 1.5 Flash (free tier)" },
    ],
    keyPrefix: "AIza",
    keyPlaceholder: "AIzaSy...",
    keyUrl: "https://aistudio.google.com/apikey",
    keyUrlLabel: "aistudio.google.com",
    freeNote: "Free · 1500 req/day · no card needed",
  },
  {
    id: "groq",
    name: "Groq (Llama / Gemma)",
    logo: "⚡",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (recommended)" },
      { id: "gemma2-9b-it",            label: "Gemma 2 9B (fastest)" },
    ],
    keyPrefix: "gsk_",
    keyPlaceholder: "gsk_...",
    keyUrl: "https://console.groq.com/keys",
    keyUrlLabel: "console.groq.com",
    freeNote: "Free · generous daily limits",
  },
];

export function getProvider(id: ProviderId): Provider {
  return PROVIDERS.find((p) => p.id === id)!;
}

// ─── System prompt (same for all providers) ───────────────────────────────────

export const SYSTEM_PROMPT = `
You are a DSA interview coach helping a student build spaced-repetition flashcards for SWE interviews at Indian product companies (Google, Microsoft, Flipkart, etc.).

Given a problem description, produce a structured flashcard that teaches the PROGRESSION of thinking — from naive to optimal — not just the final answer. The student already knows basic data structures; your job is to encode the *insights* that unlock each approach.

## Rules
- Be terse. Every word must survive a review pass.
- Never restate the problem verbatim — reframe it.
- code_hint must be a properly formatted, multi-line code snippet inside the JSON string. Use \n for line breaks and \n followed by spaces for indentation. NEVER put all code on a single line. Each statement must be on its own line. Show the key algorithmic pattern — 3-6 lines depending on language verbosity. Never a full solution.
- trade_off for the Optimal approach should explain why no better tier exists.
- recall_trigger must be ≤15 words. It's the back of a physical flashcard.
- patterns must use ONLY tags from the canonical list — no custom tags.
- Return ONLY valid JSON. No preamble, no markdown fences, no explanation.
- MANDATORY: Always aim for exactly 3 approaches — "Brute Force", "Better", and "Optimal". Only omit "Better" if absolutely no meaningful intermediate tier exists (rare). Most problems have 3 tiers. Examples of "Better" approaches: Sort + Two Pointer for Two Sum, Sorting for Contains Duplicate, Heap for Top K. If you return only 2 approaches when a valid 3rd exists, that is an ERROR.

## Canonical pattern tags (use only these, 1–3 per card)
Two Pointers, Sliding Window, Binary Search, BFS, DFS, Backtracking,
DP: Linear, DP: Knapsack, DP: Interval, DP: Grid,
Monotonic Stack, Heap / Priority Queue, Union Find,
Trie, Greedy, Topological Sort, Divide and Conquer,
Prefix Sum, Bit Manipulation, Hashing

## Output schema (strict JSON)
{
  "title": "string — problem name",
  "difficulty": "Easy" | "Medium" | "Hard",
  "patterns": ["PatternTag", ...],
  "problem_summary": "string — 1-2 sentences restating the core ask in your own words",
  "recall_trigger": "string — ≤15 words, the single cue to fire on recognition",
  "approaches": [
    {
      "label": "Brute Force" | "Better" | "Optimal",
      "intuition": "string — why does this approach work at all?",
      "key_observation": "string — the insight that enables this tier",
      "complexity": { "time": "string", "space": "string" },
      "code_hint": "string — multi-line code using \\n for newlines, e.g. 'for (int i = 0; i < n; i++) {\\n  for (int j = i+1; j < n; j++) {\\n    if (nums[i]+nums[j]==target) return {i,j};\\n  }\\n}'",
      "trade_off": "string — why reject this / why this is the ceiling"
    }
  ],
  "edge_cases": ["string", ...],
  "similar_problems": ["string", ...]
}
`.trim();

// ─── Provider-specific fetch logic ────────────────────────────────────────────

type CardPartial = Omit<FlashCard,
  "id" | "created_at" | "next_review" | "interval_days" |
  "ease_factor" | "repetitions" | "last_quality" | "source_text"
>;

async function callAnthropic(problemText: string, apiKey: string, model: string, systemPrompt: string): Promise<CardPartial> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: `Problem:\n\n${problemText.trim()}` }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Anthropic error ${res.status}`);
  }

  const data = await res.json();
  return parseJSON(data.content[0].text, "Anthropic");
}

async function callGemini(problemText: string, apiKey: string, model: string, systemPrompt: string): Promise<CardPartial> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: `Problem:\n\n${problemText.trim()}` }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned an empty response. Check your API key.");
  return parseJSON(text, "Gemini");
}

async function callGroq(problemText: string, apiKey: string, model: string, systemPrompt: string): Promise<CardPartial> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Problem:\n\n${problemText.trim()}` },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Groq error ${res.status}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Groq returned an empty response.");
  return parseJSON(text, "Groq");
}

// ─── Shared JSON parser ───────────────────────────────────────────────────────

function parseJSON(raw: string, providerName: string): CardPartial {
  const clean = raw.replace(/```json\n?|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`${providerName} returned malformed JSON. Try again.`);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateFlashCard(
  problemText: string,
  providerId: ProviderId,
  apiKey: string,
  model: string,
  language: CodeLanguage = "any",
): Promise<CardPartial> {
  // Build prompt — append language line when not pseudocode
  let prompt = SYSTEM_PROMPT;
  if (language !== "any") {
    const langLabel = LANGUAGES.find((l) => l.id === language)?.label ?? language;
    prompt += `\n\nIMPORTANT: Write all code_hint fields in ${langLabel} syntax, not pseudocode. Format code_hint as a multi-line string using \\n for line breaks and proper indentation. Each statement MUST be on its own line — NEVER put multiple statements on one line separated by semicolons. Example for C++:\n"for (int i = 0; i < n; i++) {\\n  for (int j = i+1; j < n; j++) {\\n    if (nums[i]+nums[j]==target)\\n      return {i,j};\\n  }\\n}"\nShow the complete algorithmic structure (loops, conditions, return) but never a full production solution.`;
  }

  switch (providerId) {
    case "anthropic": return callAnthropic(problemText, apiKey, model, prompt);
    case "gemini":    return callGemini(problemText, apiKey, model, prompt);
    case "groq":      return callGroq(problemText, apiKey, model, prompt);
  }
}

// ─── Pattern tag color map (unchanged) ───────────────────────────────────────

export const PATTERN_COLORS: Record<string, string> = {
  "Two Pointers":          "#dbeafe",
  "Sliding Window":        "#dbeafe",
  "Binary Search":         "#ede9fe",
  "BFS":                   "#d1fae5",
  "DFS":                   "#d1fae5",
  "Backtracking":          "#fce7f3",
  "DP: Linear":            "#fef3c7",
  "DP: Knapsack":          "#fef3c7",
  "DP: Interval":          "#fef3c7",
  "DP: Grid":              "#fef3c7",
  "Monotonic Stack":       "#fee2e2",
  "Heap / Priority Queue": "#ffedd5",
  "Union Find":            "#f0fdf4",
  "Trie":                  "#fdf4ff",
  "Greedy":                "#ecfdf5",
  "Topological Sort":      "#eff6ff",
  "Divide and Conquer":    "#f5f3ff",
  "Prefix Sum":            "#fefce8",
  "Bit Manipulation":      "#fdf2f8",
  "Hashing":               "#f0f9ff",
};

export const PATTERN_TEXT_COLORS: Record<string, string> = {
  "Two Pointers":          "#1e40af",
  "Sliding Window":        "#1e40af",
  "Binary Search":         "#5b21b6",
  "BFS":                   "#065f46",
  "DFS":                   "#065f46",
  "Backtracking":          "#9d174d",
  "DP: Linear":            "#92400e",
  "DP: Knapsack":          "#92400e",
  "DP: Interval":          "#92400e",
  "DP: Grid":              "#92400e",
  "Monotonic Stack":       "#991b1b",
  "Heap / Priority Queue": "#9a3412",
  "Union Find":            "#14532d",
  "Trie":                  "#701a75",
  "Greedy":                "#064e3b",
  "Topological Sort":      "#1e3a8a",
  "Divide and Conquer":    "#4c1d95",
  "Prefix Sum":            "#713f12",
  "Bit Manipulation":      "#831843",
  "Hashing":               "#0c4a6e",
};
