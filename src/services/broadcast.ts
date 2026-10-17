import type { MapPin, MapZone, MapToken, MapLighting } from './storage';

export interface ActiveRulerData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  distanceFt: number;
  color?: string;
}

export type ProjectionPayload = 
  | { 
      type: 'MAP'; 
      mapId: string; 
      imageUrl: string; 
      name: string;
      mapType: 'world' | 'tactical';
      gridCols?: number;
      gridRows?: number;
      ambientLighting?: MapLighting;
      activeRuler?: ActiveRulerData | null;
      fogOfWar?: {
        enabled: boolean;
        dynamicVision?: boolean;
        revealedCells: string[];
      };
      pins?: Omit<MapPin, 'isSecret'>[];
      zones?: Omit<MapZone, 'isSecret'>[];
      tokens?: Omit<MapToken, 'isSecret'>[];
    }
  | { type: 'IMAGE'; title: string; imageUrl: string; subtitle?: string }
  | { type: 'CLEAR' };

const STORAGE_KEY = 'grimoire:player_projection';
const CHANNEL_NAME = 'grimoire_player_display';

class ProjectionChannelManager {
  private channel: BroadcastChannel | null = null;
  private currentPayload: ProjectionPayload = { type: 'CLEAR' };
  private listeners: Set<(payload: ProjectionPayload) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.currentPayload = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Could not read projection from storage', e);
      }

      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.currentPayload = event.data;
            this.notify();
          }
        };
      }

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.currentPayload = JSON.parse(e.newValue);
            this.notify();
          } catch (_) {}
        }
      });
    }
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.currentPayload));
  }

  public project(payload: ProjectionPayload) {
    this.currentPayload = payload;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn("Storage quota exceeded or error storing projection:", err);
    }
    
    try {
      this.channel?.postMessage(payload);
    } catch (err) {
      console.warn("BroadcastChannel postMessage failed:", err);
    }

    this.notify();
  }

  public clear() {
    this.project({ type: 'CLEAR' });
  }

  public getPayload(): ProjectionPayload {
    return this.currentPayload;
  }

  public subscribe(fn: (payload: ProjectionPayload) => void): () => void {
    this.listeners.add(fn);
    fn(this.currentPayload);
    return () => this.listeners.delete(fn);
  }
}

export const ProjectionService = new ProjectionChannelManager();
