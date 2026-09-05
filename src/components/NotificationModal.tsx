import React, { useEffect } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, Flame, Gift } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const NotificationModal: React.FC = () => {
  const { notifications, dismissNotification } = useSystem();

  const topNotification = notifications.length > 0 ? notifications[0] : null;

  // Auto-dismiss after 4.5 seconds
  useEffect(() => {
    if (!topNotification) return;

    const timer = setTimeout(() => {
      dismissNotification(topNotification.id);
    }, 4500);

    return () => clearTimeout(timer);
  }, [topNotification, dismissNotification]);

  if (!topNotification) return null;

  const getIcon = () => {
    switch (topNotification.type) {
      case 'levelup': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'reward': return <Gift className="w-4 h-4 text-cyan-400" />;
      case 'penalty': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'quest': return <Flame className="w-4 h-4 text-cyan-400" />;
      default: return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getStyle = () => {
    switch (topNotification.type) {
      case 'levelup': return 'border-amber-500/30 system-card-gold shadow-obsidian-card';
      case 'penalty': return 'border-rose-500/40 system-card-penalty shadow-obsidian-card';
      case 'reward': return 'border-cyan-500/30 system-card shadow-obsidian-card';
      default: return 'border-white/[0.1] system-card shadow-obsidian-card';
    }
  };

  return (
    <div className="fixed top-3 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-top-3 duration-200 pointer-events-auto">
      <div className={`p-3 rounded-2xl border ${getStyle()} flex items-start justify-between space-x-2.5 backdrop-blur-xl shadow-2xl`}>
        <div className="flex items-start space-x-2.5 flex-1 min-w-0">
          <div className="p-1.5 rounded-xl bg-black/60 border border-white/10 mt-0.5 flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                SYSTEM NOTIFICATION
              </span>
              <span className="text-[9px] font-mono text-zinc-500">{topNotification.timestamp}</span>
            </div>
            <h4 className="font-display font-bold text-xs text-zinc-100 mt-0.5 truncate">
              {topNotification.title}
            </h4>
            <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
              {topNotification.message}
            </p>
          </div>
        </div>

        <button
          onClick={() => dismissNotification(topNotification.id)}
          className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
