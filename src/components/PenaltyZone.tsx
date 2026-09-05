import React, { useState } from 'react';
import { 
  Skull, 
  Clock, 
  Flame, 
  ShieldAlert,
  CheckCircle2,
  Brain,
  Timer,
  Play,
  Pause,
  RotateCcw,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSystem } from '../context/SystemContext';

interface PenaltyItem {
  id: string;
  name: string;
  category: 'physical' | 'discipline';
  target: number;
  current: number;
  unit: string;
  icon: string;
}

export const PenaltyZone: React.FC = () => {
  const { 
    penaltySecondsLeft, 
    clearPenaltyZone 
  } = useSystem();

  const [penaltyItems, setPenaltyItems] = useState<PenaltyItem[]>([
    { id: 'pushups', name: 'Emergency Push-ups', category: 'physical', target: 50, current: 0, unit: 'reps', icon: '💪' },
    { id: 'squats', name: 'Emergency Squats', category: 'physical', target: 50, current: 0, unit: 'reps', icon: '🦵' },
    { id: 'situps', name: 'Emergency Sit-ups', category: 'physical', target: 30, current: 0, unit: 'reps', icon: '🧘' },
    { id: 'pullups', name: 'Emergency Pull-ups', category: 'physical', target: 10, current: 0, unit: 'reps', icon: '🧗' },
    { id: 'plank', name: '2-Minute Plank', category: 'physical', target: 120, current: 0, unit: 'seconds', icon: '⏱️' },
    { id: 'steps', name: 'Emergency Steps', category: 'physical', target: 5000, current: 0, unit: 'steps', icon: '🏃' },
    { id: 'study', name: 'Focused Discipline Study', category: 'discipline', target: 30, current: 0, unit: 'minutes', icon: '🧠' },
  ]);

  // Live Stopwatch / Focus state for Plank & Study
  const [activeTimerItem, setActiveTimerItem] = useState<PenaltyItem | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer interval
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const updatePenaltyProgress = (id: string, delta: number) => {
    setPenaltyItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, current: Math.min(item.target, item.current + delta) };
      }
      return item;
    }));
  };

  const handleFinishTimer = () => {
    if (!activeTimerItem || elapsedSeconds <= 0) return;

    if (activeTimerItem.id === 'plank') {
      updatePenaltyProgress('plank', elapsedSeconds);
    } else if (activeTimerItem.id === 'study') {
      const mins = Math.max(1, Math.round(elapsedSeconds / 60));
      updatePenaltyProgress('study', mins);
    }

    setTimerRunning(false);
    setActiveTimerItem(null);
    setElapsedSeconds(0);
  };

  const hours = Math.floor(penaltySecondsLeft / 3600);
  const minutes = Math.floor((penaltySecondsLeft % 3600) / 60);
  const seconds = penaltySecondsLeft % 60;

  const completedCount = penaltyItems.filter(i => i.current >= i.target).length;
  const allCleared = completedCount === penaltyItems.length;

  const handleEscape = () => {
    if (!allCleared && penaltySecondsLeft > 0) return;
    confetti({
      particleCount: 100,
      spread: 70,
      colors: ['#f43f5e', '#fb7185', '#00f0ff'],
    });
    clearPenaltyZone();
  };

  const formatProgressDisplay = (item: PenaltyItem) => {
    if (item.id === 'plank') {
      const m = Math.floor(item.current / 60);
      const s = item.current % 60;
      return `${m}m ${s}s / 2m`;
    }
    if (item.id === 'study') {
      return `${item.current}m / 30m`;
    }
    return `${item.current.toLocaleString()} / ${item.target.toLocaleString()} ${item.unit}`;
  };

  const formatTimerClock = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const physicalItems = penaltyItems.filter(i => i.category === 'physical');
  const disciplineItems = penaltyItems.filter(i => i.category === 'discipline');

  return (
    <div className="fixed inset-0 z-50 bg-[#080104] text-rose-100 flex flex-col p-4 overflow-y-auto backdrop-blur-xl">
      <div className="max-w-md mx-auto w-full my-auto space-y-4 pb-12">
        {/* Red Alert Banner */}
        <div className="system-card-penalty p-4 rounded-2xl border-rose-500/40 text-center space-y-2.5">
          <div className="inline-flex items-center justify-center p-3 bg-rose-950/60 border border-rose-500/30 rounded-2xl text-rose-400">
            <Skull className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase">
              EMERGENCY PROTOCOL · FAILED DAY
            </span>
            <h1 className="font-display font-bold text-xl text-white tracking-tight mt-0.5">
              HUNTER PENALTY PROTOCOL
            </h1>
          </div>

          <p className="text-xs text-rose-300/80 leading-relaxed max-w-xs mx-auto">
            You failed to complete yesterday&apos;s daily quest. Clear all 7 redemption drills to survive the wasteland and restore your system.
          </p>

          {/* Time & Progress Counter */}
          <div className="grid grid-cols-2 gap-2 bg-black/60 p-2.5 rounded-xl border border-rose-900/40">
            <div className="text-left">
              <div className="text-[9px] font-mono text-rose-400/80 uppercase">Survival Timer</div>
              <div className="text-base font-mono font-bold text-white">
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-mono text-rose-400/80 uppercase">Drills Cleared</div>
              <div className="text-base font-mono font-bold text-rose-300">
                {completedCount} / 7 Completed
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: PHYSICAL PENALTY DRILLS */}
        <div className="system-card-penalty p-3.5 rounded-2xl border-rose-500/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-rose-950/60 pb-1.5">
            <span className="font-display text-xs font-bold tracking-wider text-rose-300 flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>PHYSICAL REDEMPTION</span>
            </span>
            <span className="text-[10px] font-mono text-rose-400/70">6 Drills</span>
          </div>

          <div className="space-y-2">
            {physicalItems.map(item => {
              const isDone = item.current >= item.target;
              const pct = Math.min(100, Math.floor((item.current / item.target) * 100));

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isDone ? 'bg-rose-950/40 border-rose-500/40' : 'bg-black/40 border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <span className="font-display text-xs font-semibold text-zinc-100">
                          {item.name}
                        </span>
                        {isDone && (
                          <span className="ml-2 text-[9px] font-mono font-bold text-emerald-400">
                            ✓ CLEARED
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-300">
                      {formatProgressDisplay(item)}
                    </span>
                  </div>

                  <div className="w-full h-1 rounded-full bg-rose-950 overflow-hidden mb-2">
                    <div className="h-full bg-rose-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-end space-x-1.5">
                    {item.id === 'plank' ? (
                      <>
                        <button
                          onClick={() => {
                            setActiveTimerItem(item);
                            setElapsedSeconds(0);
                            setTimerRunning(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-[11px] font-semibold flex items-center space-x-1"
                        >
                          <Timer className="w-3 h-3" />
                          <span>Stopwatch</span>
                        </button>
                        <button
                          onClick={() => updatePenaltyProgress(item.id, 30)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-mono text-rose-200"
                        >
                          +30s
                        </button>
                      </>
                    ) : item.id === 'steps' ? (
                      <>
                        <button
                          onClick={() => updatePenaltyProgress(item.id, 500)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-mono text-rose-200"
                        >
                          +500
                        </button>
                        <button
                          onClick={() => updatePenaltyProgress(item.id, 1000)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-mono text-rose-200"
                        >
                          +1k
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => updatePenaltyProgress(item.id, 5)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-mono text-rose-200"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => updatePenaltyProgress(item.id, 10)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-mono text-rose-200"
                        >
                          +10
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: DISCIPLINE PENALTY */}
        <div className="system-card-penalty p-3.5 rounded-2xl border-rose-500/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-rose-950/60 pb-1.5">
            <span className="font-display text-xs font-bold tracking-wider text-rose-300 flex items-center space-x-1.5">
              <Brain className="w-3.5 h-3.5" />
              <span>DISCIPLINE REDEMPTION</span>
            </span>
            <span className="text-[10px] font-mono text-rose-400/70">1 Drill</span>
          </div>

          {disciplineItems.map(item => {
            const isDone = item.current >= item.target;
            const pct = Math.min(100, Math.floor((item.current / item.target) * 100));

            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  isDone ? 'bg-rose-950/40 border-rose-500/40' : 'bg-black/40 border-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="font-display text-xs font-semibold text-zinc-100">
                      {item.name}
                    </span>
                    {isDone && (
                      <span className="ml-2 text-[9px] font-mono font-bold text-emerald-400">
                        ✓ CLEARED
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-rose-300">
                    {formatProgressDisplay(item)}
                  </span>
                </div>

                <div className="w-full h-1 rounded-full bg-rose-950 overflow-hidden mb-2">
                  <div className="h-full bg-rose-500 transition-all" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center justify-end space-x-1.5">
                  <button
                    onClick={() => {
                      setActiveTimerItem(item);
                      setElapsedSeconds(0);
                      setTimerRunning(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-[11px] font-semibold flex items-center space-x-1"
                  >
                    <Timer className="w-3 h-3" />
                    <span>Focus Timer</span>
                  </button>
                  <button
                    onClick={() => updatePenaltyProgress(item.id, 10)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-mono text-rose-200"
                  >
                    +10m
                  </button>
                  <button
                    onClick={() => updatePenaltyProgress(item.id, 30)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-mono text-rose-200"
                  >
                    +30m
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Escape Button */}
        <div className="pt-1">
          <button
            disabled={!allCleared && penaltySecondsLeft > 0}
            onClick={handleEscape}
            className={`w-full py-4 rounded-xl font-display font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              allCleared || penaltySecondsLeft <= 0
                ? 'bg-rose-500 hover:bg-rose-400 text-black shadow-obsidian-glow active:scale-95 animate-bounce'
                : 'bg-zinc-900 text-zinc-600 border border-white/[0.04] cursor-not-allowed'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              {allCleared
                ? '✓ ALL REDEMPTION DRILLS COMPLETE · ESCAPE PENALTY ZONE'
                : `COMPLETE ALL 7 DRILLS TO ESCAPE (${completedCount}/7)`}
            </span>
          </button>
        </div>
      </div>

      {/* Live Timer Modal in Penalty */}
      {activeTimerItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-sm system-card-penalty rounded-3xl p-6 border-rose-500/40 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{activeTimerItem.icon}</span>
                <h3 className="font-display font-bold text-sm text-white">
                  Penalty Session: {activeTimerItem.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setActiveTimerItem(null);
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3">
              <div className="text-5xl font-mono font-bold text-rose-300">
                {formatTimerClock(elapsedSeconds)}
              </div>
              <p className="text-xs text-rose-400/80 font-mono mt-2">
                {activeTimerItem.id === 'plank' ? 'Target: 2 Minutes (120s)' : 'Target: 30 Minutes'}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="px-6 py-2.5 rounded-xl font-display font-bold text-xs bg-rose-500 text-black hover:bg-rose-400 flex items-center space-x-1.5"
              >
                {timerRunning ? <><Pause className="w-3.5 h-3.5" /><span>Pause</span></> : <><Play className="w-3.5 h-3.5 fill-black" /><span>Start</span></>}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setElapsedSeconds(0);
                }}
                className="p-2.5 rounded-xl bg-white/[0.05] text-zinc-400 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              disabled={elapsedSeconds <= 0}
              onClick={handleFinishTimer}
              className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-display font-bold text-xs disabled:opacity-40"
            >
              ✓ Complete Drill & Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
