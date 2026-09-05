import React, { createContext, useContext, useState, useEffect } from 'react';
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
  PlayerAttributeProgressMap
} from '../types';
import { 
  calculateLevel, 
  calculateLevelProgress, 
  calculateHunterRank,
  calculateAttributeLevel,
  calculateAttributeProgress
} from '../utils/progression';
import { sound } from '../utils/audio';

const STORAGE_KEY = 'SOLO_LEVELING_QUEST_V3';

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
    target: 120, // 2 hours = 120 minutes
    current: 0,
    unit: 'minutes',
    icon: '🧠',
    xpReward: 75,
    attributeBonus: 'int',
    attributeXpReward: 75,
    isCompleted: false,
  },
];

const getInitialDailyQuestState = (): DailyQuestState => {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    quests: getInitialDailyQuests(),
    isAllCompleted: false,
    completionBonusClaimed: false,
    completionBonusXp: 300,
    isRestDay: false,
  };
};

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
  notifications: SystemNotification[];
  floatingXp: FloatingXpEvent[];
  levelProgress: LevelProgress;
  penaltyActive: boolean;
  penaltySecondsLeft: number;
  isMuted: boolean;

  // Actions
  toggleMute: () => void;
  awardXP: (amount: number, source: XPSource | string, date: string, label?: string) => boolean;
  awardAttributeXP: (attribute: AttributeKey, amount: number, source: string, date: string, label?: string) => boolean;
  addQuestProgress: (questId: QuestType, amount: number) => void;
  claimDailyCompletionBonus: () => void;
  activateRestDay: () => boolean;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  updateProfileName: (name: string, alias: string) => void;
  triggerPenaltyZone: () => void;
  clearPenaltyZone: () => void;
  addNotification: (title: string, message: string, type: SystemNotification['type']) => void;
  dismissNotification: (id: string) => void;
  dismissFloatingXp: (id: string) => void;
  resetTodayQuests: () => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('quest');

  // Synchronous initial state restoration from localStorage
  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>(() => {
    const saved = getStoredData();
    return saved?.xpTransactions ? saved.xpTransactions : [];
  });

  const [attributeTransactions, setAttributeTransactions] = useState<AttributeXPTransaction[]>(() => {
    const saved = getStoredData();
    return saved?.attributeTransactions ? saved.attributeTransactions : [];
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
      };
    }
    return INITIAL_PROFILE;
  });

  const [dailyQuest, setDailyQuest] = useState<DailyQuestState>(() => {
    const saved = getStoredData();
    const today = new Date().toISOString().split('T')[0];
    if (saved?.dailyQuest && saved.dailyQuest.date === today && saved.dailyQuest.quests?.length === 7) {
      const updatedQuests = saved.dailyQuest.quests.map((q: QuestItem) => {
        if (q.id === 'pullups') return { ...q, xpReward: 75, attributeXpReward: 75, attributeBonus: 'str' as AttributeKey };
        if (q.id === 'study') return { ...q, xpReward: 75, attributeXpReward: 75, attributeBonus: 'int' as AttributeKey };
        if (q.id === 'pushups' || q.id === 'squats') return { ...q, xpReward: 50, attributeXpReward: 50, attributeBonus: 'str' as AttributeKey };
        if (q.id === 'situps' || q.id === 'plank') return { ...q, xpReward: 50, attributeXpReward: 50, attributeBonus: 'vit' as AttributeKey };
        if (q.id === 'steps') return { ...q, xpReward: 50, attributeXpReward: 50, attributeBonus: 'agi' as AttributeKey };
        return q;
      });
      return { ...saved.dailyQuest, quests: updatedQuests };
    }
    return getInitialDailyQuestState();
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = getStoredData();
    return saved?.history ? saved.history : [];
  });

  const [floatingXp, setFloatingXp] = useState<FloatingXpEvent[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'welcome-notif',
      title: 'SYSTEM ACTIVATED',
      message: 'Welcome Hunter Charan "Kairos" Babu. Daily conditioning quest is ready.',
      type: 'quest',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [penaltyActive, setPenaltyActive] = useState<boolean>(false);
  const [penaltySecondsLeft, setPenaltySecondsLeft] = useState<number>(14400); // 4 hours
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Calculate dynamic level progress for Hunter and each individual Attribute
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
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [profile, attributeXP, dailyQuest, history, xpTransactions, attributeTransactions]);

  // Midnight Date Checker
  useEffect(() => {
    const checkMidnightReset = () => {
      const today = new Date().toISOString().split('T')[0];

      if (dailyQuest.date !== today) {
        if (dailyQuest.isRestDay) {
          sound.playQuestComplete();
          addNotification(
            'REST DAY CONCLUDED',
            'Recovery period complete. Welcome back, Hunter. A new daily quest has arrived.',
            'info'
          );
        } else if (!dailyQuest.isAllCompleted) {
          sound.playPenaltySiren();
          setPenaltyActive(true);
          setPenaltySecondsLeft(14400);
          setProfile(p => ({
            ...p,
            streakDays: 0,
            penaltyCount: p.penaltyCount + 1,
          }));
          addNotification(
            'PENALTY ZONE ACTIVATED',
            'Midnight passed without completing all 7 daily quests! Penalty Zone survival initiated.',
            'penalty'
          );
        } else {
          sound.playQuestComplete();
          addNotification(
            'NEW DAILY QUEST ARRIVED',
            'A new day has arrived. Daily conditioning protocols have reset to 0.',
            'quest'
          );
        }

        setDailyQuest(getInitialDailyQuestState());
      }
    };

    const interval = setInterval(checkMidnightReset, 15000);
    window.addEventListener('focus', checkMidnightReset);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkMidnightReset);
    };
  }, [dailyQuest]);

  // Penalty timer interval
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (penaltyActive && penaltySecondsLeft > 0) {
      timer = setInterval(() => {
        setPenaltySecondsLeft(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [penaltyActive, penaltySecondsLeft]);

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

  const addNotification = (title: string, message: string, type: SystemNotification['type']) => {
    sound.playSystemChime();
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateProfileName = (name: string, alias: string) => {
    setProfile(prev => ({ ...prev, name, alias }));
    addNotification('PROFILE UPDATED', `Hunter designation set to ${name} [${alias}]`, 'info');
  };

  /**
   * 1. Centralized Global XP Engine
   */
  const awardXP = (amount: number, source: XPSource | string, date: string, label: string = 'Quest'): boolean => {
    if (amount <= 0) return false;

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
        const levelsGained = newLevel - oldLevel;
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
   * 2. Centralized Attribute XP & Leveling Engine
   * Enforces idempotency per (date, source) and processes level-up thresholds
   */
  const awardAttributeXP = (
    attribute: AttributeKey, 
    amount: number, 
    source: string, 
    date: string, 
    label: string = 'Attribute'
  ): boolean => {
    if (amount <= 0) return false;

    // Check transaction ledger: prevent duplicate attribute rewards
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
    if (amount <= 0 || dailyQuest.isRestDay) return;
    sound.playStatPoint();

    // 1. Update lifetime physical/study metrics
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

    // 2. Accumulate progress on the daily quest
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

      // If this specific quest was just completed today:
      // Award Global XP AND Attribute XP
      if (newlyCompletedQuest) {
        const quest = newlyCompletedQuest as QuestItem;
        const globalSourceKey: XPSource = `quest_${quest.id}` as XPSource;
        const attrSourceKey = `attribute_${quest.attributeBonus}_${quest.id}_${prev.date}`;

        sound.playQuestComplete();

        // 1. Global Hunter XP
        awardXP(quest.xpReward, globalSourceKey, prev.date, quest.name);

        // 2. Individual Attribute XP
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

      // If ALL 7 quests are completed, trigger Perfect Day readiness
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

  const claimDailyCompletionBonus = () => {
    if (!dailyQuest.isAllCompleted || dailyQuest.completionBonusClaimed) return;

    sound.playQuestComplete();
    setDailyQuest(prev => ({
      ...prev,
      completionBonusClaimed: true,
      completedAt: new Date().toLocaleTimeString(),
    }));

    // 1. Award +300 Global XP for Perfect Day
    awardXP(300, 'perfect_day', dailyQuest.date, 'PERFECT DAY BONUS');

    // 2. Award +100 SENSE Attribute XP for Perfect Day
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

    // Save to history
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
      `+300 Global EXP & +100 SENSE EXP awarded! Full physical and discipline progression logged.`,
      'reward'
    );
  };

  const activateRestDay = (): boolean => {
    if (profile.shieldsAvailable <= 0 || dailyQuest.isRestDay) {
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

  const exportData = (): string => {
    const exportPayload = {
      version: '3.2',
      exportedAt: new Date().toISOString(),
      profile,
      attributeXP,
      dailyQuest,
      history,
      xpTransactions,
      attributeTransactions,
    };
    return JSON.stringify(exportPayload, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile) {
        const totalXP = typeof parsed.profile.totalXP === 'number' ? parsed.profile.totalXP : (parsed.profile.xp || 0);
        const currentLevel = calculateLevel(totalXP);
        const rank = calculateHunterRank(currentLevel);

        setProfile({
          ...parsed.profile,
          totalXP,
          currentLevel,
          rank,
        });

        if (parsed.attributeXP) setAttributeXP(parsed.attributeXP);
        if (parsed.history) setHistory(parsed.history);
        if (parsed.dailyQuest) setDailyQuest(parsed.dailyQuest);
        if (parsed.xpTransactions) setXpTransactions(parsed.xpTransactions);
        if (parsed.attributeTransactions) setAttributeTransactions(parsed.attributeTransactions);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        sound.playQuestComplete();
        addNotification('BACKUP RESTORED', 'Your Hunter data, Attribute XP, and level have been restored!', 'reward');
        return true;
      }
    } catch (e) {
      console.error('Failed to import JSON data', e);
    }
    return false;
  };

  const triggerPenaltyZone = () => {
    sound.playPenaltySiren();
    setPenaltyActive(true);
    setPenaltySecondsLeft(14400);
    setProfile(prev => ({ ...prev, penaltyCount: prev.penaltyCount + 1 }));
    addNotification(
      'PENALTY ZONE ACTIVATED',
      'Survival protocol triggered! Complete emergency conditioning to clear.',
      'penalty'
    );
  };

  const clearPenaltyZone = () => {
    sound.playQuestComplete();
    setPenaltyActive(false);
    addNotification('PENALTY ZONE CLEARED', 'Survival protocol completed. Returned to normal.', 'info');
  };

  const resetTodayQuests = () => {
    setDailyQuest(getInitialDailyQuestState());
    addNotification('QUEST RESET', 'Today’s quest progress has been reset to 0.', 'info');
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
        notifications,
        floatingXp,
        levelProgress,
        penaltyActive,
        penaltySecondsLeft,
        isMuted,
        toggleMute,
        awardXP,
        awardAttributeXP,
        addQuestProgress,
        claimDailyCompletionBonus,
        activateRestDay,
        exportData,
        importData,
        updateProfileName,
        triggerPenaltyZone,
        clearPenaltyZone,
        addNotification,
        dismissNotification,
        dismissFloatingXp,
        resetTodayQuests,
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
