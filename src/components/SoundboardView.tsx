import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Play, 
  Square, 
  Upload, 
  Trash2, 
  Bookmark, 
  BookmarkPlus, 
  Radio, 
  Sparkles, 
  Flame, 
  CloudRain, 
  Skull, 
  Beer, 
  Swords, 
  Coins, 
  AlertTriangle 
} from 'lucide-react';
import { SoundboardService } from '../services/soundboard';
import { ProjectionService } from '../services/broadcast';

export interface LocalAudioTrack {
  id: string;
  name: string;
  blob?: Blob;
  type: 'ambience' | 'sfx';
  createdAt?: number;
}

export interface LocalSoundPreset {
  id: string;
  name: string;
  activeChannelIds: string[];
  volumes: Record<string, number>;
  createdAt?: number;
}

interface BuiltinChannel {
  id: string;
  name: string;
  category: 'weather' | 'dungeon' | 'tavern';
  icon: React.ReactNode;
  url: string;
}

const BUILTIN_CHANNELS: BuiltinChannel[] = [
  { 
    id: 'amb-fire', 
    name: 'Campfire & Hearth', 
    category: 'tavern', 
    icon: <Flame size={16} className="text-amber-400" />, 
    url: '/audio/fireplace.mp3' 
  },
  { 
    id: 'amb-rain', 
    name: 'Storm & Rainfall', 
    category: 'weather', 
    icon: <CloudRain size={16} className="text-blue-400" />, 
    url: '/audio/Rain-thunder.mp3' 
  },
  { 
    id: 'amb-crypt', 
    name: 'Catacomb Drone', 
    category: 'dungeon', 
    icon: <Skull size={16} className="text-purple-400" />, 
    url: '/audio/Catacombs.mp3' 
  },
  { 
    id: 'amb-tavern', 
    name: 'Tavern Music', 
    category: 'tavern', 
    icon: <Beer size={16} className="text-amber-300" />, 
    url: '/audio/tavern.mp3' 
  }
];

export const SoundboardView: React.FC = () => {
  const [activeChannels, setActiveChannels] = useState<Record<string, boolean>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({
    'amb-fire': 0.5,
    'amb-rain': 0.5,
    'amb-crypt': 0.5,
    'amb-tavern': 0.5
  });

  const [customTracks, setCustomTracks] = useState<LocalAudioTrack[]>([]);
  const [presets, setPresets] = useState<LocalSoundPreset[]>([]);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [castToPlayer, setCastToPlayer] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadType, setUploadType] = useState<'ambience' | 'sfx'>('ambience');

  const refreshData = async () => {
    try {
      const [t, p] = await Promise.all([
        SoundboardService.listTracks ? SoundboardService.listTracks() : Promise.resolve([]),
        SoundboardService.listPresets ? SoundboardService.listPresets() : Promise.resolve([])
      ]);
      setCustomTracks(t || []);
      setPresets(p || []);
    } catch (e) {
      console.warn('Audio data refresh skipped:', e);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const toggleBuiltin = async (ch: BuiltinChannel) => {
    const isPlaying = SoundboardService.isPlaying ? SoundboardService.isPlaying(ch.id) : false;
    if (isPlaying) {
      SoundboardService.stopChannel(ch.id);
      setActiveChannels(prev => ({ ...prev, [ch.id]: false }));
    } else {
      const vol = volumes[ch.id] ?? 0.5;
      const started = await SoundboardService.playStaticOrUrlAmbience(ch.id, ch.url, vol);
      if (started) {
        setActiveChannels(prev => ({ ...prev, [ch.id]: true }));
      }
    }
  };

  const toggleCustomAmbience = async (trackId: string) => {
    const vol = volumes[trackId] ?? 0.5;
    if (SoundboardService.toggleCustomAmbience) {
      const isNowPlaying = await SoundboardService.toggleCustomAmbience(trackId, vol);
      setActiveChannels(prev => ({ ...prev, [trackId]: isNowPlaying }));
    }
  };

  const handleVolume = (id: string, vol: number) => {
    setVolumes(prev => ({ ...prev, [id]: vol }));
    if (SoundboardService.setVolume) {
      SoundboardService.setVolume(id, vol);
    }
  };

  const handleStopAll = () => {
    if (SoundboardService.stopAll) {
      SoundboardService.stopAll();
    }
    setActiveChannels({});
  };

  const triggerProceduralSfx = (type: 'crit' | 'fail' | 'sword' | 'magic' | 'coins' | 'thunder') => {
    if (SoundboardService.playProceduralSfx) {
      SoundboardService.playProceduralSfx(type);
    }
    if (castToPlayer && ProjectionService?.project) {
      ProjectionService.project({
        type: 'AUDIO',
        audioType: type
      });
    }
  };

  const triggerCustomSfx = (trackId: string) => {
    if (SoundboardService.playCustomSfx) {
      void SoundboardService.playCustomSfx(trackId);
    }
    if (castToPlayer && ProjectionService?.project) {
      ProjectionService.project({
        type: 'AUDIO',
        audioType: 'custom',
        audioCustomId: trackId
      });
    }
  };

  const saveCurrentPreset = async () => {
    if (!presetNameInput.trim() || !SoundboardService.savePreset) return;
    const activeIds = Object.keys(activeChannels).filter(id => activeChannels[id]);
    await SoundboardService.savePreset(presetNameInput.trim(), activeIds, volumes);
    setPresetNameInput('');
    await refreshData();
  };

  const applyPreset = async (preset: LocalSoundPreset) => {
    handleStopAll();
    const newActive: Record<string, boolean> = {};
    const newVolumes = { ...volumes, ...preset.volumes };

    for (const id of preset.activeChannelIds) {
      const vol = newVolumes[id] ?? 0.5;
      const builtin = BUILTIN_CHANNELS.find(b => b.id === id);
      if (builtin && builtin.url) {
        await SoundboardService.playStaticOrUrlAmbience(id, builtin.url, vol);
        newActive[id] = true;
      } else if (SoundboardService.toggleCustomAmbience) {
        const started = await SoundboardService.toggleCustomAmbience(id, vol);
        if (started) newActive[id] = true;
      }
    }

    setVolumes(newVolumes);
    setActiveChannels(newActive);
  };

  const deletePreset = async (id: string) => {
    if (SoundboardService.deletePreset) {
      await SoundboardService.deletePreset(id);
      await refreshData();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !SoundboardService.saveTrack) return;
    await SoundboardService.saveTrack(file, uploadType);
    await refreshData();
    e.target.value = '';
  };

  const handleDeleteTrack = async (id: string) => {
    if (SoundboardService.deleteTrack) {
      await SoundboardService.deleteTrack(id);
    }
    setActiveChannels(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await refreshData();
  };

  const customAmbience = customTracks.filter(t => t.type === 'ambience');
  const customSfx = customTracks.filter(t => t.type === 'sfx');
  const currentlyPlayingIds = Object.keys(activeChannels).filter(id => activeChannels[id]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d13] text-slate-200 select-none overflow-hidden font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header */}
      <div className="h-14 px-6 border-b border-white/5 bg-[#121620]/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Volume2 size={18} className="text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Audio Mixer & Ambience
          </h2>
          <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
            {currentlyPlayingIds.length} Channel{currentlyPlayingIds.length === 1 ? '' : 's'} Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCastToPlayer(!castToPlayer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              castToPlayer
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
            title="Broadcast triggered SFX over the Player Display Window"
          >
            <Radio size={13} className={castToPlayer ? 'animate-pulse' : ''} />
            Player Screen Sync: {castToPlayer ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={handleStopAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
          >
            <Square size={12} /> Master Mute All
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full flex flex-col gap-6">

        {/* Presets Toolbar */}
        <div className="p-4 rounded-xl bg-[#111722] border border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bookmark size={15} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Atmosphere Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 ml-2">
              {presets.length === 0 && (
                <span className="text-xs text-slate-500 italic">No saved presets yet</span>
              )}
              {presets.map(p => (
                <div key={p.id} className="flex items-center bg-[#18212e] border border-white/10 rounded-lg pl-2.5 pr-1 py-1 text-xs">
                  <button
                    onClick={() => applyPreset(p)}
                    className="text-slate-200 hover:text-amber-400 font-medium mr-1.5"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => deletePreset(p.id)}
                    className="text-slate-600 hover:text-red-400 p-0.5"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New preset name..."
              value={presetNameInput}
              onChange={e => setPresetNameInput(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50"
            />
            <button
              onClick={saveCurrentPreset}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold"
            >
              <BookmarkPlus size={13} /> Save Mix
            </button>
          </div>
        </div>

        {/* Ambient Channels Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Multi-Channel Environmental Loops
            </span>
            <button
              onClick={() => {
                setUploadType('ambience');
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
            >
              <Upload size={12} /> Upload Custom Loop
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {BUILTIN_CHANNELS.map(ch => {
              const isPlaying = Boolean(activeChannels[ch.id]);
              return (
                <div
                  key={ch.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isPlaying
                      ? 'bg-[#18212e] border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-[#111722] border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5">{ch.icon}</div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{ch.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono">{ch.category}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleBuiltin(ch)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {isPlaying ? <Square size={11} /> : <Play size={11} className="ml-0.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <Volume2 size={12} className="text-slate-500" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volumes[ch.id] ?? 0.5}
                      onChange={e => handleVolume(ch.id, parseFloat(e.target.value))}
                      className="w-full accent-amber-500 bg-white/10 h-1 rounded outline-none cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}

            {/* Custom Loops */}
            {customAmbience.map(t => {
              const isPlaying = Boolean(activeChannels[t.id]);
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isPlaying
                      ? 'bg-[#18212e] border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-[#111722] border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <Flame size={14} />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-200 truncate">{t.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono">Custom Loop</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleCustomAmbience(t.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isPlaying
                            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                            : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {isPlaying ? <Square size={11} /> : <Play size={11} className="ml-0.5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteTrack(t.id)}
                        className="text-slate-600 hover:text-red-400 p-1"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <Volume2 size={12} className="text-slate-500" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volumes[t.id] ?? 0.5}
                      onChange={e => handleVolume(t.id, parseFloat(e.target.value))}
                      className="w-full accent-amber-500 bg-white/10 h-1 rounded outline-none cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Combat & Table SFX Pads */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              One-Shot Action Soundboard
            </span>
            <button
              onClick={() => {
                setUploadType('sfx');
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
            >
              <Upload size={12} /> Add Custom SFX
            </button>
          </div>

          <div className="grid grid-cols-6 gap-3">
            <button
              onClick={() => triggerProceduralSfx('crit')}
              className="p-3 rounded-xl bg-[#141b25] border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={15} />
              </div>
              <span className="text-xs font-bold text-slate-200">Crit Fanfare</span>
            </button>

            <button
              onClick={() => triggerProceduralSfx('fail')}
              className="p-3 rounded-xl bg-[#141b25] border border-white/5 hover:border-red-500/40 hover:bg-red-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle size={15} />
              </div>
              <span className="text-xs font-bold text-slate-200">Crit Fumble</span>
            </button>

            <button
              onClick={() => triggerProceduralSfx('sword')}
              className="p-3 rounded-xl bg-[#141b25] border border-white/5 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Swords size={15} />
              </div>
              <span className="text-xs font-bold text-slate-200">Blade Clash</span>
            </button>

            <button
              onClick={() => triggerProceduralSfx('magic')}
              className="p-3 rounded-xl bg-[#141b25] border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={15} />
              </div>
              <span className="text-xs font-bold text-slate-200">Spell Resonance</span>
            </button>

            <button
              onClick={() => triggerProceduralSfx('coins')}
              className="p-3 rounded-xl bg-[#141b25] border border-white/5 hover:border-yellow-500/40 hover:bg-yellow-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Coins size={15} />
              </div>
              <span className="text-xs font-bold text-slate-200">Gold Loot</span>
            </button>

            <button
              onClick={() => triggerProceduralSfx('thunder')}
              className="p-3 rounded-xl bg-[#141b25] border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CloudRain size={15} />
              </div>
              <span className="text-xs font-bold text-slate-200">Thunderstrike</span>
            </button>
          </div>

          {/* Custom SFX Row */}
          {customSfx.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {customSfx.map(s => (
                <div key={s.id} className="flex items-center gap-1.5 bg-[#141b25] border border-white/10 rounded-lg px-2.5 py-1.5">
                  <button
                    onClick={() => triggerCustomSfx(s.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-amber-400"
                  >
                    <Play size={10} className="text-amber-400 fill-amber-400" />
                    <span className="truncate max-w-[130px]">{s.name}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTrack(s.id)}
                    className="text-slate-600 hover:text-red-400 ml-1"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
