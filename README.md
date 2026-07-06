# 🧠 DSA Recall

> **Active Recall + Spaced Repetition designed specifically for technical coding interview prep.**
> *"Purpose-built pedagogical structure for coding interviews — not a general-purpose flashcard format stretched to fit."*

🔗 **Live App**: [dsarecall.whymanas.tech](https://dsarecall.whymanas.tech)

---

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Local First](https://img.shields.io/badge/Data-Local--First-3B6E5E)](#)
[![License](https://img.shields.io/badge/License-MIT-black)](#)

Most software engineering candidates study for interviews by solving hundreds of LeetCode problems, only to forget the exact patterns, intuitions, and trade-offs a few weeks later. 

**DSA Recall** is a professional, local-first web application that helps you retain coding patterns permanently. Instead of re-solving complex problems from scratch, you review structured active recall cards at mathematically optimal intervals computed by a custom spaced-repetition algorithm.

---

## ✨ Key Features

### 1. Smart Daily Revision Plan
Layers a three-step coverage guarantee on top of raw SM-2 scheduling to prevent forgetting entire categories:
* **Due Cards First**: Standard SM-2 scheduled reviews sorted by most overdue first, capped at 25/day.
* **Pattern-Staleness Protection**: If a pattern tag (e.g. *DP*, *Sliding Window*) hasn't been touched in 14 days, the system pulls in its most overdue card even if not strictly scheduled yet.
* **New Card Drip-Feed**: Gradually introduces up to 5 unseen cards a day in leftover session slots to avoid backlog overwhelm.

### 2. Structured Pedagogical Cards
Cards are built around a custom pedagogical template tailored for SWE interview prep rather than simple Q&A:
* **Recall Trigger**: The key visual/textual cue that fires when you see the problem.
* **Brute → Optimal Approaches**: Tabbed approaches documenting complexity, key insights, code hints, and trade-offs.
* **O(N) Complexity Watermark**: Ghosted optimal complexities layered behind difficulty badges.

### 3. High-Friction Active Recall Helpers
* **Self-Explanation Prompt**: Draft your key intuition in your own words before revealing the approaches — a technique [shown in cognitive science research](https://doi.org/10.1111/j.1467-9280.2006.01693.x) to significantly improve long-term retention.
* **Approach Recall Checklist**: Grade yourself on which complexity tiers (Brute Force vs Optimal Hashing) you successfully remembered.
* **Visual Countdown Timer**: Circular countdown display simulating high-pressure mock interviews.

### 4. Interactive Analytics & Streaks
* Heatmap tracker mapping reviews over time.
* Streak counter to build daily consistency.
* **Recent Sessions Summary**: View recall rates, durations, and average response times across your last 30 sessions.

---

## 🔒 Phase 2 Auth, Sync, & Utility Enhancements

We implemented a comprehensive suite of cloud synchronization, utility, and safety features in Phase 2:

### 1. Cross-Device Sync & Supabase Auth
* **GitHub OAuth & Magic Links**: Secure sign-in options integrated via Supabase Auth.
* **Local-First, Sync-Second**: Offline usage remains fully supported. Upon sign-in, a background sync engine reconciles `localStorage` with remote Supabase tables, executing auto-conflict resolution based on `updated_at` timestamps.

### 2. Intelligent Duplicate Prevention
* **First-Pass (Exact Title/Slug Hashing)**: Normalizes problem titles (strips formatting, numbers, symbols, spaces, and case) to block exact duplicate cards during bulk imports.
* **Second-Pass (Fuzzy Similarity Checking)**: Runs token-based Jaccard similarity checks against existing card titles and descriptions. If a match is detected during AI generation, it warns the user with options to "Add Anyway" or "Discard".

### 3. Interactive Binary Search 404 Page
* A custom Page Not Found route displaying a live, interactive visualization of a binary search. It dynamically narrows down a sorted array step-by-step to show the user that their target route does not exist.

### 4. Note-Taking Quick Wins
* **Vertical Textarea Resize**: Resizable notes area styled customly to integrate cleanly with dark theme.
* **Autosave Fail-Safe**: Debounced autosaving status with error-handling validation. If storage quotas are reached, it flags `"Failed to save"` instead of failing silently.
* **Last Edited Timestamp**: Displays a relative date timestamp tracking exactly when notes were modified.

### 5. Interactive Pages & Feedbacks
* Dedicated pages for **About Us**, **Contact Us**, **Support & FAQ**, and **How to Use** (with an interactive demo card preview).
* **Privacy Policy**: A dedicated page outlining data handling, auth scopes, and local-first storage guarantees.
* **Feedback Page**: Feedback forms linked directly to inserts in a secure Supabase `feedback` table.

---

## 📦 Bundled Content

DSA Recall ships with the **Blind 75 starter pack** built-in:
* 75 essential problems spanning 14 patterns.
* Fully pre-packaged as a static local JSON bundle.
* **Zero API keys needed** to get started immediately.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: React 19 + TypeScript
* **Build System**: Vite 6
* **Router**: React Router 6
* **Styling**: Vanilla CSS (Harmonious custom pine/terracotta palette, fully dark-mode responsive, premium animations).
* **Storage**: Local-First via abstracted `Storage` layer wrapping `localStorage` with background synchronization to Supabase.

### Folder Structure (Feature-Wise)

```
dsa-flashcards/
├── src/
│   ├── components/          # Categorized by feature area
│   │   ├── layout/          # ThemeToggle, Nav
│   │   ├── cards/           # CardDetail
│   │   ├── review/          # ReviewSession, ReviewConfig, ReviewAnalytics
│   │   ├── dashboard/       # Dashboard, Heatmap
│   │   ├── library/         # Library, StarterPacks
│   │   ├── generate/        # GenerateCard (BYOK parser)
│   │   └── settings/        # ApiKeyModal
│   ├── hooks/               # useStore (useCardStore, useSessionHistory)
│   ├── lib/                 # sm2 (daily session builder), llm (Claude/Gemini integration)
│   ├── data/                # blind75.json (starter deck)
│   ├── types/               # index.ts (strongly typed interfaces)
│   ├── styles/              # global.css, animations.css
│   ├── App.tsx
│   └── main.tsx
```

---

## 🚀 Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MANASZ-WEBDEV/DSA-Revision.git
   cd DSA-Revision
   ```

2. **Configure environment variables**:
   Create a `.env` file by copying the template and filling in your Supabase credentials:
   ```bash
   cp .env.example .env
   # Then open .env and replace the placeholder values:
   # VITE_SUPABASE_URL=your-supabase-project-url
   # VITE_SUPABASE_ANON_KEY=your-supabase-anonymous-key
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```

5. **Verify types and build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

---

## 🌐 Deployment to Vercel

This app is configured as a single-page application (SPA). To prevent `404` errors when reloading routes like `/review` or `/welcome` in production, a `vercel.json` rewrite configuration is included:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Simply connect this repository to your Vercel account, and it will deploy automatically with continuous integration.
