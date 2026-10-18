import { create } from 'zustand';
import { StorageService as FolderStorage, type Folder, type Card } from '../services/storage-folders';
import { StorageService as CoreStorage, type World, type CombatEncounter } from '../services/storage';

interface GrimoireStore {
  worlds: World[];
  currentWorld: World | null;
  cards: Card[];
  folders: Folder[];
  activeCardId: string | null;
  activeView: 'editor' | 'map' | 'graph' | 'timeline' | 'combat' | 'sessions' | 'soundboard' | 'reader';
  combats: CombatEncounter[];
  maps: any[];
  sessions: any[];

  init: () => Promise<void>;
  selectWorld: (worldId: string) => Promise<void>;
  createWorld: (name: string, genre: string) => Promise<void>;
  loadWorldData: (worldId: string, preferredActiveId?: string | null) => Promise<void>;

  setActiveView: (view: any) => void;
  setActiveCard: (id: string | null) => void;
  createCard: (name: string, type: 'character' | 'location' | 'faction' | 'item' | 'lore', folderId?: string) => Promise<Card>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;

  createFolder: (name: string, category: 'character' | 'location' | 'faction' | 'item' | 'lore', parentId?: string) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useGrimoireStore = create<GrimoireStore>((set, get) => ({
  worlds: [],
  currentWorld: null,
  cards: [],
  folders: [],
  activeCardId: null,
  activeView: 'editor',
  combats: [],
  maps: [],
  sessions: [],

  init: async () => {
    let worlds = await CoreStorage.listWorlds();
    if (!worlds || worlds.length === 0) {
      const defaultWorld: World = {
        id: 'world-1',
        name: 'The First Realm',
        description: 'Primary campaign world',
        genre: 'Fantasy',
        createdAt: Date.now()
      };
      await CoreStorage.saveWorld(defaultWorld);
      worlds = [defaultWorld];
    }

    const currentWorld = worlds[0];
    set({ worlds, currentWorld });
    await get().loadWorldData(currentWorld.id);
  },

  selectWorld: async (worldId: string) => {
    const world = get().worlds.find(w => w.id === worldId);
    if (world) {
      set({ currentWorld: world });
      await get().loadWorldData(world.id);
    }
  },

  createWorld: async (name: string, genre: string) => {
    const newWorld: World = {
      id: `world-${crypto.randomUUID()}`,
      name,
      description: '',
      genre: genre || 'Fantasy',
      createdAt: Date.now()
    };
    await CoreStorage.saveWorld(newWorld);
    const updatedWorlds = await CoreStorage.listWorlds();
    set({ worlds: updatedWorlds, currentWorld: newWorld });
    await get().loadWorldData(newWorld.id);
  },

  loadWorldData: async (worldId: string, preferredActiveId?: string | null) => {
    const [cards, folders] = await Promise.all([
      FolderStorage.getCards(worldId),
      FolderStorage.getFolders(worldId)
    ]);

    const currentActiveId = get().activeCardId;
    // Keep preferredActiveId if provided, or current active card if it exists in the list, otherwise fallback to cards[0]
    let resolvedActiveId: string | null = null;
    if (preferredActiveId && cards.some(c => c.id === preferredActiveId)) {
      resolvedActiveId = preferredActiveId;
    } else if (currentActiveId && cards.some(c => c.id === currentActiveId)) {
      resolvedActiveId = currentActiveId;
    } else {
      resolvedActiveId = cards[0]?.id || null;
    }

    set({
      cards,
      folders,
      activeCardId: resolvedActiveId
    });
  },

  setActiveView: (view) => set({ activeView: view }),
  setActiveCard: (id) => set({ activeCardId: id }),

  createCard: async (name, type, folderId) => {
    const currentWorld = get().currentWorld;
    const worldId = currentWorld ? currentWorld.id : 'world-1';

    const newCard: Card = {
      id: `card-${crypto.randomUUID()}`,
      worldId,
      folderId,
      name,
      type,
      aliases: [],
      content: `# ${name}\n\n`,
      tags: [],
      properties: {},
      updatedAt: Date.now()
    };

    await FolderStorage.saveCard(newCard);
    set(state => ({
      cards: [newCard, ...state.cards],
      activeCardId: newCard.id
    }));
    return newCard;
  },

  updateCard: async (id, updates) => {
    const existing = get().cards.find(c => c.id === id);
    if (!existing) return;

    const updated: Card = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    await FolderStorage.saveCard(updated);
    set(state => ({
      cards: state.cards.map(c => c.id === id ? updated : c)
    }));
  },

  deleteCard: async (id) => {
    await FolderStorage.deleteCard(id);
    set(state => ({
      cards: state.cards.filter(c => c.id !== id),
      activeCardId: state.activeCardId === id ? null : state.activeCardId
    }));
  },

  createFolder: async (name, category, parentId) => {
    const currentWorld = get().currentWorld;
    const worldId = currentWorld ? currentWorld.id : 'world-1';

    const newFolder: Folder = {
      id: `folder-${crypto.randomUUID()}`,
      worldId,
      parentId,
      name,
      category,
      createdAt: Date.now()
    };

    await FolderStorage.saveFolder(newFolder);
    set(state => ({
      folders: [...state.folders, newFolder]
    }));
    return newFolder;
  },

  deleteFolder: async (id) => {
    await FolderStorage.deleteFolder(id);
    set(state => ({
      folders: state.folders.filter(f => f.id !== id)
    }));
  }
}));
