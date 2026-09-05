// Centralized XP, Leveling and Attribute Progression Engine for Solo Leveling System

export type XPSource = 
  | 'quest_pushups'
  | 'quest_squats'
  | 'quest_situps'
  | 'quest_pullups'
  | 'quest_plank'
  | 'quest_steps'
  | 'quest_study'
  | 'perfect_day';

export type AttributeKey = 'str' | 'vit' | 'agi' | 'int' | 'sen';

export interface XPTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  source: XPSource | string;
  amount: number;
  timestamp: number;
}

export interface AttributeXPTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  attribute: AttributeKey;
  source: string;
  amount: number;
  timestamp: number;
}

export interface LevelProgress {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelRequiredXP: number;
  progressPercent: number;
  totalXP: number;
}

export interface AttributeProgress {
  level: number;
  currentLevelXP: number;
  nextLevelRequiredXP: number;
  progressPercent: number;
  totalXP: number;
}

// -------------------------------------------------------------
// 1. GLOBAL HUNTER XP ENGINE
// Formula: getXPRequiredForLevel(level) = 500 + ((level - 1) * 250)
// -------------------------------------------------------------
export function getXPRequiredForLevel(level: number): number {
  const lvl = Math.max(1, Math.floor(level));
  return 500 + ((lvl - 1) * 250);
}

export function calculateLevel(totalXP: number): number {
  let xp = Math.max(0, Math.floor(totalXP));
  let level = 1;

  while (true) {
    const needed = getXPRequiredForLevel(level);
    if (xp >= needed) {
      xp -= needed;
      level += 1;
    } else {
      break;
    }
  }

  return level;
}

export function calculateLevelProgress(totalXP: number): LevelProgress {
  const safeTotalXP = Math.max(0, Math.floor(totalXP));
  let xpRemaining = safeTotalXP;
  let level = 1;

  while (true) {
    const neededForNext = getXPRequiredForLevel(level);
    if (xpRemaining >= neededForNext) {
      xpRemaining -= neededForNext;
      level += 1;
    } else {
      const currentLevelXP = xpRemaining;
      const nextLevelRequiredXP = neededForNext;
      const progressPercent = Math.min(100, Math.max(0, Math.floor((currentLevelXP / nextLevelRequiredXP) * 100)));

      return {
        currentLevel: level,
        currentLevelXP,
        nextLevelRequiredXP,
        progressPercent,
        totalXP: safeTotalXP,
      };
    }
  }
}

export function calculateHunterRank(level: number): 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National Level' {
  if (level >= 80) return 'National Level';
  if (level >= 60) return 'S';
  if (level >= 45) return 'A';
  if (level >= 30) return 'B';
  if (level >= 15) return 'C';
  if (level >= 5) return 'D';
  return 'E';
}

// -------------------------------------------------------------
// 2. ATTRIBUTE XP & LEVELING ENGINE (STR, VIT, AGI, INT, SENSE)
// Formula: getAttributeXPRequired(level) = 100 + ((level - 1) * 50)
// Level 1 -> 2 = 100 XP
// Level 2 -> 3 = 150 XP
// Level 3 -> 4 = 200 XP
// Level 4 -> 5 = 250 XP
// -------------------------------------------------------------
export function getAttributeXPRequired(level: number): number {
  const lvl = Math.max(1, Math.floor(level));
  return 100 + ((lvl - 1) * 50);
}

export function calculateAttributeLevel(totalAttributeXP: number): number {
  let xp = Math.max(0, Math.floor(totalAttributeXP));
  let level = 1;

  while (true) {
    const needed = getAttributeXPRequired(level);
    if (xp >= needed) {
      xp -= needed;
      level += 1;
    } else {
      break;
    }
  }

  return level;
}

export function calculateAttributeProgress(totalAttributeXP: number): AttributeProgress {
  const safeTotalXP = Math.max(0, Math.floor(totalAttributeXP));
  let xpRemaining = safeTotalXP;
  let level = 1;

  while (true) {
    const neededForNext = getAttributeXPRequired(level);
    if (xpRemaining >= neededForNext) {
      xpRemaining -= neededForNext;
      level += 1;
    } else {
      const currentLevelXP = xpRemaining;
      const nextLevelRequiredXP = neededForNext;
      const progressPercent = Math.min(100, Math.max(0, Math.floor((currentLevelXP / nextLevelRequiredXP) * 100)));

      return {
        level,
        currentLevelXP,
        nextLevelRequiredXP,
        progressPercent,
        totalXP: safeTotalXP,
      };
    }
  }
}
