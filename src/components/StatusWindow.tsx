import React, { useState, useRef } from 'react';
import { 
  Flame, 
  Zap, 
  Eye, 
  Heart, 
  Brain, 
  Award, 
  Edit3, 
  TrendingUp,
  Activity,
  Download,
  Upload,
  Shield,
  FileText,
  Sparkles,
  Skull,
  X
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { AttributeKey } from '../types';
import { getLocalDateKey } from '../utils/dateUtils';

export const StatusWindow: React.FC = () => {
  const { 
    profile, 
    levelProgress,
    attributeProgress,
    updateProfileName, 
    exportData, 
    importData,
    triggerManualPenaltyZone 
  } = useSystem();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editAlias, setEditAlias] = useState(profile.alias);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = () => {
    if (editName.trim()) {
      updateProfileName(editName.trim(), editAlias.trim() || 'Kairos');
    }
    setIsEditingName(false);
  };

  const handleExportDownload = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hunter-system-kairos-backup-${getLocalDateKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = importData(content);
        if (success) {
          setShowBackupModal(false);
        } else {
          alert('Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const attributeList: { 
    key: AttributeKey; 
    label: string; 
    icon: React.ReactNode; 
    desc: string; 
    borderStyle: string;
    barColor: string;
    textColor: string;
  }[] = [
    {
      key: 'str',
      label: 'STRENGTH (STR)',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      desc: 'Trained by: Push-ups, Squats, Pull-ups',
      borderStyle: 'border-orange-500/25 bg-orange-950/10',
      barColor: 'bg-orange-400',
      textColor: 'text-orange-300',
    },
    {
      key: 'vit',
      label: 'VITALITY (VIT)',
      icon: <Heart className="w-4 h-4 text-rose-400" />,
      desc: 'Trained by: Sit-ups & 5m Plank',
      borderStyle: 'border-rose-500/25 bg-rose-950/10',
      barColor: 'bg-rose-400',
      textColor: 'text-rose-300',
    },
    {
      key: 'agi',
      label: 'AGILITY (AGI)',
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
      desc: 'Trained by: 10,000 Steps & Movement',
      borderStyle: 'border-cyan-500/25 bg-cyan-950/10',
      barColor: 'bg-cyan-400',
      textColor: 'text-cyan-300',
    },
    {
      key: 'int',
      label: 'INTELLIGENCE (INT)',
      icon: <Brain className="w-4 h-4 text-purple-400" />,
      desc: 'Trained by: 1 Hour Focused Study',
      borderStyle: 'border-purple-500/25 bg-purple-950/10',
      barColor: 'bg-purple-400',
      textColor: 'text-purple-300',
    },
    {
      key: 'sen',
      label: 'SENSE (DISCIPLINE)',
      icon: <Eye className="w-4 h-4 text-emerald-400" />,
      desc: 'Trained by: Perfect Day Protocol Clears (7/7)',
      borderStyle: 'border-emerald-500/25 bg-emerald-950/10',
      barColor: 'bg-emerald-400',
      textColor: 'text-emerald-300',
    },
  ];

  const formatPlankTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatStudyTime = (totalMins: number) => {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Holographic Hunter Status Card */}
      <div className="relative rounded-2xl p-4 system-card border-white/[0.08] shadow-obsidian-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-display font-bold text-xs tracking-widest text-cyan-400 uppercase">
              HUNTER STATUS
            </span>
            <span className="text-[10px] uppercase font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
              Rank {profile.rank}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBackupModal(true)}
              className="text-[10px] font-mono font-medium text-zinc-400 hover:text-cyan-300 bg-white/[0.04] px-2 py-1 rounded-lg border border-white/[0.08] flex items-center space-x-1"
              title="Backup & Transfer Data"
            >
              <Download className="w-3 h-3" />
              <span>Sync/Backup</span>
            </button>
            <div className="text-xs font-mono font-bold text-cyan-300">
              LEVEL {levelProgress.currentLevel}
            </div>
          </div>
        </div>

        {/* Hunter Identity & Edit */}
        {isEditingName ? (
          <div className="bg-black/60 p-3 rounded-xl border border-white/10 space-y-2 mb-3">
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase">Hunter Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 font-sans focus:outline-none focus:border-cyan-400"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase">Codename / Alias</label>
              <input
                type="text"
                value={editAlias}
                onChange={e => setEditAlias(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                placeholder="Alias (e.g. Kairos)"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => setIsEditingName(false)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-xs text-zinc-400 hover:bg-white/[0.1]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                className="px-3 py-1 rounded-lg bg-cyan-400 text-black text-xs font-display font-bold hover:bg-cyan-300"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-display font-bold text-lg text-zinc-100 tracking-tight">
                  {profile.name}
                </h1>
                <span className="text-xs font-mono font-medium text-cyan-400">
                  &quot;{profile.alias}&quot;
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-zinc-500 hover:text-cyan-400 transition-colors p-0.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-purple-400 font-medium tracking-wide flex items-center space-x-1 mt-0.5">
                <Award className="w-3.5 h-3.5" />
                <span>{profile.title}</span>
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-xs font-mono font-bold text-amber-400">
                {profile.streakDays}d Streak
              </div>
              <div className="text-[10px] font-mono text-cyan-400/90 flex items-center justify-end space-x-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>{profile.shieldsAvailable} Shield{profile.shieldsAvailable === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Global Hunter XP Bar */}
        <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/[0.04]">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-medium flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>HUNTER LEVEL {levelProgress.currentLevel}</span>
            </span>
            <div className="font-mono text-xs text-right">
              <span className="text-cyan-300 font-bold">{levelProgress.currentLevelXP}</span>
              <span className="text-zinc-500"> / {levelProgress.nextLevelRequiredXP} XP</span>
              <span className="text-zinc-400 ml-1.5 font-normal">({levelProgress.progressPercent}%)</span>
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-blue-500 transition-all duration-300"
              style={{ width: `${levelProgress.progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-0.5">
            <span>Lifetime Global: {levelProgress.totalXP.toLocaleString()} XP</span>
            <span>Next Hunter Level at +{levelProgress.nextLevelRequiredXP - levelProgress.currentLevelXP} XP</span>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL ATTRIBUTE PROGRESS BARS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-xs font-bold tracking-wider text-zinc-300 uppercase flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>INDIVIDUAL ATTRIBUTE LEVELS</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Dynamic Attribute XP</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {attributeList.map(attr => {
            const prog = attributeProgress[attr.key];

            return (
              <div
                key={attr.key}
                className={`p-3.5 rounded-xl border ${attr.borderStyle} space-y-2 transition-all`}
              >
                {/* Header: Icon, Name, and Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-black/40 border border-white/[0.06]">
                      {attr.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-display font-bold text-xs tracking-wider text-zinc-100">
                          {attr.label}
                        </span>
                        <span className={`font-mono font-bold text-xs ${attr.textColor}`}>
                          Lv. {prog.level}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        {attr.desc}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className={attr.textColor}>{prog.currentLevelXP}</span>
                    <span className="text-zinc-500"> / {prog.nextLevelRequiredXP} XP</span>
                    <span className="text-[10px] text-zinc-500 ml-1">({prog.progressPercent}%)</span>
                  </div>
                </div>

                {/* Sub-Level Attribute Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                  <div
                    className={`h-full ${attr.barColor} transition-all duration-300`}
                    style={{ width: `${prog.progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                  <span>Total {attr.key.toUpperCase()} XP: {prog.totalXP.toLocaleString()} XP</span>
                  <span>+{prog.nextLevelRequiredXP - prog.currentLevelXP} XP to Lv. {prog.level + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lifetime Conditioning Records */}
      <div className="system-card p-4 rounded-2xl border-white/[0.08] space-y-3 shadow-obsidian-card">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
          <span className="font-display text-xs font-bold tracking-wider text-cyan-400 flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>LIFETIME CONDITIONING</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Push-ups</div>
            <div className="text-sm font-mono font-bold text-cyan-300 mt-0.5">
              {profile.lifetimePushups.toLocaleString()}
            </div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Squats</div>
            <div className="text-sm font-mono font-bold text-blue-300 mt-0.5">
              {profile.lifetimeSquats.toLocaleString()}
            </div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Sit-ups</div>
            <div className="text-sm font-mono font-bold text-purple-300 mt-0.5">
              {profile.lifetimeSitups.toLocaleString()}
            </div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Pull-ups</div>
            <div className="text-sm font-mono font-bold text-orange-300 mt-0.5">
              {profile.lifetimePullups.toLocaleString()}
            </div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Plank Time</div>
            <div className="text-sm font-mono font-bold text-rose-300 mt-0.5">
              {formatPlankTime(profile.lifetimePlankSeconds)}
            </div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Total Steps</div>
            <div className="text-sm font-mono font-bold text-emerald-300 mt-0.5">
              {profile.lifetimeSteps.toLocaleString()}
            </div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04] col-span-2 sm:col-span-3">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Focused Study Time</div>
            <div className="text-sm font-mono font-bold text-purple-300 mt-0.5">
              {formatStudyTime(profile.lifetimeStudyMinutes)}
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Transfer Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm system-card rounded-2xl p-5 border-cyan-500/30 shadow-obsidian-glow text-left space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-bold text-sm text-zinc-100">
                  Data Backup & Phone Transfer
                </h3>
              </div>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Download Backup File</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Save your progress to a `.json` file to keep safe or move to another device.
              </p>
              <button
                onClick={handleExportDownload}
                className="w-full py-2 mt-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-xs font-display font-bold text-black flex items-center justify-center space-x-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>Download Backup (.json)</span>
              </button>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Restore / Import Backup</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Upload your downloaded file to restore your streak, XP, & lifetime stats.
              </p>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 mt-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono font-medium text-zinc-200 border border-white/10 flex items-center justify-center space-x-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-zinc-400" />
                <span>Choose Backup File to Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
