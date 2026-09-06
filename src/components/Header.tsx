import React from 'react';
import { Volume2, VolumeX, Flame } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const Header: React.FC = () => {
  const { profile, isMuted, toggleMute } = useSystem();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#02040a]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Left: System Badge & Hunter ID */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs shadow-cyan-hairline">
            {profile.rank}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-display text-[11px] tracking-widest text-cyan-400 font-bold uppercase">
                THE SYSTEM
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="text-[12px] text-zinc-300 font-medium leading-tight truncate max-w-[130px]">
              {profile.name}
            </p>
          </div>
        </div>

        {/* Right: Streak & Sound */}
        <div className="flex items-center space-x-2">
          {/* Active Streak */}
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/[0.08] border border-amber-500/25 text-amber-300 text-xs font-mono font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{profile.streakDays}d</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg border transition-all ${
              isMuted
                ? 'bg-zinc-900 border-zinc-800 text-zinc-500'
                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40'
            }`}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
