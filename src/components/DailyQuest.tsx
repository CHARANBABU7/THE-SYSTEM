import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  Award, 
  Plus, 
  Sparkles, 
  Brain, 
  X,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Timer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSystem } from '../context/SystemContext';
import { QuestItem } from '../types';

export const DailyQuest: React.FC = () => {
  const { 
    dailyQuest, 
    addQuestProgress, 
    claimDailyCompletionBonus,
    activateRestDay,
    profile,
    floatingXp 
  } = useSystem();

  const [activeModalQuest, setActiveModalQuest] = useState<QuestItem | null>(null);
  const [customInputValue, setCustomInputValue] = useState<string>('');
  
  // Timer State (Plank & Study)
  const [activeTimerQuest, setActiveTimerQuest] = useState<QuestItem | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [focusTargetMinutes, setFocusTargetMinutes] = useState<number>(25);

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Countdown timer to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      const diff = midnight.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live Stopwatch / Focus Timer Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handleOpenTimer = (quest: QuestItem) => {
    setActiveTimerQuest(quest);
    setElapsedSeconds(0);
    setTimerRunning(false);
  };

  const handleFinishTimer = () => {
    if (!activeTimerQuest || elapsedSeconds <= 0) return;

    if (activeTimerQuest.id === 'plank') {
      addQuestProgress('plank', elapsedSeconds);
    } else if (activeTimerQuest.id === 'study') {
      const minutesCompleted = Math.max(1, Math.round(elapsedSeconds / 60));
      addQuestProgress('study', minutesCompleted);
    }

    setTimerRunning(false);
    setActiveTimerQuest(null);
    setElapsedSeconds(0);
  };

  const handleOpenAddModal = (quest: QuestItem) => {
    setActiveModalQuest(quest);
    setCustomInputValue('');
  };

  const handleApplyProgress = (amount: number) => {
    if (!activeModalQuest || amount <= 0) return;
    addQuestProgress(activeModalQuest.id, amount);
    setActiveModalQuest(null);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customInputValue);
    if (!isNaN(val) && val > 0 && activeModalQuest) {
      handleApplyProgress(val);
    }
  };

  const handleGrandClaim = () => {
    claimDailyCompletionBonus();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#38bdf8', '#a855f7'],
    });
  };

  const formatProgressDisplay = (quest: QuestItem) => {
    if (quest.id === 'plank') {
      const currentMins = Math.floor(quest.current / 60);
      const currentSecs = quest.current % 60;
      const targetMins = Math.floor(quest.target / 60);
      return `${currentMins}m ${currentSecs}s / ${targetMins}m`;
    }
    if (quest.id === 'study') {
      const currentHours = Math.floor(quest.current / 60);
      const currentMins = quest.current % 60;
      if (quest.target === 60) {
        return currentHours > 0
          ? `${currentHours}h ${currentMins}m / 1h`
          : `${currentMins}m / 60m`;
      }
      const targetHours = Math.floor(quest.target / 60);
      return `${currentHours}h ${currentMins}m / ${targetHours}h`;
    }
    return `${quest.current.toLocaleString()} / ${quest.target.toLocaleString()} ${quest.unit}`;
  };

  const formatTimerClock = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const physicalQuests = dailyQuest.quests.filter(q => q.category === 'physical');
  const studyQuests = dailyQuest.quests.filter(q => q.category === 'study');

  const totalProgressPercent = Math.floor(
    dailyQuest.quests.reduce((acc, q) => acc + Math.min(100, (q.current / q.target) * 100), 0) /
      dailyQuest.quests.length
  );

  const completedCount = dailyQuest.quests.filter(q => q.isCompleted).length;

  return (
    <div className="space-y-4 pb-24 relative">
      {/* Floating XP Gain Animations */}
      <div className="fixed top-16 right-4 z-50 pointer-events-none space-y-2">
        {floatingXp.map(evt => (
          <div
            key={evt.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center space-x-2 bg-zinc-900/90 border border-cyan-500/30 text-cyan-300 px-3.5 py-1.5 rounded-full font-mono font-semibold text-xs shadow-obsidian-glow backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>+{evt.amount} EXP</span>
            <span className="text-[10px] text-zinc-400">({evt.source})</span>
          </div>
        ))}
      </div>

      {/* Rest Day Active Banner */}
      {dailyQuest.isRestDay && (
        <div className="system-card-gold p-3.5 rounded-2xl border-amber-500/30 text-center space-y-1">
          <div className="flex items-center justify-center space-x-2 text-amber-300 font-display font-bold text-xs">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>MONARCH AEGIS ACTIVE · REST & RECOVERY DAY</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Streak is frozen and fully protected. Daily protocols are paused for muscle recovery.
          </p>
        </div>
      )}

      {/* Daily Quest Header Card */}
      <div className="system-card p-4 rounded-2xl border-white/[0.08] shadow-obsidian-card relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-display font-bold text-xs tracking-widest text-cyan-400 uppercase">
              DAILY QUEST
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
              Conditioning
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Rest Day Trigger Pill */}
            {!dailyQuest.isRestDay && profile.shieldsAvailable > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Use 1 Recovery Shield to take a Rest Day? Your streak will be protected.')) {
                    activateRestDay();
                  }
                }}
                className="flex items-center space-x-1 text-[10px] font-mono font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/25 transition-all"
                title="Use Recovery Shield"
              >
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Rest ({profile.shieldsAvailable})</span>
              </button>
            )}

            {/* Countdown Clock */}
            <div className="flex items-center space-x-1.5 text-xs font-mono text-rose-400 font-medium bg-rose-950/20 px-2.5 py-1 rounded-lg border border-rose-500/20">
              <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <h2 className="font-display font-bold text-base text-zinc-100 mb-0.5 tracking-tight">
          Preparation to Become Strong
        </h2>
        <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
          Condition your body daily. Progress saves cumulatively throughout the day.
        </p>

        {/* Overall Completion Progress */}
        <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/[0.04]">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400 font-medium">Protocol Progress</span>
            <span className="font-mono font-bold text-cyan-300">
              {completedCount}/7 Complete ({totalProgressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${Math.min(100, totalProgressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: PHYSICAL QUESTS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-xs font-bold tracking-wider text-zinc-300 uppercase flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            <span>PHYSICAL PROTOCOLS</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">6 Quests</span>
        </div>

        {physicalQuests.map(quest => {
          const percent = Math.min(100, Math.floor((quest.current / quest.target) * 100));

          return (
            <div
              key={quest.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                quest.isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/25'
                  : 'system-card border-white/[0.06] hover:border-cyan-500/20'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg p-1.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                    {quest.icon}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-display font-semibold text-sm text-zinc-100">
                        {quest.name}
                      </span>
                      {quest.isCompleted && (
                        <span className="flex items-center text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> DONE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      +{quest.xpReward} EXP · +{quest.attributeBonus.toUpperCase()} XP
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-cyan-300">
                    {formatProgressDisplay(quest)}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{percent}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 rounded-full bg-zinc-900/80 overflow-hidden mb-2.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    quest.isCompleted ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Steppers & Auto-Timer button */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quest.id === 'plank' ? (
                    <>
                      <button
                        onClick={() => handleOpenTimer(quest)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono font-semibold text-cyan-300 border border-cyan-500/30 flex items-center space-x-1 active:scale-95 transition-all"
                      >
                        <Timer className="w-3 h-3 text-cyan-400" />
                        <span>Live Stopwatch</span>
                      </button>
                      <button
                        onClick={() => addQuestProgress(quest.id, 30)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                      >
                        +30s
                      </button>
                      <button
                        onClick={() => addQuestProgress(quest.id, 60)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                      >
                        +1m
                      </button>
                    </>
                  ) : quest.id === 'steps' ? (
                    <>
                      <button
                        onClick={() => addQuestProgress(quest.id, 500)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                      >
                        +500
                      </button>
                      <button
                        onClick={() => addQuestProgress(quest.id, 1000)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                      >
                        +1k
                      </button>
                      <button
                        onClick={() => addQuestProgress(quest.id, 2500)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                      >
                        +2.5k
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => addQuestProgress(quest.id, 5)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => addQuestProgress(quest.id, 10)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => addQuestProgress(quest.id, 25)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                      >
                        +25
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleOpenAddModal(quest)}
                  className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono font-medium text-zinc-300 flex items-center space-x-1 active:scale-95 ml-auto transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2: STUDY QUEST */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-xs font-bold tracking-wider text-zinc-300 uppercase flex items-center space-x-1.5">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>INTELLECT PROTOCOL</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">1 Quest</span>
        </div>

        {studyQuests.map(quest => {
          const percent = Math.min(100, Math.floor((quest.current / quest.target) * 100));

          return (
            <div
              key={quest.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                quest.isCompleted
                  ? 'bg-purple-950/20 border-purple-500/25'
                  : 'system-card border-white/[0.06] hover:border-purple-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg p-1.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                    {quest.icon}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-display font-semibold text-sm text-zinc-100">
                        {quest.name}
                      </span>
                      {quest.isCompleted && (
                        <span className="flex items-center text-[10px] font-mono font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> DONE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      +{quest.xpReward} EXP · +INT
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-purple-300">
                    {formatProgressDisplay(quest)}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{percent}%</span>
                </div>
              </div>

              <div className="w-full h-1 rounded-full bg-zinc-900/80 overflow-hidden mb-2.5">
                <div
                  className="h-full bg-purple-400 transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Study Steppers & Focus Timer */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleOpenTimer(quest)}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-xs font-mono font-semibold text-purple-300 border border-purple-500/30 flex items-center space-x-1 active:scale-95 transition-all"
                  >
                    <Timer className="w-3 h-3 text-purple-400" />
                    <span>Focus Timer</span>
                  </button>
                  <button
                    onClick={() => addQuestProgress(quest.id, 15)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                  >
                    +15m
                  </button>
                  <button
                    onClick={() => addQuestProgress(quest.id, 30)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                  >
                    +30m
                  </button>
                  <button
                    onClick={() => addQuestProgress(quest.id, 60)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
                  >
                    +1h
                  </button>
                </div>

                <button
                  onClick={() => handleOpenAddModal(quest)}
                  className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono font-medium text-zinc-300 flex items-center space-x-1 active:scale-95 ml-auto transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* GRAND COMPLETION BUTTON */}
      <div className="pt-2">
        {dailyQuest.isAllCompleted ? (
          !dailyQuest.completionBonusClaimed ? (
            <button
              onClick={handleGrandClaim}
              className="w-full py-3.5 rounded-2xl font-display font-bold text-sm bg-cyan-400 hover:bg-cyan-300 text-black shadow-obsidian-glow active:scale-98 transition-all flex items-center justify-center space-x-2 animate-bounce"
            >
              <Award className="w-4 h-4 text-black" />
              <span>CLAIM PERFECT DAY BONUS (+300 EXP)</span>
            </button>
          ) : (
            <div className="p-3 text-center bg-emerald-950/30 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs font-mono flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All 7 Quests Complete · +300 EXP Perfect Day Claimed</span>
            </div>
          )
        ) : (
          <div className="p-3 text-center bg-white/[0.02] border border-white/[0.06] rounded-2xl text-zinc-500 text-xs font-mono">
            {completedCount}/7 Protocols Cleared · Complete all to claim +300 EXP
          </div>
        )}
      </div>

      {/* Live Auto-Timer Modal (Plank & Study) */}
      {activeTimerQuest && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-sm system-card rounded-3xl p-6 border-cyan-500/30 shadow-obsidian-glow text-center space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{activeTimerQuest.icon}</span>
                <div className="text-left">
                  <h3 className="font-display font-bold text-sm text-zinc-100">
                    Live {activeTimerQuest.name} Session
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Auto-logs progress when finished
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setActiveTimerQuest(null);
                }}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Giant Digital Clock */}
            <div className="py-4">
              <div className="text-5xl font-mono font-bold text-cyan-300 tracking-wider">
                {formatTimerClock(elapsedSeconds)}
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-2">
                {activeTimerQuest.id === 'plank'
                  ? `Target: 5 Minutes (300s)`
                  : `Target: 1 Hour (60 mins)`}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-6 py-3 rounded-2xl font-display font-bold text-sm flex items-center space-x-2 transition-all active:scale-95 ${
                  timerRunning
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : 'bg-cyan-400 text-black hover:bg-cyan-300 shadow-obsidian-glow'
                }`}
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-black" />
                    <span>Start Session</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setTimerRunning(false);
                  setElapsedSeconds(0);
                }}
                className="p-3 rounded-2xl bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08]"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Save & Log Button */}
            <div className="pt-2">
              <button
                disabled={elapsedSeconds <= 0}
                onClick={handleFinishTimer}
                className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-display font-bold text-xs disabled:opacity-40 transition-all"
              >
                ✓ Complete & Auto-Log Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Add Progress Modal */}
      {activeModalQuest && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm system-card rounded-2xl p-5 border-cyan-500/30 shadow-obsidian-glow text-left space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{activeModalQuest.icon}</span>
                <div>
                  <h3 className="font-display font-bold text-sm text-zinc-100">
                    Log {activeModalQuest.name}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Current: {formatProgressDisplay(activeModalQuest)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModalQuest(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">
                  Enter completed amount to add (cumulative):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="any"
                    autoFocus
                    placeholder={
                      activeModalQuest.id === 'plank'
                        ? 'Seconds (e.g. 45)'
                        : activeModalQuest.id === 'study'
                        ? 'Minutes (e.g. 30)'
                        : 'Count (e.g. 20)'
                    }
                    value={customInputValue}
                    onChange={e => setCustomInputValue(e.target.value)}
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <span className="text-xs text-zinc-400 font-mono uppercase">
                    {activeModalQuest.id === 'plank'
                      ? 'secs'
                      : activeModalQuest.id === 'study'
                      ? 'mins'
                      : activeModalQuest.unit}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveModalQuest(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-xs text-zinc-400 font-medium hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customInputValue || parseFloat(customInputValue) <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-xs font-display font-bold text-black disabled:opacity-40 transition-all"
                >
                  + Add Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
