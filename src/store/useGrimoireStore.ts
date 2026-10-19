import { create } from 'zustand';
import { 
  StorageService, 
  type World, 
  type Card, 
  type Folder,
  type WorldMap, 
  type MapPin, 
  type MapZone, 
  type MapToken,
  type SavedTokenTemplate,
  type MapObstacle,
  type MapLighting,
  type Relationship,
  type TimelineEvent,
  type CombatEncounter,
  type Combatant,
  type SessionRecord,
  type CombatSoundTrigger
} from '../services/storage';

export type ActiveView = 'editor' | 'map' | 'graph' | 'timeline' | 'combat' | 'sessions' | 'soundboard' | 'reader' | 'settings';

const DEFAULT_COMBAT_SOUNDS: Omit<CombatSoundTrigger, 'id' | 'worldId'>[] = [
  { name: 'Thunder Clap', url: '/audio/Rain-thunder.mp3', icon: '⚡', volume: 0.8 },
  { name: 'Catacombs Roar', url: '/audio/Catacombs.mp3', icon: '💀', volume: 0.7 },
  { name: 'Campfire Crackle', url: '/audio/fireplace.mp3', icon: '🔥', volume: 0.6 }
];

interface GrimoireState {
  worlds: World[];
  currentWorld: World | null;
  cards: Card[];
  folders: Folder[];
  maps: WorldMap[];
  savedTokens: SavedTokenTemplate[];
  relationships: Relationship[];
  events: TimelineEvent[];
  combats: CombatEncounter[];
  sessions: SessionRecord[];
  combatSounds: CombatSoundTrigger[];
  activeCombatId: string | null;
  activeSessionId: string | null;

  activeView: ActiveView;
  activeCardId: string | null;
  activeMapId: string | null;
  selectedTokenId: string | null;

  init: () => Promise<void>;
  selectWorld: (worldId: string) => Promise<void>;
  loadWorldData: (worldId: string) => Promise<void>;
  createWorld: (name: string, genre: string) => Promise<World>;
  
  createFolder: (name: string, category: Folder['category'], parentId?: string) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  moveCardToFolder: (cardId: string, folderId?: string) => Promise<void>;

  createCard: (name: string, type: Card['type'], folderId?: string) => Promise<Card>;
  updateCard: (card: Card) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  setActiveCard: (id: string | null) => void;
  setActiveView: (view: ActiveView) => void;

  createMap: (name: string, imageUrl: string, mapType?: 'world' | 'tactical') => Promise<WorldMap>;
  deleteMap: (id: string) => Promise<void>;
  setActiveMap: (id: string | null) => void;
  setSelectedTokenId: (id: string | null) => void;
  setMapLighting: (mapId: string, lighting: MapLighting) => Promise<void>;
  setMapGridDimensions: (mapId: string, gridCols: number, gridRows: number) => Promise<void>;
  addPinToMap: (mapId: string, pin: Omit<MapPin, 'id' | 'mapId'>) => Promise<void>;
  deletePinFromMap: (mapId: string, pinId: string) => Promise<void>;
  addZoneToMap: (mapId: string, zone: Omit<MapZone, 'id' | 'mapId'>) => Promise<void>;
  deleteZoneFromMap: (mapId: string, zoneId: string) => Promise<void>;

  addTokenToMap: (mapId: string, token: Omit<MapToken, 'id' | 'mapId'>) => Promise<void>;
  updateToken: (mapId: string, token: MapToken) => Promise<void>;
  updateTokenPosition: (mapId: string, tokenId: string, x: number, y: number) => Promise<void>;
  deleteTokenFromMap: (mapId: string, tokenId: string) => Promise<void>;

  saveTokenToVault: (token: Omit<SavedTokenTemplate, 'id' | 'worldId'>) => Promise<void>;
  deleteTokenFromVault: (id: string) => Promise<void>;

  addObstacleToMap: (mapId: string, obstacle: Omit<MapObstacle, 'id' | 'mapId'>) => Promise<void>;
  updateObstaclePosition: (mapId: string, obstacleId: string, updates: Partial<MapObstacle>) => Promise<void>;
  toggleDoorState: (mapId: string, obstacleId: string) => Promise<void>;
  toggleObstacleSecret: (mapId: string, obstacleId: string) => Promise<void>;
  deleteObstacleFromMap: (mapId: string, obstacleId: string) => Promise<void>;

  toggleFogOfWar: (mapId: string, enabled: boolean) => Promise<void>;
  toggleDynamicVision: (mapId: string, enabled: boolean) => Promise<void>;
  setFogCells: (mapId: string, revealedCells: string[]) => Promise<void>;

  createRelationship: (sourceId: string, targetId: string, relationType: string) => Promise<void>;
  deleteRelationship: (id: string) => Promise<void>;

  createEvent: (eventData: Omit<TimelineEvent, 'id' | 'worldId' | 'updatedAt'>) => Promise<TimelineEvent>;
  updateEvent: (event: TimelineEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  createCombat: (name: string) => Promise<CombatEncounter>;
  updateCombat: (combat: CombatEncounter) => Promise<void>;
  deleteCombat: (id: string) => Promise<void>;
  setActiveCombat: (id: string | null) => void;
  nextTurn: (combatId: string) => Promise<void>;
  prevTurn: (combatId: string) => Promise<void>;
  importMapTokensToCombat: (mapId: string, combatId: string) => Promise<void>;
  deployCombatantsToMap: (combatId: string, mapId: string) => Promise<void>;

  saveCombatSoundTrigger: (soundData: Omit<CombatSoundTrigger, 'id' | 'worldId'>) => Promise<CombatSoundTrigger>;
  deleteCombatSoundTrigger: (id: string) => Promise<void>;

  createSession: (title: string) => Promise<SessionRecord>;
  updateSession: (session: SessionRecord) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setActiveSession: (id: string | null) => void;
  togglePinCardInSession: (sessionId: string, cardId: string) => Promise<void>;

  advanceDay: (days?: number) => Promise<void>;
}

export const useGrimoireStore = create<GrimoireState>((set, get) => ({
  worlds: [],
  currentWorld: null,
  cards: [],
  folders: [],
  maps: [],
  savedTokens: [],
  relationships: [],
  events: [],
  combats: [],
  sessions: [],
  combatSounds: [],
  activeCombatId: null,
  activeSessionId: null,
  activeView: 'editor',
  activeCardId: null,
  activeMapId: null,
  selectedTokenId: null,

  init: async () => {
    try {
      let worlds = await StorageService.listWorlds();
      if (worlds.length === 0) {
        const defaultWorld: World = {
          id: crypto.randomUUID(),
          name: 'The First Realm',
          description: 'An offline world waiting to be charted.',
          genre: 'Fantasy',
          createdAt: Date.now()
        };
        await StorageService.saveWorld(defaultWorld);
        worlds = [defaultWorld];
      }
      
      const current = worlds[0];
      const cards = await StorageService.listCardsByWorld(current.id);
      const folders = await StorageService.listFoldersByWorld(current.id);
      const maps = await StorageService.listMapsByWorld(current.id);
      const savedTokens = await StorageService.listSavedTokensByWorld(current.id);
      const relationships = await StorageService.listRelationshipsByWorld(current.id);
      const events = await StorageService.listEventsByWorld(current.id);
      const combats = await StorageService.listCombatsByWorld(current.id);
      const sessions = await StorageService.listSessionsByWorld(current.id);
      let combatSounds = await StorageService.listCombatSoundsByWorld(current.id);

      if (combatSounds.length === 0) {
        for (const ds of DEFAULT_COMBAT_SOUNDS) {
          const item: CombatSoundTrigger = {
            id: crypto.randomUUID(),
            worldId: current.id,
            ...ds
          };
          await StorageService.saveCombatSound(item);
          combatSounds.push(item);
        }
      }

      set({ 
        worlds, 
        currentWorld: current, 
        cards, 
        folders,
        maps, 
        savedTokens,
        relationships, 
        events, 
        combats,
        sessions,
        combatSounds,
        activeCombatId: combats[0]?.id || null,
        activeSessionId: sessions[0]?.id || null,
        activeCardId: cards[0]?.id || null, 
        activeMapId: maps[0]?.id || null 
      });
    } catch (e) {
      console.error("Grimoire DB init error:", e);
    }
  },

  loadWorldData: async (worldId) => {
    const { selectWorld } = get();
    await selectWorld(worldId);
  },
  selectWorld: async (worldId) => {
    const world = await StorageService.getWorld(worldId);
    if (!world) return;
    const cards = await StorageService.listCardsByWorld(world.id);
    const folders = await StorageService.listFoldersByWorld(world.id);
    const maps = await StorageService.listMapsByWorld(world.id);
    const savedTokens = await StorageService.listSavedTokensByWorld(world.id);
    const relationships = await StorageService.listRelationshipsByWorld(world.id);
    const events = await StorageService.listEventsByWorld(world.id);
    const combats = await StorageService.listCombatsByWorld(world.id);
    const sessions = await StorageService.listSessionsByWorld(world.id);
    const combatSounds = await StorageService.listCombatSoundsByWorld(world.id);

    set({
      currentWorld: world,
      cards,
      folders,
      maps,
      savedTokens,
      relationships,
      events,
      combats,
      sessions,
      combatSounds,
      activeCombatId: combats[0]?.id || null,
      activeSessionId: sessions[0]?.id || null,
      activeCardId: cards[0]?.id || null,
      activeMapId: maps[0]?.id || null,
      selectedTokenId: null,
      activeView: 'editor'
    });
  },

  createWorld: async (name, genre) => {
    const newWorld: World = {
      id: crypto.randomUUID(),
      name,
      description: '',
      genre,
      createdAt: Date.now()
    };
    await StorageService.saveWorld(newWorld);
    const worlds = await StorageService.listWorlds();
    set({ worlds, currentWorld: newWorld, cards: [], folders: [], maps: [], savedTokens: [], relationships: [], events: [], combats: [], sessions: [], combatSounds: [], activeCardId: null, activeMapId: null, selectedTokenId: null });
    return newWorld;
  },

  createFolder: async (name, category, parentId) => {
    const { currentWorld, folders } = get();
    if (!currentWorld) throw new Error('No active world');

    const newFolder: Folder = {
      id: crypto.randomUUID(),
      worldId: currentWorld.id,
      name,
      category,
      parentId
    };

    await StorageService.saveFolder(newFolder);
    set({ folders: [...folders, newFolder] });
    return newFolder;
  },

  deleteFolder: async (id) => {
    const { folders, cards } = get();
    await StorageService.deleteFolder(id);
    const updatedCards = cards.map(c => c.folderId === id ? { ...c, folderId: undefined } : c);
    set({ 
      folders: folders.filter(f => f.id !== id),
      cards: updatedCards
    });
  },

  moveCardToFolder: async (cardId, folderId) => {
    const { cards } = get();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const updated = { ...card, folderId, updatedAt: Date.now() };
    await StorageService.saveCard(updated);
    set({ cards: cards.map(c => c.id === cardId ? updated : c) });
  },

  createCard: async (name, type, folderId) => {
    let { currentWorld, worlds, cards } = get();
    if (!currentWorld) {
      currentWorld = worlds[0] || {
        id: crypto.randomUUID(),
        name: 'The First Realm',
        description: '',
        genre: 'Fantasy',
        createdAt: Date.now()
      };
    }

    const newCard: Card = {
      id: crypto.randomUUID(),
      worldId: currentWorld.id,
      folderId,
      name,
      type,
      aliases: [],
      content: '',
      tags: [],
      properties: {},
      updatedAt: Date.now()
    };

    await StorageService.saveCard(newCard);
    set({ cards: [newCard, ...cards], activeCardId: newCard.id, activeView: 'editor' });
    return newCard;
  },

  updateCard: async (updated) => {
    const { cards } = get();
    const newCards = cards.map(c => c.id === updated.id ? { ...updated, updatedAt: Date.now() } : c);
    await StorageService.saveCard(updated);
    set({ cards: newCards });
  },

  deleteCard: async (id) => {
    const { cards, activeCardId } = get();
    await StorageService.deleteCard(id);
    const remaining = cards.filter(c => c.id !== id);
    set({
      cards: remaining,
      activeCardId: activeCardId === id ? (remaining[0]?.id || null) : activeCardId
    });
  },

  setActiveCard: (id) => set({ activeCardId: id, activeView: 'editor' }),
  setActiveView: (view) => set({ activeView: view }),

  createMap: async (name, imageUrl, mapType = 'world') => {
    let { currentWorld, worlds, maps } = get();
    if (!currentWorld) {
      if (worlds.length > 0) {
        currentWorld = worlds[0];
      } else {
        currentWorld = {
          id: crypto.randomUUID(),
          name: 'The First Realm',
          description: '',
          genre: 'Fantasy',
          createdAt: Date.now()
        };
        await StorageService.saveWorld(currentWorld);
        set({ worlds: [currentWorld], currentWorld });
      }
    }

    const newMap: WorldMap = {
      id: crypto.randomUUID(),
      worldId: currentWorld.id,
      name,
      imageUrl,
      mapType,
      gridCols: 25,
      gridRows: 30,
      ambientLighting: 'bright',
      pins: [],
      zones: [],
      tokens: [],
      obstacles: [],
      fogOfWar: { enabled: false, dynamicVision: true, revealedCells: [] },
      updatedAt: Date.now()
    };

    await StorageService.saveMap(newMap);
    set({ maps: [newMap, ...maps], activeMapId: newMap.id, activeView: 'map' });
    return newMap;
  },

  deleteMap: async (id) => {
    const { maps, activeMapId } = get();
    await StorageService.deleteMap(id);
    const remaining = maps.filter(m => m.id !== id);
    set({
      maps: remaining,
      activeMapId: activeMapId === id ? (remaining[0]?.id || null) : activeMapId
    });
  },

  setActiveMap: (id) => set({ activeMapId: id, activeView: 'map' }),
  setSelectedTokenId: (id) => set({ selectedTokenId: id }),

  setMapLighting: async (mapId, ambientLighting) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedMap: WorldMap = { ...targetMap, ambientLighting, updatedAt: Date.now() };
    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  setMapGridDimensions: async (mapId, gridCols, gridRows) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedMap: WorldMap = { ...targetMap, gridCols, gridRows, updatedAt: Date.now() };
    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  addPinToMap: async (mapId, pinData) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const newPin: MapPin = { id: crypto.randomUUID(), mapId, ...pinData };
    const updatedMap: WorldMap = { ...targetMap, pins: [...targetMap.pins, newPin], updatedAt: Date.now() };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  deletePinFromMap: async (mapId, pinId) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedMap: WorldMap = { ...targetMap, pins: targetMap.pins.filter(p => p.id !== pinId), updatedAt: Date.now() };
    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  addZoneToMap: async (mapId, zoneData) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const newZone: MapZone = { id: crypto.randomUUID(), mapId, ...zoneData };
    const updatedMap: WorldMap = { ...targetMap, zones: [...(targetMap.zones || []), newZone], updatedAt: Date.now() };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  deleteZoneFromMap: async (mapId, zoneId) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedMap: WorldMap = { ...targetMap, zones: (targetMap.zones || []).filter(z => z.id !== zoneId), updatedAt: Date.now() };
    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  addTokenToMap: async (mapId, tokenData) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const newToken: MapToken = { 
      id: crypto.randomUUID(), 
      mapId, 
      isPlayer: false,
      visionRange: 6,
      sightType: 'normal',
      aoe: { shape: 'none', radiusFt: 15, angleDeg: 0, color: '#ef4444' },
      conditions: [],
      ...tokenData 
    };
    const updatedMap: WorldMap = { ...targetMap, tokens: [...(targetMap.tokens || []), newToken], updatedAt: Date.now() };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m), selectedTokenId: newToken.id });
  },

  updateToken: async (mapId, token) => {
    const { maps, combats, activeCombatId } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedTokens = (targetMap.tokens || []).map(t => t.id === token.id ? token : t);
    const updatedMap: WorldMap = { ...targetMap, tokens: updatedTokens, updatedAt: Date.now() };
    await StorageService.saveMap(updatedMap);

    let updatedCombats = combats;
    if (activeCombatId) {
      const combat = combats.find(c => c.id === activeCombatId);
      if (combat) {
        let changed = false;
        const newCombatants = combat.combatants.map(c => {
          if (c.id === token.id || c.name.toLowerCase() === token.name.toLowerCase()) {
            changed = true;
            return {
              ...c,
              hpCurrent: token.hpCurrent ?? c.hpCurrent,
              hpMax: token.hpMax ?? c.hpMax,
              conditions: token.conditions || []
            };
          }
          return c;
        });

        if (changed) {
          const updatedCombat = { ...combat, combatants: newCombatants, updatedAt: Date.now() };
          await StorageService.saveCombat(updatedCombat);
          updatedCombats = combats.map(c => c.id === activeCombatId ? updatedCombat : c);
        }
      }
    }

    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m), combats: updatedCombats });
  },

  updateTokenPosition: async (mapId, tokenId, x, y) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedTokens = (targetMap.tokens || []).map(t => t.id === tokenId ? { ...t, x, y } : t);
    const updatedMap: WorldMap = { ...targetMap, tokens: updatedTokens, updatedAt: Date.now() };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  deleteTokenFromMap: async (mapId, tokenId) => {
    const { maps, selectedTokenId } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedTokens = (targetMap.tokens || []).filter(t => t.id !== tokenId);
    const updatedMap: WorldMap = { ...targetMap, tokens: updatedTokens, updatedAt: Date.now() };

    await StorageService.saveMap(updatedMap);
    set({ 
      maps: maps.map(m => m.id === mapId ? updatedMap : m),
      selectedTokenId: selectedTokenId === tokenId ? null : selectedTokenId
    });
  },

  saveTokenToVault: async (tokenData) => {
    const { currentWorld, worlds, savedTokens } = get();
    const worldId = currentWorld?.id || worlds[0]?.id || 'default-realm';

    const newTemplate: SavedTokenTemplate = {
      id: crypto.randomUUID(),
      worldId,
      ...tokenData
    };

    await StorageService.saveTokenTemplate(newTemplate);
    const filtered = savedTokens.filter(t => t.name.toLowerCase() !== tokenData.name.toLowerCase());
    set({ savedTokens: [newTemplate, ...filtered] });
  },

  deleteTokenFromVault: async (id) => {
    const { savedTokens } = get();
    await StorageService.deleteTokenTemplate(id);
    set({ savedTokens: savedTokens.filter(t => t.id !== id) });
  },

  addObstacleToMap: async (mapId, obstacleData) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const newObstacle: MapObstacle = { id: crypto.randomUUID(), mapId, ...obstacleData };
    const existing = targetMap.obstacles || [];
    
    const filtered = existing.filter(o => {
      if (obstacleData.x1 !== undefined && o.x1 !== undefined) {
        const matchFwd = Math.abs(o.x1 - obstacleData.x1) < 0.1 && Math.abs(o.y1! - obstacleData.y1!) < 0.1 && Math.abs(o.x2! - obstacleData.x2!) < 0.1 && Math.abs(o.y2! - obstacleData.y2!) < 0.1;
        const matchRev = Math.abs(o.x1 - obstacleData.x2!) < 0.1 && Math.abs(o.y1! - obstacleData.y2!) < 0.1 && Math.abs(o.x2! - obstacleData.x1) < 0.1 && Math.abs(o.y2! - obstacleData.y1!) < 0.1;
        return !(matchFwd || matchRev);
      }
      if (obstacleData.cx !== undefined && o.cx !== undefined) {
        return !(Math.abs(o.cx - obstacleData.cx) < 0.1 && Math.abs(o.cy! - obstacleData.cy!) < 0.1);
      }
      if (obstacleData.col !== undefined && o.col !== undefined) {
        return !(o.col === obstacleData.col && o.row === obstacleData.row && o.type === obstacleData.type);
      }
      return true;
    });

    const updatedMap: WorldMap = {
      ...targetMap,
      obstacles: [...filtered, newObstacle],
      updatedAt: Date.now()
    };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  updateObstaclePosition: async (mapId, obstacleId, updates) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedObstacles = (targetMap.obstacles || []).map(o => o.id === obstacleId ? { ...o, ...updates } : o);
    const updatedMap: WorldMap = { ...targetMap, obstacles: updatedObstacles, updatedAt: Date.now() };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  toggleDoorState: async (mapId, obstacleId) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedObstacles = (targetMap.obstacles || []).map(o => {
      if (o.id === obstacleId && o.type === 'door') {
        return { ...o, isOpen: !o.isOpen };
      }
      return o;
    });

    const updatedMap: WorldMap = { ...targetMap, obstacles: updatedObstacles, updatedAt: Date.now() };
    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  toggleObstacleSecret: async (mapId, obstacleId) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedObstacles = (targetMap.obstacles || []).map(o => {
      if (o.id === obstacleId) {
        return { ...o, isSecret: !o.isSecret };
      }
      return o;
    });

    const updatedMap: WorldMap = { ...targetMap, obstacles: updatedObstacles, updatedAt: Date.now() };
    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  deleteObstacleFromMap: async (mapId, obstacleId) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const updatedObstacles = (targetMap.obstacles || []).filter(o => o.id !== obstacleId);
    const updatedMap: WorldMap = { ...targetMap, obstacles: updatedObstacles, updatedAt: Date.now() };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  toggleFogOfWar: async (mapId, enabled) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const currentFog = targetMap.fogOfWar || { enabled: false, dynamicVision: true, revealedCells: [] };
    const updatedMap: WorldMap = {
      ...targetMap,
      fogOfWar: { ...currentFog, enabled },
      updatedAt: Date.now()
    };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  toggleDynamicVision: async (mapId, dynamicVision) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const currentFog = targetMap.fogOfWar || { enabled: true, dynamicVision: true, revealedCells: [] };
    const updatedMap: WorldMap = {
      ...targetMap,
      fogOfWar: { ...currentFog, dynamicVision },
      updatedAt: Date.now()
    };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  setFogCells: async (mapId, revealedCells) => {
    const { maps } = get();
    const targetMap = maps.find(m => m.id === mapId);
    if (!targetMap) return;

    const currentFog = targetMap.fogOfWar || { enabled: true, dynamicVision: true, revealedCells: [] };
    const updatedMap: WorldMap = {
      ...targetMap,
      fogOfWar: { ...currentFog, revealedCells },
      updatedAt: Date.now()
    };

    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  createRelationship: async (sourceId, targetId, relationType) => {
    const { currentWorld, relationships } = get();
    if (!currentWorld) return;

    const newRel: Relationship = { id: crypto.randomUUID(), worldId: currentWorld.id, sourceCardId: sourceId, targetCardId: targetId, relationType };
    await StorageService.saveRelationship(newRel);
    set({ relationships: [...relationships, newRel] });
  },

  deleteRelationship: async (id) => {
    const { relationships } = get();
    await StorageService.deleteRelationship(id);
    set({ relationships: relationships.filter(r => r.id !== id) });
  },

  createEvent: async (eventData) => {
    const { currentWorld, events } = get();
    if (!currentWorld) throw new Error('No active world');

    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      worldId: currentWorld.id,
      ...eventData,
      updatedAt: Date.now()
    };

    await StorageService.saveEvent(newEvent);
    const sorted = [...events, newEvent].sort((a, b) => a.year - b.year);
    set({ events: sorted });
    return newEvent;
  },

  updateEvent: async (updated) => {
    const { events } = get();
    const newEvents = events.map(e => e.id === updated.id ? { ...updated, updatedAt: Date.now() } : e).sort((a, b) => a.year - b.year);
    await StorageService.saveEvent(updated);
    set({ events: newEvents });
  },

  deleteEvent: async (id) => {
    const { events } = get();
    await StorageService.deleteEvent(id);
    set({ events: events.filter(e => e.id !== id) });
  },

  createCombat: async (name) => {
    const { currentWorld, combats } = get();
    if (!currentWorld) throw new Error('No active world');

    const newCombat: CombatEncounter = {
      id: crypto.randomUUID(),
      worldId: currentWorld.id,
      name,
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      updatedAt: Date.now()
    };

    await StorageService.saveCombat(newCombat);
    set({ combats: [newCombat, ...combats], activeCombatId: newCombat.id, activeView: 'combat' });
    return newCombat;
  },

  updateCombat: async (combat) => {
    const { combats, maps, activeMapId } = get();
    const next = combats.map(c => c.id === combat.id ? { ...combat, updatedAt: Date.now() } : c);
    await StorageService.saveCombat(combat);

    let updatedMaps = maps;
    if (activeMapId) {
      const activeMap = maps.find(m => m.id === activeMapId);
      if (activeMap && activeMap.tokens) {
        let changed = false;
        const newTokens = activeMap.tokens.map(token => {
          const match = combat.combatants.find(c => c.id === token.id || c.name.toLowerCase() === token.name.toLowerCase());
          if (match) {
            changed = true;
            return {
              ...token,
              hpCurrent: match.hpCurrent,
              hpMax: match.hpMax,
              conditions: match.conditions
            };
          }
          return token;
        });

        if (changed) {
          const updatedMap = { ...activeMap, tokens: newTokens, updatedAt: Date.now() };
          await StorageService.saveMap(updatedMap);
          updatedMaps = maps.map(m => m.id === activeMapId ? updatedMap : m);
        }
      }
    }

    set({ combats: next, maps: updatedMaps });
  },

  deleteCombat: async (id) => {
    const { combats, activeCombatId } = get();
    await StorageService.deleteCombat(id);
    const remaining = combats.filter(c => c.id !== id);
    set({
      combats: remaining,
      activeCombatId: activeCombatId === id ? (remaining[0]?.id || null) : activeCombatId
    });
  },

  setActiveCombat: (id) => set({ activeCombatId: id, activeView: 'combat' }),

  nextTurn: async (combatId) => {
    const { combats } = get();
    const combat = combats.find(c => c.id === combatId);
    if (!combat || combat.combatants.length === 0) return;

    let nextIndex = combat.currentTurnIndex + 1;
    let nextRound = combat.round;

    if (nextIndex >= combat.combatants.length) {
      nextIndex = 0;
      nextRound += 1;
    }

    const updated: CombatEncounter = {
      ...combat,
      round: nextRound,
      currentTurnIndex: nextIndex,
      updatedAt: Date.now()
    };

    await StorageService.saveCombat(updated);
    set({ combats: combats.map(c => c.id === combatId ? updated : c) });
  },

  prevTurn: async (combatId) => {
    const { combats } = get();
    const combat = combats.find(c => c.id === combatId);
    if (!combat || combat.combatants.length === 0) return;

    let prevIndex = combat.currentTurnIndex - 1;
    let prevRound = combat.round;

    if (prevIndex < 0) {
      if (prevRound > 1) {
        prevRound -= 1;
        prevIndex = combat.combatants.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    const updated: CombatEncounter = {
      ...combat,
      round: prevRound,
      currentTurnIndex: prevIndex,
      updatedAt: Date.now()
    };

    await StorageService.saveCombat(updated);
    set({ combats: combats.map(c => c.id === combatId ? updated : c) });
  },

  importMapTokensToCombat: async (mapId, combatId) => {
    const { maps, combats } = get();
    const targetMap = maps.find(m => m.id === mapId);
    const combat = combats.find(c => c.id === combatId);
    if (!targetMap || !combat || !targetMap.tokens) return;

    const existingIds = new Set(combat.combatants.map(c => c.id));
    const newCombatants: Combatant[] = [...combat.combatants];

    targetMap.tokens.forEach(t => {
      if (!existingIds.has(t.id)) {
        newCombatants.push({
          id: t.id,
          name: t.name,
          kind: t.isPlayer ? 'player' : 'monster',
          initiative: Math.floor(Math.random() * 20) + 1,
          hpCurrent: t.hpCurrent ?? 20,
          hpMax: t.hpMax ?? 20,
          ac: 12,
          conditions: t.conditions || []
        });
      }
    });

    newCombatants.sort((a, b) => b.initiative - a.initiative);
    const updated = { ...combat, combatants: newCombatants, updatedAt: Date.now() };
    await StorageService.saveCombat(updated);
    set({ combats: combats.map(c => c.id === combatId ? updated : c) });
  },

  deployCombatantsToMap: async (combatId, mapId) => {
    const { combats, maps } = get();
    const combat = combats.find(c => c.id === combatId);
    const targetMap = maps.find(m => m.id === mapId);
    if (!combat || !targetMap) return;

    const existingTokenIds = new Set((targetMap.tokens || []).map(t => t.id));
    const cols = targetMap.gridCols ?? 25;
    const rows = targetMap.gridRows ?? 30;
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);

    const newTokens: MapToken[] = [...(targetMap.tokens || [])];

    combat.combatants.forEach((c, idx) => {
      if (!existingTokenIds.has(c.id)) {
        const offsetCol = (idx % 4) - 1.5;
        const offsetRow = Math.floor(idx / 4);

        const x = Math.max(cellW / 2, Math.min(100 - cellW / 2, (centerCol + offsetCol + 0.5) * cellW));
        const y = Math.max(cellH / 2, Math.min(100 - cellH / 2, (centerRow + offsetRow + 0.5) * cellH));

        newTokens.push({
          id: c.id,
          mapId: targetMap.id,
          x,
          y,
          name: c.name,
          color: c.kind === 'player' ? '#3b82f6' : '#ef4444',
          size: 'medium',
          hpCurrent: c.hpCurrent,
          hpMax: c.hpMax,
          isPlayer: c.kind === 'player',
          visionRange: 6,
          sightType: 'normal',
          aoe: { shape: 'none', radiusFt: 15, angleDeg: 0, color: '#ef4444' },
          conditions: c.conditions || []
        });
      }
    });

    const updatedMap: WorldMap = { ...targetMap, tokens: newTokens, updatedAt: Date.now() };
    await StorageService.saveMap(updatedMap);
    set({ maps: maps.map(m => m.id === mapId ? updatedMap : m) });
  },

  saveCombatSoundTrigger: async (soundData) => {
    const { currentWorld, worlds, combatSounds } = get();
    const worldId = currentWorld?.id || worlds[0]?.id || 'default-realm';

    const newSound: CombatSoundTrigger = {
      id: crypto.randomUUID(),
      worldId,
      ...soundData
    };

    await StorageService.saveCombatSound(newSound);
    set({ combatSounds: [newSound, ...combatSounds] });
    return newSound;
  },

  deleteCombatSoundTrigger: async (id) => {
    const { combatSounds } = get();
    await StorageService.deleteCombatSound(id);
    set({ combatSounds: combatSounds.filter(s => s.id !== id) });
  },

  createSession: async (title) => {
    const { currentWorld, sessions } = get();
    if (!currentWorld) throw new Error('No active world');

    const nextNum = sessions.length > 0 ? Math.max(...sessions.map(s => s.sessionNumber)) + 1 : 1;
    const newSession: SessionRecord = {
      id: crypto.randomUUID(),
      worldId: currentWorld.id,
      title: title || `Session ${nextNum.toString().padStart(2, '0')}`,
      sessionNumber: nextNum,
      date: new Date().toLocaleDateString(),
      notes: '',
      pinnedCardIds: [],
      updatedAt: Date.now()
    };

    await StorageService.saveSession(newSession);
    set({ sessions: [newSession, ...sessions], activeSessionId: newSession.id, activeView: 'sessions' });
    return newSession;
  },

  updateSession: async (updated) => {
    const { sessions } = get();
    const next = sessions.map(s => s.id === updated.id ? { ...updated, updatedAt: Date.now() } : s);
    await StorageService.saveSession(updated);
    set({ sessions: next });
  },

  deleteSession: async (id) => {
    const { sessions, activeSessionId } = get();
    await StorageService.deleteSession(id);
    const remaining = sessions.filter(s => s.id !== id);
    set({
      sessions: remaining,
      activeSessionId: activeSessionId === id ? (remaining[0]?.id || null) : activeSessionId
    });
  },

  setActiveSession: (id) => set({ activeSessionId: id, activeView: 'sessions' }),

  togglePinCardInSession: async (sessionId, cardId) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const isPinned = session.pinnedCardIds.includes(cardId);
    const pinnedCardIds = isPinned 
      ? session.pinnedCardIds.filter(id => id !== cardId)
      : [...session.pinnedCardIds, cardId];

    const updated = { ...session, pinnedCardIds, updatedAt: Date.now() };
    await StorageService.saveSession(updated);
    set({ sessions: sessions.map(s => s.id === sessionId ? updated : s) });
  },

  advanceDay: async (days = 1) => {
    const { currentWorld, worlds } = get();
    if (!currentWorld) return;
    const cal = currentWorld.calendar || {
      daysPerWeek: 7,
      weekdays: ['Moonday', 'Towerday', 'Windsday', 'Thunderday', 'Fireday', 'Starday', 'Sunday'],
      months: [{ name: 'Deepwinter', days: 30 }, { name: 'Highsun', days: 30 }],
      moons: [{ id: 'm1', name: 'Lumina', cycleDays: 28, color: '#e2e8f0' }],
      currentYear: 324,
      currentMonthIndex: 0,
      currentDay: 1
    };

    let nextDay = cal.currentDay + days;
    let nextMonthIdx = cal.currentMonthIndex;
    let nextYear = cal.currentYear;

    while (nextDay > (cal.months[nextMonthIdx]?.days || 30)) {
      nextDay -= (cal.months[nextMonthIdx]?.days || 30);
      nextMonthIdx += 1;
      if (nextMonthIdx >= cal.months.length) {
        nextMonthIdx = 0;
        nextYear += 1;
      }
    }

    const updatedWorld = {
      ...currentWorld,
      calendar: {
        ...cal,
        currentYear: nextYear,
        currentMonthIndex: nextMonthIdx,
        currentDay: nextDay
      }
    };

    await StorageService.saveWorld(updatedWorld);
    set({
      currentWorld: updatedWorld,
      worlds: worlds.map(w => w.id === updatedWorld.id ? updatedWorld : w)
    });
  }
}));
