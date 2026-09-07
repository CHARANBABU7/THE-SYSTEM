import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  PlayerProfile, 
  DailyQuestState, 
  QuestItem, 
  QuestType,
  FloatingXpEvent,
  HistoryEntry, 
  SystemNotification, 
  TabType,
  XPTransaction,
  XPSource,
  LevelProgress,
  AttributeKey,
  AttributeXPTransaction,
  PlayerAttributesXP,
  PlayerAttributeProgressMap,
  PenaltyState,
  PenaltyDrillItem,
  PenaltyLedgerEvent
} from '../types';
import { 
  calculateLevel, 
  calculateLevelProgress, 
  calculateHunterRank,
  calculateAttributeLevel,
  calculateAttributeProgress
} from '../utils/progression';
import { getLocalDateKey, getMissedDateRange } from '../utils/dateUtils';
import { sound } from '../utils/audio';

const STORAGE_KEY = 'SOLO_LEVELING_QUEST_V3';

export const getDefaultPenaltyDrills = (): PenaltyDrillItem[] => [
  { id: 'pushups', name: 'Emergency Push-ups', category: 'physical', target: 50, current: 0, unit: 'reps', icon: '💪' },
  { id: 'squats', name: 'Emergency Squats', category: 'physical', target: 50, current: 0, unit: 'reps', icon: '🦵' },
  { id: 'situps', name: 'Emergency Sit-ups', category: 'physical', target: 30, current: 0, unit: 'reps', icon: '🧘' },
  { id: 'pullups', name: 'Emergency Pull-ups', category: 'physical', target: 10, current: 0, unit: 'reps', icon: '🧗' },
  { id: 'plank', name: '2-Minute Plank', category: 'physical', target: 120, current: 0, unit: 'seconds', icon: '⏱️' },
  { id: 'steps', name: 'Emergency Steps', category: 'physical', target: 2000, current: 0, unit: 'steps', icon: '🏃' },
  { id: 'study', name: 'Focused Discipline Study', category: 'discipline', target: 18, current: 0, unit: 'minutes', icon: '🧠' },
];

const INITIAL_PENALTY_STATE: PenaltyState = {
  isActive: false,
  startTimestamp: null,
  endTimestamp: null,
  triggerDate: null,
  drills: getDefaultPenaltyDrills(),
};

const INITIAL_PROFILE: PlayerProfile = {
  name: 'Charan Babu',
  alias: 'Kairos',
  title: 'The One Who Overcame Adversity',
  totalXP: 0,
  currentLevel: 1,
  streakDays: 1,
  bestStreak: 1,
  totalDailyQuestsCompleted: 0,
  shieldsAvailable: 1,
  rank: 'E',
  penaltyCount: 0,
  lifetimePushups: 0,
  lifetimeSquats: 0,
  lifetimeSitups: 0,
  lifetimePullups: 0,
  lifetimePlankSeconds: 0,
  lifetimeSteps: 0,
  lifetimeStudyMinutes: 0,
};

const INITIAL_ATTRIBUTE_XP: PlayerAttributesXP = {
  str: 0,
  vit: 0,
  agi: 0,
  int: 0,
  sen: 0,
};

const getInitialDailyQuests = (): QuestItem[] => [
  {
    id: 'pushups',
    name: 'Push-ups',
    category: 'physical',
    target: 150,
    current: 0,
    unit: 'reps',
    icon: '💪',
    xpReward: 50,
    attributeBonus: 'str',
    attributeXpReward: 50,
    isCompleted: false,
  },
  {
    id: 'squats',
    name: 'Squats',
    category: 'physical',
    target: 150,
    current: 0,
    unit: 'reps',
    icon: '🦵',
    xpReward: 50,
    attributeBonus: 'str',
    attributeXpReward: 50,
    isCompleted: false,
  },
  {
    id: 'situps',
    name: 'Sit-ups',
    category: 'physical',
    target: 100,
    current: 0,
    unit: 'reps',
    icon: '🧘',
    xpReward: 50,
    attributeBonus: 'vit',
    attributeXpReward: 50,
    isCompleted: false,
  },
  {
    id: 'pullups',
    name: 'Pull-ups',
    category: 'physical',
    target: 30,
    current: 0,
    unit: 'reps',
    icon: '🧗',
    xpReward: 75,
    attributeBonus: 'str',
    attributeXpReward: 75,
    isCompleted: false,
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'physical',
    target: 300, // 5 minutes = 300 seconds
    current: 0,
    unit: 'seconds',
    icon: '⏱️',
    xpReward: 50,
    attributeBonus: 'vit',
    attributeXpReward: 50,
    isCompleted: false,
  },
  {
    id: 'steps',
    name: 'Steps',
    category: 'physical',
    target: 10000,
    current: 0,
    unit: 'steps',
    icon: '🏃',
    xpReward: 50,
    attributeBonus: 'agi',
    attributeXpReward: 50,
    isCompleted: false,
  },
  {
    id: 'study',
    name: 'Focused Study',
    category: 'study',
    target: 60, // 1 hour = 60 minutes
    current: 0,
    unit: 'minutes',
    icon: '🧠',
    xpReward: 75,
    attributeBonus: 'int',
    attributeXpReward: 75,
    isCompleted: false,
  },
];

const getInitialDailyQuestState = (dateStr: string = getLocalDateKey()): DailyQuestState => ({
  date: dateStr,
  quests: getInitialDailyQuests(),
  isAllCompleted: false,
  completionBonusClaimed: false,
  completionBonusXp: 300,
  isRestDay: false,
});

const getStoredData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse localStorage data', e);
  }
  return null;
};

interface SystemContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  profile: PlayerProfile;
  attributeXP: PlayerAttributesXP;
  attributeProgress: PlayerAttributeProgressMap;
  dailyQuest: DailyQuestState;
  history: HistoryEntry[];
  xpTransactions: XPTransaction[];
  attributeTransactions: AttributeXPTransaction[];
  penaltyLedger: PenaltyLedgerEvent[];
  penaltyState: PenaltyState;
  notifications: SystemNotification[];
  floatingXp: FloatingXpEvent[];
  levelProgress: LevelProgress;
  isMuted: boolean;

  // Actions
  toggleMute: () => void;
  awardXP: (amount: number, source: XPSource | string, date: string, label?: string) => boolean;
  awardAttributeXP: (attribute: AttributeKey, amount: number, source: string, date: string, label?: string) => boolean;
  addQuestProgress: (questId: QuestType, amount: number) => void;
  updatePenaltyDrillProgress: (drillId: string, amount: number) => void;
  claimDailyCompletionBonus: () => void;
  activateRestDay: () => boolean;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  updateProfileName: (name: string, alias: string) => void;
  triggerManualPenaltyZone: () => void;
  clearPenaltyZone: () => boolean;
  addNotification: (title: string, message: string, type: SystemNotification['type']) => void;
  dismissNotification: (id: string) => void;
  dismissFloatingXp: (id: string) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('quest');
  const todayKey = getLocalDateKey();

  // 1. Synchronous initial state restoration from localStorage
  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>(() => {
    const saved = getStoredData();
    return Array.isArray(saved?.xpTransactions) ? saved.xpTransactions : [];
  });

  const [attributeTransactions, setAttributeTransactions] = useState<AttributeXPTransaction[]>(() => {
    const saved = getStoredData();
    return Array.isArray(saved?.attributeTransactions) ? saved.attributeTransactions : [];
  });

  const [penaltyLedger, setPenaltyLedger] = useState<PenaltyLedgerEvent[]>(() => {
    const saved = getStoredData();
    return Array.isArray(saved?.penaltyLedger) ? saved.penaltyLedger : [];
  });

  const [penaltyState, setPenaltyState] = useState<PenaltyState>(() => {
    const saved = getStoredData();
    if (saved?.penaltyState && typeof saved.penaltyState === 'object') {
      const ps = saved.penaltyState;
      if (ps.isActive) {
        return {
          isActive: true,
          startTimestamp: ps.startTimestamp || Date.now(),
          endTimestamp: null,
          triggerDate: ps.triggerDate || todayKey,
          drills: Array.isArray(ps.drills) && ps.drills.length === 7
            ? ps.drills.map((d: PenaltyDrillItem) => {
                if (d.id === 'steps' && d.target === 5000) return { ...d, target: 2000 };
                if (d.id === 'study' && (d.target === 30 || d.target === 120)) return { ...d, target: 18 };
                return d;
              })
            : getDefaultPenaltyDrills(),
        };
      }
    }
    return INITIAL_PENALTY_STATE;
  });

  const [attributeXP, setAttributeXP] = useState<PlayerAttributesXP>(() => {
    const saved = getStoredData();
    if (saved?.attributeXP) {
      return { ...INITIAL_ATTRIBUTE_XP, ...saved.attributeXP };
    }
    return INITIAL_ATTRIBUTE_XP;
  });

  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = getStoredData();
    const ledgerCount = Array.isArray(saved?.penaltyLedger) ? saved.penaltyLedger.length : 0;
    if (saved?.profile) {
      const totalXP = typeof saved.profile.totalXP === 'number' ? saved.profile.totalXP : (saved.profile.xp || 0);
      const currentLevel = calculateLevel(totalXP);
      const rank = calculateHunterRank(currentLevel);
      return {
        ...INITIAL_PROFILE,
        ...saved.profile,
        totalXP,
        currentLevel,
        rank,
        penaltyCount: Math.max(saved.profile.penaltyCount || 0, ledgerCount),
      };
    }
    return { ...INITIAL_PROFILE, penaltyCount: ledgerCount };
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = getStoredData();
    return Array.isArray(saved?.history) ? saved.history : [];
  });

  const [dailyQuest, setDailyQuest] = useState<DailyQuestState>(() => {
    const saved = getStoredData();
    if (saved?.dailyQuest && typeof saved.dailyQuest.date === 'string' && Array.isArray(saved.dailyQuest.quests) && saved.dailyQuest.quests.length === 7) {
      const normalizedQuests = saved.dailyQuest.quests.map((q: QuestItem) => {
        if (q.id === 'study') {
          const isCompleted = q.current >= 60;
          return { ...q, target: 60, isCompleted };
        }
        return q;
      });
      const isAllCompleted = normalizedQuests.every((q: QuestItem) => q.isCompleted);
      return {
        ...saved.dailyQuest,
        quests: normalizedQuests,
        isAllCompleted: isAllCompleted || saved.dailyQuest.isAllCompleted,
      };
    }
    return getInitialDailyQuestState(todayKey);
  });

  const [floatingXp, setFloatingXp] = useState<FloatingXpEvent[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'welcome-notif',
      title: 'SYSTEM ACTIVATED',
      message: 'Welcome Hunter Charan "Kairos" Babu. Daily conditioning protocols active.',
      type: 'quest',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Dynamic calculations
  const levelProgress = calculateLevelProgress(profile.totalXP);

  const attributeProgress: PlayerAttributeProgressMap = {
    str: calculateAttributeProgress(attributeXP.str),
    vit: calculateAttributeProgress(attributeXP.vit),
    agi: calculateAttributeProgress(attributeXP.agi),
    int: calculateAttributeProgress(attributeXP.int),
    sen: calculateAttributeProgress(attributeXP.sen),
  };

  // Auto-save state to LocalStorage
  useEffect(() => {
    try {
      const dataToSave = {
        profile,
        attributeXP,
        dailyQuest,
        history,
        xpTransactions,
        attributeTransactions,
        penaltyLedger,
        penaltyState,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [profile, attributeXP, dailyQuest, history, xpTransactions, attributeTransactions, penaltyLedger, penaltyState]);

  const addNotification = useCallback((title: string, message: string, type: SystemNotification['type']) => {
    sound.playSystemChime();
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
  }, []);

  /**
   * CORE PENALTY ENGINE: Multi-Day Missed Gap Detection & Idempotent Rollover
   * Guarantees:
   * 1. Exactly ONE penalty event per missed active day (penalty:YYYY-MM-DD).
   * 2. No missed day is lost even if the user opens the app days later.
   * 3. Rest-day and Shield-protected days are never penalized.
   * 4. Idempotent across reloads, remounts, and double executions.
   */
  const processMissedDaysAndRollover = useCallback(() => {
    const currentLocalToday = getLocalDateKey();

    if (dailyQuest.date < currentLocalToday) {
      const missedRange = getMissedDateRange(dailyQuest.date, currentLocalToday);
      const newPenaltyLedgerEvents: PenaltyLedgerEvent[] = [];
      let activatedPenalty = false;
      let lastTriggerDate = '';

      missedRange.forEach(dateKey => {
        const isHistoricalRestDay = history.some(h => h.date === dateKey && h.isRestDay);
        const isHistoricalCompleted = history.some(h => h.date === dateKey && h.completed);
        const isCurrentQuestDay = dateKey === dailyQuest.date;
        const isCurrentQuestSafe = isCurrentQuestDay && (dailyQuest.isAllCompleted || dailyQuest.isRestDay);

        // A day was missed ONLY if it was NOT completed and NOT a rest day
        if (!isHistoricalRestDay && !isHistoricalCompleted && !isCurrentQuestSafe) {
          const penaltyId = `penalty:${dateKey}`;
          const alreadyInLedger = penaltyLedger.some(e => e.id === penaltyId) || newPenaltyLedgerEvents.some(e => e.id === penaltyId);

          if (!alreadyInLedger) {
            newPenaltyLedgerEvents.push({
              id: penaltyId,
              date: dateKey,
              timestamp: Date.now(),
              reason: 'Daily conditioning quest incomplete at day boundary',
            });
            activatedPenalty = true;
            lastTriggerDate = dateKey;
          }
        }
      });

      // Update Penalty Ledger & Profile if new penalties occurred
      if (newPenaltyLedgerEvents.length > 0) {
        sound.playPenaltySiren();
        setPenaltyLedger(prev => [...newPenaltyLedgerEvents, ...prev]);

        setProfile(p => ({
          ...p,
          streakDays: 0, // Reset streak on missed day
          penaltyCount: p.penaltyCount + newPenaltyLedgerEvents.length,
        }));

        // Enforce active penalty state (escapable ONLY via 100% drill completion)
        setPenaltyState({
          isActive: true,
          startTimestamp: Date.now(),
          endTimestamp: null,
          triggerDate: lastTriggerDate,
          drills: getDefaultPenaltyDrills(),
        });

        addNotification(
          'PENALTY ZONE ACTIVATED',
          `${newPenaltyLedgerEvents.length} missed day(s) detected! Complete all 7 redemption drills to survive.`,
          'penalty'
        );
      } else {
        // Safe rollover (e.g. yesterday was completed or rest day)
        sound.playQuestComplete();
        addNotification(
          'NEW DAILY QUEST ARRIVED',
          'Welcome to a new day, Hunter. Daily conditioning protocols have reset.',
          'quest'
        );
      }

      // Initialize clean 0-progress daily quest sheet for today
      setDailyQuest(getInitialDailyQuestState(currentLocalToday));
    }
  }, [dailyQuest, history, penaltyLedger, addNotification]);

  // Periodic and on-focus rollover check
  useEffect(() => {
    processMissedDaysAndRollover();
    const interval = setInterval(processMissedDaysAndRollover, 15000);
    window.addEventListener('focus', processMissedDaysAndRollover);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', processMissedDaysAndRollover);
    };
  }, [processMissedDaysAndRollover]);

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMuted(nextMute);
    if (!nextMute) sound.playStatPoint();
  };

  const triggerFloatingXp = (amount: number, source: string, isAttribute: boolean = false) => {
    const event: FloatingXpEvent = {
      id: `xp-${Date.now()}-${Math.random()}`,
      amount,
      source,
      timestamp: Date.now(),
      isAttribute,
    };
    setFloatingXp(prev => [event, ...prev]);

    setTimeout(() => {
      setFloatingXp(prev => prev.filter(e => e.id !== event.id));
    }, 2800);
  };

  const dismissFloatingXp = (id: string) => {
    setFloatingXp(prev => prev.filter(e => e.id !== id));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateProfileName = (name: string, alias: string) => {
    setProfile(prev => ({ ...prev, name, alias }));
    addNotification('PROFILE UPDATED', `Hunter designation set to ${name} [${alias}]`, 'info');
  };

  /**
   * 1. Global Hunter XP Engine (Idempotent)
   */
  const awardXP = (amount: number, source: XPSource | string, date: string, label: string = 'Quest'): boolean => {
    if (amount <= 0 || penaltyState.isActive) return false;

    const alreadyAwarded = xpTransactions.some(t => t.date === date && t.source === source);
    if (alreadyAwarded) {
      return false;
    }

    const newTransaction: XPTransaction = {
      id: `tx-${date}-${source}-${Date.now()}`,
      date,
      source,
      amount,
      timestamp: Date.now(),
    };

    setXpTransactions(prev => [newTransaction, ...prev]);
    triggerFloatingXp(amount, label, false);

    setProfile(prev => {
      const oldTotalXP = prev.totalXP;
      const newTotalXP = oldTotalXP + amount;

      const oldLevel = calculateLevel(oldTotalXP);
      const newLevel = calculateLevel(newTotalXP);

      if (newLevel > oldLevel) {
        sound.playLevelUp();
        setTimeout(() => {
          addNotification(
            'HUNTER LEVEL UP!',
            `You reached Level ${newLevel}! Hunter Rank recalculated.`,
            'levelup'
          );
        }, 150);
      }

      const rank = calculateHunterRank(newLevel);

      return {
        ...prev,
        totalXP: newTotalXP,
        currentLevel: newLevel,
        rank,
      };
    });

    return true;
  };

  /**
   * 2. Attribute XP Engine (Idempotent)
   */
  const awardAttributeXP = (
    attribute: AttributeKey, 
    amount: number, 
    source: string, 
    date: string, 
    label: string = 'Attribute'
  ): boolean => {
    if (amount <= 0 || penaltyState.isActive) return false;

    const alreadyAwarded = attributeTransactions.some(t => t.date === date && t.source === source);
    if (alreadyAwarded) {
      return false;
    }

    const newTransaction: AttributeXPTransaction = {
      id: `attr-tx-${date}-${source}-${Date.now()}`,
      date,
      attribute,
      source,
      amount,
      timestamp: Date.now(),
    };

    setAttributeTransactions(prev => [newTransaction, ...prev]);
    triggerFloatingXp(amount, label, true);

    setAttributeXP(prev => {
      const oldXP = prev[attribute];
      const newXP = oldXP + amount;

      const oldLevel = calculateAttributeLevel(oldXP);
      const newLevel = calculateAttributeLevel(newXP);

      if (newLevel > oldLevel) {
        sound.playStatPoint();
        const attrUpper = attribute.toUpperCase();
        setTimeout(() => {
          addNotification(
            `${attrUpper} LEVEL UP!`,
            `${attrUpper} advanced to Lv. ${newLevel}!`,
            'reward'
          );
        }, 200);
      }

      return {
        ...prev,
        [attribute]: newXP,
      };
    });

    return true;
  };

  // Cumulative progress accumulator
  const addQuestProgress = (questId: QuestType, amount: number) => {
    if (amount <= 0 || dailyQuest.isRestDay || penaltyState.isActive) return;
    sound.playStatPoint();

    // 1. Update lifetime metrics
    setProfile(prev => {
      const updated = { ...prev };
      if (questId === 'pushups') updated.lifetimePushups += amount;
      if (questId === 'squats') updated.lifetimeSquats += amount;
      if (questId === 'situps') updated.lifetimeSitups += amount;
      if (questId === 'pullups') updated.lifetimePullups += amount;
      if (questId === 'plank') updated.lifetimePlankSeconds += amount;
      if (questId === 'steps') updated.lifetimeSteps += amount;
      if (questId === 'study') updated.lifetimeStudyMinutes += amount;
      return updated;
    });

    // 2. Accumulate progress on daily quest
    setDailyQuest(prev => {
      let newlyCompletedQuest: QuestItem | null = null;

      const updatedQuests = prev.quests.map(q => {
        if (q.id === questId) {
          const newCurrent = q.current + amount;
          const isNowCompleted = newCurrent >= q.target;

          if (isNowCompleted && !q.isCompleted) {
            newlyCompletedQuest = { ...q, current: newCurrent, isCompleted: true };
          }

          return {
            ...q,
            current: newCurrent,
            isCompleted: isNowCompleted,
          };
        }
        return q;
      });

      const allDone = updatedQuests.every(q => q.isCompleted);

      // Award XP on 100% completion
      if (newlyCompletedQuest) {
        const quest = newlyCompletedQuest as QuestItem;
        const globalSourceKey: XPSource = `quest_${quest.id}` as XPSource;
        const attrSourceKey = `attribute_${quest.attributeBonus}_${quest.id}_${prev.date}`;

        sound.playQuestComplete();
        awardXP(quest.xpReward, globalSourceKey, prev.date, quest.name);
        awardAttributeXP(
          quest.attributeBonus, 
          quest.attributeXpReward, 
          attrSourceKey, 
          prev.date, 
          `+${quest.attributeXpReward} ${quest.attributeBonus.toUpperCase()} XP`
        );

        setTimeout(() => {
          addNotification(
            'QUEST COMPLETED',
            `[${quest.name}] finished! +${quest.xpReward} Global XP & +${quest.attributeXpReward} ${quest.attributeBonus.toUpperCase()} XP awarded.`,
            'reward'
          );
        }, 200);
      }

      if (allDone && !prev.isAllCompleted) {
        sound.playLevelUp();
        setTimeout(() => {
          addNotification(
            'DAILY QUEST COMPLETE',
            'All 7 Daily Protocols cleared! Perfect Day Bonus of +300 Global XP & +100 SENSE XP is ready to claim.',
            'quest'
          );
        }, 400);
      }

      return {
        ...prev,
        quests: updatedQuests,
        isAllCompleted: allDone,
      };
    });
  };

  /**
   * Penalty Drill Progress Updater
   * Survives page refresh and does NOT award normal XP
   */
  const updatePenaltyDrillProgress = (drillId: string, amount: number) => {
    if (amount <= 0 || !penaltyState.isActive) return;
    sound.playStatPoint();

    setPenaltyState(prev => {
      const updatedDrills = prev.drills.map(d => {
        if (d.id === drillId) {
          return {
            ...d,
            current: Math.min(d.target, d.current + amount),
          };
        }
        return d;
      });

      return {
        ...prev,
        drills: updatedDrills,
      };
    });
  };

  const claimDailyCompletionBonus = () => {
    if (!dailyQuest.isAllCompleted || dailyQuest.completionBonusClaimed || penaltyState.isActive) return;

    sound.playQuestComplete();
    setDailyQuest(prev => ({
      ...prev,
      completionBonusClaimed: true,
      completedAt: new Date().toLocaleTimeString(),
    }));

    awardXP(300, 'perfect_day', dailyQuest.date, 'PERFECT DAY BONUS');
    awardAttributeXP(
      'sen', 
      100, 
      `attribute_sense_perfect_day_${dailyQuest.date}`, 
      dailyQuest.date, 
      '+100 SENSE XP (Perfect Day)'
    );

    setProfile(prev => {
      const nextStreak = prev.streakDays + 1;
      const nextCompleted = prev.totalDailyQuestsCompleted + 1;
      const shieldGained = nextCompleted % 7 === 0 ? 1 : 0;

      if (shieldGained > 0) {
        setTimeout(() => {
          addNotification(
            'RECOVERY SHIELD EARNED',
            '7-day milestone reached! +1 Monarch Aegis recovery shield added.',
            'reward'
          );
        }, 600);
      }

      return {
        ...prev,
        streakDays: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        totalDailyQuestsCompleted: nextCompleted,
        shieldsAvailable: prev.shieldsAvailable + shieldGained,
      };
    });

    setHistory(h => [
      {
        date: dailyQuest.date,
        completed: true,
        pushups: dailyQuest.quests.find(q => q.id === 'pushups')?.current || 0,
        squats: dailyQuest.quests.find(q => q.id === 'squats')?.current || 0,
        situps: dailyQuest.quests.find(q => q.id === 'situps')?.current || 0,
        pullups: dailyQuest.quests.find(q => q.id === 'pullups')?.current || 0,
        plankSeconds: dailyQuest.quests.find(q => q.id === 'plank')?.current || 0,
        steps: dailyQuest.quests.find(q => q.id === 'steps')?.current || 0,
        studyMinutes: dailyQuest.quests.find(q => q.id === 'study')?.current || 0,
      },
      ...h.filter(entry => entry.date !== dailyQuest.date),
    ]);

    addNotification(
      'PERFECT DAY BONUS CLAIMED',
      `+300 Global EXP & +100 SENSE EXP awarded! Full discipline logged.`,
      'reward'
    );
  };

  const activateRestDay = (): boolean => {
    if (profile.shieldsAvailable <= 0 || dailyQuest.isRestDay || penaltyState.isActive) {
      return false;
    }

    sound.playQuestComplete();
    setProfile(p => ({ ...p, shieldsAvailable: p.shieldsAvailable - 1 }));
    setDailyQuest(q => ({ ...q, isRestDay: true }));

    setHistory(h => [
      {
        date: dailyQuest.date,
        completed: true,
        isRestDay: true,
        pushups: 0,
        squats: 0,
        situps: 0,
        pullups: 0,
        plankSeconds: 0,
        steps: 0,
        studyMinutes: 0,
      },
      ...h.filter(entry => entry.date !== dailyQuest.date),
    ]);

    addNotification(
      'MONARCH AEGIS ACTIVATED',
      'Rest Day activated. Streak frozen and protected. Recovery protocol in effect.',
      'info'
    );
    return true;
  };

  /**
   * Anti-Cheat Penalty Clearance
   * Can ONLY be cleared when all 7 drills are 100% completed.
   */
  const clearPenaltyZone = (): boolean => {
    if (!penaltyState.isActive) return false;

    const allDrillsDone = penaltyState.drills.every(d => d.current >= d.target);

    if (!allDrillsDone) {
      return false; // Refuse clearance if drills are incomplete
    }

    sound.playPenaltySurvived();
    setPenaltyState({
      isActive: false,
      startTimestamp: null,
      endTimestamp: null,
      triggerDate: null,
      drills: getDefaultPenaltyDrills(),
    });

    addNotification('PENALTY ZONE CLEARED', 'Survival protocol completed. Returned to normal reality.', 'reward');
    return true;
  };

  const triggerManualPenaltyZone = () => {
    sound.playPenaltySiren();
    setPenaltyState({
      isActive: true,
      startTimestamp: Date.now(),
      endTimestamp: null,
      triggerDate: getLocalDateKey(),
      drills: getDefaultPenaltyDrills(),
    });

    addNotification(
      'PENALTY ZONE ACTIVATED',
      'Emergency survival simulation active. Complete all 7 drills to escape.',
      'penalty'
    );
  };

  const exportData = (): string => {
    const exportPayload = {
      version: '3.3',
      exportedAt: new Date().toISOString(),
      profile,
      attributeXP,
      dailyQuest,
      history,
      xpTransactions,
      attributeTransactions,
      penaltyLedger,
      penaltyState,
    };
    return JSON.stringify(exportPayload, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile && typeof parsed.profile === 'object') {
        const totalXP = typeof parsed.profile.totalXP === 'number' ? parsed.profile.totalXP : (parsed.profile.xp || 0);
        const currentLevel = calculateLevel(totalXP);
        const rank = calculateHunterRank(currentLevel);

        // Sanitize penalty ledger to prevent corruption
        const validPenaltyLedger: PenaltyLedgerEvent[] = Array.isArray(parsed.penaltyLedger)
          ? parsed.penaltyLedger.filter((e: any) => typeof e?.id === 'string' && typeof e?.date === 'string')
          : [];

        const currentLocalToday = getLocalDateKey();
        let shouldActivatePenalty = false;
        let lastTriggerDate = '';

        if (parsed.dailyQuest) {
          const dq = parsed.dailyQuest;
          if (Array.isArray(dq.quests)) {
            dq.quests = dq.quests.map((q: QuestItem) => (q.id === 'study' ? { ...q, target: 60, isCompleted: q.current >= 60 } : q));
            dq.isAllCompleted = dq.quests.every((q: QuestItem) => q.isCompleted) || dq.isAllCompleted;
          }

          // If imported date is from a past calendar day, immediately scan for missed penalties
          if (dq.date < currentLocalToday) {
            const missedRange = getMissedDateRange(dq.date, currentLocalToday);
            missedRange.forEach(dateKey => {
              const isHistoricalRest = Array.isArray(parsed.history) && parsed.history.some((h: any) => h.date === dateKey && h.isRestDay);
              const isHistoricalCompleted = Array.isArray(parsed.history) && parsed.history.some((h: any) => h.date === dateKey && h.completed);
              const isImportDay = dateKey === dq.date;
              const isImportSafe = isImportDay && (dq.isAllCompleted || dq.isRestDay);

              if (!isHistoricalRest && !isHistoricalCompleted && !isImportSafe) {
                const penaltyId = `penalty:${dateKey}`;
                if (!validPenaltyLedger.some(e => e.id === penaltyId)) {
                  validPenaltyLedger.unshift({
                    id: penaltyId,
                    date: dateKey,
                    timestamp: Date.now(),
                    reason: 'Daily conditioning incomplete on imported past date',
                  });
                  shouldActivatePenalty = true;
                  lastTriggerDate = dateKey;
                }
              }
            });

            // Initialize clean daily quest sheet for today
            setDailyQuest(getInitialDailyQuestState(currentLocalToday));
          } else {
            setDailyQuest(dq);
          }
        }

        setPenaltyLedger(validPenaltyLedger);

        setProfile({
          ...parsed.profile,
          totalXP,
          currentLevel,
          rank,
          streakDays: shouldActivatePenalty ? 0 : (parsed.profile.streakDays || 0),
          penaltyCount: Math.max(0, validPenaltyLedger.length),
        });

        if (parsed.attributeXP) setAttributeXP(parsed.attributeXP);
        if (Array.isArray(parsed.history)) setHistory(parsed.history);
        if (Array.isArray(parsed.xpTransactions)) setXpTransactions(parsed.xpTransactions);
        if (Array.isArray(parsed.attributeTransactions)) setAttributeTransactions(parsed.attributeTransactions);

        if (shouldActivatePenalty) {
          sound.playPenaltySiren();
          setPenaltyState({
            isActive: true,
            startTimestamp: Date.now(),
            endTimestamp: null,
            triggerDate: lastTriggerDate,
            drills: getDefaultPenaltyDrills(),
          });
          addNotification(
            'PENALTY ZONE ACTIVATED',
            'Imported past missed day detected! Complete all 7 redemption drills to survive.',
            'penalty'
          );
        } else if (parsed.penaltyState && typeof parsed.penaltyState.isActive === 'boolean') {
          const ps = parsed.penaltyState;
          if (Array.isArray(ps.drills)) {
            ps.drills = ps.drills.map((d: PenaltyDrillItem) => {
              if (d.id === 'steps' && d.target === 5000) return { ...d, target: 2000 };
              if (d.id === 'study' && (d.target === 30 || d.target === 120)) return { ...d, target: 18 };
              return d;
            });
          }
          ps.endTimestamp = null;
          setPenaltyState(ps);
        }

        sound.playQuestComplete();
        addNotification('BACKUP RESTORED', 'Your Hunter state and stats have been loaded!', 'reward');
        return true;
      }
    } catch (e) {
      console.error('Failed to import JSON data', e);
    }
    return false;
  };

  return (
    <SystemContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profile,
        attributeXP,
        attributeProgress,
        dailyQuest,
        history,
        xpTransactions,
        attributeTransactions,
        penaltyLedger,
        penaltyState,
        notifications,
        floatingXp,
        levelProgress,
        isMuted,
        toggleMute,
        awardXP,
        awardAttributeXP,
        addQuestProgress,
        updatePenaltyDrillProgress,
        claimDailyCompletionBonus,
        activateRestDay,
        exportData,
        importData,
        updateProfileName,
        triggerManualPenaltyZone,
        clearPenaltyZone,
        addNotification,
        dismissNotification,
        dismissFloatingXp,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within a SystemProvider');
  return context;
};
