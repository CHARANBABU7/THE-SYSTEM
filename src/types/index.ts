import { 
  XPTransaction, 
  XPSource, 
  LevelProgress, 
  AttributeKey, 
  AttributeXPTransaction, 
  AttributeProgress 
} from '../utils/progression';

export type TabType = 'quest' | 'status' | 'history';

export interface PlayerStats {
  str: number; // Strength (Push-ups, Squats, Pull-ups)
  agi: number; // Agility (Steps, Cardio)
  vit: number; // Vitality (Sit-ups, Plank)
  int: number; // Intelligence (Focused Study)
  sen: number; // Sense (Perception, Consistency)
}

export type PlayerAttributesXP = Record<AttributeKey, number>;
export type PlayerAttributeProgressMap = Record<AttributeKey, AttributeProgress>;

export interface PlayerProfile {
  name: string;
  alias: string;
  title: string;
  totalXP: number; // Single source of truth for global hunter leveling
  currentLevel: number;
  streakDays: number;
  bestStreak: number;
  totalDailyQuestsCompleted: number;
  shieldsAvailable: number; // Rest Day / Recovery shields
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National Level';
  penaltyCount: number;
  // Lifetime physical & study metrics
  lifetimePushups: number;
  lifetimeSquats: number;
  lifetimeSitups: number;
  lifetimePullups: number;
  lifetimePlankSeconds: number;
  lifetimeSteps: number;
  lifetimeStudyMinutes: number;
}

export type QuestType = 
  | 'pushups' 
  | 'squats' 
  | 'situps' 
  | 'pullups' 
  | 'plank' 
  | 'steps' 
  | 'study';

export interface QuestItem {
  id: QuestType;
  name: string;
  category: 'physical' | 'study';
  target: number; // Pushups: 150, Squats: 150, Situps: 100, Pullups: 30, Plank: 300, Steps: 10000, Study: 60
  current: number;
  unit: string;
  icon: string;
  xpReward: number; // Pushups: 50, Squats: 50, Situps: 50, Pullups: 75, Plank: 50, Steps: 50, Study: 75
  attributeBonus: AttributeKey;
  attributeXpReward: number;
  isCompleted: boolean;
}

export interface DailyQuestState {
  date: string; // YYYY-MM-DD
  quests: QuestItem[];
  isAllCompleted: boolean;
  completionBonusClaimed: boolean;
  completionBonusXp: number; // 300 Global XP
  isRestDay: boolean;
  completedAt?: string;
}

export interface FloatingXpEvent {
  id: string;
  amount: number;
  source: string;
  timestamp: number;
  isAttribute?: boolean;
}

export interface HistoryEntry {
  date: string; // YYYY-MM-DD
  completed: boolean;
  isRestDay?: boolean;
  pushups: number;
  squats: number;
  situps: number;
  pullups: number;
  plankSeconds: number;
  steps: number;
  studyMinutes: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'quest' | 'levelup' | 'reward' | 'penalty';
  timestamp: string;
}

// -------------------------------------------------------------
// PENALTY STATE MACHINE & LEDGER MODELS
// -------------------------------------------------------------
export interface PenaltyDrillItem {
  id: string;
  name: string;
  category: 'physical' | 'discipline';
  target: number;
  current: number;
  unit: string;
  icon: string;
}

export interface PenaltyState {
  isActive: boolean;
  startTimestamp: number | null;
  endTimestamp: number | null; // Persisted timestamp for accurate remaining time calculation
  triggerDate: string | null; // The missed date that triggered the penalty
  drills: PenaltyDrillItem[];
}

export interface PenaltyLedgerEvent {
  id: string; // Format: penalty:YYYY-MM-DD
  date: string; // The missed calendar date
  timestamp: number;
  reason: string;
}

export type { 
  XPTransaction, 
  XPSource, 
  LevelProgress, 
  AttributeKey, 
  AttributeXPTransaction, 
  AttributeProgress 
};
