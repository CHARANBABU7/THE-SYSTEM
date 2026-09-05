# ⚔️ THE SYSTEM — Local-First Gamified Habit & Fitness Engine

> An offline-first, client-side progressive discipline and fitness tracking application modeled after the *Solo Leveling* System HUD.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 🌟 Key Features

* **7 Cumulative Daily Protocols:** 
  * Physical: Push-ups (150), Squats (150), Sit-ups (100), Pull-ups (30), Plank (5 mins), Steps (10,000)
  * Intellect: Focused Study (2 hours)
* **Dual-Track Progression Engine:**
  * **Global Hunter Level:** Linear RPG formula `500 + 250 * (level - 1)` with rank promotions (Rank E to National Level).
  * **5 Attribute Levels:** Dedicated level curves for **STR, VIT, AGI, INT, SENSE** with individual XP thresholds and sub-level progress bars.
* **Idempotent Transaction Ledger:** Event-ledger pattern guaranteeing zero duplicate XP grants on page reloads or rapid logging.
* **1-Tap Auto-Timers:** Integrated Plank Stopwatch and Study Pomodoro Focus Timer with automatic progress crediting.
* **Monthly Consistency Heatmap:** Visual streak grid tracking cleared days and rest periods.
* **Accountability & Redemption:** 
  * Midnight rollover logic detecting incomplete days.
  * **Hunter Penalty Protocol:** 7-drill emergency survival wasteland.
  * **Monarch's Aegis:** Earnable Rest Day recovery shields to protect streaks during illness/travel.
* **Web Audio Synthesis:** Algorithmic, zero-dependency audio synthesis using the native Web Audio API (chimes, sirens, level-up fanfares).
* **Local-First & Private:** 100% offline persistence via browser `localStorage` with 1-click JSON backup and mobile sync.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/solo-leveling-system.git
cd solo-leveling-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for production
```bash
npm run build
```

---

## 📐 Architecture

```
src/
├── components/          # Obsidian Hologram UI Components
│   ├── Header.tsx       # Hunter rank badge, streak, sound toggles
│   ├── DailyQuest.tsx   # 7-quest tracker, live timers, modal loggers
│   ├── StatusWindow.tsx # Dual-track XP bars, 5 attribute levels, sync modal
│   ├── HistoryLog.tsx   # Monthly Consistency Heatmap & daily logs
│   ├── PenaltyZone.tsx  # 7-drill redemption survival protocol
│   └── BottomNav.tsx    # Mobile-optimized tab navigation
├── context/
│   └── SystemContext.tsx # Centralized state engine, persistence & ledger
├── utils/
│   ├── progression.ts   # Centralized mathematical XP and level algorithms
│   └── audio.ts         # Native Web Audio API digital sound synthesizer
└── types/
    └── index.ts         # Strict TypeScript definitions
```

---

## 📜 License
MIT License. Built for daily discipline and self-mastery.
