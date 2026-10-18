import { get, set, del, keys } from 'idb-keyval';

export interface CustomAudioTrack {
  id: string;
  name: string;
  blob: Blob;
  type: 'ambience' | 'sfx';
  createdAt: number;
}

export interface SoundboardPreset {
  id: string;
  name: string;
  activeChannelIds: string[];
  volumes: Record<string, number>;
  createdAt: number;
}

const PREFIX_TRACK = 'grimoire:audio:track:';
const PREFIX_PRESET = 'grimoire:audio:preset:';

class SoundboardEngine {
  private ctx: AudioContext | null = null;
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private customSources: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  // --- Track CRUD ---
  async saveTrack(file: File, type: 'ambience' | 'sfx'): Promise<CustomAudioTrack> {
    const id = `track-${crypto.randomUUID()}`;
    const track: CustomAudioTrack = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ''),
      blob: file,
      type,
      createdAt: Date.now()
    };
    await set(`${PREFIX_TRACK}${id}`, track);
    return track;
  }

  async listTracks(): Promise<CustomAudioTrack[]> {
    const allKeys = await keys();
    const trackKeys = allKeys.filter(k => String(k).startsWith(PREFIX_TRACK));
    const tracks: CustomAudioTrack[] = [];
    for (const k of trackKeys) {
      const t = await get<CustomAudioTrack>(k);
      if (t) tracks.push(t);
    }
    return tracks.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteTrack(id: string): Promise<void> {
    this.stopChannel(id);
    await del(`${PREFIX_TRACK}${id}`);
  }

  // --- Preset CRUD ---
  async savePreset(name: string, activeChannelIds: string[], volumes: Record<string, number>): Promise<SoundboardPreset> {
    const id = `preset-${crypto.randomUUID()}`;
    const preset: SoundboardPreset = {
      id,
      name,
      activeChannelIds,
      volumes,
      createdAt: Date.now()
    };
    await set(`${PREFIX_PRESET}${id}`, preset);
    return preset;
  }

  async listPresets(): Promise<SoundboardPreset[]> {
    const allKeys = await keys();
    const presetKeys = allKeys.filter(k => String(k).startsWith(PREFIX_PRESET));
    const presets: SoundboardPreset[] = [];
    for (const k of presetKeys) {
      const p = await get<SoundboardPreset>(k);
      if (p) presets.push(p);
    }
    return presets.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deletePreset(id: string): Promise<void> {
    await del(`${PREFIX_PRESET}${id}`);
  }

  // --- Playback & Volume ---
  isPlaying(channelId: string): boolean {
    const el = this.audioElements.get(channelId);
    if (el) return !el.paused;
    return this.customSources.has(channelId);
  }

  setVolume(channelId: string, volume: number) {
    const safeVol = Math.max(0, Math.min(1, volume));
    const el = this.audioElements.get(channelId);
    if (el) {
      el.volume = safeVol;
    }
    const custom = this.customSources.get(channelId);
    if (custom) {
      custom.gain.gain.value = safeVol;
    }
  }

  stopChannel(channelId: string) {
    const el = this.audioElements.get(channelId);
    if (el) {
      el.pause();
      el.currentTime = 0;
      this.audioElements.delete(channelId);
    }

    const custom = this.customSources.get(channelId);
    if (custom) {
      try {
        custom.source.stop();
      } catch {}
      this.customSources.delete(channelId);
    }
  }

  stopAll() {
    this.audioElements.forEach((el) => {
      el.pause();
      el.currentTime = 0;
    });
    this.audioElements.clear();

    this.customSources.forEach(({ source }) => {
      try {
        source.stop();
      } catch {}
    });
    this.customSources.clear();
  }

  // Clean Native HTML5 Audio Looper (No synthetic buzzing fallback)
  async playStaticOrUrlAmbience(channelId: string, url: string, volume: number = 0.5): Promise<boolean> {
    this.stopChannel(channelId);

    try {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = Math.max(0, Math.min(1, volume));

      await audio.play();
      this.audioElements.set(channelId, audio);
      return true;
    } catch (err) {
      console.error(`Failed to play ${url}:`, err);
      return false;
    }
  }

  async toggleCustomAmbience(trackId: string, volume: number = 0.5): Promise<boolean> {
    if (this.isPlaying(trackId)) {
      this.stopChannel(trackId);
      return false;
    }

    const track = await get<CustomAudioTrack>(`${PREFIX_TRACK}${trackId}`);
    if (!track) return false;

    const ctx = this.getAudioContext();
    const arrayBuffer = await track.blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volume));

    source.connect(gain);
    gain.connect(ctx.destination);

    source.start(0);
    this.customSources.set(trackId, { source, gain });
    return true;
  }

  async playCustomSfx(trackId: string) {
    const track = await get<CustomAudioTrack>(`${PREFIX_TRACK}${trackId}`);
    if (!track) return;

    const ctx = this.getAudioContext();
    const arrayBuffer = await track.blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0);
  }

  playProceduralSfx(type: 'crit' | 'fail' | 'sword' | 'magic' | 'coins' | 'thunder') {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'crit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.50, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.5);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'sword') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'magic') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'coins') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.setValueAtTime(2400, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'thunder') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.8);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.start(now);
      osc.stop(now + 0.9);
    }
  }
}

export const SoundboardService = new SoundboardEngine();
