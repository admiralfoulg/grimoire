import { get, set, keys } from 'idb-keyval';
import { openDB } from 'idb';

export interface GrimoireBackupArchive {
  version: number;
  exportedAt: number;
  appName: 'Grimoire';
  worlds: any[];
  cards: any[];
  folders: any[];
  maps: any[];
  tokenTemplates: any[];
  combats: any[];
  sessions: any[];
  audioPresets: any[];
}

export const VaultService = {
  async exportCampaignSnapshot(): Promise<void> {
    const allKeys = await keys();
    const strKeys = allKeys.map(String);

    // 1. Collect Core Database Stores (supports both idb-keyval and raw IDB storage)
    let worlds = (await get<any[]>('grimoire_worlds')) || [];
    let cards = (await get<any[]>('grimoire_cards')) || [];
    let folders = (await get<any[]>('grimoire_folders')) || [];
    let maps = (await get<any[]>('grimoire_maps')) || [];
    let tokenTemplates = (await get<any[]>('grimoire_token_templates')) || [];
    let combats = (await get<any[]>('grimoire_combats')) || [];
    let sessions = (await get<any[]>('grimoire_sessions')) || [];

    // Fallback: If using structured IDB database directly
    try {
      const db = await openDB('grimoire-db', 6);
      if (db.objectStoreNames.contains('worlds')) worlds = await db.getAll('worlds');
      if (db.objectStoreNames.contains('cards')) cards = await db.getAll('cards');
      if (db.objectStoreNames.contains('folders')) folders = await db.getAll('folders');
      if (db.objectStoreNames.contains('maps')) maps = await db.getAll('maps');
      if (db.objectStoreNames.contains('saved_tokens')) tokenTemplates = await db.getAll('saved_tokens');
      if (db.objectStoreNames.contains('combats')) combats = await db.getAll('combats');
      if (db.objectStoreNames.contains('sessions')) sessions = await db.getAll('sessions');
    } catch {
      // idb-keyval stores take precedence if structured db does not exist
    }

    // 2. Collect Audio Presets
    const presetKeys = strKeys.filter(k => k.startsWith('grimoire:audio:preset:'));
    const audioPresets: any[] = [];
    for (const pk of presetKeys) {
      const p = await get<any>(pk);
      if (p) audioPresets.push(p);
    }

    const snapshot: GrimoireBackupArchive = {
      version: 6,
      exportedAt: Date.now(),
      appName: 'Grimoire',
      worlds,
      cards,
      folders,
      maps,
      tokenTemplates,
      combats,
      sessions,
      audioPresets
    };

    // 3. Trigger Browser JSON Download
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const activeWorldName = worlds[0]?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'campaign';
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeWorldName}_backup_${dateStr}.grimoire`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async importCampaignSnapshot(file: File): Promise<{ success: boolean; message: string }> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as GrimoireBackupArchive;

      if (!data || data.appName !== 'Grimoire' || !data.worlds) {
        return { success: false, message: 'Invalid or incompatible Grimoire backup file.' };
      }

      // Restore to idb-keyval stores
      if (Array.isArray(data.worlds)) await set('grimoire_worlds', data.worlds);
      if (Array.isArray(data.cards)) await set('grimoire_cards', data.cards);
      if (Array.isArray(data.folders)) await set('grimoire_folders', data.folders);
      if (Array.isArray(data.maps)) await set('grimoire_maps', data.maps);
      if (Array.isArray(data.tokenTemplates)) await set('grimoire_token_templates', data.tokenTemplates);
      if (Array.isArray(data.combats)) await set('grimoire_combats', data.combats);
      if (Array.isArray(data.sessions)) await set('grimoire_sessions', data.sessions);

      // Restore to structured IDB stores if present
      try {
        const db = await openDB('grimoire-db', 6);
        const tx = db.transaction(Array.from(db.objectStoreNames), 'readwrite');
        if (db.objectStoreNames.contains('worlds') && Array.isArray(data.worlds)) {
          for (const item of data.worlds) await tx.objectStore('worlds').put(item);
        }
        if (db.objectStoreNames.contains('cards') && Array.isArray(data.cards)) {
          for (const item of data.cards) await tx.objectStore('cards').put(item);
        }
        if (db.objectStoreNames.contains('folders') && Array.isArray(data.folders)) {
          for (const item of data.folders) await tx.objectStore('folders').put(item);
        }
        if (db.objectStoreNames.contains('maps') && Array.isArray(data.maps)) {
          for (const item of data.maps) await tx.objectStore('maps').put(item);
        }
        if (db.objectStoreNames.contains('saved_tokens') && Array.isArray(data.tokenTemplates)) {
          for (const item of data.tokenTemplates) await tx.objectStore('saved_tokens').put(item);
        }
        if (db.objectStoreNames.contains('combats') && Array.isArray(data.combats)) {
          for (const item of data.combats) await tx.objectStore('combats').put(item);
        }
        if (db.objectStoreNames.contains('sessions') && Array.isArray(data.sessions)) {
          for (const item of data.sessions) await tx.objectStore('sessions').put(item);
        }
        await tx.done;
      } catch {
        // Ignored if using flat idb-keyval
      }

      if (Array.isArray(data.audioPresets)) {
        for (const preset of data.audioPresets) {
          await set(`grimoire:audio:preset:${preset.id}`, preset);
        }
      }

      return { 
        success: true, 
        message: `Successfully imported ${data.cards?.length || 0} cards, ${data.maps?.length || 0} maps, and ${data.worlds?.length || 0} world(s)!` 
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to parse backup file.' };
    }
  }
};
