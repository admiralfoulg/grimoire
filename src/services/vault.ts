import { StorageService, type World, type Card, type WorldMap, type Relationship } from './storage';

export interface GrimoireVaultBackup {
  version: number;
  exportedAt: number;
  worlds: World[];
  cards: Card[];
  maps: WorldMap[];
  relationships: Relationship[];
}

export const VaultService = {
  async exportFullVault(): Promise<void> {
    const worlds = await StorageService.listWorlds();
    const allCards: Card[] = [];
    const allMaps: WorldMap[] = [];
    const allRelationships: Relationship[] = [];

    for (const w of worlds) {
      const cards = await StorageService.listCardsByWorld(w.id);
      const maps = await StorageService.listMapsByWorld(w.id);
      const rels = await StorageService.listRelationshipsByWorld(w.id);

      allCards.push(...cards);
      allMaps.push(...maps);
      allRelationships.push(...rels);
    }

    const payload: GrimoireVaultBackup = {
      version: 1,
      exportedAt: Date.now(),
      worlds,
      cards: allCards,
      maps: allMaps,
      relationships: allRelationships
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grimoire-vault-backup-${new Date().toISOString().slice(0, 10)}.grimoire`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async importVaultFile(file: File): Promise<void> {
    const text = await file.text();
    const data: GrimoireVaultBackup = JSON.parse(text);

    if (!data.worlds || !Array.isArray(data.worlds)) {
      throw new Error('Invalid Grimoire backup archive.');
    }

    // Persist all imported entities into IndexedDB
    for (const w of data.worlds) {
      await StorageService.saveWorld(w);
    }
    for (const c of data.cards || []) {
      await StorageService.saveCard(c);
    }
    for (const m of data.maps || []) {
      await StorageService.saveMap(m);
    }
    for (const r of data.relationships || []) {
      await StorageService.saveRelationship(r);
    }
  }
};
