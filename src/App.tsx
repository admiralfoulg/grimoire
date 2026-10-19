import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useGrimoireStore } from './store/useGrimoireStore';
import { EditorView } from './components/EditorView';
import { MapView } from './components/MapView';
import { GraphView } from './components/GraphView';
import { TimelineView } from './components/TimelineView';
import { CampaignTracker } from './components/CampaignTracker';
import { ReaderView } from './components/ReaderView';
import { SessionView } from './components/SessionView';
import { CommandPalette } from './components/CommandPalette';
import { VaultSettingsModal } from './components/VaultSettingsModal';
import { DiceRoller } from './components/DiceRoller';
import { ProjectionService } from './services/broadcast';
import type { Folder, Card } from './services/storage';
import {
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Map as MapIcon,
  Network,
  Clock,
  FileSpreadsheet,
  Images,
  LayoutGrid,
  Calendar,
  Swords,
  Eye,
  Cast,
  Radio,
  MessageSquareCode,
  Plus,
  Edit2,
  Trash2,
  Copy,
  FileText,
  Folder as FolderIcon
} from 'lucide-react';

interface SidebarContextMenu {
  x: number;
  y: number;
  type: 'folder' | 'card' | 'root';
  targetId?: string;
  category?: Folder['category'];
}

export default function App() {
  const { 
    init, 
    worlds,
    currentWorld,
    loadWorldData, 
    cards, 
    folders,
    activeView, 
    activeCardId, 
    createCard, 
    updateCard,
    deleteCard,
    duplicateCard,
    createWorld,
    deleteWorld,
    renameWorld,
    createFolder,
    renameFolder,
    deleteFolder,
    moveCardToFolder,
    moveFolderToFolder,
    setActiveCard, 
    setActiveView 
  } = useGrimoireStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const [worldToDelete, setWorldToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingWorldId, setEditingWorldId] = useState<string | null>(null);
  const [editWorldName, setEditWorldName] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignGenre, setNewCampaignGenre] = useState('Fantasy');
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isProjecting, setIsProjecting] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Sidebar Context Menu & Inline Renaming
  const [contextMenu, setContextMenu] = useState<SidebarContextMenu | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleToggleProject = () => {
    if (isProjecting) {
      ProjectionService.clear();
      setIsProjecting(false);
    } else {
      ProjectionService.project({
        type: 'MAP',
        mapId: 'global-active',
        imageUrl: '',
        name: currentWorld?.name || 'Grimoire Display',
        mapType: 'world',
        gridCols: 25,
        gridRows: 25,
        ambientLighting: 'bright',
        fogOfWar: { enabled: false, revealedCells: [], dynamicVision: false },
        pins: [],
        zones: [],
        tokens: []
      });
      setIsProjecting(true);
    }
  };

  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  if (activeView === 'reader') {
    return <ReaderView />;
  }

  // Recursive Folder Tree Node Renderer
  const renderFolderNode = (folder: Folder) => {
    const isCollapsed = collapsedFolders[folder.id] ?? false;
    const childFolders = folders
      .filter(f => f.parentId === folder.id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    const childCards = cards.filter(c => c.folderId === folder.id && (
      !searchQuery.trim() || c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const cardId = e.dataTransfer.getData('text/cardId');
      const folderIdToMove = e.dataTransfer.getData('text/folderId');

      if (cardId) {
        await moveCardToFolder(cardId, folder.id);
      } else if (folderIdToMove && folderIdToMove !== folder.id) {
        await moveFolderToFolder(folderIdToMove, folder.id);
      }
    };

    return (
      <div key={folder.id} className="flex flex-col gap-0.5 select-none">
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/folderId', folder.id);
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', targetId: folder.id, category: folder.category });
          }}
          onClick={() => toggleFolderCollapse(folder.id)}
          className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-1.5 truncate">
            {isCollapsed ? <ChevronRight size={13} className="text-slate-500 shrink-0" /> : <ChevronDown size={13} className="text-slate-500 shrink-0" />}
            <FolderIcon size={14} className="text-amber-400 shrink-0" />
            {renamingId === folder.id ? (
              <input
                type="text"
                autoFocus
                value={renamingName}
                onChange={e => setRenamingName(e.target.value)}
                onBlur={async () => {
                  if (renamingName.trim()) await renameFolder(folder.id, renamingName.trim());
                  setRenamingId(null);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && renamingName.trim()) {
                    await renameFolder(folder.id, renamingName.trim());
                    setRenamingId(null);
                  }
                }}
                onClick={e => e.stopPropagation()}
                className="bg-black border border-amber-400 rounded px-1 text-xs text-white outline-none w-full"
              />
            ) : (
              <span className="truncate text-xs font-medium group-hover:text-amber-300">{folder.name}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {childCards.length + childFolders.length}
          </span>
        </div>

        {!isCollapsed && (
          <div className="ml-3 pl-2 border-l border-white/10 flex flex-col gap-0.5 mt-0.5">
            {childFolders.map(sub => renderFolderNode(sub))}
            {childCards.map(c => {
              const isActive = activeCardId === c.id && activeView === 'editor';
              return (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/cardId', c.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', targetId: c.id });
                  }}
                  onClick={() => {
                    setActiveCard(c.id);
                    setActiveView('editor');
                  }}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-[#18212e] text-slate-100 font-medium shadow-md border border-white/10'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={13} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
                    {renamingId === c.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={renamingName}
                        onChange={e => setRenamingName(e.target.value)}
                        onBlur={async () => {
                          if (renamingName.trim()) await updateCard({ ...c, name: renamingName.trim() });
                          setRenamingId(null);
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && renamingName.trim()) {
                            await updateCard({ ...c, name: renamingName.trim() });
                            setRenamingId(null);
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                        className="bg-black border border-amber-400 rounded px-1 text-xs text-white outline-none w-full"
                      />
                    ) : (
                      <span className="truncate">{c.name}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const toggleCollapseAll = () => {
    const allAreCollapsed = folders.length > 0 && folders.every(f => collapsedFolders[f.id]);
    if (allAreCollapsed) {
      setCollapsedFolders({});
    } else {
      const next: Record<string, boolean> = {};
      folders.forEach(f => { next[f.id] = true; });
      setCollapsedFolders(next);
    }
  };

  const rootFolders = folders
    .filter(f => !f.parentId)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  const unfiledCards = cards.filter(c => !c.folderId && (
    !searchQuery.trim() || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0f17] text-slate-100 font-sans select-none relative">
      
      {/* New Campaign Modal */}
      {isNewCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#121824] border border-white/10 shadow-2xl flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Start New Campaign</h3>
              <button onClick={() => setIsNewCampaignOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Campaign / World Name</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Chronicles of Eldoria"
                value={newCampaignName}
                onChange={e => setNewCampaignName(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Genre / Setting</label>
              <input
                type="text"
                placeholder="e.g. High Fantasy, Dark Sci-Fi"
                value={newCampaignGenre}
                onChange={e => setNewCampaignGenre(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button onClick={() => setIsNewCampaignOpen(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
              <button
                disabled={!newCampaignName.trim()}
                onClick={async () => {
                  if (!newCampaignName.trim()) return;
                  await createWorld(newCampaignName.trim(), newCampaignGenre.trim() || 'Fantasy');
                  setNewCampaignName('');
                  setIsNewCampaignOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs transition-colors"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Double-Verification Delete Campaign Modal */}
      {worldToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#121824] border border-red-500/30 shadow-2xl flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">⚠️ Delete Campaign</h3>
              <button onClick={() => { setWorldToDelete(null); setDeleteConfirmText(''); }} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently delete <span className="font-bold text-white">"{worldToDelete.name}"</span> and all its notes, folders, and maps. This action cannot be undone.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Type <span className="text-red-400 font-mono">{worldToDelete.name}</span> to confirm:
              </label>
              <input
                type="text"
                autoFocus
                placeholder={worldToDelete.name}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button onClick={() => { setWorldToDelete(null); setDeleteConfirmText(''); }} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
              <button
                disabled={deleteConfirmText !== worldToDelete.name}
                onClick={async () => {
                  if (deleteConfirmText !== worldToDelete.name) return;
                  await deleteWorld(worldToDelete.id);
                  await deleteWorld(worldToDelete.name);
                  setWorldToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-lg shadow-red-600/30"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <VaultSettingsModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
      <DiceRoller />

      {/* Top Master Bar */}
      <header className="h-10 px-3 flex items-center justify-between border-b border-white/5 bg-[#0d121b]/80 backdrop-blur-md z-30 shrink-0 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button 
              onClick={() => setIsCampaignDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#18212e] border border-white/10 hover:border-white/25 transition-colors text-slate-200 font-medium"
            >
              <span className="w-4 h-4 rounded bg-amber-500/25 text-amber-300 flex items-center justify-center text-[10px] font-bold">
                {currentWorld?.name.charAt(0) || 'V'}
              </span>
              <span>{currentWorld?.name || 'Voltawic'}</span>
              <ChevronDown size={11} className="text-slate-500" />
            </button>

            {isCampaignDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 p-1.5 rounded-xl bg-[#121824] border border-white/15 shadow-2xl backdrop-blur-md z-50 flex flex-col gap-0.5 text-xs text-slate-200">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Switch Campaign</div>
                {worlds.map(w => (
                  <div
                    key={w.id}
                    className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors group ${
                      currentWorld?.id === w.id ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30' : 'hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {editingWorldId === w.id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={editWorldName}
                          onChange={e => setEditWorldName(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              await renameWorld(w.id, editWorldName);
                              setEditingWorldId(null);
                            } else if (e.key === 'Escape') {
                              setEditingWorldId(null);
                            }
                          }}
                          className="w-full bg-black/60 border border-amber-500/50 rounded px-2 py-1 text-xs text-white outline-none"
                        />
                        <button
                          onClick={async () => {
                            await renameWorld(w.id, editWorldName);
                            setEditingWorldId(null);
                          }}
                          className="text-[10px] bg-amber-500 text-black font-bold px-2 py-1 rounded"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={async () => {
                            await loadWorldData(w.id);
                            setIsCampaignDropdownOpen(false);
                          }}
                          className="flex-1 text-left truncate flex items-center justify-between pr-2"
                        >
                          <span className="truncate">{w.name}</span>
                          <span className="text-[10px] text-slate-500 capitalize">{w.genre || 'Fantasy'}</span>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Rename Campaign"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingWorldId(w.id);
                              setEditWorldName(w.name);
                            }}
                            className="hover:text-amber-400 text-slate-500 p-1"
                          >
                            ✏️
                          </button>
                          {worlds.length > 1 && (
                            <button
                              title="Delete Campaign"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCampaignDropdownOpen(false);
                                setWorldToDelete({ id: w.id, name: w.name });
                              }}
                              className="hover:text-red-400 text-slate-500 p-1"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveView('map')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'map' ? 'bg-[#1e2736] text-white border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon size={12} />
            <span>Atlas</span>
          </button>

          <button 
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'editor' ? 'bg-[#1e2736] text-white border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet size={12} />
            <span>Codex</span>
          </button>

          <button 
            onClick={() => setActiveView('graph')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'graph' ? 'bg-[#1e2736] text-white border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network size={12} />
            <span>Nexus</span>
          </button>

          <button 
            onClick={() => setActiveView('timeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === 'timeline' ? 'bg-[#1e2736] text-white border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar size={12} />
            <span>Chronicles</span>
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
            onClick={() => setActiveView('sessions' as any)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              activeView === ('sessions' as any) ? 'bg-[#1e2736] text-white border border-white/10' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareCode size={12} className="text-emerald-400" />
            <span>Sessions</span>
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

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleProject}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all shadow-md ${
              isProjecting
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25 ring-2 ring-amber-400/50'
                : 'bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border border-purple-500/40'
            }`}
          >
            {isProjecting ? (
              <>
                <Radio size={12} className="animate-pulse" />
                <span>Live to Players</span>
              </>
            ) : (
              <>
                <Cast size={12} />
                <span>Project Screen</span>
              </>
            )}
          </button>

          <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
            <Clock size={11} className="opacity-60" /> {currentTime}
          </span>
        </div>
      </header>

      {/* Main Workstation Layout */}
      <div className="flex-1 flex overflow-hidden z-20">

        {/* Far-Left Vertical Toolbar */}
        <div className="w-10 bg-[#0d121a]/90 border-r border-white/5 flex flex-col justify-between items-center py-3 shrink-0">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setIsNewCampaignOpen(true)}
              className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 flex items-center justify-center transition-colors shadow-md"
              title="Start New Campaign"
            >
              <Plus size={15} />
            </button>
            <div className="w-6 h-px bg-white/10 my-1" />
            <button onClick={() => setActiveView('editor')} className={`p-1.5 rounded-lg hover:text-slate-200 ${activeView === 'editor' ? 'text-amber-400 bg-white/5' : 'text-slate-500'}`} title="Codex Documents">
              <FileSpreadsheet size={16} />
            </button>
            <button onClick={() => setActiveView('map')} className={`p-1.5 rounded-lg hover:text-slate-200 ${activeView === 'map' ? 'text-blue-400 bg-white/5' : 'text-slate-500'}`} title="Atlas Maps">
              <Images size={16} />
            </button>
            <button onClick={() => setActiveView('graph')} className={`p-1.5 rounded-lg hover:text-slate-200 ${activeView === 'graph' ? 'text-purple-400 bg-white/5' : 'text-slate-500'}`} title="Nexus Graph">
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setActiveView('timeline')} className={`p-1.5 rounded-lg hover:text-slate-200 ${activeView === 'timeline' ? 'text-emerald-400 bg-white/5' : 'text-slate-500'}`} title="Chronicles">
              <Calendar size={16} />
            </button>
            <button onClick={() => setActiveView('combat')} className={`p-1.5 rounded-lg hover:text-slate-200 ${activeView === 'combat' ? 'text-red-400 bg-white/5' : 'text-slate-500'}`} title="Combat Tracker">
              <Swords size={16} />
            </button>
            <button onClick={() => setActiveView('sessions' as any)} className={`p-1.5 rounded-lg hover:text-slate-200 ${activeView === ('sessions' as any) ? 'text-emerald-400 bg-white/5' : 'text-slate-500'}`} title="Session Logs">
              <MessageSquareCode size={16} />
            </button>
          </div>

          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-[11px] font-bold">
            ●
          </div>
        </div>

        <aside className="w-72 bg-[#10151f]/85 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between shrink-0">
          <div className="flex flex-col">
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-[#090d14]/90 border border-white/5 rounded-lg px-2.5 py-1.5 focus-within:border-white/25 transition-colors">
                <Search size={13} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search vault..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-600 font-sans"
                />
              </div>
              <button
                onClick={toggleCollapseAll}
                className="text-slate-400 hover:text-amber-300 p-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
                title="Collapse / Expand All Folders"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m7 20 5-5 5 5"/>
                  <path d="m7 4 5 5 5-5"/>
                </svg>
              </button>
              <button 
                onClick={async () => {
                  await createFolder('New Folder', 'general');
                }} 
                className="text-slate-400 hover:text-amber-300 p-1 rounded bg-white/5 hover:bg-white/10" 
                title="New Root Folder"
              >
                <FolderPlus size={15} />
              </button>
              <button 
                onClick={() => createCard('New Note', 'lore')} 
                className="text-slate-400 hover:text-amber-300 p-1 rounded bg-white/5 hover:bg-white/10" 
                title="New Note"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Obsidian-Style Recursive Folder & File Tree */}
            <div 
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, type: 'root' });
              }}
              className="p-2 flex flex-col gap-1 text-xs overflow-y-auto max-h-[calc(100vh-120px)]"
            >
              {rootFolders.map(folder => renderFolderNode(folder))}

              {unfiledCards.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Root Notes</span>
                  {unfiledCards.map(c => {
                    const isActive = activeCardId === c.id && activeView === 'editor';
                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/cardId', c.id);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', targetId: c.id });
                        }}
                        onClick={() => {
                          setActiveCard(c.id);
                          setActiveView('editor');
                        }}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all ${
                          isActive
                            ? 'bg-[#18212e] text-slate-100 font-medium shadow-md border border-white/10'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={13} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
                          <span className="truncate">{c.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 border-t border-white/5 flex items-center justify-between text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">●</span>
              <span className="text-slate-300 font-medium">Obsidian Mode</span>
            </div>
            <button onClick={() => setIsVaultOpen(true)} className="text-slate-500 hover:text-white" title="Settings">
              <SlidersHorizontal size={13} />
            </button>
          </div>
        </aside>

        {/* SIDEBAR RIGHT-CLICK CONTEXT MENU */}
        {contextMenu && (
          <div
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
            className="fixed z-60 min-w-[180px] p-1.5 rounded-xl bg-[#121824] border border-white/15 shadow-2xl backdrop-blur-md flex flex-col gap-0.5 text-xs text-slate-200 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'folder' && (
              <>
                <button
                  onClick={async () => {
                    await createFolder('New Subfolder', contextMenu.category || 'general', contextMenu.targetId);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs transition-colors"
                >
                  <FolderPlus size={13} className="text-amber-400" />
                  <span>New Subfolder</span>
                </button>
                <button
                  onClick={async () => {
                    await createCard('New Note', 'lore', contextMenu.targetId);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs transition-colors"
                >
                  <Plus size={13} className="text-blue-400" />
                  <span>New Note Here</span>
                </button>
                <div className="h-px bg-white/5 my-0.5" />
                <button
                  onClick={() => {
                    setRenamingId(contextMenu.targetId || null);
                    const f = folders.find(item => item.id === contextMenu.targetId);
                    setRenamingName(f ? f.name : '');
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs transition-colors"
                >
                  <span>Rename Folder</span>
                  <Edit2 size={12} className="text-amber-400" />
                </button>
                <button
                  onClick={async () => {
                    if (contextMenu.targetId) await deleteFolder(contextMenu.targetId);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 flex items-center justify-between text-xs border-t border-white/5 mt-0.5 transition-colors"
                >
                  <span>Delete Folder</span>
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </>
            )}

            {contextMenu.type === 'card' && (
              <>
                <button
                  onClick={async () => {
                    if (contextMenu.targetId) await duplicateCard(contextMenu.targetId);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs transition-colors"
                >
                  <span>Duplicate Note</span>
                  <Copy size={12} className="text-blue-400" />
                </button>
                <button
                  onClick={() => {
                    setRenamingId(contextMenu.targetId || null);
                    const c = cards.find(item => item.id === contextMenu.targetId);
                    setRenamingName(c ? c.name : '');
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs transition-colors"
                >
                  <span>Rename Note</span>
                  <Edit2 size={12} className="text-amber-400" />
                </button>
                <button
                  onClick={async () => {
                    if (contextMenu.targetId) await deleteCard(contextMenu.targetId);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 flex items-center justify-between text-xs border-t border-white/5 mt-0.5 transition-colors"
                >
                  <span>Delete Note</span>
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </>
            )}

            {contextMenu.type === 'root' && (
              <button
                onClick={async () => {
                  await createFolder('New Folder', 'general');
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs transition-colors"
              >
                <FolderPlus size={13} className="text-amber-400" />
                <span>New Folder</span>
              </button>
            )}
          </div>
        )}

        <main className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative">
          {activeView === 'editor' && <EditorView />}
          {activeView === 'map' && <MapView />}
          {activeView === 'graph' && <GraphView />}
          {activeView === 'timeline' && <TimelineView />}
          {activeView === 'combat' && <CampaignTracker />}
          {activeView === ('sessions' as any) && <SessionView />}

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
