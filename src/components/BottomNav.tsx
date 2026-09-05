import React from 'react';
import { 
  User, 
  Flame, 
  Calendar 
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { TabType } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, dailyQuest } = useSystem();

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'quest',
      label: 'DAILY QUEST',
      icon: <Flame className="w-5 h-5" />,
      badge: dailyQuest.isAllCompleted && !dailyQuest.completionBonusClaimed ? '!' : undefined,
    },
    {
      id: 'status',
      label: 'STATUS',
      icon: <User className="w-5 h-5" />,
    },
    {
      id: 'history',
      label: 'LOG',
      icon: <Calendar className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#02040a]/90 backdrop-blur-xl border-t border-white/[0.06] px-4 py-2 max-w-lg mx-auto">
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center py-1 px-4 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {/* Active Indicator Top Glow Line */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-0.5 bg-cyan-400 rounded-full shadow-cyan-hairline" />
              )}

              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-cyan-400 text-black font-mono font-bold text-[9px] rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-display font-semibold tracking-wider mt-1 ${
                isActive ? 'text-cyan-400 font-bold' : 'text-zinc-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};