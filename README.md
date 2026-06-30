# 🧠 DSA Recall

> **Active Recall + Spaced Repetition designed specifically for technical coding interview prep.**
> *“The template-driven flashcard system Anki can't replicate.”*

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
* **Self-Explanation Prompt**: Draft your key intuition in your own words before revealing the approaches (shown to boost retention by ~40%).
* **Approach Recall Checklist**: Grade yourself on which complexity tiers (Brute Force vs Optimal Hashing) you successfully remembered.
* **Visual Countdown Timer**: Circular countdown display simulating high-pressure mock interviews.

### 4. Interactive Analytics & Streaks
* Heatmap tracker mapping reviews over time.
* Streak counter to enforce daily discipline.
* **Recent Sessions Summary**: View recall rates, durations, and average response times across your last 30 sessions.

---

## 📦 Bundled Content

DSA Recall ships with the **Blind 75 starter pack** built-in:
* 75 essential problems spanning 14 patterns (plus *Trapping Rain Water* as a bonus card).
* Fully pre-packaged as a static local JSON bundle.
* **Zero API keys needed** to get started immediately.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: React 19 + TypeScript
* **Build System**: Vite 6
* **Router**: React Router 6
* **Styling**: Vanilla CSS (Harmonious custom pine/terracotta palette, fully dark-mode responsive, premium animations).
* **Storage**: Local-First via abstracted `Storage` layer wrapping `localStorage`.

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
   cd dsa-flashcards
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Verify types and build**:
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
