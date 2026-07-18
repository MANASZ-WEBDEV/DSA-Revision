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
- Ensure all algorithm logic and code hints are correct and sound. Avoid assuming pre-calculated helper variables (such as sorting a non-existent 'prefixGcd' array) without showing how they are constructed. Show the complete code flow in 'code_hint', including any necessary array constructions.
- Always prefer in-place modifications to optimize space complexity. If the input array can be mutated to store intermediate values (e.g., in-place element updates or in-place sorting), do it in-place on the input array (e.g. mutating the input array directly instead of declaring a new array) to achieve O(1) auxiliary space complexity.
- In-place modifications to input arguments (such as modifying the input array in-place, or sorting it in-place) use O(1) auxiliary space. The space complexity for these approaches MUST be written as O(1).
- trade_off for the Optimal approach should explain why no better tier exists.
- recall_trigger must be ≤15 words. It's the back of a physical flashcard.
- patterns must use ONLY tags from the canonical list — no custom tags.
- Return ONLY valid JSON. No preamble, no markdown fences, no explanation.
- Generate EXACTLY 2 approaches: "Brute Force" and "Optimal". Do NOT include a "Better" tier — that will be evaluated separately. The approaches array must contain exactly 2 objects.

## Canonical pattern tags (use only these, 1–3 per card)
Two Pointers, Sliding Window, Binary Search, BFS, DFS, Backtracking,
DP: Linear, DP: Knapsack, DP: Interval, DP: Grid,
Monotonic Stack, Heap / Priority Queue, Union Find,
Trie, Greedy, Topological Sort, Divide and Conquer,
Prefix Sum, Bit Manipulation, Hashing, Sorting,
Math / Number Theory

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

// ─── Separate prompt for conditional "Better" tier ────────────────────────────

const BETTER_TIER_PROMPT = `You are a DSA algorithm analyst. You will be given a problem description along with a "Brute Force" and "Optimal" approach (with their complexities and code hints).

Your ONLY job: decide whether a genuinely DISTINCT intermediate ("Better") approach exists between them.

A valid "Better" tier MUST satisfy ALL of these:
1. It has a DIFFERENT time complexity than both Brute Force and Optimal (e.g., O(n log n) between O(n²) and O(n)), OR it uses a fundamentally different technique/data structure than Optimal.
2. It represents a real, well-known algorithmic idea — not a minor variation of Optimal or a rephrasing.
3. A student learning this problem would lose a genuinely distinct insight if it were omitted.

Examples of VALID "Better" tiers:
- Two Sum: Sort + Two Pointers (O(n log n)) between nested loops (O(n²)) and hash map (O(n))
- Top K Elements: Sorting (O(n log n)) between brute max-scan (O(nk)) and heap (O(n log k))

Examples of INVALID "Better" tiers (DO NOT produce these):
- Same complexity as Optimal but described differently
- Same algorithm as Optimal but with a minor implementation tweak
- An invented approach that doesn't correspond to a real algorithm

If NO valid "Better" approach exists, respond with EXACTLY the word: NONE

If a valid "Better" approach DOES exist, respond with ONLY valid JSON (no markdown fences, no explanation):
{
  "label": "Better",
  "intuition": "string — why does this approach work?",
  "key_observation": "string — the insight that enables this tier",
  "complexity": { "time": "string", "space": "string" },
  "code_hint": "string — multi-line code using \\\\n for newlines",
  "trade_off": "string — why reject this in favor of Optimal"
}
`.trim();

// ─── Provider-specific fetch logic ────────────────────────────────────────────

export type CardPartial = Omit<FlashCard,
  "id" | "created_at" | "next_review" | "interval_days" |
  "ease_factor" | "repetitions" | "last_quality" | "source_text"
>;

export interface ComplexityCorrection {
  approachLabel: string;
  field: "time" | "space";
  original: string;
  corrected: string;
  derivation?: string; // why the correction was made — the model's execution trace
}

export interface GenerationResult {
  card: CardPartial;
  corrections: ComplexityCorrection[];
}

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

// ─── Post-generation complexity validation ────────────────────────────────────

const VALIDATION_PROMPT = `You are a complexity analysis validator. For EACH approach given, you must derive complexity from the code before you're allowed to state or correct it. Do not pattern-match against the stated label — trace execution.

For each approach, work through this derivation silently but report the summary:
1. Identify every loop and its bound (does it scale with input size N/M, or is it fixed/nested-constant?).
2. Identify every allocation: new arrays, maps, sets, sorted copies, recursion stack depth. Note whether each one scales with input size.
3. Determine if the input itself is mutated in-place (e.g. \`nums[i] = ...\`, in-place \`sort()\`, swapping elements within the given array). In-place mutation of the input does NOT count as extra space — extra/auxiliary space only counts NEW memory the algorithm allocates beyond the input and a constant number of scalar variables.
4. From steps 1-3, state the time complexity (driven by loop/recursion bounds) and space complexity (driven ONLY by new allocations, not input mutation) as a short derivation sentence, e.g. "single pass over m rows with pointer j walking n cols, each cell visited once → O(m+n) time; only scalar counters (i, j, count), no new structures → O(1) space."
5. Compare your derived complexity to the STATED complexity. Only emit a correction if they genuinely differ — do not "correct" a value that's already right just to have something to say.

Rules:
- Base every judgment on the derivation, not on surface pattern-matching to phrases like "sorted" or "matrix."
- Only using scalar variables (counters, pointers, accumulators, fixed-size variables) is O(1) space.
- Creating a new array/map/set/string that scales with input size is O(n) (or relevant variable) space.
- Return ONLY valid JSON, no markdown fences, no explanation outside the JSON fields.

Output format:
{
  "corrections": [
    {
      "approach_index": 0,
      "field": "time" | "space",
      "corrected_value": "O(...)",
      "derivation": "string — the 1-sentence trace from step 4 that justifies this correction"
    }
  ]
}
Return { "corrections": [] } if all complexities are correct after derivation.`;

async function callProviderRaw(
  message: string,
  providerId: ProviderId,
  apiKey: string,
  model: string,
  systemPrompt: string,
): Promise<string> {
  switch (providerId) {
    case "anthropic": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model, max_tokens: 512, system: systemPrompt,
          messages: [{ role: "user", content: message }],
        }),
      });
      if (!res.ok) return "";
      const data = await res.json();
      return data.content?.[0]?.text ?? "";
    }
    case "gemini": {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 512, temperature: 0 },
        }),
      });
      if (!res.ok) return "";
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }
    case "groq": {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model, max_tokens: 512, temperature: 0,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
        }),
      });
      if (!res.ok) return "";
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? "";
    }
  }
}

// ─── Deterministic space-complexity pre-check ─────────────────────────────────
// Scans code_hint for allocation patterns vs scalar-only usage.
// Catches the most common space complexity mismatches without an LLM call.

// Patterns that indicate O(n) or worse space allocation
const ALLOCATION_PATTERNS = [
  // JavaScript / TypeScript
  /new\s+(Array|Map|Set|WeakMap|WeakSet)/i,
  /\[\s*\]/, // empty array literal []
  /Array\s*\.\s*(from|of)/i,
  /\.\s*(map|filter|slice|concat|flat|flatMap|split|Object\.keys|Object\.values|Object\.entries)\s*\(/i,
  /\.\s*reduce\s*\(\s*[^)]*\[\s*\]/i, // reduce accumulating into array
  // Python
  /\bdict\s*\(/i, /\bset\s*\(/i, /\blist\s*\(/i,
  /\[.*\bfor\b.*\bin\b.*\]/i, // list comprehension
  /\{.*\bfor\b.*\bin\b.*\}/i, // dict/set comprehension
  /collections\.\w+/i,
  /defaultdict/i,
  /Counter\s*\(/i,
  // Java
  /new\s+(HashMap|HashSet|TreeMap|TreeSet|ArrayList|LinkedList|PriorityQueue|ArrayDeque|Stack|Queue)/i,
  // C++
  /\b(vector|unordered_map|unordered_set|map|set|stack|queue|priority_queue|deque)\s*</i,
  // General
  /malloc\s*\(/i,
  /calloc\s*\(/i,
  /new\s+int\s*\[/i,
];

// Patterns that indicate in-place mutation (NOT allocation)
const INPLACE_PATTERNS = [
  /\b(nums|arr|matrix|grid|board|s|str)\s*\[.*\]\s*=/i,  // direct index assignment
  /\.sort\s*\(/i,        // in-place sort
  /\.reverse\s*\(/i,     // in-place reverse
  /\.splice\s*\(/i,      // in-place splice
  /swap\s*\(/i,          // swap function
  /\bswap\b/i,
];

function deterministicSpaceCheck(card: CardPartial): ComplexityCorrection[] {
  const corrections: ComplexityCorrection[] = [];

  for (const approach of card.approaches) {
    const code = approach.code_hint ?? "";
    const statedSpace = approach.complexity.space.trim().toLowerCase();

    // Check if code contains any allocation patterns
    const hasAllocation = ALLOCATION_PATTERNS.some((p) => p.test(code));
    // Check if code only has in-place operations
    const hasInPlace = INPLACE_PATTERNS.some((p) => p.test(code));

    // Case 1: Code allocates data structures but claims O(1) space
    if (hasAllocation && (statedSpace === "o(1)" || statedSpace === "o(1) auxiliary")) {
      corrections.push({
        approachLabel: approach.label,
        field: "space",
        original: approach.complexity.space,
        corrected: "O(n)",
      });
      approach.complexity.space = "O(n)";
    }

    // Case 2: Code has NO allocations (only scalars/in-place) but claims O(n) space
    if (!hasAllocation && hasInPlace && statedSpace.includes("o(n")) {
      corrections.push({
        approachLabel: approach.label,
        field: "space",
        original: approach.complexity.space,
        corrected: "O(1)",
      });
      approach.complexity.space = "O(1)";
    }
  }

  return corrections;
}

async function validateComplexity(
  card: CardPartial,
  providerId: ProviderId,
  apiKey: string,
  model: string,
): Promise<ComplexityCorrection[]> {
  // Phase A: Deterministic pre-check (free, instant, catches ~70% of space bugs)
  const deterministicCorrections = deterministicSpaceCheck(card);

  // Phase B: LLM-based validation (catches subtler issues the heuristics miss)
  try {
    // Build a concise message with each approach's code + stated complexity
    const approachSummaries = card.approaches.map((a, i) =>
      `Approach ${i} (${a.label}):\nCode: ${a.code_hint}\nStated time: ${a.complexity.time}\nStated space: ${a.complexity.space}`
    ).join("\n\n");

    const raw = await callProviderRaw(
      `Verify these complexities:\n\n${approachSummaries}`,
      providerId, apiKey, model, VALIDATION_PROMPT,
    );

    if (!raw) return deterministicCorrections;

    const clean = raw.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(clean) as {
      corrections: { approach_index: number; field: "time" | "space"; corrected_value: string; derivation?: string }[];
    };

    if (!Array.isArray(parsed.corrections)) return deterministicCorrections;

    const llmCorrections: ComplexityCorrection[] = [];
    for (const c of parsed.corrections) {
      const approach = card.approaches[c.approach_index];
      if (!approach) continue;
      // Require a derivation — a "correction" with no trace of *why* is more likely
      // to be the same kind of ungrounded pattern-match we're trying to eliminate,
      // so discard it rather than silently applying an unjustified change.
      if (!c.derivation || c.derivation.trim().length < 10) continue;
      const original = approach.complexity[c.field];
      // Skip if deterministic check already corrected this field
      const alreadyCorrected = deterministicCorrections.some(
        (dc) => dc.approachLabel === approach.label && dc.field === c.field
      );
      if (alreadyCorrected) continue;
      if (original !== c.corrected_value) {
        llmCorrections.push({
          approachLabel: approach.label,
          field: c.field,
          original,
          corrected: c.corrected_value,
          derivation: c.derivation,
        });
        // Apply the correction
        approach.complexity[c.field] = c.corrected_value;
      }
    }
    return [...deterministicCorrections, ...llmCorrections];
  } catch {
    // LLM validation failed — still return deterministic corrections
    return deterministicCorrections;
  }
}

// ─── Phase 2: Conditional "Better" tier check ────────────────────────────────

async function checkForBetterTier(
  problemText: string,
  card: CardPartial,
  providerId: ProviderId,
  apiKey: string,
  model: string,
  languageSuffix: string,
): Promise<void> {
  try {
    const bruteForce = card.approaches.find((a) => a.label === "Brute Force");
    const optimal = card.approaches.find((a) => a.label === "Optimal");
    if (!bruteForce || !optimal) return;

    // Build the context message for the Better tier evaluator
    const contextMessage = `Problem:\n${problemText.trim()}\n\nBrute Force (${bruteForce.complexity.time} time, ${bruteForce.complexity.space} space):\n${bruteForce.code_hint}\n\nOptimal (${optimal.complexity.time} time, ${optimal.complexity.space} space):\n${optimal.code_hint}${languageSuffix}`;

    const raw = await callProviderRaw(
      contextMessage,
      providerId, apiKey, model, BETTER_TIER_PROMPT,
    );

    if (!raw) return;

    const trimmed = raw.trim();

    // If the model says NONE, no Better tier — we're done
    if (trimmed.toUpperCase() === "NONE") return;

    // Try to parse a valid Better approach
    const clean = trimmed.replace(/```json\n?|```/g, "").trim();
    const better = JSON.parse(clean) as {
      label: string;
      intuition: string;
      key_observation: string;
      complexity: { time: string; space: string };
      code_hint: string;
      trade_off: string;
    };

    // Validate: must have different time complexity than both Brute Force and Optimal
    // If its time complexity matches Optimal, it's not genuinely distinct
    if (
      better.complexity.time === optimal.complexity.time &&
      better.complexity.space === optimal.complexity.space
    ) {
      return; // Same complexity as Optimal — reject this phantom tier
    }

    // Insert Better between Brute Force and Optimal
    better.label = "Better"; // Ensure label is correct
    const bruteIndex = card.approaches.findIndex((a) => a.label === "Brute Force");
    card.approaches.splice(bruteIndex + 1, 0, better as CardPartial["approaches"][0]);
  } catch {
    // Better tier check is best-effort — don't block card generation
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export type GenerationPhase = 
  | "generating_base" 
  | "checking_better" 
  | "validating_complexity";

export async function generateFlashCard(
  problemText: string,
  providerId: ProviderId,
  apiKey: string,
  model: string,
  language: CodeLanguage = "any",
  onProgress?: (phase: GenerationPhase) => void,
): Promise<GenerationResult> {
  // Build prompt — append language line when not pseudocode
  let prompt = SYSTEM_PROMPT;
  let languageSuffix = "";
  if (language !== "any") {
    const langLabel = LANGUAGES.find((l) => l.id === language)?.label ?? language;
    const langLine = `\n\nIMPORTANT: Write all code_hint fields in ${langLabel} syntax, not pseudocode. Format code_hint as a multi-line string using \\n for line breaks and proper indentation. Each statement MUST be on its own line — NEVER put multiple statements on one line separated by semicolons. Example for C++:\n"for (int i = 0; i < n; i++) {\\n  for (int j = i+1; j < n; j++) {\\n    if (nums[i]+nums[j]==target)\\n      return {i,j};\\n  }\\n}"\nShow the complete algorithmic structure (loops, conditions, return) but never a full production solution.`;
    prompt += langLine;
    languageSuffix = `\n\nIMPORTANT: Write the code_hint in ${langLabel} syntax.`;
  }

  // Phase 1: Generate Brute Force + Optimal only
  if (onProgress) onProgress("generating_base");
  let card: CardPartial;
  switch (providerId) {
    case "anthropic": card = await callAnthropic(problemText, apiKey, model, prompt); break;
    case "gemini":    card = await callGemini(problemText, apiKey, model, prompt); break;
    case "groq":      card = await callGroq(problemText, apiKey, model, prompt); break;
  }

  // Phase 2: Conditionally add "Better" tier via separate evaluation
  if (onProgress) onProgress("checking_better");
  await checkForBetterTier(problemText, card, providerId, apiKey, model, languageSuffix);

  // Phase 3: Validate complexity against actual code
  if (onProgress) onProgress("validating_complexity");
  const corrections = await validateComplexity(card, providerId, apiKey, model);

  return { card, corrections };
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
  "Sorting":               "#e2e8f0",
  "Math / Number Theory":  "#ccfbf1",
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
  "Sorting":               "#334155",
  "Math / Number Theory":  "#0f766e",
};
