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
  Minus,
  AlertTriangle,
  Zap,
  Lock,
  SlidersHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSystem, BIRTHDAY_SPECIAL_QUEST } from '../context/SystemContext';
import { QuestItem, CustomQuestTargets } from '../types';
import { getLocalDateKey } from '../utils/dateUtils';

export const DailyQuest: React.FC = () => {
  const { 
    dailyQuest, 
    addQuestProgress, 
    logSpecialQuestDistance,
    resetSpecialQuest,
    claimDailyCompletionBonus,
    activateRestDay,
    profile,
    floatingXp,
    customTargets,
    updateCustomTargets
  } = useSystem();

  // Custom Protocol Goals Modal State
  const [showTargetModal, setShowTargetModal] = useState<boolean>(false);
  const [tempTargets, setTempTargets] = useState<CustomQuestTargets>(customTargets);

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

  const todayKey = getLocalDateKey();
  const isBirthdayProtocolDay = todayKey === '2026-09-10';
  const specialQuest = isBirthdayProtocolDay ? (dailyQuest.specialQuest || BIRTHDAY_SPECIAL_QUEST) : null;
  const isUpcoming = false; // Officially unlocked for September 10th!
  const isUrgentActive = Boolean(specialQuest && !specialQuest.isCompleted);

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

      {/* Anime-Style URGENT QUEST / UPCOMING EVENT Card */}
      {specialQuest && (
        <div className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
          specialQuest.isCompleted
            ? 'bg-emerald-950/25 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            : isUpcoming
            ? 'bg-gradient-to-b from-purple-950/40 via-black/80 to-amber-950/30 border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
            : 'bg-gradient-to-b from-rose-950/40 via-black/80 to-black/90 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
        }`}>
          {/* Top glow accent */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
            isUpcoming ? 'via-amber-500' : 'via-rose-500'
          } to-transparent`} />

          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3">
            <div className="flex items-center space-x-2">
              {isUpcoming ? (
                <span className="inline-flex items-center space-x-1 font-display font-black text-xs tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  <span>UPCOMING EVENT</span>
                </span>
              ) : (
                <span className={`inline-flex items-center space-x-1 font-display font-black text-xs tracking-wider uppercase px-2 py-0.5 rounded ${
                  specialQuest.isCompleted 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  <span>URGENT QUEST</span>
                </span>
              )}
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">
                Birthday Protocol
              </span>
            </div>

            {specialQuest.isCompleted ? (
              <span className="flex items-center text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> CLEARED
              </span>
            ) : isUpcoming ? (
              <div className="flex items-center space-x-1 text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Unlocks in {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                ACTIVE
              </span>
            )}
          </div>

          {/* Quest Info */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-display font-bold text-base text-zinc-100 flex items-center space-x-2">
                <span>{specialQuest.title}</span>
              </h3>
              <p className="text-xs text-zinc-300 mt-0.5">
                {specialQuest.subtitle}
              </p>
              <div className="flex items-center space-x-2 mt-1.5 text-[11px] font-mono text-cyan-400">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>+{specialQuest.xpReward} Global EXP · +{specialQuest.attributeXpReward} AGI · +{specialQuest.attributeXpReward} VIT</span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono font-black text-lg text-amber-300">
                {specialQuest.current.toFixed(1)} <span className="text-xs text-zinc-400">/ {specialQuest.target.toFixed(1)} km</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {isUpcoming ? 'Starts at Midnight' : `${Math.min(100, Math.floor((specialQuest.current / specialQuest.target) * 100))}% Completed`}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden mb-3 border border-white/[0.06]">
            <div
              className={`h-full transition-all duration-500 ${
                specialQuest.isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : isUpcoming
                  ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-500'
                  : 'bg-gradient-to-r from-rose-500 via-amber-500 to-orange-400'
              }`}
              style={{
                width: isUpcoming ? '100%' : `${Math.min(100, (specialQuest.current / specialQuest.target) * 100)}%`,
              }}
            />
          </div>

          {/* Action Log Buttons */}
          {isUpcoming ? (
            <div className="flex items-center justify-center p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/25 text-amber-300/90 text-xs font-mono font-semibold space-x-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>LOCKED UNTIL 12:00 AM MIDNIGHT · PROTOCOL ACTIVATES AT DAWN</span>
            </div>
          ) : !specialQuest.isCompleted ? (
            <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1 border-t border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 font-mono">Log Distance:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => logSpecialQuestDistance(1.0)}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] transition-all hover:scale-105"
                >
                  +1 km
                </button>
                <button
                  onClick={() => logSpecialQuestDistance(5.0)}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] transition-all hover:scale-105"
                >
                  +5 km
                </button>
                <button
                  onClick={() => logSpecialQuestDistance(10.0)}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] transition-all hover:scale-105"
                >
                  +10 km
                </button>
                <button
                  onClick={() => {
                    const remaining = parseFloat((specialQuest.target - specialQuest.current).toFixed(1));
                    if (remaining > 0) {
                      logSpecialQuestDistance(remaining);
                      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    }
                  }}
                  className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-lg shadow-rose-900/30 transition-all hover:scale-105 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  <span>Complete (21.0 km)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-2">
              <div className="text-center">
                <span className="text-xs font-mono font-semibold text-emerald-300">
                  🎉 Protocol Cleared at {specialQuest.completedAt || 'Dawn'}. Physical drills fulfilled for the day!
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-emerald-500/15">
                <span className="text-[10px] text-zinc-400 font-mono">Test Mode:</span>
                <button
                  onClick={resetSpecialQuest}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs font-mono font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/25 transition-all hover:scale-105"
                >
                  <RotateCcw className="w-3 h-3 mr-1 text-amber-400" />
                  <span>Reset to 0.0 km</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quest Header Card: Obsidian HUD Theme */}
      <div className="system-card rounded-2xl p-4 border-cyan-500/20 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-glow" />
            <h2 className="font-display font-bold text-sm tracking-wider uppercase text-zinc-100">
              DAILY CONDITIONING PROTOCOL
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setTempTargets({ ...customTargets });
              setShowTargetModal(true);
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs transition-all hover:scale-105 shadow-cyan-hairline"
            title="Recalibrate Daily Goals"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>EDIT GOALS</span>
          </button>
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

      {/* Anime System Override: Protocols Locked Banner */}
      {isUrgentActive && (
        <div className="system-card p-4 rounded-2xl border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-black/80 to-rose-950/40 text-center space-y-1.5 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold animate-pulse">
            <Lock className="w-3.5 h-3.5 mr-1 text-rose-400" />
            <span>SYSTEM OVERRIDE · PROTOCOLS LOCKED</span>
          </div>
          <p className="text-xs text-zinc-300 font-medium">
            Daily conditioning drills are suspended while the 21.0 km Birthday Urgent Quest is active.
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Focus all energy on the Endurance Protocol to clear requirements.
          </p>
        </div>
      )}

      {/* SECTION 1: PHYSICAL CONDITIONING (6 Quests) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-xs font-bold tracking-wider text-zinc-300 uppercase flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            <span>PHYSICAL CONDITIONING</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {isUrgentActive ? 'Locked' : '6 Quests'}
          </span>
        </div>

        {physicalQuests.map(quest => {
          const percent = Math.min(100, Math.floor((quest.current / quest.target) * 100));

          return (
            <div
              key={quest.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isUrgentActive ? 'opacity-60 border-rose-500/15' : ''
              } ${
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
                {isUrgentActive ? (
                  <div className="w-full py-2 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-400/80 text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 cursor-not-allowed select-none">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>LOCKED · COMPLETE URGENT QUEST FIRST</span>
                  </div>
                ) : quest.id === 'plank' ? (
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
                  <button
                    onClick={() => handleOpenAddModal(quest)}
                    className="w-full py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono font-semibold text-cyan-300 border border-cyan-500/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Log Steps</span>
                  </button>
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
                isUrgentActive ? 'opacity-60 border-rose-500/15' : ''
              } ${
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
                {isUrgentActive ? (
                  <div className="w-full py-2 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-400/80 text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 cursor-not-allowed select-none">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>LOCKED · COMPLETE URGENT QUEST FIRST</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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

              {/* Big Glowing Value Readout with Direct Custom Input */}
              <div className="py-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  Amount to Add
                </span>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <span className="text-3xl font-mono font-bold text-cyan-400/70">+</span>
                  <input
                    type="number"
                    min={config.min}
                    value={sliderAmount === 0 ? '' : sliderAmount}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                      setSliderAmount(val);
                    }}
                    className="w-36 bg-black/60 border border-cyan-500/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-center text-4xl font-mono font-bold text-cyan-300 rounded-2xl py-1 px-2 focus:outline-none transition-all shadow-inner"
                    placeholder="0"
                  />
                  <span className="text-sm font-mono font-medium text-zinc-400 uppercase">
                    {unitLabel}
                  </span>
                </div>
              </div>

              {/* Touch Range Scroller */}
              <div className="space-y-3 px-1">
                <input
                  type="range"
                  min={config.min}
                  max={Math.max(config.max, sliderAmount || 0)}
                  step={config.step}
                  value={sliderAmount}
                  onChange={e => setSliderAmount(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                {/* Fine-Tuning Precision Steppers */}
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => Math.max(config.min, (prev || 0) - config.largeStep))}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-400 border border-white/[0.06] active:scale-95"
                  >
                    -{config.largeStep}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => Math.max(config.min, (prev || 0) - config.smallStep))}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-400 border border-white/[0.06] active:scale-95"
                  >
                    -{config.smallStep}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => (prev || 0) + config.smallStep)}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-200 border border-white/[0.06] active:scale-95"
                  >
                    +{config.smallStep}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => (prev || 0) + config.largeStep)}
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

      {/* Custom Protocol Goals Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="system-card bg-[#030712]/95 border-cyan-500/30 w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl p-5 shadow-obsidian-card relative animate-modal-pop overflow-hidden">
            {/* Header glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm tracking-wider uppercase text-zinc-100">
                    RECALIBRATE PROTOCOL
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Set daily targets you can sustain consistently
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  Quick Presets
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTempTargets({
                      pushups: 30,
                      squats: 30,
                      situps: 20,
                      pullups: 5,
                      plank: 60,
                      steps: 4000,
                      study: 25,
                    })}
                    className="p-2 rounded-xl bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-500/20 text-left transition-all hover:scale-[1.02]"
                  >
                    <div className="text-[11px] font-bold text-cyan-300">Starter</div>
                    <div className="text-[9px] text-zinc-400 font-mono mt-0.5">30 reps · 1m plank</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTempTargets({
                      pushups: 50,
                      squats: 50,
                      situps: 30,
                      pullups: 10,
                      plank: 120,
                      steps: 7000,
                      study: 45,
                    })}
                    className="p-2 rounded-xl bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-500/20 text-left transition-all hover:scale-[1.02]"
                  >
                    <div className="text-[11px] font-bold text-cyan-300">Balanced</div>
                    <div className="text-[9px] text-zinc-400 font-mono mt-0.5">50 reps · 2m plank</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTempTargets({
                      pushups: 150,
                      squats: 150,
                      situps: 100,
                      pullups: 30,
                      plank: 300,
                      steps: 10000,
                      study: 60,
                    })}
                    className="p-2 rounded-xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-500/25 text-left transition-all hover:scale-[1.02]"
                  >
                    <div className="text-[11px] font-bold text-purple-300">Monarch</div>
                    <div className="text-[9px] text-zinc-400 font-mono mt-0.5">150 reps · 5m plank</div>
                  </button>
                </div>
              </div>

              {/* Individual Drill Configuration */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  Custom Targets
                </span>

                {[
                  { id: 'pushups', name: 'Push-ups', icon: '💪', unit: 'reps', step: 5, min: 5, max: 500 },
                  { id: 'squats', name: 'Squats', icon: '🦵', unit: 'reps', step: 5, min: 5, max: 500 },
                  { id: 'situps', name: 'Sit-ups', icon: '🧘', unit: 'reps', step: 5, min: 5, max: 500 },
                  { id: 'pullups', name: 'Pull-ups', icon: '🧗', unit: 'reps', step: 1, min: 1, max: 100 },
                  { id: 'plank', name: 'Plank', icon: '⏱️', unit: 'sec', step: 15, min: 15, max: 900, isPlank: true },
                  { id: 'steps', name: 'Daily Steps', icon: '🏃', unit: 'steps', step: 500, min: 1000, max: 50000 },
                  { id: 'study', name: 'Focused Study', icon: '🧠', unit: 'min', step: 5, min: 5, max: 300 },
                ].map(item => {
                  const val = tempTargets[item.id as keyof CustomQuestTargets] || 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <div className="text-xs font-semibold text-zinc-200">{item.name}</div>
                          {item.isPlank && (
                            <div className="text-[9px] font-mono text-zinc-500">
                              {val >= 60 ? `${(val / 60).toFixed(1)} min` : `${val}s`}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setTempTargets(prev => ({
                            ...prev,
                            [item.id]: Math.max(item.min, (prev[item.id as keyof CustomQuestTargets] || 0) - item.step),
                          }))}
                          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 text-xs font-mono flex items-center justify-center border border-white/[0.06] active:scale-95"
                        >
                          -
                        </button>

                        <div className="relative">
                          <input
                            type="number"
                            min={item.min}
                            max={item.max}
                            value={val === 0 ? '' : val}
                            onChange={e => {
                              const num = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                              setTempTargets(prev => ({ ...prev, [item.id]: num }));
                            }}
                            className="w-16 py-1 px-1.5 text-center text-xs font-mono font-bold text-cyan-300 bg-black/80 border border-cyan-500/30 rounded-lg focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setTempTargets(prev => ({
                            ...prev,
                            [item.id]: (prev[item.id as keyof CustomQuestTargets] || 0) + item.step,
                          }))}
                          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 text-xs font-mono flex items-center justify-center border border-white/[0.06] active:scale-95"
                        >
                          +
                        </button>

                        <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-400 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateCustomTargets(tempTargets);
                  setShowTargetModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-xs font-display font-bold text-black transition-all shadow-obsidian-glow active:scale-95"
              >
                ✓ Save Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
