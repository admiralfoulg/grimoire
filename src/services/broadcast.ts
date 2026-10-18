export interface ProjectionPayload {
  type: 'MAP' | 'IMAGE' | 'CLEAR' | 'AUDIO';
  title?: string;
  imageUrl?: string;
  subtitle?: string;
  mapData?: any;
  audioType?: 'crit' | 'fail' | 'sword' | 'magic' | 'coins' | 'thunder' | 'custom';
  audioCustomId?: string;
}

class ProjectionManager {
  private channel: BroadcastChannel | null = null;
  private currentPayload: ProjectionPayload = { type: 'CLEAR' };

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('grimoire_projection_v1');
    }
  }

  public project(payload: ProjectionPayload) {
    this.currentPayload = payload;
    if (this.channel) {
      this.channel.postMessage(payload);
    }
  }

  public clear() {
    this.project({ type: 'CLEAR' });
  }

  public getPayload(): ProjectionPayload {
    return this.currentPayload;
  }

  public subscribe(callback: (payload: ProjectionPayload) => void): () => void {
    if (!this.channel) return () => {};

    const handler = (e: MessageEvent<ProjectionPayload>) => {
      this.currentPayload = e.data;
      callback(e.data);
    };

    this.channel.addEventListener('message', handler);
    return () => {
      this.channel?.removeEventListener('message', handler);
    };
  }
}

export const ProjectionService = new ProjectionManager();
