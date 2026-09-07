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
  Timer,
  Minus
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

  // Scroller Modal State
  const [activeModalQuest, setActiveModalQuest] = useState<QuestItem | null>(null);
  const [sliderAmount, setSliderAmount] = useState<number>(10);
  
  // Timer State (Plank & Study)
  const [activeTimerQuest, setActiveTimerQuest] = useState<QuestItem | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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
    const remaining = Math.max(1, quest.target - quest.current);
    if (quest.id === 'steps') {
      setSliderAmount(Math.min(1000, remaining));
    } else if (quest.id === 'plank') {
      setSliderAmount(Math.min(30, remaining));
    } else if (quest.id === 'study') {
      setSliderAmount(Math.min(15, remaining));
    } else {
      setSliderAmount(Math.min(10, remaining));
    }
  };

  const handleApplyProgress = (amount: number) => {
    if (!activeModalQuest || amount <= 0) return;
    addQuestProgress(activeModalQuest.id, amount);
    setActiveModalQuest(null);
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

  // Dynamic Slider Config
  const getSliderConfig = (quest: QuestItem) => {
    if (quest.id === 'steps') {
      return { min: 100, max: 10000, step: 100, smallStep: 250, largeStep: 1000 };
    }
    if (quest.id === 'plank') {
      return { min: 5, max: 300, step: 5, smallStep: 5, largeStep: 30 };
    }
    if (quest.id === 'study') {
      return { min: 1, max: 60, step: 1, smallStep: 5, largeStep: 15 };
    }
    return { min: 1, max: quest.target, step: 1, smallStep: 1, largeStep: 5 };
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Floating XP Animation Container */}
      <div className="fixed top-20 right-4 pointer-events-none z-50 flex flex-col space-y-2 items-end">
        {floatingXp.map(fx => (
          <div
            key={fx.id}
            className="animate-floating-xp bg-black/80 border border-cyan-400 text-cyan-300 px-3 py-1.5 rounded-full font-mono text-xs font-bold shadow-obsidian-glow flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>+{fx.amount} EXP</span>
            {fx.source && <span className="text-[10px] text-zinc-400">({fx.source})</span>}
          </div>
        ))}
      </div>

      {/* Quest Header Card: Obsidian HUD Theme */}
      <div className="system-card rounded-2xl p-4 border-cyan-500/20 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-glow" />
            <h2 className="font-display font-bold text-sm tracking-wider uppercase text-zinc-100">
              DAILY CONDITIONING PROTOCOL
            </h2>
          </div>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
            SOLO LEVELING
          </span>
        </div>

        {/* Countdown & Status */}
        <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-b border-white/[0.06] py-2.5 my-2">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-zinc-300">
              Reset in {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-mono font-semibold text-zinc-200">
              {profile.streakDays} Day Streak
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-zinc-400">PROTOCOL COMPLETION</span>
            <span className="text-cyan-300 font-bold">{totalProgressPercent}% ({completedCount}/7)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-900/80 overflow-hidden p-0.5 border border-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 shadow-glow"
              style={{ width: `${totalProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Rest Day Aegis Button */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono text-zinc-300">
              Monarch's Aegis: <span className="font-bold text-cyan-300">{profile.shieldsAvailable} Shield</span>
            </span>
          </div>

          {dailyQuest.isRestDay ? (
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              ✓ REST DAY ACTIVE (PROTECTED)
            </span>
          ) : (
            <button
              onClick={activateRestDay}
              disabled={profile.shieldsAvailable <= 0}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-xs font-mono text-zinc-300 hover:text-cyan-300 transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            >
              Activate Shield
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: PHYSICAL CONDITIONING (6 Quests) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-xs font-bold tracking-wider text-zinc-300 uppercase flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            <span>PHYSICAL CONDITIONING</span>
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
                      +{quest.xpReward} EXP · +{quest.attributeBonus.toUpperCase()}
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

              {/* Minimalist Action Controls */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                {quest.id === 'plank' ? (
                  <>
                    <button
                      onClick={() => handleOpenTimer(quest)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono font-semibold text-cyan-300 border border-cyan-500/30 flex items-center space-x-1.5 active:scale-95 transition-all"
                    >
                      <Timer className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Live Stopwatch</span>
                    </button>
                    <button
                      onClick={() => handleOpenAddModal(quest)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono font-medium text-zinc-200 flex items-center space-x-1 active:scale-95 ml-auto transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Log Time</span>
                    </button>
                  </>
                ) : quest.id === 'steps' ? (
                  <>
                    <div className="flex items-center gap-1.5">
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
                    </div>
                    <button
                      onClick={() => handleOpenAddModal(quest)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono font-medium text-zinc-200 flex items-center space-x-1 active:scale-95 ml-auto transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Custom</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenAddModal(quest)}
                    className="w-full py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono font-semibold text-cyan-300 border border-cyan-500/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Log Reps</span>
                  </button>
                )}
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

              {/* Minimalist Study Actions */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  onClick={() => handleOpenTimer(quest)}
                  className="flex-1 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-xs font-mono font-semibold text-purple-300 border border-purple-500/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                >
                  <Timer className="w-3.5 h-3.5 text-purple-400" />
                  <span>Focus Timer</span>
                </button>

                <button
                  onClick={() => handleOpenAddModal(quest)}
                  className="px-4 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono font-medium text-zinc-200 flex items-center space-x-1 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Log Time</span>
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

      {/* Touch-Scroller Modal (Zero Keyboard Input) */}
      {activeModalQuest && (() => {
        const config = getSliderConfig(activeModalQuest);
        const unitLabel = activeModalQuest.id === 'plank' 
          ? 'secs' 
          : activeModalQuest.id === 'study' 
          ? 'mins' 
          : activeModalQuest.unit;

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm system-card rounded-3xl p-6 border-cyan-500/30 shadow-obsidian-glow text-center space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{activeModalQuest.icon}</span>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-sm text-zinc-100">
                      Log {activeModalQuest.name}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">
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

              {/* Big Glowing Value Readout */}
              <div className="py-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  Amount to Add
                </span>
                <div className="text-5xl font-mono font-bold text-cyan-300 mt-1">
                  +{sliderAmount.toLocaleString()}
                  <span className="text-sm font-sans font-normal text-zinc-400 ml-1.5 uppercase">
                    {unitLabel}
                  </span>
                </div>
              </div>

              {/* Touch Range Scroller */}
              <div className="space-y-3 px-1">
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={sliderAmount}
                  onChange={e => setSliderAmount(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                {/* Fine-Tuning Precision Steppers */}
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => Math.max(config.min, prev - config.largeStep))}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-400 border border-white/[0.06] active:scale-95"
                  >
                    -{config.largeStep}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => Math.max(config.min, prev - config.smallStep))}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-400 border border-white/[0.06] active:scale-95"
                  >
                    -{config.smallStep}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => Math.min(config.max, prev + config.smallStep))}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-200 border border-white/[0.06] active:scale-95"
                  >
                    +{config.smallStep}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => Math.min(config.max, prev + config.largeStep))}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-200 border border-white/[0.06] active:scale-95"
                  >
                    +{config.largeStep}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalQuest(null)}
                  className="flex-1 py-3 rounded-2xl bg-white/[0.04] text-xs text-zinc-400 font-medium hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyProgress(sliderAmount)}
                  className="flex-1 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-xs font-display font-bold text-black shadow-obsidian-glow transition-all active:scale-95"
                >
                  ✓ Confirm & Add
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
