# DSA Flashcards

AI-powered DSA interview prep flashcards with spaced repetition. Paste a problem → Claude extracts pattern tags, multiple approaches (brute → optimal), and recall triggers. SM-2 algorithm schedules reviews.

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/dsa-flashcards
cd dsa-flashcards
npm install
npm run dev
```

Open `http://localhost:5173`, set your Anthropic API key (Settings icon), and paste your first problem.

## Your own API key

This app uses a **Bring Your Own Key** model. Your key is stored in browser localStorage only — it never touches any server.

Get a key: https://console.anthropic.com  
Cost: ~₹0.60 per card (under $0.01). $5 credit lasts months for personal use.

## Architecture

```
src/
├── types/index.ts          # FlashCard, Approach, SM-2 fields, PatternTag
├── lib/
│   ├── claude.ts           # System prompt + API call + pattern color map
│   └── sm2.ts              # SM-2 algorithm, isDue(), nextReviewLabel()
├── hooks/
│   └── useStore.ts         # localStorage persistence (cards + API key)
└── components/
    ├── App.tsx             # Router + nav
    ├── Library.tsx         # Card grid with pattern/difficulty filters
    ├── GenerateCard.tsx    # Problem input + API call
    ├── CardDetail.tsx      # Full card with tabbed approaches
    ├── ReviewSession.tsx   # SM-2 review flow
    └── ApiKeyModal.tsx     # Key input modal
```

## SM-2 algorithm

Standard SuperMemo 2 implementation in `src/lib/sm2.ts`:

- **Quality 5** (Easy): Instant recall → interval multiplies by ease factor
- **Quality 4** (Good): Correct with hesitation → interval grows normally  
- **Quality 3** (Hard): Barely got it → interval grows slowly, EF decreases
- **Quality 0** (Forgot): Reset to interval=1, relearn from scratch

Initial EF = 2.5. Minimum EF = 1.3. Cards due when `next_review <= now`.

## Multiple approaches per card

Each card stores 2–3 `Approach` objects:
```typescript
{
  label: "Brute Force" | "Better" | "Optimal"
  intuition: string         // Why does this work?
  key_observation: string   // The aha insight
  complexity: { time, space }
  code_hint: string         // Pseudocode only — forces active recall
  trade_off: string         // Why reject / why this is the ceiling
}
```

The `code_hint` is hidden by default in review mode — you must recall the approach before revealing it.

## Canonical pattern tags

Cards use only these tags (ensures filterability):
Two Pointers, Sliding Window, Binary Search, BFS, DFS, Backtracking,
DP: Linear, DP: Knapsack, DP: Interval, DP: Grid,
Monotonic Stack, Heap / Priority Queue, Union Find, Trie,
Greedy, Topological Sort, Divide and Conquer, Prefix Sum,
Bit Manipulation, Hashing

## Deploying to Vercel

```bash
npm run build
# Push to GitHub, connect repo in Vercel — zero config needed
```

No environment variables required (users bring their own key).

## Roadmap

- [ ] Export cards to CSV / Anki format
- [ ] Import from LeetCode list URL (via backend scraper)
- [ ] Tag-specific review sessions ("Only Sliding Window today")
- [ ] Streak tracking
- [ ] PWA support (offline review)
