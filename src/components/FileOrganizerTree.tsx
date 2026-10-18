import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { 
  Folder as FolderIcon, 
  FolderOpen,
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Plus, 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Tv, 
  MoreVertical,
  Copy,
  FolderInput,
  Bookmark,
  Search,
  ExternalLink,
  SplitSquareVertical,
  AppWindow,
  GitMerge,
  History,
  LayoutGrid,
  Kanban,
  Database,
  GripVertical,
  ChevronsDownUp,
  X
} from 'lucide-react';
import { ProjectionService } from '../services/broadcast';
import { StorageService } from '../services/storage-folders';

export type MasterCategoryKey = 
  | '00_meta'
  | '01_campaign'
  | '02_characters'
  | '03_atlas'
  | '04_factions'
  | '05_codex';

interface ContextMenuState {
  x: number;
  y: number;
  type: 'card' | 'folder' | 'root';
  id?: string;
  name?: string;
  folderCategory?: any;
}

interface DragItem {
  id: string;
  type: 'card' | 'folder';
  name: string;
  category?: any;
}

export const MASTER_CATEGORIES: Array<{
  key: MasterCategoryKey;
  label: string;
  icon: string;
  defaultSubfolders: string[];
}> = [
  {
    key: '00_meta',
    label: '00 WORKBENCH',
    icon: '🛠️',
    defaultSubfolders: ['Assets', 'Inbox', 'Templates']
  },
  {
    key: '01_campaign',
    label: '01 CAMPAIGN',
    icon: '🎲',
    defaultSubfolders: ['Adventures', 'Handouts', 'House Rules', 'Session Logs']
  },
  {
    key: '02_characters',
    label: '02 CHARACTERS',
    icon: '👤',
    defaultSubfolders: ['Monsters', 'NPCs', 'The Party']
  },
  {
    key: '03_atlas',
    label: '03 ATLAS',
    icon: '🗺️',
    defaultSubfolders: ['Dungeons', 'Realms', 'Settlements']
  },
  {
    key: '04_factions',
    label: '04 FACTIONS',
    icon: '🛡️',
    defaultSubfolders: ['Cults', 'Guilds', 'Nobility']
  },
  {
    key: '05_codex',
    label: '05 CODEX',
    icon: '📜',
    defaultSubfolders: ['Cosmology', 'History', 'Items & Relics']
  }
];

export const FileOrganizerTree: React.FC = () => {
  const { 
    cards, 
    folders, 
    activeCardId, 
    setActiveCard, 
    setActiveView, 
    deleteCard, 
    currentWorld,
    loadWorldData
  } = useGrimoireStore();

  const [searchQuery, setSearchQuery] = useState('');

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'root_00_meta': true,
    'root_01_campaign': true,
    'root_02_characters': true,
    'root_03_atlas': true,
    'root_04_factions': true,
    'root_05_codex': true
  });

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingTarget, setEditingTarget] = useState<{ id: string; type: 'card' | 'folder'; currentName: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [inlineFolderCreation, setInlineFolderCreation] = useState<{
    parentId?: string;
    category: any;
  } | null>(null);
  const [folderCreationName, setFolderCreationName] = useState('');

  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  const resolveCategoryKey = (catOrType?: string): MasterCategoryKey => {
    const val = (catOrType || '').toLowerCase();
    if (val.includes('meta') || val.includes('00') || val.includes('workbench')) return '00_meta';
    if (val.includes('campaign') || val.includes('session') || val.includes('01')) return '01_campaign';
    if (val.includes('character') || val.includes('02') || val.includes('party') || val.includes('npc')) return '02_characters';
    if (val.includes('atlas') || val.includes('location') || val.includes('world') || val.includes('03')) return '03_atlas';
    if (val.includes('faction') || val.includes('04')) return '04_factions';
    return '05_codex';
  };

  useEffect(() => {
    const enforceCleanNames = async () => {
      if (!currentWorld?.id || folders.length === 0) return;

      let databaseChanged = false;
      for (const f of folders) {
        if (f.name.includes(' (')) {
          const clean = f.name.split(' (')[0].trim();
          await StorageService.renameFolder(f.id, clean);
          f.name = clean;
          databaseChanged = true;
        } else if (f.name === 'Continents & Realms') {
          await StorageService.renameFolder(f.id, 'Realms');
          f.name = 'Realms';
          databaseChanged = true;
        } else if (f.name === 'Settlements & Districts') {
          await StorageService.renameFolder(f.id, 'Settlements');
          f.name = 'Settlements';
          databaseChanged = true;
        } else if (f.name === 'Dungeons, Ruins & Encounters') {
          await StorageService.renameFolder(f.id, 'Dungeons');
          f.name = 'Dungeons';
          databaseChanged = true;
        }
      }

      if (databaseChanged) {
        useGrimoireStore.setState({ folders: [...folders] });
      }
    };

    enforceCleanNames();
  }, [currentWorld?.id, folders]);

  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const collapseAll = () => {
    setExpandedFolders({});
  };

  const createAndOpenNote = async (
    folderId?: string, 
    archetype: string = 'quicknote', 
    specialType?: string,
    defaultName?: string,
    targetCategory?: string
  ) => {
    const targetWorldId = currentWorld?.id || 'world-1';
    const typeTag = specialType === 'canvas' ? ' [Canvas]' : specialType === 'kanban' ? ' [Kanban]' : specialType === 'base' ? ' [Database]' : '';
    const newCardId = `card-${crypto.randomUUID()}`;
    const initialTitle = defaultName || (specialType ? `Untitled ${specialType}` : 'Quick Note');

    const newCard = {
      id: newCardId,
      worldId: targetWorldId,
      folderId,
      name: `${initialTitle}${typeTag}`,
      type: archetype as any,
      sectionCategory: targetCategory || (folderId ? undefined : '00_meta'),
      content: '',
      updatedAt: Date.now()
    };

    await StorageService.saveCard(newCard);

    useGrimoireStore.setState((state) => ({
      cards: [newCard, ...state.cards],
      activeCardId: newCard.id
    }));

    setActiveCard(newCard.id);
    setActiveView('editor');

    if (folderId) {
      setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
    } else if (targetCategory) {
      setExpandedFolders(prev => ({ ...prev, [`root_${targetCategory}`]: true }));
    }

    if (loadWorldData) {
      await loadWorldData(targetWorldId, newCard.id);
    }
  };

  const handleQuickNoteToInbox = async () => {
    let inboxFolder = folders.find(f => {
      const name = f.name.toLowerCase();
      return name === 'inbox' || name.startsWith('inbox');
    });

    if (!inboxFolder && currentWorld?.id) {
      inboxFolder = {
        id: `folder-${crypto.randomUUID()}`,
        worldId: currentWorld.id,
        name: 'Inbox',
        category: '00_meta' as any,
        createdAt: Date.now()
      };
      await StorageService.saveFolder(inboxFolder);
      useGrimoireStore.setState(state => ({
        folders: [...state.folders, inboxFolder!]
      }));
    }

    setExpandedFolders(prev => ({
      ...prev,
      'root_00_meta': true,
      ...(inboxFolder?.id ? { [inboxFolder.id]: true } : {})
    }));

    await createAndOpenNote(inboxFolder?.id, 'quicknote');
  };

  const handleQuickFolderlessNPC = async () => {
    await createAndOpenNote(undefined, 'character', undefined, 'New NPC', 'root_unfiled');
  };

  const submitFolderCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineFolderCreation || !folderCreationName.trim()) return;

    const targetWorldId = currentWorld?.id || 'world-1';
    const trimmed = folderCreationName.trim();
    const resolvedCat = resolveCategoryKey(inlineFolderCreation.category);

    const newFolderId = `folder-${crypto.randomUUID()}`;
    const newFolder = {
      id: newFolderId,
      worldId: targetWorldId,
      parentId: inlineFolderCreation.parentId,
      name: trimmed,
      category: resolvedCat as any,
      createdAt: Date.now()
    };

    await StorageService.saveFolder(newFolder);
    useGrimoireStore.setState((state) => ({
      folders: [...state.folders, newFolder]
    }));

    setExpandedFolders(prev => ({
      ...prev,
      [newFolderId]: true,
      ...(inlineFolderCreation.parentId ? { [inlineFolderCreation.parentId]: true } : { [`root_${resolvedCat}`]: true })
    }));

    if (loadWorldData) {
      await loadWorldData(targetWorldId);
    }
    setInlineFolderCreation(null);
    setFolderCreationName('');
  };

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q 
      ? cards.filter(c => c.name.toLowerCase().includes(q) || (c.tags || []).some((t: string) => t.toLowerCase().includes(q)))
      : [...cards];
    return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
  }, [cards, searchQuery]);

  const sortFoldersAlpha = (folderList: any[]) => {
    return [...folderList].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const newExp: Record<string, boolean> = {
        'root_00_meta': true,
        'root_01_campaign': true,
        'root_02_characters': true,
        'root_03_atlas': true,
        'root_04_factions': true,
        'root_05_codex': true
      };
      filteredCards.forEach(c => {
        if (c.folderId) {
          newExp[c.folderId] = true;
          let curr = folders.find(f => f.id === c.folderId);
          while (curr && curr.parentId) {
            newExp[curr.parentId] = true;
            curr = folders.find(f => f.id === curr?.parentId);
          }
        }
      });
      setExpandedFolders(prev => ({ ...prev, ...newExp }));
    }
  }, [searchQuery, filteredCards, folders]);

  // --- Drag & Drop Handlers (Allows dropping anywhere) ---
  const handleDragStart = (e: React.DragEvent, id: string, type: 'card' | 'folder', name: string, category?: any) => {
    e.stopPropagation();
    const item: DragItem = { id, type, name, category };
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTargetId !== targetId) {
      setDragOverTargetId(targetId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTargetId === targetId) {
      setDragOverTargetId(null);
    }
  };

  const handleDrop = async (
    e: React.DragEvent, 
    targetFolderId?: string, 
    targetCategory?: any
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);

    if (!draggedItem) return;
    if (draggedItem.type === 'folder' && draggedItem.id === targetFolderId) {
      setDraggedItem(null);
      return;
    }

    const resolvedCategory = targetCategory ? resolveCategoryKey(targetCategory) : undefined;

    if (draggedItem.type === 'card') {
      const targetCard = cards.find(c => c.id === draggedItem.id);
      if (!targetCard) return;

      const updatedCard = {
        ...targetCard,
        folderId: targetFolderId,
        // If dropped directly into a root category section, record that sectionCategory
        sectionCategory: targetFolderId ? undefined : resolvedCategory,
        updatedAt: Date.now()
      };

      await StorageService.saveCard(updatedCard);
      useGrimoireStore.setState((state) => ({
        cards: state.cards.map(c => c.id === draggedItem.id ? updatedCard : c)
      }));
    } else if (draggedItem.type === 'folder') {
      const isDescendant = (parentId: string, childId: string): boolean => {
        const sub = folders.filter(f => f.parentId === parentId);
        if (sub.some(f => f.id === childId)) return true;
        return sub.some(f => isDescendant(f.id, childId));
      };

      if (targetFolderId && isDescendant(draggedItem.id, targetFolderId)) {
        setDraggedItem(null);
        return;
      }

      await StorageService.moveFolder(draggedItem.id, targetFolderId, resolvedCategory as any);
      useGrimoireStore.setState((state) => ({
        folders: state.folders.map(f => 
          f.id === draggedItem.id 
            ? { ...f, parentId: targetFolderId, ...(resolvedCategory ? { category: resolvedCategory as any } : {}) } 
            : f
        )
      }));
    }

    if (targetFolderId) {
      setExpandedFolders(prev => ({ ...prev, [targetFolderId]: true }));
    }
    if (resolvedCategory) {
      setExpandedFolders(prev => ({ ...prev, [`root_${resolvedCategory}`]: true }));
    }

    if (currentWorld?.id && loadWorldData) {
      await loadWorldData(currentWorld.id);
    }

    setDraggedItem(null);
  };

  const handleContextMenu = (
    e: React.MouseEvent, 
    type: 'card' | 'folder' | 'root', 
    id?: string, 
    name?: string, 
    folderCategory?: any
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 240;
    const menuHeight = type === 'card' ? 440 : 420;
    const clampedX = Math.min(e.clientX, window.innerWidth - menuWidth - 12);
    const clampedY = Math.min(e.clientY, window.innerHeight - menuHeight - 12);

    setContextMenu({
      x: Math.max(10, clampedX),
      y: Math.max(10, clampedY),
      type,
      id,
      name,
      folderCategory
    });
  };

  const startRename = (id: string, type: 'card' | 'folder', currentName: string) => {
    setEditingTarget({ id, type, currentName });
    setRenameValue(currentName);
    setContextMenu(null);
  };

  const submitRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget || !renameValue.trim()) return;

    if (editingTarget.type === 'card') {
      await StorageService.renameCard(editingTarget.id, renameValue.trim());
      useGrimoireStore.setState((state) => ({
        cards: state.cards.map((c) =>
          c.id === editingTarget.id ? { ...c, name: renameValue.trim() } : c
        )
      }));
    } else {
      await StorageService.renameFolder(editingTarget.id, renameValue.trim());
      useGrimoireStore.setState((state) => ({
        folders: state.folders.map((f) =>
          f.id === editingTarget.id ? { ...f, name: renameValue.trim() } : f
        )
      }));
    }

    if (currentWorld?.id && loadWorldData) {
      await loadWorldData(currentWorld.id);
    }
    setEditingTarget(null);
  };

  const handleDelete = async (id: string, type: 'card' | 'folder') => {
    if (type === 'card') {
      await deleteCard(id);
    } else {
      await StorageService.deleteFolder(id);
      useGrimoireStore.setState((state) => ({
        folders: state.folders.filter((f) => f.id !== id)
      }));
      if (currentWorld?.id && loadWorldData) {
        await loadWorldData(currentWorld.id);
      }
    }
    setContextMenu(null);
  };

  const handleSendToPlayer = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    ProjectionService.project({
      type: 'CARD',
      cardId: card.id,
      cardName: card.name,
      cardContent: card.content
    });
    setContextMenu(null);
  };

  const handleDuplicate = async (id: string, type: 'card' | 'folder') => {
    const targetWorldId = currentWorld?.id || 'world-1';
    if (type === 'card') {
      const source = cards.find(c => c.id === id);
      if (source) {
        const copy = {
          ...source,
          id: `card-${crypto.randomUUID()}`,
          name: `${source.name} (Copy)`,
          updatedAt: Date.now()
        };
        await StorageService.saveCard(copy);
        useGrimoireStore.setState((state) => ({
          cards: [...state.cards, copy]
        }));
        if (loadWorldData) await loadWorldData(targetWorldId);
      }
    }
    setContextMenu(null);
  };

  const handleCopyPath = (name?: string) => {
    if (name) {
      navigator.clipboard.writeText(name);
    }
    setContextMenu(null);
  };

  // --- Recursive Folder Rendering ---
  const renderFolder = (folder: any, depth: number = 0) => {
    const isExpanded = Boolean(expandedFolders[folder.id]);
    const childFolders = sortFoldersAlpha(folders.filter(f => f.parentId === folder.id));
    const folderCards = filteredCards.filter(c => c.folderId === folder.id);
    const isDragOver = dragOverTargetId === folder.id;

    if (searchQuery.trim() && folderCards.length === 0 && childFolders.length === 0) {
      return null;
    }

    const displayName = folder.name.includes(' (') ? folder.name.split(' (')[0].trim() : folder.name;

    return (
      <div 
        key={folder.id} 
        className="flex flex-col select-none"
        onDragOver={(e) => handleDragOver(e, folder.id)}
        onDragLeave={(e) => handleDragLeave(e, folder.id)}
        onDrop={(e) => handleDrop(e, folder.id, folder.category)}
      >
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, folder.id, 'folder', displayName, folder.category)}
          onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, displayName, folder.category)}
          onClick={() => toggleFolder(folder.id)}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className={`flex items-center justify-between py-1 pr-2 rounded-lg cursor-pointer text-xs group transition-all ${
            isDragOver 
              ? 'bg-amber-500/20 border-2 border-dashed border-amber-400 text-white' 
              : isExpanded 
                ? 'text-slate-200 hover:bg-white/5' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {isExpanded ? (
              <ChevronDown size={13} className="shrink-0 text-slate-500 group-hover:text-amber-400" />
            ) : (
              <ChevronRight size={13} className="shrink-0 text-slate-500 group-hover:text-amber-400" />
            )}
            {isExpanded ? (
              <FolderOpen size={14} className="shrink-0 text-amber-400/90" />
            ) : (
              <FolderIcon size={14} className="shrink-0 text-amber-500/70" />
            )}
            <span className="truncate font-medium">{displayName}</span>
          </div>

          <div className="flex items-center opacity-0 group-hover:opacity-100">
            <GripVertical size={11} className="text-slate-600 hover:text-slate-400 cursor-grab mr-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, 'folder', folder.id, displayName, folder.category);
              }}
              className="p-0.5 text-slate-500 hover:text-white"
            >
              <MoreVertical size={11} />
            </button>
          </div>
        </div>

        {inlineFolderCreation && inlineFolderCreation.parentId === folder.id && (
          <form 
            onSubmit={submitFolderCreation}
            style={{ paddingLeft: `${(depth + 1) * 14 + 6}px` }} 
            className="py-1 pr-2"
          >
            <input
              type="text"
              autoFocus
              placeholder="New folder name..."
              value={folderCreationName}
              onChange={e => setFolderCreationName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setInlineFolderCreation(null);
              }}
              className="w-full bg-black/70 border border-amber-500/60 rounded px-2 py-0.5 text-xs text-white outline-none"
            />
          </form>
        )}

        {isExpanded && (
          <div className="flex flex-col">
            {childFolders.map(child => renderFolder(child, depth + 1))}
            {folderCards.map(c => renderCard(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderCard = (card: any, depth: number = 0) => {
    const isActive = activeCardId === card.id;

    return (
      <div
        key={card.id}
        draggable
        onDragStart={(e) => handleDragStart(e, card.id, 'card', card.name, card.type)}
        onContextMenu={(e) => handleContextMenu(e, 'card', card.id, card.name)}
        onClick={() => {
          setActiveCard(card.id);
          setActiveView('editor');
        }}
        style={{ paddingLeft: `${depth * 14 + 16}px` }}
        className={`flex items-center justify-between py-1 pr-2 rounded-lg cursor-pointer text-xs group transition-all ${
          isActive 
            ? 'bg-[#18212e] text-amber-300 font-semibold border border-amber-500/30' 
            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText size={12} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
          <span className="truncate">{card.name || 'Untitled'}</span>
        </div>

        <div className="flex items-center opacity-0 group-hover:opacity-100">
          <GripVertical size={11} className="text-slate-600 hover:text-slate-400 cursor-grab mr-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, 'card', card.id, card.name);
            }}
            className="p-0.5 text-slate-500 hover:text-white"
          >
            <MoreVertical size={11} />
          </button>
        </div>
      </div>
    );
  };

  // Cards with no folderId and no specific category bucket
  const unassignedRootNotes = filteredCards.filter(c => !c.folderId && (!c.sectionCategory || c.sectionCategory === 'root_unfiled'));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans text-xs">
      
      {/* Top Search Toolbar */}
      <div className="p-2 border-b border-white/5 flex items-center gap-1.5 bg-[#0e131d]/60 shrink-0">
        <div className="flex-1 flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-slate-200 focus-within:border-amber-500/50 transition-colors">
          <Search size={12} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search notes & tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[11px] text-slate-200 placeholder-slate-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-300">
              <X size={11} />
            </button>
          )}
        </div>

        <button
          onClick={collapseAll}
          className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
          title="Collapse all folders"
        >
          <ChevronsDownUp size={14} />
        </button>

        {/* Custom Lightning Bolt Button (Auto-opens Quick Note into Inbox) */}
        <button
          onClick={handleQuickNoteToInbox}
          className="p-1.5 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 transition-all group"
          title="Quick Note / Scratchpad (Instant Dump into Inbox)"
        >
          <svg 
            width="15" 
            height="15" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="group-hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </button>

        {/* Plus (+) Button: Auto-creates Default Folderless Note below Codex */}
        <button
          onClick={handleQuickFolderlessNPC}
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-all group"
          title="New Folderless NPC (Below Codex)"
        >
          <Plus size={16} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* 6 Clean Numbered Root Categories & Subfolders */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        {MASTER_CATEGORIES.map(cat => {
          const rootKey = `root_${cat.key}`;
          const isExpanded = Boolean(expandedFolders[rootKey]);
          
          // Folders directly under this category
          const rootFolders = sortFoldersAlpha(folders.filter(f => 
            !f.parentId && resolveCategoryKey(f.category) === cat.key
          ));

          // Loose cards directly placed under this category without any subfolder
          const looseCategoryCards = filteredCards.filter(c => {
            if (c.folderId) return false;
            if (c.sectionCategory) return c.sectionCategory === cat.key;
            // Legacy fallback by card type
            return resolveCategoryKey(c.type) === cat.key;
          });
          
          const isDragOver = dragOverTargetId === rootKey;

          if (searchQuery.trim() && rootFolders.length === 0 && looseCategoryCards.length === 0) {
            return null;
          }

          return (
            <div 
              key={cat.key} 
              className="flex flex-col mb-1.5"
              onDragOver={(e) => handleDragOver(e, rootKey)}
              onDragLeave={(e) => handleDragLeave(e, rootKey)}
              onDrop={(e) => handleDrop(e, undefined, cat.key)}
            >
              <div
                onClick={() => toggleFolder(rootKey)}
                onContextMenu={(e) => handleContextMenu(e, 'root', undefined, cat.label, cat.key)}
                className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer font-bold tracking-wide text-[11px] transition-all ${
                  isDragOver
                    ? 'bg-amber-500/20 border-2 border-dashed border-amber-400 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isExpanded ? (
                    <ChevronDown size={13} className="text-slate-500 shrink-0" />
                  ) : (
                    <ChevronRight size={13} className="text-slate-500 shrink-0" />
                  )}
                  <span className="shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono ml-2 shrink-0">
                  {rootFolders.length + looseCategoryCards.length}
                </span>
              </div>

              {/* Inline Folder Creation at Root Category Level */}
              {inlineFolderCreation && !inlineFolderCreation.parentId && resolveCategoryKey(inlineFolderCreation.category) === cat.key && (
                <form onSubmit={submitFolderCreation} className="py-1 px-3 ml-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New folder name..."
                    value={folderCreationName}
                    onChange={e => setFolderCreationName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') setInlineFolderCreation(null);
                    }}
                    className="w-full bg-black/70 border border-amber-500/60 rounded px-2 py-0.5 text-xs text-white outline-none"
                  />
                </form>
              )}

              {/* Render Subfolders & Any Loose Cards Directly Under Category */}
              {isExpanded && (
                <div className="flex flex-col pl-1 border-l border-white/5 ml-2 mt-0.5">
                  {rootFolders.map(f => renderFolder(f, 0))}
                  {looseCategoryCards.map(c => renderCard(c, 0))}
                </div>
              )}
            </div>
          );
        })}

        {/* Truly Unassigned Loose Notes Section: Rendered directly below 05 CODEX */}
        {unassignedRootNotes.length > 0 && (
          <div 
            className="flex flex-col mt-2 pt-2 border-t border-white/5 gap-0.5"
            onDragOver={(e) => handleDragOver(e, 'root_unfiled')}
            onDragLeave={(e) => handleDragLeave(e, 'root_unfiled')}
            onDrop={(e) => handleDrop(e, undefined, 'root_unfiled')}
          >
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 py-0.5">
              Root Notes
            </div>
            {unassignedRootNotes.map(c => renderCard(c, 0))}
          </div>
        )}
      </div>

      {/* Rename Dialog Modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={submitRename} className="bg-[#121620] border border-white/10 rounded-xl p-4 w-72 flex flex-col gap-3 shadow-2xl">
            <div className="text-xs font-bold text-slate-200">
              Rename {editingTarget.type === 'folder' ? 'Folder' : 'Note'}
            </div>
            <input
              type="text"
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              className="bg-black/50 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-amber-500 text-black font-semibold rounded-lg text-xs hover:bg-amber-400"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* React Portal Context Menu */}
      {contextMenu && createPortal(
        <div
          style={{ 
            position: 'fixed',
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px`,
            zIndex: 999999
          }}
          onClick={e => e.stopPropagation()}
          className="w-56 bg-[#161a23] border border-white/15 rounded-xl shadow-2xl p-1.5 text-slate-200 flex flex-col font-sans select-none text-[12px]"
        >
          {(contextMenu.type === 'folder' || contextMenu.type === 'root') && (
            <>
              <button
                onClick={() => {
                  createAndOpenNote(contextMenu.id, 'quicknote', undefined, undefined, contextMenu.folderCategory);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
              >
                <Plus size={14} className="text-slate-400" />
                <span>New note</span>
              </button>

              <button
                onClick={() => {
                  setInlineFolderCreation({ parentId: contextMenu.id, category: contextMenu.folderCategory || '00_meta' });
                  setFolderCreationName('');
                  setContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
              >
                <FolderPlus size={14} className="text-slate-400" />
                <span>New folder</span>
              </button>

              <button
                onClick={() => {
                  createAndOpenNote(contextMenu.id, 'quicknote', 'canvas', undefined, contextMenu.folderCategory);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
              >
                <LayoutGrid size={14} className="text-slate-400" />
                <span>New canvas</span>
              </button>

              <button
                onClick={() => {
                  createAndOpenNote(contextMenu.id, 'quicknote', 'base', undefined, contextMenu.folderCategory);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
              >
                <Database size={14} className="text-slate-400" />
                <span>New base</span>
              </button>

              <button
                onClick={() => {
                  createAndOpenNote(contextMenu.id, 'quicknote', 'kanban', undefined, contextMenu.folderCategory);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
              >
                <Kanban size={14} className="text-slate-400" />
                <span>New kanban board</span>
              </button>

              <div className="h-[1px] bg-white/10 my-1" />

              <button
                onClick={() => handleDuplicate(contextMenu.id!, 'folder')}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <Copy size={14} className="text-slate-400" />
                <span>Make a copy</span>
              </button>

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <FolderInput size={14} className="text-slate-400" />
                <span>Move folder to...</span>
              </button>

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <Search size={14} className="text-slate-400" />
                <span>Search in folder</span>
              </button>

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <Bookmark size={14} className="text-slate-400" />
                <span>Bookmark...</span>
              </button>

              <div className="h-[1px] bg-white/10 my-1" />

              <button
                onClick={() => handleCopyPath(contextMenu.name)}
                className="flex items-center justify-between px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <div className="flex items-center gap-2.5">
                  <Copy size={14} className="text-slate-400" />
                  <span>Copy path</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </button>

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <ExternalLink size={14} className="text-slate-400" />
                <span>Show in system explorer</span>
              </button>

              {contextMenu.type === 'folder' && (
                <>
                  <div className="h-[1px] bg-white/10 my-1" />
                  <button
                    onClick={() => startRename(contextMenu.id!, 'folder', contextMenu.name || '')}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
                  >
                    <Edit2 size={14} className="text-slate-400" />
                    <span>Rename...</span>
                  </button>
                  <button
                    onClick={() => handleDelete(contextMenu.id!, 'folder')}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-red-500/20 text-red-400 rounded-md text-left transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </>
          )}

          {contextMenu.type === 'card' && (
            <>
              <button
                onClick={() => {
                  setActiveCard(contextMenu.id!);
                  setActiveView('editor');
                  setContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
              >
                <Plus size={14} className="text-slate-400" />
                <span>Open in new tab</span>
              </button>

              <button
                onClick={() => {
                  setActiveCard(contextMenu.id!);
                  setActiveView('editor');
                  setContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
              >
                <SplitSquareVertical size={14} className="text-slate-400" />
                <span>Open to the right</span>
              </button>

              <button
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
              >
                <AppWindow size={14} className="text-slate-400" />
                <span>Open in new window</span>
              </button>

              <div className="h-[1px] bg-white/10 my-1" />

              <button
                onClick={() => handleDuplicate(contextMenu.id!, 'card')}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <Copy size={14} className="text-slate-400" />
                <span>Make a copy</span>
              </button>

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <FolderInput size={14} className="text-slate-400" />
                <span>Move file to...</span>
              </button>

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <Bookmark size={14} className="text-slate-400" />
                <span>Bookmark...</span>
              </button>

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <GitMerge size={14} className="text-slate-400" />
                <span>Merge entire file with...</span>
              </button>

              <div className="h-[1px] bg-white/10 my-1" />

              <button
                onClick={() => handleCopyPath(contextMenu.name)}
                className="flex items-center justify-between px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <div className="flex items-center gap-2.5">
                  <Copy size={14} className="text-slate-400" />
                  <span>Copy path</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </button>

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <History size={14} className="text-slate-400" />
                <span>Open version history</span>
              </button>

              <div className="h-[1px] bg-white/10 my-1" />

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <ExternalLink size={14} className="text-slate-400" />
                <span>Open in default app</span>
              </button>

              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors text-slate-300"
              >
                <ExternalLink size={14} className="text-slate-400" />
                <span>Show in system explorer</span>
              </button>

              <div className="h-[1px] bg-white/10 my-1" />

              <button
                onClick={() => handleSendToPlayer(contextMenu.id!)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-blue-500/20 text-blue-300 rounded-md text-left transition-colors"
              >
                <Tv size={14} />
                <span>Send note to player screen</span>
              </button>

              <div className="h-[1px] bg-white/10 my-1" />

              <button
                onClick={() => startRename(contextMenu.id!, 'card', contextMenu.name || '')}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-white/10 rounded-md text-left transition-colors"
              >
                <Edit2 size={14} className="text-slate-400" />
                <span>Rename...</span>
              </button>

              <button
                onClick={() => handleDelete(contextMenu.id!, 'card')}
                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-red-500/20 text-red-400 rounded-md text-left transition-colors"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>,
        document.body
      )}

    </div>
  );
};
