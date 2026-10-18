import { get, set } from 'idb-keyval';
import { openDB } from 'idb';

export interface Card {
  id: string;
  worldId: string;
  folderId?: string;
  name: string;
  type: 'character' | 'location' | 'faction' | 'item' | 'lore';
  aliases?: string[];
  content: string;
  tags?: string[];
  properties?: Record<string, any>;
  updatedAt: number;
}

export interface Folder {
  id: string;
  worldId: string;
  parentId?: string;
  name: string;
  category: 'character' | 'location' | 'faction' | 'item' | 'lore';
  createdAt: number;
}

export const StorageService = {
  async getCards(worldId?: string): Promise<Card[]> {
    const cards = (await get<Card[]>('grimoire_cards')) || [];
    return worldId ? cards.filter(c => c.worldId === worldId) : cards;
  },

  async saveCard(card: Card): Promise<void> {
    const cards = (await get<Card[]>('grimoire_cards')) || [];
    const idx = cards.findIndex(c => c.id === card.id);
    if (idx >= 0) {
      cards[idx] = card;
    } else {
      cards.push(card);
    }
    await set('grimoire_cards', cards);

    // Also persist to raw indexedDB table if available
    try {
      const db = await openDB('grimoire-db', 6);
      if (db.objectStoreNames.contains('cards')) {
        await db.put('cards', card);
      }
    } catch {}
  },

  async deleteCard(id: string): Promise<void> {
    const cards = (await get<Card[]>('grimoire_cards')) || [];
    await set('grimoire_cards', cards.filter(c => c.id !== id));
    try {
      const db = await openDB('grimoire-db', 6);
      if (db.objectStoreNames.contains('cards')) {
        await db.delete('cards', id);
      }
    } catch {}
  },

  async renameCard(id: string, newName: string): Promise<void> {
    const cards = (await get<Card[]>('grimoire_cards')) || [];
    const card = cards.find(c => c.id === id);
    if (card) {
      card.name = newName;
      card.updatedAt = Date.now();
      await set('grimoire_cards', cards);
      try {
        const db = await openDB('grimoire-db', 6);
        if (db.objectStoreNames.contains('cards')) {
          await db.put('cards', card);
        }
      } catch {}
    }
  },

  async moveCard(cardId: string, targetFolderId?: string, targetCategory?: 'character' | 'location' | 'faction' | 'item' | 'lore'): Promise<void> {
    const cards = (await get<Card[]>('grimoire_cards')) || [];
    const card = cards.find(c => c.id === cardId);
    if (card) {
      card.folderId = targetFolderId;
      if (targetCategory) {
        card.type = targetCategory;
      }
      card.updatedAt = Date.now();
      await set('grimoire_cards', cards);
      try {
        const db = await openDB('grimoire-db', 6);
        if (db.objectStoreNames.contains('cards')) {
          await db.put('cards', card);
        }
      } catch {}
    }
  },

  async getFolders(worldId?: string): Promise<Folder[]> {
    const folders = (await get<Folder[]>('grimoire_folders')) || [];
    return worldId ? folders.filter(f => f.worldId === worldId) : folders;
  },

  async saveFolder(folder: Folder): Promise<void> {
    const folders = (await get<Folder[]>('grimoire_folders')) || [];
    const idx = folders.findIndex(f => f.id === folder.id);
    if (idx >= 0) {
      folders[idx] = folder;
    } else {
      folders.push(folder);
    }
    await set('grimoire_folders', folders);

    try {
      const db = await openDB('grimoire-db', 6);
      if (db.objectStoreNames.contains('folders')) {
        await db.put('folders', folder);
      }
    } catch {}
  },

  async deleteFolder(id: string): Promise<void> {
    const folders = (await get<Folder[]>('grimoire_folders')) || [];
    const toDelete = new Set<string>([id]);
    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
          toDelete.add(f.id);
          added = true;
        }
      }
    }
    const remainingFolders = folders.filter(f => !toDelete.has(f.id));
    await set('grimoire_folders', remainingFolders);

    try {
      const db = await openDB('grimoire-db', 6);
      if (db.objectStoreNames.contains('folders')) {
        const tx = db.transaction('folders', 'readwrite');
        for (const delId of toDelete) {
          await tx.store.delete(delId);
        }
        await tx.done;
      }
    } catch {}

    const cards = (await get<Card[]>('grimoire_cards')) || [];
    cards.forEach(c => {
      if (c.folderId && toDelete.has(c.folderId)) {
        delete c.folderId;
      }
    });
    await set('grimoire_cards', cards);
  },

  async renameFolder(id: string, newName: string): Promise<void> {
    const folders = (await get<Folder[]>('grimoire_folders')) || [];
    const f = folders.find(item => item.id === id);
    if (f) {
      f.name = newName;
      await set('grimoire_folders', folders);
      try {
        const db = await openDB('grimoire-db', 6);
        if (db.objectStoreNames.contains('folders')) {
          await db.put('folders', f);
        }
      } catch {}
    }
  },

  async moveFolder(folderId: string, targetParentId?: string, targetCategory?: 'character' | 'location' | 'faction' | 'item' | 'lore'): Promise<void> {
    const folders = (await get<Folder[]>('grimoire_folders')) || [];
    if (folderId === targetParentId) return;

    const f = folders.find(item => item.id === folderId);
    if (f) {
      f.parentId = targetParentId;
      if (targetCategory) {
        f.category = targetCategory;
      }
      await set('grimoire_folders', folders);
      try {
        const db = await openDB('grimoire-db', 6);
        if (db.objectStoreNames.contains('folders')) {
          await db.put('folders', f);
        }
      } catch {}
    }
  }
};
