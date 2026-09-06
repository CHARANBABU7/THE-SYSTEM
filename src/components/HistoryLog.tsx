import React, { useState } from 'react';
import { Calendar, CheckCircle2, Flame, Award, Shield, Sparkles } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { getLocalDateKey } from '../utils/dateUtils';

export const HistoryLog: React.FC = () => {
  const { history, profile, dailyQuest } = useSystem();
  const [selectedDateLog, setSelectedDateLog] = useState<string | null>(null);

  const formatPlankTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  const formatStudyTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hours}h ${m}m`;
  };

  // Generate Current Month Days
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const monthName = now.toLocaleString('default', { month: 'long' });
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  const startOffset = (firstDayIndex + 6) % 7; // Convert to Mon = 0

  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const todayStr = getLocalDateKey(now);

  const getDayStatus = (dayNum: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const log = history.find(h => h.date === dateStr);

    if (log?.isRestDay) return { type: 'rest', log };
    if (log?.completed) return { type: 'completed', log };
    if (dateStr === todayStr) {
      return { type: dailyQuest.isAllCompleted ? 'completed' : 'today', log: null };
    }
    return { type: 'empty', log: null };
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Discipline Stats Overview */}
      <div className="system-card p-4 rounded-2xl border-white/[0.08] shadow-obsidian-card">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3">
          <span className="font-display font-bold text-xs tracking-widest text-cyan-400 uppercase">
            DISCIPLINE & STREAKS
          </span>
          <span className="text-[10px] uppercase font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {profile.streakDays} Day Streak
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[9px] uppercase font-mono text-zinc-500">Days Cleared</div>
            <div className="text-base font-mono font-bold text-zinc-100 mt-0.5">
              {profile.totalDailyQuestsCompleted}
            </div>
          </div>
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[9px] uppercase font-mono text-zinc-500">Best Streak</div>
            <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
              {profile.bestStreak}d
            </div>
          </div>
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[9px] uppercase font-mono text-zinc-500">Shields</div>
            <div className="text-base font-mono font-bold text-cyan-300 mt-0.5 flex items-center justify-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>{profile.shieldsAvailable}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MONTHLY CONSISTENCY HEATMAP */}
      <div className="system-card p-4 rounded-2xl border-white/[0.08] space-y-3 shadow-obsidian-card">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-display font-bold text-xs tracking-wider text-zinc-200 uppercase">
              {monthName} {year} Heatmap
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {history.filter(h => h.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length} / {totalDaysInMonth} Days
          </span>
        </div>

        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-500 pb-1">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>

        {/* Calendar Grid Tiles */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {/* Offset leading empty tiles */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <div key={`offset-${idx}`} className="h-8 rounded-lg bg-transparent" />
          ))}

          {/* Actual days */}
          {daysArray.map(dayNum => {
            const { type, log } = getDayStatus(dayNum);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = selectedDateLog === dateStr;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDateLog(log ? dateStr : null)}
                className={`h-8 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-all ${
                  type === 'completed'
                    ? 'bg-cyan-400 text-black font-bold shadow-cyan-hairline'
                    : type === 'rest'
                    ? 'bg-amber-400 text-black font-bold'
                    : type === 'today'
                    ? 'border border-cyan-400/60 bg-cyan-950/40 text-cyan-300 font-bold animate-pulse'
                    : 'bg-white/[0.03] text-zinc-600 hover:bg-white/[0.06]'
                } ${isSelected ? 'ring-2 ring-white scale-105' : ''}`}
                title={`${dateStr}: ${type}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 pt-1 text-[10px] font-mono text-zinc-500">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
            <span>Cleared</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-400" />
            <span>Rest Day</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded border border-cyan-400 bg-cyan-950/40" />
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Selected Day Breakdown (if tapped) */}
      {selectedDateLog && (
        <div className="p-3.5 rounded-2xl system-card border-cyan-500/30 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-xs text-cyan-300">
              Log Details: {selectedDateLog}
            </span>
            <button
              onClick={() => setSelectedDateLog(null)}
              className="text-zinc-500 hover:text-white text-xs font-mono"
            >
              Close
            </button>
          </div>
          {(() => {
            const entry = history.find(h => h.date === selectedDateLog);
            if (!entry) return <p className="text-xs text-zinc-500 font-mono">No data logged.</p>;
            if (entry.isRestDay) return <p className="text-xs text-amber-300 font-mono">Monarch Aegis Rest & Recovery Day.</p>;

            return (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-center text-[10px] bg-black/40 p-2 rounded-xl border border-white/[0.04] font-mono">
                <div><div className="text-zinc-500">Push</div><div className="font-bold text-cyan-300">{entry.pushups}</div></div>
                <div><div className="text-zinc-500">Squat</div><div className="font-bold text-blue-300">{entry.squats}</div></div>
                <div><div className="text-zinc-500">Situp</div><div className="font-bold text-purple-300">{entry.situps}</div></div>
                <div><div className="text-zinc-500">Pull</div><div className="font-bold text-orange-300">{entry.pullups}</div></div>
                <div><div className="text-zinc-500">Plank</div><div className="font-bold text-rose-300">{formatPlankTime(entry.plankSeconds)}</div></div>
                <div><div className="text-zinc-500">Steps</div><div className="font-bold text-emerald-300">{entry.steps}</div></div>
                <div><div className="text-zinc-500">Study</div><div className="font-bold text-purple-300">{formatStudyTime(entry.studyMinutes)}</div></div>
              </div>
            );
          })()}
        </div>
      )}

      {/* History Log List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-xs font-bold tracking-wider text-zinc-300 uppercase">
            RECENT DAILY LOGS
          </span>
        </div>

        {history.length === 0 ? (
          <div className="system-card p-5 rounded-2xl text-center text-zinc-500 text-xs font-mono border-white/[0.06]">
            No completed logs yet. Finish all 7 quests today to record your first tile!
          </div>
        ) : (
          history.slice(0, 10).map(entry => (
            <div
              key={entry.date}
              className="p-3.5 rounded-2xl system-card border-white/[0.06] space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono font-bold text-xs text-zinc-100">
                    {entry.date}
                  </span>
                </div>
                {entry.isRestDay ? (
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    REST DAY
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    CLEARED
                  </span>
                )}
              </div>

              {!entry.isRestDay && (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-center text-[10px] bg-black/40 p-2 rounded-xl border border-white/[0.04] font-mono">
                  <div><div className="text-zinc-500">Push</div><div className="font-bold text-cyan-300">{entry.pushups}</div></div>
                  <div><div className="text-zinc-500">Squat</div><div className="font-bold text-blue-300">{entry.squats}</div></div>
                  <div><div className="text-zinc-500">Situp</div><div className="font-bold text-purple-300">{entry.situps}</div></div>
                  <div><div className="text-zinc-500">Pull</div><div className="font-bold text-orange-300">{entry.pullups}</div></div>
                  <div><div className="text-zinc-500">Plank</div><div className="font-bold text-rose-300">{formatPlankTime(entry.plankSeconds)}</div></div>
                  <div><div className="text-zinc-500">Steps</div><div className="font-bold text-emerald-300">{entry.steps}</div></div>
                  <div><div className="text-zinc-500">Study</div><div className="font-bold text-purple-300">{formatStudyTime(entry.studyMinutes)}</div></div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
