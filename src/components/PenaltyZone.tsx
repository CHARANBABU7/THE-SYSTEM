import React, { useState, useEffect } from 'react';
import { 
  Skull, 
  Flame, 
  ShieldAlert, 
  Brain, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  X,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSystem } from '../context/SystemContext';
import { PenaltyDrillItem } from '../types';

export const PenaltyZone: React.FC = () => {
  const { 
    penaltyState, 
    updatePenaltyDrillProgress, 
    clearPenaltyZone 
  } = useSystem();

  // Scroller Modal State in Penalty
  const [activeModalItem, setActiveModalItem] = useState<PenaltyDrillItem | null>(null);
  const [sliderAmount, setSliderAmount] = useState<number>(5);

  // Live Stopwatch / Focus state for Plank & Study
  const [activeTimerItem, setActiveTimerItem] = useState<PenaltyDrillItem | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handleFinishTimer = () => {
    if (!activeTimerItem || elapsedSeconds <= 0) return;

    if (activeTimerItem.id === 'plank') {
      updatePenaltyDrillProgress('plank', elapsedSeconds);
    } else if (activeTimerItem.id === 'study') {
      const mins = Math.max(1, Math.round(elapsedSeconds / 60));
      updatePenaltyDrillProgress('study', mins);
    }

    setTimerRunning(false);
    setActiveTimerItem(null);
    setElapsedSeconds(0);
  };

  const handleOpenAddModal = (item: PenaltyDrillItem) => {
    setActiveModalItem(item);
    const remaining = Math.max(1, item.target - item.current);
    if (item.id === 'steps') {
      setSliderAmount(Math.min(500, remaining));
    } else if (item.id === 'plank') {
      setSliderAmount(Math.min(30, remaining));
    } else if (item.id === 'study') {
      setSliderAmount(Math.min(5, remaining));
    } else {
      setSliderAmount(Math.min(5, remaining));
    }
  };

  const handleApplyProgress = (amount: number) => {
    if (!activeModalItem || amount <= 0) return;
    updatePenaltyDrillProgress(activeModalItem.id, amount);
    setActiveModalItem(null);
  };

  const completedCount = penaltyState.drills.filter(i => i.current >= i.target).length;
  const allCleared = completedCount === penaltyState.drills.length;
  const canEscape = allCleared;

  const handleEscape = () => {
    if (!canEscape) return;
    confetti({
      particleCount: 100,
      spread: 70,
      colors: ['#f43f5e', '#fb7185', '#00f0ff'],
    });
    clearPenaltyZone();
  };

  const formatProgressDisplay = (item: PenaltyDrillItem) => {
    if (item.id === 'plank') {
      const m = Math.floor(item.current / 60);
      const s = item.current % 60;
      return `${m}m ${s}s / 2m`;
    }
    if (item.id === 'study') {
      return `${item.current}m / 18m`;
    }
    return `${item.current.toLocaleString()} / ${item.target.toLocaleString()} ${item.unit}`;
  };

  const formatTimerClock = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const physicalItems = penaltyState.drills.filter(i => i.category === 'physical');
  const disciplineItems = penaltyState.drills.filter(i => i.category === 'discipline');

  const getSliderConfig = (item: PenaltyDrillItem) => {
    if (item.id === 'steps') {
      return { min: 100, max: 2000, step: 100, smallStep: 100, largeStep: 500 };
    }
    if (item.id === 'plank') {
      return { min: 5, max: 120, step: 5, smallStep: 5, largeStep: 15 };
    }
    if (item.id === 'study') {
      return { min: 1, max: 18, step: 1, smallStep: 1, largeStep: 5 };
    }
    return { min: 1, max: item.target, step: 1, smallStep: 1, largeStep: 5 };
  };

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
            You failed to complete your daily quest. Complete all 7 redemption drills to restore your system. There is no passive escape.
          </p>

          {/* Progress Counter */}
          <div className="grid grid-cols-2 gap-2 bg-black/60 p-2.5 rounded-xl border border-rose-900/40">
            <div className="text-left">
              <div className="text-[9px] font-mono text-rose-400/80 uppercase">Redemption Mode</div>
              <div className="text-xs font-mono font-bold text-rose-400 flex items-center space-x-1 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping mr-1" />
                <span>DRILLS ONLY</span>
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

                  {/* Clean Action Controls */}
                  <div className="flex items-center justify-between gap-1.5 pt-0.5">
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
                          onClick={() => handleOpenAddModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs font-mono text-rose-200 ml-auto flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3 text-rose-400" />
                          <span>Log Time</span>
                        </button>
                      </>
                    ) : item.id === 'steps' ? (
                      <button
                        onClick={() => handleOpenAddModal(item)}
                        className="w-full py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                      >
                        <Plus className="w-3 h-3 text-rose-400" />
                        <span>Log Steps</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenAddModal(item)}
                        className="w-full py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                      >
                        <Plus className="w-3 h-3 text-rose-400" />
                        <span>Log Reps</span>
                      </button>
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

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveTimerItem(item);
                      setElapsedSeconds(0);
                      setTimerRunning(false);
                    }}
                    className="flex-1 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-xs font-semibold flex items-center justify-center space-x-1"
                  >
                    <Timer className="w-3 h-3 text-rose-400" />
                    <span>Focus Timer (18m)</span>
                  </button>

                  <button
                    onClick={() => handleOpenAddModal(item)}
                    className="px-3 py-1 rounded-lg bg-white/[0.05] text-xs font-mono text-rose-200 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3 text-rose-400" />
                    <span>Log Time</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Escape Button */}
        <div className="pt-1">
          <button
            disabled={!canEscape}
            onClick={handleEscape}
            className={`w-full py-4 rounded-xl font-display font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              canEscape
                ? 'bg-rose-500 hover:bg-rose-400 text-black shadow-obsidian-glow active:scale-95 animate-bounce'
                : 'bg-zinc-900 text-zinc-600 border border-white/[0.04] cursor-not-allowed'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              {allCleared
                ? '✓ ALL 7 REDEMPTION DRILLS COMPLETE · ESCAPE PENALTY ZONE'
                : `COMPLETE ALL 7 DRILLS TO ESCAPE (${completedCount}/7)`}
            </span>
          </button>
        </div>
      </div>

      {/* Live Timer Modal in Penalty (Plank & Study) */}
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
                {activeTimerItem.id === 'plank' ? 'Target: 2 Minutes (120s)' : 'Target: 18 Minutes (18m)'}
              </p>
            </div>

            {/* Timer Controls: Start / Pause and Reset */}
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-6 py-2.5 rounded-xl font-display font-bold text-xs flex items-center space-x-1.5 transition-all ${
                  timerRunning
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : 'bg-rose-500 text-black hover:bg-rose-400 shadow-obsidian-glow'
                }`}
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Start Session</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setElapsedSeconds(0);
                }}
                className="p-2.5 rounded-xl bg-white/[0.05] text-zinc-400 hover:text-white border border-white/[0.08]"
                title="Reset Stopwatch"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              disabled={elapsedSeconds <= 0}
              onClick={handleFinishTimer}
              className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-display font-bold text-xs disabled:opacity-40 active:scale-95 transition-all"
            >
              ✓ Complete Drill & Log ({Math.max(1, Math.round(elapsedSeconds / 60))}m)
            </button>
          </div>
        </div>
      )}

      {/* Touch Scroller Modal for Penalty Drills */}
      {activeModalItem && (() => {
        const config = getSliderConfig(activeModalItem);
        const unitLabel = activeModalItem.id === 'plank' 
          ? 'secs' 
          : activeModalItem.id === 'study' 
          ? 'mins' 
          : activeModalItem.unit;

        return (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-sm system-card-penalty rounded-3xl p-6 border-rose-500/40 text-center space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-rose-900/40 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{activeModalItem.icon}</span>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-sm text-white">
                      Log {activeModalItem.name}
                    </h3>
                    <span className="text-[10px] font-mono text-rose-400">
                      Current: {formatProgressDisplay(activeModalItem)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Big Glowing Value Readout with Direct Custom Input */}
              <div className="py-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400">
                  Amount to Add
                </span>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <span className="text-3xl font-mono font-bold text-rose-400/70">+</span>
                  <input
                    type="number"
                    min={config.min}
                    value={sliderAmount === 0 ? '' : sliderAmount}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                      setSliderAmount(val);
                    }}
                    className="w-36 bg-black/60 border border-rose-500/40 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 text-center text-4xl font-mono font-bold text-rose-300 rounded-2xl py-1 px-2 focus:outline-none transition-all shadow-inner"
                    placeholder="0"
                  />
                  <span className="text-sm font-mono font-medium text-rose-400/80 uppercase">
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
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />

                {/* Fine-Tuning Precision Steppers */}
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => Math.max(config.min, (prev || 0) - config.largeStep))}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] text-xs font-mono text-zinc-400 border border-white/[0.06] active:scale-95"
                  >
                    -{config.largeStep}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => Math.max(config.min, (prev || 0) - config.smallStep))}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] text-xs font-mono text-zinc-400 border border-white/[0.06] active:scale-95"
                  >
                    -{config.smallStep}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => (prev || 0) + config.smallStep)}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] text-xs font-mono text-rose-200 border border-white/[0.06] active:scale-95"
                  >
                    +{config.smallStep}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSliderAmount(prev => (prev || 0) + config.largeStep)}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.04] text-xs font-mono text-rose-200 border border-white/[0.06] active:scale-95"
                  >
                    +{config.largeStep}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-xs text-zinc-400 font-medium hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyProgress(sliderAmount)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-xs font-display font-bold text-black shadow-obsidian-glow transition-all active:scale-95"
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
