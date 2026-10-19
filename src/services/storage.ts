import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface World {
  id: string;
  name: string;
  description: string;
  genre: string;
  calendar?: {
    daysPerWeek: number;
    weekdays: string[];
    months: { name: string; days: number }[];
    moons: { id: string; name: string; cycleDays: number; color: string }[];
    currentYear: number;
    currentMonthIndex: number;
    currentDay: number;
  };
  createdAt: number;
}

export interface Folder {
  id: string;
  worldId: string;
  name: string;
  category: 'character' | 'location' | 'faction' | 'item' | 'lore' | 'cards' | 'general';
  createdAt?: number;
  parentId?: string;
}

export interface StatblockData {
  armorClass: number;
  hitPoints: number;
  hitDice: string;
  speed: string;
  proficiencyBonus: number;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  actions: {
    id: string;
    name: string;
    type: 'melee' | 'ranged' | 'spell' | 'special';
    toHit: number;
    damageDice: string;
    description: string;
  }[];
}

export interface CardBlock {
  id: string;
  title: string;
  content: string;
  placeholder?: string;
  width?: 'full' | 'half';
  blockType: 'text' | 'statblock';
  collapsed?: boolean;
  statblock?: StatblockData;
}

export type EntityType = 'character' | 'location' | 'faction' | 'item' | 'lore' | 'monster' | 'npc';

export interface Card {
  id: string;
  worldId: string;
  folderId?: string;
  name: string;
  type: 'character' | 'location' | 'faction' | 'item' | 'lore' | 'monster' | 'npc' | 'quest';
  sectionCategory?: string;
  imageUrl?: string;
  aliases: string[];
  content: string;
  tags: string[];
  properties: Record<string, any>;
  blocks?: {
    id: string;
    title: string;
    content: string;
    placeholder?: string;
    width?: 'half' | 'full';
    blockType: 'text' | 'statblock';
    statblock?: any;
  }[];
  updatedAt: number;
}

export interface MapPin {
  id: string;
  mapId: string;
  x: number;
  y: number;
  label: string;
  color?: string;
  isSecret?: boolean;
}

export interface MapZone {
  id: string;
  mapId: string;
  label: string;
  color?: string;
  isSecret?: boolean;
  isDifficultTerrain?: boolean;
}

export type SightType = 'normal' | 'darkvision' | 'blindsight' | 'truesight';
export type MapLighting = 'bright' | 'dim' | 'darkness';
export type AoEShape = 'none' | 'circle' | 'cone' | 'line';

export interface TokenAoE {
  shape: AoEShape;
  radiusFt: number;
  angleDeg: number;
  color: string;
}

export interface MapToken {
  id: string;
  mapId: string;
  x: number;
  y: number;
  name: string;
  imageUrl?: string;
  color: string;
  size: 'medium' | 'large' | 'huge';
  hpCurrent?: number;
  hpMax?: number;
  isSecret?: boolean;
  isPlayer?: boolean;
  visionRange?: number;
  sightType?: SightType;
  aoe?: TokenAoE;
  conditions?: string[];
}

export interface SavedTokenTemplate {
  id: string;
  worldId: string;
  name: string;
  imageUrl?: string;
  color: string;
  size: 'medium' | 'large' | 'huge';
  hpMax: number;
  isPlayer: boolean;
  visionRange: number;
  sightType: SightType;
  conditions?: string[];
}

export type ObstacleType = 'wall' | 'door' | 'window' | 'chest' | 'table' | 'block' | 'circle' | 'terrain';

export interface MapObstacle {
  id: string;
  mapId: string;
  type: ObstacleType;
  col?: number;
  row?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  radius?: number;
  isDifficultTerrain?: boolean;
  isOpen?: boolean;
  isSecret?: boolean;
}

export interface WorldMap {
  id: string;
  worldId: string;
  name: string;
  imageUrl: string;
  mapType: 'world' | 'tactical';
  gridCols?: number;
  gridRows?: number;
  pins: MapPin[];
  zones: MapZone[];
  tokens?: MapToken[];
  obstacles?: MapObstacle[];
  ambientLighting?: MapLighting;
  fogOfWar?: {
    enabled: boolean;
    dynamicVision?: boolean;
    revealedCells: string[];
  };
  updatedAt: number;
}

export interface Relationship {
  id: string;
  worldId: string;
  sourceCardId: string;
  targetCardId: string;
  relationType: string;
}

export interface TimelineEvent {
  id: string;
  worldId: string;
  year: number;
  title: string;
  description: string;
  category: 'major' | 'minor' | 'era_start' | 'battle' | 'treaty' | 'discovery' | 'cataclysm' | 'general';
  era?: string;
  month?: string;
  day?: number;
  linkedCardIds?: string[];
  updatedAt: number;
}

export interface Combatant {
  id: string;
  name: string;
  kind: 'player' | 'monster' | 'npc';
  initiative: number;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  conditions: string[];
}

export interface CombatEncounter {
  id: string;
  worldId: string;
  name: string;
  round: number;
  currentTurnIndex: number;
  combatants: Combatant[];
  updatedAt: number;
}

export interface SessionRecord {
  id: string;
  worldId: string;
  title: string;
  sessionNumber: number;
  date: string;
  notes: string;
  pinnedCardIds: string[];
  updatedAt: number;
}

export interface CombatSoundTrigger {
  id: string;
  worldId: string;
  name: string;
  url: string;
  icon?: string;
  volume?: number;
}

interface GrimoireDB extends DBSchema {
  worlds: { key: string; value: World };
  folders: { key: string; value: Folder; indexes: { 'by-world': string } };
  cards: { key: string; value: Card; indexes: { 'by-world': string; 'by-type': string } };
  maps: { key: string; value: WorldMap; indexes: { 'by-world': string } };
  savedTokens: { key: string; value: SavedTokenTemplate; indexes: { 'by-world': string } };
  relationships: { key: string; value: Relationship; indexes: { 'by-world': string } };
  events: { key: string; value: TimelineEvent; indexes: { 'by-world': string } };
  combats: { key: string; value: CombatEncounter; indexes: { 'by-world': string } };
  sessions: { key: string; value: SessionRecord; indexes: { 'by-world': string } };
  combatSounds: { key: string; value: CombatSoundTrigger; indexes: { 'by-world': string } };
}

const DB_NAME = 'grimoire_workstation_db';
const DB_VERSION = 7;

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<GrimoireDB>>;

  constructor() {
    this.dbPromise = openDB<GrimoireDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('worlds')) {
          db.createObjectStore('worlds', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          folderStore.createIndex('by-world', 'worldId');
        }
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('by-world', 'worldId');
          cardStore.createIndex('by-type', 'type');
        }
        if (!db.objectStoreNames.contains('maps')) {
          const mapStore = db.createObjectStore('maps', { keyPath: 'id' });
          mapStore.createIndex('by-world', 'worldId');
        }
        if (!db.objectStoreNames.contains('savedTokens')) {
          const tokenVault = db.createObjectStore('savedTokens', { keyPath: 'id' });
          tokenVault.createIndex('by-world', 'worldId');
        }
        if (!db.objectStoreNames.contains('relationships')) {
          const relStore = db.createObjectStore('relationships', { keyPath: 'id' });
          relStore.createIndex('by-world', 'worldId');
        }
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('by-world', 'worldId');
        }
        if (!db.objectStoreNames.contains('combats')) {
          const combatStore = db.createObjectStore('combats', { keyPath: 'id' });
          combatStore.createIndex('by-world', 'worldId');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-world', 'worldId');
        }
        if (!db.objectStoreNames.contains('combatSounds')) {
          const soundStore = db.createObjectStore('combatSounds', { keyPath: 'id' });
          soundStore.createIndex('by-world', 'worldId');
        }
      }
    });
  }

  async listWorlds(): Promise<World[]> {
    const db = await this.dbPromise;
    return db.getAll('worlds');
  }

  async getWorld(id: string): Promise<World | undefined> {
    const db = await this.dbPromise;
    return db.get('worlds', id);
  }

  async saveWorld(world: World): Promise<void> {
    const db = await this.dbPromise;
    await db.put('worlds', world);
  }

  async listFoldersByWorld(worldId: string): Promise<Folder[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('folders', 'by-world', worldId);
  }

  async saveFolder(folder: Folder): Promise<void> {
    const db = await this.dbPromise;
    await db.put('folders', folder);
  }

  async deleteFolder(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('folders', id);
  }

  async listCardsByWorld(worldId: string): Promise<Card[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('cards', 'by-world', worldId);
  }

  async saveCard(card: Card): Promise<void> {
    const db = await this.dbPromise;
    await db.put('cards', card);
  }

  async deleteCard(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('cards', id);
  }

  async listMapsByWorld(worldId: string): Promise<WorldMap[]> {
    const db = await this.dbPromise;
    const maps = await db.getAllFromIndex('maps', 'by-world', worldId);
    return maps.map(m => ({
      ...m,
      mapType: m.mapType || 'world',
      ambientLighting: m.ambientLighting || 'bright',
      gridCols: m.gridCols ?? 25,
      gridRows: m.gridRows ?? 30,
      tokens: (m.tokens || []).map(t => ({
        ...t,
        isPlayer: t.isPlayer ?? false,
        visionRange: t.visionRange ?? 6,
        sightType: t.sightType || 'normal',
        aoe: t.aoe || { shape: 'none', radiusFt: 15, angleDeg: 0, color: '#ef4444' },
        conditions: t.conditions || []
      })),
      obstacles: (m.obstacles || []).map(o => ({
        ...o,
        isSecret: o.isSecret ?? false
      })),
      fogOfWar: m.fogOfWar || { enabled: false, dynamicVision: true, revealedCells: [] }
    }));
  }

  async saveMap(map: WorldMap): Promise<void> {
    const db = await this.dbPromise;
    await db.put('maps', map);
  }

  async deleteMap(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('maps', id);
  }

  async listSavedTokensByWorld(worldId: string): Promise<SavedTokenTemplate[]> {
    const db = await this.dbPromise;
    if (!db.objectStoreNames.contains('savedTokens')) return [];
    return db.getAllFromIndex('savedTokens', 'by-world', worldId);
  }

  async saveTokenTemplate(token: SavedTokenTemplate): Promise<void> {
    const db = await this.dbPromise;
    await db.put('savedTokens', token);
  }

  async deleteTokenTemplate(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('savedTokens', id);
  }

  async listRelationshipsByWorld(worldId: string): Promise<Relationship[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('relationships', 'by-world', worldId);
  }

  async saveRelationship(rel: Relationship): Promise<void> {
    const db = await this.dbPromise;
    await db.put('relationships', rel);
  }

  async deleteRelationship(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('relationships', id);
  }

  async listEventsByWorld(worldId: string): Promise<TimelineEvent[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('events', 'by-world', worldId);
  }

  async saveEvent(event: TimelineEvent): Promise<void> {
    const db = await this.dbPromise;
    await db.put('events', event);
  }

  async deleteEvent(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('events', id);
  }

  async listCombatsByWorld(worldId: string): Promise<CombatEncounter[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('combats', 'by-world', worldId);
  }

  async saveCombat(combat: CombatEncounter): Promise<void> {
    const db = await this.dbPromise;
    await db.put('combats', combat);
  }

  async deleteCombat(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('combats', id);
  }

  async listSessionsByWorld(worldId: string): Promise<SessionRecord[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('sessions', 'by-world', worldId);
  }

  async saveSession(session: SessionRecord): Promise<void> {
    const db = await this.dbPromise;
    await db.put('sessions', session);
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('sessions', id);
  }

  async listCombatSoundsByWorld(worldId: string): Promise<CombatSoundTrigger[]> {
    const db = await this.dbPromise;
    if (!db.objectStoreNames.contains('combatSounds')) return [];
    return db.getAllFromIndex('combatSounds', 'by-world', worldId);
  }

  async saveCombatSound(sound: CombatSoundTrigger): Promise<void> {
    const db = await this.dbPromise;
    await db.put('combatSounds', sound);
  }

  async deleteCombatSound(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('combatSounds', id);
  }
}

export const StorageService = new DatabaseService();
