import React from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { Header } from './components/Header';
import { StatusWindow } from './components/StatusWindow';
import { DailyQuest } from './components/DailyQuest';
import { HistoryLog } from './components/HistoryLog';
import { BottomNav } from './components/BottomNav';
import { PenaltyZone } from './components/PenaltyZone';
import { NotificationModal } from './components/NotificationModal';

const AppContent: React.FC = () => {
  const { activeTab, penaltyActive } = useSystem();

  return (
    <div className="relative min-h-screen bg-[#040711] text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Background Subtle Tech Grid & Scanline */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />
      <div className="fixed inset-0 pointer-events-none scanline-overlay z-0 opacity-40" />

      {/* Main App Container */}
      <div className="relative z-10 flex flex-col min-h-screen max-w-lg mx-auto w-full px-4 pt-2">
        <Header />
        <NotificationModal />

        <main className="flex-1 mt-4">
          {activeTab === 'quest' && <DailyQuest />}
          {activeTab === 'status' && <StatusWindow />}
          {activeTab === 'history' && <HistoryLog />}
        </main>

        <BottomNav />
      </div>

      {/* Penalty Zone Emergency Overlay */}
      {penaltyActive && <PenaltyZone />}
    </div>
  );
};

export function App() {
  return (
    <SystemProvider>
      <AppContent />
    </SystemProvider>
  );
}

export default App;
