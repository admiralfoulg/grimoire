import React, { useEffect, useState } from 'react';
import { useGrimoireStore } from './store/useGrimoireStore';
import { EditorView } from './components/EditorView';
import { MapView } from './components/MapView';
import { GraphView } from './components/GraphView';
import { TimelineView } from './components/TimelineView';
import { CampaignTracker } from './components/CampaignTracker';
import { SessionView } from './components/SessionView';
import { SoundboardView } from './components/SoundboardView';
import { ReaderView } from './components/ReaderView';
import { CommandPalette } from './components/CommandPalette';
import { VaultSettingsModal } from './components/VaultSettingsModal';
import { GeneratorModal } from './components/GeneratorModal';
import { DiceRoller } from './components/DiceRoller';
import { FileOrganizerTree } from './components/FileOrganizerTree';
import { 
  ChevronDown, 
  Map as MapIcon, 
  Network, 
  Clock, 
  FileSpreadsheet, 
  Images, 
  ChevronUp, 
  Calendar, 
  Swords, 
  Eye, 
  BookMarked,
  Volume2,
  Sparkles,
  Globe,
  Plus,
  Check
} from 'lucide-react';

export default function App() {
  const { 
    init, 
    currentWorld, 
    worlds, 
    activeView, 
    setActiveView,
    createWorld,
    selectWorld
  } = useGrimoireStore();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isCampaignDrawerOpen, setIsCampaignDrawerOpen] = useState(false);
  const [newWorldName, setNewWorldName] = useState('');
  const [isCreatingWorld, setIsCreatingWorld] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

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

  const handleCreateWorldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorldName.trim()) return;
    createWorld(newWorldName.trim(), 'Fantasy');
    setNewWorldName('');
    setIsCreatingWorld(false);
  };

  if (activeView === 'reader') {
    return <ReaderView />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0f17] text-slate-100 font-sans select-none relative">
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none bg-cover bg-center filter blur-3xl scale-110"
        style={{
          backgroundImage: `radial-gradient(circle at 60% 40%, #1a324b 0%, #0d1722 60%, #060a10 100%)`
        }}
      />

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <VaultSettingsModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
      <GeneratorModal isOpen={isGeneratorOpen} onClose={() => setIsGeneratorOpen(false)} />
      <DiceRoller />

      {/* Top Header */}
      <header className="h-10 px-3 flex items-center justify-between border-b border-white/5 bg-[#0d121b]/80 backdrop-blur-md z-30 shrink-0 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsVaultOpen(true)}
            className="w-5 h-5 rounded-md bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 hover:border-amber-400 text-amber-300 flex items-center justify-center text-[10px] font-extrabold shadow-sm transition-all cursor-pointer group"
            title="Campaign Vault: Upload, Import, Export, or Obsidian Sync"
          >
            <span className="group-hover:scale-110 transition-transform">
              {currentWorld?.name.charAt(0) || 'T'}
            </span>
          </button>

          <button 
            onClick={() => setIsCampaignDrawerOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#18212e] border border-white/10 hover:border-white/20 transition-colors text-slate-200 font-medium"
            title="Switch Campaign / Realm"
          >
            <span>{currentWorld?.name || 'The First Realm'}</span>
            <ChevronDown size={11} className="text-slate-500" />
          </button>

          <button 
            onClick={() => setActiveView('map')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'map' ? 'bg-[#1e2736] text-white border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon size={12} />
            <span>World</span>
          </button>

          <button 
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'editor' ? 'bg-[#1e2736] text-white border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px] text-slate-500 font-mono">W</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Character</span>
          </button>

          <button 
            onClick={() => setActiveView('graph')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'graph' ? 'bg-[#1e2736] text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network size={12} className="text-purple-400" />
            <span>Nexus</span>
          </button>

          <button 
            onClick={() => setActiveView('timeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'timeline' ? 'bg-[#1e2736] text-white border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar size={12} />
            <span>Timeline</span>
          </button>

          <button 
            onClick={() => setActiveView('combat')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'combat' ? 'bg-[#1e2736] text-white border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords size={12} className="text-red-400" />
            <span>Combat</span>
          </button>

          <button 
            onClick={() => setActiveView('sessions')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'sessions' ? 'bg-[#1e2736] text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookMarked size={12} className="text-amber-400" />
            <span>Sessions</span>
          </button>

          <button 
            onClick={() => setActiveView('soundboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'soundboard' ? 'bg-[#1e2736] text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 size={12} className="text-cyan-400" />
            <span>Audio</span>
          </button>

          <button 
            onClick={() => setIsGeneratorOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition-colors"
            title="Instant DM Sparks, NPCs, Taverns & Oracles"
          >
            <Sparkles size={12} />
            <span>Sparks</span>
          </button>

          <button 
            onClick={() => setActiveView('reader')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 border border-transparent hover:border-amber-500/30 transition-colors"
            title="Open Wiki Reader Mode"
          >
            <Eye size={12} />
            <span>Reader</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="text-slate-300 font-mono flex items-center gap-1.5">
            <Clock size={11} className="opacity-60" /> {currentTime}
          </span>
        </div>
      </header>

      {/* Main Workstation Layout */}
      <div className="flex-1 flex overflow-hidden z-20 relative">

        {/* Far-Left Vertical Rail */}
        <div className="w-10 bg-[#0d121a]/90 border-r border-white/5 flex flex-col justify-between items-center py-3 shrink-0 z-30">
          <button 
            onClick={() => setIsCampaignDrawerOpen(prev => !prev)}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer group ${
              isCampaignDrawerOpen 
                ? 'bg-amber-500/30 border-amber-500 shadow-md shadow-amber-500/20' 
                : 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60'
            }`}
            title="All Campaigns & Realms"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform shadow-sm shadow-amber-400" />
          </button>

          <div className="flex flex-col items-center gap-3 text-slate-500">
            <button onClick={() => setActiveView('editor')} className={`hover:text-slate-300 ${activeView === 'editor' ? 'text-amber-400' : ''}`} title="Codex Documents">
              <FileSpreadsheet size={15} />
            </button>
            <button onClick={() => setActiveView('map')} className={`hover:text-slate-300 ${activeView === 'map' ? 'text-blue-400' : ''}`} title="Atlas Maps">
              <Images size={15} />
            </button>
            <button onClick={() => setActiveView('graph')} className={`hover:text-purple-300 ${activeView === 'graph' ? 'text-purple-400' : ''}`} title="Nexus Graph">
              <Network size={15} />
            </button>
            <button onClick={() => setActiveView('timeline')} className={`hover:text-slate-300 ${activeView === 'timeline' ? 'text-emerald-400' : ''}`} title="Timeline Eras">
              <Calendar size={15} />
            </button>
            <button onClick={() => setActiveView('combat')} className={`hover:text-red-400 ${activeView === 'combat' ? 'text-red-400' : ''}`} title="Encounter Tracker">
              <Swords size={15} />
            </button>
            <button onClick={() => setActiveView('sessions')} className={`hover:text-amber-400 ${activeView === 'sessions' ? 'text-amber-400' : ''}`} title="Live Sessions">
              <BookMarked size={15} />
            </button>
            <button onClick={() => setActiveView('soundboard')} className={`hover:text-cyan-400 ${activeView === 'soundboard' ? 'text-cyan-400' : ''}`} title="Audio Soundboard">
              <Volume2 size={15} />
            </button>
            <button onClick={() => setIsGeneratorOpen(true)} className="hover:text-amber-400 text-amber-400/70" title="DM Spark Tables">
              <Sparkles size={15} />
            </button>
            <button className="hover:text-slate-300 transition-colors"><ChevronUp size={14} /></button>
          </div>
        </div>

        {/* Campaign Realms Drawer */}
        {isCampaignDrawerOpen && (
          <div className="w-64 bg-[#0e141f] border-r border-white/10 flex flex-col justify-between shrink-0 z-20 shadow-2xl">
            <div className="flex flex-col overflow-y-auto">
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Campaign Realms</span>
                </div>
                <button
                  onClick={() => setIsCreatingWorld(true)}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                  title="Create New Campaign"
                >
                  <Plus size={14} />
                </button>
              </div>

              {isCreatingWorld && (
                <form onSubmit={handleCreateWorldSubmit} className="p-3 bg-white/5 border-b border-white/5 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">New Campaign Name</span>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Curse of Strahd..."
                    value={newWorldName}
                    onChange={e => setNewWorldName(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-amber-500/50"
                  />
                  <div className="flex justify-end gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingWorld(false)}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="text-[10px] bg-amber-500 text-black font-semibold px-2 py-1 rounded hover:bg-amber-400"
                    >
                      Create Realm
                    </button>
                  </div>
                </form>
              )}

              <div className="p-2 flex flex-col gap-1 text-xs">
                {worlds.map(w => {
                  const isActive = currentWorld?.id === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        selectWorld(w.id);
                        setIsCampaignDrawerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all group ${
                        isActive
                          ? 'bg-[#18212e] text-amber-300 font-bold border border-amber-500/40 shadow-md'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isActive ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-500'
                        }`}>
                          {w.name.charAt(0)}
                        </span>
                        <div className="truncate">
                          <div className="truncate">{w.name}</div>
                          <div className="text-[9px] text-slate-500 font-normal">Campaign</div>
                        </div>
                      </div>
                      {isActive && <Check size={13} className="text-amber-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => {
                  setIsCampaignDrawerOpen(false);
                  setIsVaultOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
              >
                <span>Campaign Backup & Vault</span>
              </button>
            </div>
          </div>
        )}

        {/* Tree Explorer Drawer */}
        <aside className="w-64 bg-[#10151f]/85 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between shrink-0">
          <FileOrganizerTree />

          <div className="p-2.5 border-t border-white/5 flex items-center justify-between text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-bold">👤</span>
              <span className="text-slate-300 font-medium">trey 7</span>
            </div>
            <button 
              onClick={() => setIsVaultOpen(true)}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline"
            >
              Vault
            </button>
          </div>
        </aside>

        {/* Main Central Workspace */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative">
          {activeView === 'editor' && <EditorView />}
          {activeView === 'map' && <MapView />}
          {activeView === 'graph' && <GraphView />}
          {activeView === 'timeline' && <TimelineView />}
          {activeView === 'combat' && <CampaignTracker />}
          {activeView === 'sessions' && <SessionView />}
          {activeView === 'soundboard' && <SoundboardView />}

          <button 
            onClick={() => setIsVaultOpen(true)}
            className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-[#18212e]/90 hover:bg-[#202c3d] border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs shadow-2xl transition-all"
            title="Help & Vault Settings"
          >
            ?
          </button>
        </main>
      </div>
    </div>
  );
}
