import React, { useEffect, useState, useMemo } from 'react';
import { useGrimoireStore } from './store/useGrimoireStore';
import { ProjectionService } from './services/broadcast';
import { PlayerDisplayWindow } from './components/PlayerDisplayWindow';
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
import { 
  Folder as FolderIcon, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  FolderPlus, 
  Map as MapIcon, 
  Network, 
  Clock, 
  FileSpreadsheet, 
  Images, 
  ChevronUp, 
  Calendar, 
  Swords, 
  Eye, 
  Plus, 
  Trash2, 
  BookMarked,
  Volume2,
  Sparkles,
  Cast,
  Tv
} from 'lucide-react';

export default function App() {
  const isPlayerWindow = new URLSearchParams(window.location.search).get('player') === 'true';

  if (isPlayerWindow) {
    return <PlayerDisplayWindow />;
  }

  const { 
    init, 
    currentWorld, 
    cards, 
    folders,
    maps,
    activeMapId,
    activeView, 
    activeCardId, 
    createCard, 
    createFolder, 
    deleteFolder, 
    setActiveCard, 
    setActiveView 
  } = useGrimoireStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState<'character' | 'location' | 'faction' | 'item' | 'lore'>('character');

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

  const openPlayerWindow = () => {
    window.open(`${window.location.origin}?player=true`, 'GrimoirePlayerWindow', 'width=1280,height=720');
  };

  const projectActiveMap = () => {
    const activeMap = maps.find(m => m.id === activeMapId) || maps[0];
    if (activeMap && activeMap.imageUrl) {
      ProjectionService.project({
        type: 'MAP',
        mapId: activeMap.id,
        imageUrl: activeMap.imageUrl,
        name: activeMap.name
      });
    } else {
      alert("No active map with a valid image is selected to project.");
    }
  };

  const clearProjection = () => {
    ProjectionService.clear();
  };

  const toggleFolder = (folderKey: string) => {
    setCollapsedFolders(prev => ({ ...prev, [folderKey]: !prev[folderKey] }));
  };

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    return cards.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [cards, searchQuery]);

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim(), newFolderCategory);
    setNewFolderName('');
    setIsCreatingFolder(false);
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

      {/* Top VVD Master Bar */}
      <header className="h-10 px-3 flex items-center justify-between border-b border-white/5 bg-[#0d121b]/80 backdrop-blur-md z-30 shrink-0 text-xs">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsVaultOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#18212e] border border-white/10 hover:border-white/20 transition-colors text-slate-200 font-medium"
          >
            <span className="w-4 h-4 rounded bg-amber-500/25 text-amber-300 flex items-center justify-center text-[10px] font-bold">
              {currentWorld?.name.charAt(0) || 'V'}
            </span>
            <span>{currentWorld?.name || 'Voltawic'}</span>
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
            <Sparkles size={12} className="text-amber-400" />
            <span>Sparks</span>
          </button>

          {/* Player TV Window Controls */}
          <div className="flex items-center gap-1 pl-1 ml-1 border-l border-white/10">
            <button
              onClick={openPlayerWindow}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-semibold transition-colors"
              title="Open secondary player screen window (drag to TV/second monitor)"
            >
              <Tv size={12} />
              <span>Player Screen</span>
            </button>

            <button
              onClick={projectActiveMap}
              className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-300 transition-colors"
              title="Project active map to player screen"
            >
              <Cast size={13} />
            </button>

            <button
              onClick={clearProjection}
              className="text-[10px] text-slate-500 hover:text-red-400 px-1 py-0.5"
              title="Blank the player screen"
            >
              Clear
            </button>
          </div>

          <button 
            onClick={() => setActiveView('reader')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 border border-transparent hover:border-amber-500/30 transition-colors ml-1"
            title="Open Wiki Reader Mode"
          >
            <Eye size={12} />
            <span>Reader</span>
          </button>

          <button 
            onClick={() => createCard('New Character', 'character')}
            className="text-slate-500 hover:text-slate-300 px-1 py-1"
            title="Create Card"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <button className="hover:text-slate-200 transition-colors">Feedback</button>
          <span className="text-slate-300 font-mono flex items-center gap-1.5">
            <Clock size={11} className="opacity-60" /> {currentTime}
          </span>
        </div>
      </header>

      {/* Main Workstation Layout */}
      <div className="flex-1 flex overflow-hidden z-20">
        <div className="w-10 bg-[#0d121a]/90 border-r border-white/5 flex flex-col justify-between items-center py-3 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-[11px] font-bold">
            ●
          </div>

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

        {/* Tree Explorer Drawer */}
        <aside className="w-64 bg-[#10151f]/85 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between shrink-0">
          <div className="flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-[#090d14]/90 border border-white/5 rounded-lg px-2.5 py-1.5 focus-within:border-white/20 transition-colors">
                <Search size={13} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search document..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-600 font-sans"
                />
              </div>
              <button 
                onClick={() => setIsCreatingFolder(true)} 
                className="text-slate-500 hover:text-amber-400 p-1"
                title="Create New Folder"
              >
                <FolderPlus size={14} />
              </button>
              <button 
                onClick={() => createCard('New Character', 'character')} 
                className="text-slate-500 hover:text-slate-300 p-1"
                title="Create Card"
              >
                <Plus size={14} />
              </button>
            </div>

            {isCreatingFolder && (
              <form onSubmit={handleCreateFolderSubmit} className="p-3 bg-white/5 border-b border-white/5 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">New Folder</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                />
                <select
                  value={newFolderCategory}
                  onChange={e => setNewFolderCategory(e.target.value as any)}
                  className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 outline-none"
                >
                  <option value="character">Characters</option>
                  <option value="location">Locations</option>
                  <option value="faction">Factions</option>
                  <option value="item">Items</option>
                  <option value="lore">Lore</option>
                </select>
                <div className="flex justify-end gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="text-[10px] text-slate-400 hover:text-white px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-[10px] bg-amber-500 text-black font-semibold px-2 py-1 rounded"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            <div className="p-2 flex flex-col gap-1 text-xs">
              {/* Characters Section */}
              <div className="flex flex-col">
                <div 
                  onClick={() => toggleFolder('root_character')}
                  className="flex items-center justify-between px-2 py-1.5 text-slate-300 hover:text-white cursor-pointer font-medium"
                >
                  <div className="flex items-center gap-2">
                    <FolderIcon size={14} className="text-slate-400" />
                    <span>Characters</span>
                  </div>
                  {collapsedFolders['root_character'] ? <ChevronRight size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                </div>

                {!collapsedFolders['root_character'] && (
                  <div className="ml-2 pl-2 flex flex-col gap-1 border-l border-white/5 mt-0.5">
                    {folders.filter(f => f.category === 'character').map(folder => {
                      const isCollapsed = Boolean(collapsedFolders[folder.id]);
                      const folderCards = filteredCards.filter(c => c.folderId === folder.id);

                      return (
                        <div key={folder.id} className="flex flex-col">
                          <div 
                            className="flex items-center justify-between px-2 py-1 text-slate-400 hover:text-slate-200 cursor-pointer group"
                            onClick={() => toggleFolder(folder.id)}
                          >
                            <div className="flex items-center gap-1.5">
                              {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                              <FolderIcon size={13} className="text-amber-500/70" />
                              <span className="font-medium text-slate-300">{folder.name}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFolder(folder.id);
                              }}
                              className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                              title="Delete Folder"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>

                          {!isCollapsed && (
                            <div className="ml-3 pl-2 flex flex-col gap-0.5 border-l border-white/5 mt-0.5">
                              {folderCards.map(c => {
                                const isActive = activeCardId === c.id && activeView === 'editor';
                                return (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      setActiveCard(c.id);
                                      setActiveView('editor');
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-all ${
                                      isActive
                                        ? 'bg-[#18212e] text-slate-100 font-medium border border-white/10'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                    }`}
                                  >
                                    <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center text-[9px]">👤</span>
                                    <span className="truncate flex-1">{c.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredCards.filter(c => c.type === 'character' && !c.folderId).map(c => {
                      const isActive = activeCardId === c.id && activeView === 'editor';
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setActiveCard(c.id);
                            setActiveView('editor');
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 text-xs transition-all ${
                            isActive
                              ? 'bg-[#18212e] text-slate-100 font-medium shadow-md border border-white/10'
                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                            isActive ? 'bg-amber-500/25 text-amber-300 border border-amber-500/35' : 'bg-white/5 text-slate-500'
                          }`}>
                            👤
                          </span>
                          <span className="truncate flex-1">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Locations Section */}
              <div className="flex flex-col">
                <div 
                  onClick={() => toggleFolder('root_location')}
                  className="flex items-center justify-between px-2 py-1.5 text-slate-400 hover:text-slate-200 cursor-pointer font-medium"
                >
                  <div className="flex items-center gap-2">
                    <FolderIcon size={14} className="text-slate-500" />
                    <span>Locations</span>
                  </div>
                  {collapsedFolders['root_location'] ? <ChevronRight size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                </div>

                {!collapsedFolders['root_location'] && (
                  <div className="ml-2 pl-2 flex flex-col gap-1 border-l border-white/5 mt-0.5">
                    {filteredCards.filter(c => c.type === 'location').map(c => {
                      const isActive = activeCardId === c.id && activeView === 'editor';
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setActiveCard(c.id);
                            setActiveView('editor');
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 text-xs transition-all ${
                            isActive
                              ? 'bg-[#18212e] text-slate-100 font-medium border border-white/10'
                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px]">📍</span>
                          <span className="truncate flex-1">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Nexus Graph Entry */}
              <div 
                onClick={() => setActiveView('graph')} 
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'graph' ? 'bg-[#1e2736] text-purple-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Network size={14} className="text-purple-400" />
                  <span>Nexus Graph</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </div>

              {/* Timeline Entry */}
              <div 
                onClick={() => setActiveView('timeline')} 
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'timeline' ? 'bg-[#1e2736] text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-500" />
                  <span>Timeline & Eras</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </div>

              {/* Combat Entry */}
              <div 
                onClick={() => setActiveView('combat')} 
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'combat' ? 'bg-[#1e2736] text-red-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Swords size={14} className="text-red-400" />
                  <span>Combat & Tracker</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </div>

              {/* Sessions Entry */}
              <div 
                onClick={() => setActiveView('sessions')} 
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'sessions' ? 'bg-[#1e2736] text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookMarked size={14} className="text-amber-400" />
                  <span>Live Sessions</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </div>

              {/* Audio Soundboard Entry */}
              <div 
                onClick={() => setActiveView('soundboard')} 
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'soundboard' ? 'bg-[#1e2736] text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Volume2 size={14} className="text-cyan-400" />
                  <span>Audio & Ambience</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </div>

            </div>
          </div>

          <div className="p-3 border-t border-white/5 flex items-center justify-between text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-bold">👤</span>
              <span className="text-slate-300 font-medium">trey 7</span>
            </div>
            <ChevronRight size={13} className="text-slate-500" />
          </div>
        </aside>

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
