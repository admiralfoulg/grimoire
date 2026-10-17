import { get, set, del, keys } from 'idb-keyval';

export interface CustomTrack {
  id: string;
  name: string;
  type: 'ambience' | 'sfx';
  dataUrl?: string;
}

const PREFIX_AUDIO = 'grimoire:audio:';

class SoundboardManager {
  private ctx: AudioContext | null = null;
  private activeLoops: Map<string, { stop: () => void; setVolume: (v: number) => void }> = new Map();
  private decodedBufferCache: Map<string, AudioBuffer> = new Map();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- IndexedDB Custom Track Storage ---
  public async saveCustomTrack(file: File, type: 'ambience' | 'sfx'): Promise<CustomTrack> {
    const id = `custom-${crypto.randomUUID()}`;
    const arrayBuffer = await file.arrayBuffer();
    
    await set(`${PREFIX_AUDIO}${id}`, {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      type,
      buffer: arrayBuffer
    });

    const ctx = this.getContext();
    try {
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      this.decodedBufferCache.set(id, audioBuffer);
    } catch (e) {
      console.warn("Could not pre-decode buffer:", e);
    }

    return { id, name: file.name.replace(/\.[^/.]+$/, ""), type };
  }

  public async listCustomTracks(): Promise<{ id: string; name: string; type: 'ambience' | 'sfx' }[]> {
    const allKeys = await keys();
    const audioKeys = allKeys.filter(k => String(k).startsWith(PREFIX_AUDIO));
    const list = [];
    for (const k of audioKeys) {
      const item = await get<any>(k);
      if (item) {
        list.push({ id: item.id, name: item.name, type: item.type });
      }
    }
    return list;
  }

  public async deleteCustomTrack(id: string) {
    if (this.activeLoops.has(id)) {
      this.activeLoops.get(id)!.stop();
      this.activeLoops.delete(id);
    }
    this.decodedBufferCache.delete(id);
    await del(`${PREFIX_AUDIO}${id}`);
  }

  private async getOrLoadBuffer(id: string): Promise<AudioBuffer | null> {
    if (this.decodedBufferCache.has(id)) {
      return this.decodedBufferCache.get(id)!;
    }
    const item = await get<any>(`${PREFIX_AUDIO}${id}`);
    if (!item || !item.buffer) return null;

    const ctx = this.getContext();
    const audioBuffer = await ctx.decodeAudioData(item.buffer.slice(0));
    this.decodedBufferCache.set(id, audioBuffer);
    return audioBuffer;
  }

  // --- Custom Audio Playback ---
  public async playCustomSfx(id: string, volume: number = 0.8) {
    const buffer = await this.getOrLoadBuffer(id);
    if (!buffer) return;

    const ctx = this.getContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();

    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  }

  public async toggleCustomAmbience(id: string, volume: number = 0.5): Promise<boolean> {
    const ctx = this.getContext();

    if (this.activeLoops.has(id)) {
      this.activeLoops.get(id)!.stop();
      this.activeLoops.delete(id);
      return false;
    }

    const buffer = await this.getOrLoadBuffer(id);
    if (!buffer) return false;

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();

    source.buffer = buffer;
    source.loop = true;
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);

    this.activeLoops.set(id, {
      stop: () => {
        try { source.stop(); } catch (_) {}
      },
      setVolume: (v: number) => {
        gain.gain.setValueAtTime(v, ctx.currentTime);
      }
    });

    return true;
  }

  // --- Built-in Sounds & Fireplace ---
  public playSfx(type: 'crit' | 'fail' | 'sword' | 'magic' | 'coins') {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    if (type === 'crit') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } else if (type === 'fail') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.52);
    } else if (type === 'sword') {
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(10, now);
      noise.connect(filter);
      filter.connect(ctx.destination);
      noise.start(now);
    } else if (type === 'magic') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (type === 'coins') {
      [2400, 3100, 2750].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
    }
  }

  public async toggleAmbience(id: string, type: 'rain' | 'fire' | 'crypt', volume: number = 0.5): Promise<boolean> {
    if (this.activeLoops.has(id)) {
      this.activeLoops.get(id)!.stop();
      this.activeLoops.delete(id);
      return false;
    }

    if (type === 'fire') {
      try {
        const audio = new Audio('/audio/fireplace.mp3');
        audio.loop = true;
        audio.volume = Math.max(0, Math.min(1, volume));
        await audio.play();

        this.activeLoops.set(id, {
          stop: () => {
            audio.pause();
            audio.currentTime = 0;
          },
          setVolume: (v: number) => {
            audio.volume = Math.max(0, Math.min(1, v));
          }
        });
        return true;
      } catch (err) {
        console.error("Failed to play /audio/fireplace.mp3 via HTML5 Audio:", err);
        return false;
      }
    }

    const ctx = this.getContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (type === 'rain') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.1;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(masterGain);
      noiseSource.start();

      this.activeLoops.set(id, {
        stop: () => {
          try { noiseSource.stop(); } catch (_) {}
        },
        setVolume: (v: number) => {
          masterGain.gain.setValueAtTime(v, ctx.currentTime);
        }
      });
      return true;
    }

    if (type === 'crypt') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(56.5, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ctx.currentTime);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);

      osc.start();
      osc2.start();

      this.activeLoops.set(id, {
        stop: () => {
          try {
            osc.stop();
            osc2.stop();
          } catch (_) {}
        },
        setVolume: (v: number) => {
          masterGain.gain.setValueAtTime(v, ctx.currentTime);
        }
      });
      return true;
    }

    return false;
  }

  public setVolume(id: string, volume: number) {
    const loop = this.activeLoops.get(id);
    if (loop) {
      loop.setVolume(volume);
    }
  }

  public isPlaying(id: string): boolean {
    return this.activeLoops.has(id);
  }

  public stopAll() {
    this.activeLoops.forEach(loop => loop.stop());
    this.activeLoops.clear();
  }
}

export const SoundboardService = new SoundboardManager();
