import React, { useEffect, useState } from 'react';
import { useGrimoireStore } from './store/useGrimoireStore';
import { EditorView } from './components/EditorView';
import { MapView } from './components/MapView';
import { GraphView } from './components/GraphView';
import { TimelineView } from './components/TimelineView';
import { CampaignTracker } from './components/CampaignTracker';
import { SessionView } from './components/SessionView';
import { ReaderView } from './components/ReaderView';
import { CommandPalette } from './components/CommandPalette';
import { VaultSettingsModal } from './components/VaultSettingsModal';
import { DiceRoller } from './components/DiceRoller';
import { FileOrganizerTree } from './components/FileOrganizerTree';
import { PlayerDisplayWindow } from './components/PlayerDisplayWindow';
import { SettingsDrawer } from './components/SettingsDrawer';
import { 
  FileSpreadsheet, 
  Images, 
  LayoutGrid, 
  Calendar, 
  Swords, 
  Tv, 
  Settings, 
  ChevronDown, 
  Clock, 
  Radio, 
  BookOpen,
  Volume2
} from 'lucide-react';

export default function App() {
  const { 
    init, 
    currentWorld, 
    activeView, 
    setActiveView 
  } = useGrimoireStore();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Dual-display / popout check
  const isPlayerWindow = new URLSearchParams(window.location.search).get('player') === 'true';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    init().catch(err => console.error("Initialization error:", err));
  }, [init]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (isPlayerWindow) {
    return <PlayerDisplayWindow />;
  }

  if (activeView === 'reader') {
    return <ReaderView />;
  }

  const handleOpenPlayerDisplay = () => {
    const playerUrl = `${window.location.origin}${window.location.pathname}?player=true`;
    window.open(playerUrl, 'GrimoirePlayerDisplay', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--vvd-bg-dark)] text-slate-100 font-sans select-none relative">
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center filter blur-3xl scale-110"
        style={{
          backgroundImage: `radial-gradient(circle at 60% 40%, #1a324b 0%, #0d1722 60%, #060a10 100%)`
        }}
      />

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <VaultSettingsModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <DiceRoller />

      {/* Top Streamlined Header */}
      <header 
        className="h-10 px-3 flex items-center justify-between border-b backdrop-blur-md z-30 shrink-0 text-xs"
        style={{ 
          backgroundColor: 'var(--vvd-bg-panel)',
          borderColor: 'var(--vvd-border)'
        }}
      >
        {/* Left: World Switcher */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsVaultOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg border hover:border-white/20 transition-all font-medium text-slate-200"
            style={{ 
              backgroundColor: 'var(--vvd-bg-surface)',
              borderColor: 'var(--vvd-border)'
            }}
          >
            <span 
              className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: 'rgba(200, 150, 62, 0.2)', color: 'var(--vvd-gold)' }}
            >
              {currentWorld?.name?.charAt(0) || 'G'}
            </span>
            <span className="max-w-[140px] truncate">{currentWorld?.name || 'Grimoire Vault'}</span>
            <ChevronDown size={11} className="text-slate-500" />
          </button>
        </div>

        {/* Right: Quick Triggers, Broadcast, Time, Settings */}
        <div className="flex items-center gap-2.5 text-slate-400 text-[11px]">
          <button 
            onClick={handleOpenPlayerDisplay}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 transition-colors font-medium shadow-sm"
            title="Launch Player Display popout window"
          >
            <Radio size={12} className="animate-pulse text-sky-400" />
            <span>Player Broadcast</span>
          </button>

          <button 
            onClick={() => setActiveView('reader')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:text-slate-200 hover:bg-white/5 transition-colors"
            title="Player-facing Wiki Reader"
          >
            <BookOpen size={12} />
            <span>Reader</span>
          </button>

          <div className="h-3.5 w-[1px] bg-white/10" />

          <span className="text-slate-300 font-mono flex items-center gap-1.5 px-1">
            <Clock size={11} className="opacity-60" /> {currentTime}
          </span>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Workspace Settings & Colors"
          >
            <Settings size={14} />
          </button>
        </div>
      </header>

      {/* Main Workstation Layout */}
      <div className="flex-1 flex overflow-hidden z-20">
        {/* Far-Left Master Rail */}
        <div 
          className="w-11 border-r flex flex-col justify-between items-center py-3 shrink-0"
          style={{ 
            backgroundColor: 'var(--vvd-bg-dark)',
            borderColor: 'var(--vvd-border)'
          }}
        >
          <div 
            className="w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-bold shadow-sm"
            style={{ 
              borderColor: 'var(--vvd-gold)', 
              color: 'var(--vvd-gold)',
              backgroundColor: 'rgba(200, 150, 62, 0.1)'
            }}
          >
            G
          </div>

          <div className="flex flex-col items-center gap-3.5 text-slate-500">
            <button 
              onClick={() => setActiveView('editor')} 
              className={`p-1.5 rounded-lg transition-colors ${activeView === 'editor' ? 'text-amber-400 bg-white/5' : 'hover:text-slate-300'}`} 
              title="Codex Notes & Archetypes"
            >
              <FileSpreadsheet size={16} />
            </button>
            <button 
              onClick={() => setActiveView('map')} 
              className={`p-1.5 rounded-lg transition-colors ${activeView === 'map' ? 'text-blue-400 bg-white/5' : 'hover:text-slate-300'}`} 
              title="Tactical Battlemap & World Atlas"
            >
              <Images size={16} />
            </button>
            <button 
              onClick={() => setActiveView('graph')} 
              className={`p-1.5 rounded-lg transition-colors ${activeView === 'graph' ? 'text-purple-400 bg-white/5' : 'hover:text-slate-300'}`} 
              title="Nexus Graph"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setActiveView('timeline')} 
              className={`p-1.5 rounded-lg transition-colors ${activeView === 'timeline' ? 'text-emerald-400 bg-white/5' : 'hover:text-slate-300'}`} 
              title="Chronicles & Timelines"
            >
              <Calendar size={16} />
            </button>
            <button 
              onClick={() => setActiveView('combat')} 
              className={`p-1.5 rounded-lg transition-colors ${activeView === 'combat' ? 'text-red-400 bg-white/5' : 'hover:text-red-400'}`} 
              title="Encounter & Combat Tracker"
            >
              <Swords size={16} />
            </button>
            <button 
              onClick={() => setActiveView('sessions')} 
              className={`p-1.5 rounded-lg transition-colors ${activeView === 'sessions' ? 'text-yellow-400 bg-white/5' : 'hover:text-yellow-400'}`} 
              title="Session Cockpit & Notes"
            >
              <Tv size={16} />
            </button>
          </div>

          <button 
            onClick={() => setIsVaultOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
            title="Vault Backups & Archive"
          >
            <Volume2 size={16} />
          </button>
        </div>

        {/* Tree Sidebar */}
        <aside 
          className="w-64 border-r flex flex-col justify-between shrink-0"
          style={{ 
            backgroundColor: 'var(--vvd-bg-panel)',
            borderColor: 'var(--vvd-border)'
          }}
        >
          <FileOrganizerTree />
        </aside>

        {/* Main Work Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative">
          {activeView === 'editor' && <EditorView />}
          {activeView === 'map' && <MapView />}
          {activeView === 'graph' && <GraphView />}
          {activeView === 'timeline' && <TimelineView />}
          {activeView === 'combat' && <CampaignTracker />}
          {activeView === 'sessions' && <SessionView />}
        </main>
      </div>
    </div>
  );
}
