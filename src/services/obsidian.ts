import { get, set } from 'idb-keyval';
import { openDB } from 'idb';

export interface LocalImportedCard {
  id: string;
  worldId: string;
  folderId?: string;
  name: string;
  type: 'character' | 'location' | 'faction' | 'item' | 'lore';
  aliases: string[];
  content: string;
  tags: string[];
  properties: Record<string, any>;
  updatedAt: number;
}

export interface LocalFolder {
  id: string;
  worldId: string;
  parentId?: string;
  name: string;
  category: 'character' | 'location' | 'faction' | 'item' | 'lore';
  createdAt: number;
}

export interface ObsidianImportResult {
  totalParsed: number;
  importedCards: number;
  importedFolders: number;
  errors: string[];
}

export const ObsidianService = {
  parseFrontmatterAndBody(raw: string): { frontmatter: Record<string, any>; body: string } {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('---')) {
      return { frontmatter: {}, body: trimmed };
    }

    const endIdx = trimmed.indexOf('\n---', 3);
    if (endIdx === -1) {
      return { frontmatter: {}, body: trimmed };
    }

    const yamlBlock = trimmed.slice(3, endIdx).trim();
    const body = trimmed.slice(endIdx + 4).trim();
    const frontmatter: Record<string, any> = {};

    yamlBlock.split('\n').forEach(line => {
      const colon = line.indexOf(':');
      if (colon > 0) {
        const key = line.slice(0, colon).trim();
        let val = line.slice(colon + 1).trim();

        val = val.replace(/^["'](.*)["']$/, '$1');

        if (val.startsWith('[') && val.endsWith(']')) {
          frontmatter[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["'](.*)["']$/, '$1'));
        } else {
          frontmatter[key] = val;
        }
      }
    });

    return { frontmatter, body };
  },

  inferCategory(pathOrTags: string): 'character' | 'location' | 'faction' | 'item' | 'lore' {
    const lower = pathOrTags.toLowerCase();
    if (lower.includes('char') || lower.includes('npc') || lower.includes('party')) return 'character';
    if (lower.includes('loc') || lower.includes('place') || lower.includes('cit') || lower.includes('dungeon')) return 'location';
    if (lower.includes('fact') || lower.includes('guild') || lower.includes('cult')) return 'faction';
    if (lower.includes('item') || lower.includes('loot') || lower.includes('relic')) return 'item';
    return 'lore';
  },

  async importObsidianFiles(files: FileList | File[], worldId: string): Promise<ObsidianImportResult> {
    const result: ObsidianImportResult = {
      totalParsed: 0,
      importedCards: 0,
      importedFolders: 0,
      errors: []
    };

    const fileArray = Array.from(files).filter(f => f.name.endsWith('.md') || f.name.endsWith('.txt'));
    result.totalParsed = fileArray.length;

    const existingCards = (await get<LocalImportedCard[]>('grimoire_cards')) || [];
    const existingFolders = (await get<LocalFolder[]>('grimoire_folders')) || [];
    
    const folderPathMap = new Map<string, string>();
    const newFolders: LocalFolder[] = [];
    const newCards: LocalImportedCard[] = [];

    // Helper: Find or create nested folder hierarchy from relative path
    const getOrCreateFolderId = (fullRelativePath: string, rootCategory: 'character' | 'location' | 'faction' | 'item' | 'lore'): string | undefined => {
      const segments = fullRelativePath.split('/').filter(Boolean);
      segments.pop(); // Remove filename, leave folder trail

      // Skip top-level root vault folder if present
      if (segments.length > 1) {
        segments.shift();
      } else if (segments.length === 1) {
        segments.shift();
      }

      if (segments.length === 0) return undefined;

      let parentId: string | undefined = undefined;
      let accumulatedPath = '';

      for (const segment of segments) {
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;

        if (folderPathMap.has(accumulatedPath)) {
          parentId = folderPathMap.get(accumulatedPath);
          continue;
        }

        const match = existingFolders.concat(newFolders).find(f => 
          f.name.toLowerCase() === segment.toLowerCase() && 
          f.parentId === parentId && 
          f.worldId === worldId
        );

        if (match) {
          parentId = match.id;
          folderPathMap.set(accumulatedPath, match.id);
        } else {
          const folderId = `folder-${crypto.randomUUID()}`;
          const newFolder: LocalFolder = {
            id: folderId,
            worldId,
            parentId,
            name: segment,
            category: rootCategory,
            createdAt: Date.now()
          };
          newFolders.push(newFolder);
          result.importedFolders++;
          folderPathMap.set(accumulatedPath, folderId);
          parentId = folderId;
        }
      }

      return parentId;
    };

    for (const file of fileArray) {
      try {
        const rawText = await file.text();
        const { frontmatter, body } = this.parseFrontmatterAndBody(rawText);

        const cardName = file.name.replace(/\.(md|txt)$/i, '').trim();
        const relativePath = (file as any).webkitRelativePath || file.name;
        
        const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags.join(' ') : String(frontmatter.tags || '');
        const cardType = this.inferCategory(`${relativePath} ${frontmatter.type || ''} ${tags}`);
        const assignedFolderId = getOrCreateFolderId(relativePath, cardType);

        let aliases: string[] = [];
        if (Array.isArray(frontmatter.aliases)) {
          aliases = frontmatter.aliases.map(String);
        } else if (typeof frontmatter.aliases === 'string') {
          aliases = frontmatter.aliases.split(',').map(s => s.trim()).filter(Boolean);
        }

        let parsedTags: string[] = [];
        if (Array.isArray(frontmatter.tags)) {
          parsedTags = frontmatter.tags.map(String);
        } else if (typeof frontmatter.tags === 'string') {
          parsedTags = frontmatter.tags.split(/[,\s]+/).map(s => s.replace(/^#/, '').trim()).filter(Boolean);
        }

        const newCard: LocalImportedCard = {
          id: `card-${crypto.randomUUID()}`,
          worldId,
          folderId: assignedFolderId,
          name: cardName,
          type: cardType,
          aliases,
          content: body,
          tags: parsedTags,
          properties: frontmatter,
          updatedAt: Date.now()
        };

        newCards.push(newCard);
        result.importedCards++;
      } catch (err: any) {
        result.errors.push(`Failed to import ${file.name}: ${err?.message || 'Unknown error'}`);
      }
    }

    // Persist new folders and cards to IndexedDB
    if (newFolders.length > 0) {
      const combinedFolders = [...existingFolders, ...newFolders];
      await set('grimoire_folders', combinedFolders);
    }

    if (newCards.length > 0) {
      const combinedCards = [...existingCards, ...newCards];
      await set('grimoire_cards', combinedCards);
    }

    try {
      const db = await openDB('grimoire-db', 6);
      if (db.objectStoreNames.contains('folders') && newFolders.length > 0) {
        const tx = db.transaction('folders', 'readwrite');
        for (const f of newFolders) await tx.store.put(f);
        await tx.done;
      }
      if (db.objectStoreNames.contains('cards') && newCards.length > 0) {
        const tx = db.transaction('cards', 'readwrite');
        for (const c of newCards) await tx.store.put(c);
        await tx.done;
      }
    } catch {}

    return result;
  }
};
