import React, { useState, useEffect, useRef } from 'react';
import { SoundboardService } from '../services/soundboard';
import type { CustomAudioTrack, SoundboardPreset } from '../services/soundboard';
import { ProjectionService } from '../services/broadcast';
import {
  Volume2,
  CloudRain,
  Flame,
  Skull,
  Sparkles,
  Swords,
  Coins,
  AlertTriangle,
  Play,
  Square,
  Upload,
  Trash2,
  Music,
  Bookmark,
  Zap,
  Sliders,
  Tv
} from 'lucide-react';

interface BuiltinChannel {
  id: string;
  name: string;
  fileBasenames: string[];
  icon: React.ReactNode;
  description: string;
}

const BUILTIN_CHANNELS: BuiltinChannel[] = [
  {
    id: 'amb-fire',
    name: 'Campfire & Hearth',
    fileBasenames: ['fireplace.mp3', 'fireplace.mp3.mp3', 'Fireplace.mp3'],
    icon: <Flame size={18} className="text-amber-400" />,
    description: 'Warm crackling embers and glowing hearth'
  },
  {
    id: 'amb-rain',
    name: 'Thunderous Rainfall',
    fileBasenames: ['Rain-thunder.mp3', 'Rain-thunder.mp3.mp3', 'rain-thunder.mp3'],
    icon: <CloudRain size={18} className="text-blue-400" />,
    description: 'Relentless storm downpour and distant thunder'
  },
  {
    id: 'amb-crypt',
    name: 'Whispering Catacomb',
    fileBasenames: ['Catacombs.mp3', 'Catacombs.mp3.mp3', 'catacombs.mp3'],
    icon: <Skull size={18} className="text-purple-400" />,
    description: 'Subsonic dungeon drone and spectral whispers'
  }
];

export const SoundboardView: React.FC = () => {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({
    'amb-fire': 0.5,
    'amb-rain': 0.5,
    'amb-crypt': 0.5
  });
  const [customTracks, setCustomTracks] = useState<CustomAudioTrack[]>([]);
  const [presets, setPresets] = useState<SoundboardPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [syncToPlayerDisplay, setSyncToPlayerDisplay] = useState(true);

  const ambienceUploadRef = useRef<HTMLInputElement | null>(null);
  const sfxUploadRef = useRef<HTMLInputElement | null>(null);

  const reloadData = async () => {
    const [t, p] = await Promise.all([
      SoundboardService.listTracks(),
      SoundboardService.listPresets()
    ]);
    setCustomTracks(t);
    setPresets(p);
  };

  useEffect(() => {
    void reloadData();
  }, []);

  const triggerSfx = (type: 'crit' | 'fail' | 'sword' | 'magic' | 'coins' | 'thunder') => {
    SoundboardService.playProceduralSfx(type);
    if (syncToPlayerDisplay) {
      ProjectionService.project({
        type: 'AUDIO',
        audioType: type
      });
    }
  };

  const triggerCustomSfx = (id: string) => {
    SoundboardService.playCustomSfx(id);
    if (syncToPlayerDisplay) {
      ProjectionService.project({
        type: 'AUDIO',
        audioType: 'custom',
        audioCustomId: id
      });
    }
  };

  const toggleBuiltin = async (channel: BuiltinChannel) => {
    const currentPlaying = activeStates[channel.id];
    if (currentPlaying) {
      SoundboardService.stopChannel(channel.id);
      setActiveStates(prev => ({ ...prev, [channel.id]: false }));
      return;
    }

    const vol = volumes[channel.id] ?? 0.5;
    const url = `/audio/${channel.fileBasenames[0]}?t=${Date.now()}`;
    const started = await SoundboardService.playStaticOrUrlAmbience(channel.id, url, vol);
    setActiveStates(prev => ({ ...prev, [channel.id]: started }));
  };

  const toggleCustomLoop = async (id: string) => {
    const currentPlaying = activeStates[id];
    if (currentPlaying) {
      SoundboardService.stopChannel(id);
      setActiveStates(prev => ({ ...prev, [id]: false }));
      return;
    }
    const vol = volumes[id] ?? 0.5;
    const started = await SoundboardService.toggleCustomAmbience(id, vol);
    setActiveStates(prev => ({ ...prev, [id]: started }));
  };

  const handleVolumeChange = (id: string, vol: number) => {
    setVolumes(prev => ({ ...prev, [id]: vol }));
    SoundboardService.setVolume(id, vol);
  };

  const handleStopAll = () => {
    SoundboardService.stopAll();
    setActiveStates({});
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ambience' | 'sfx') => {
    const file = e.target.files?.[0];
    if (!file) return;
    await SoundboardService.saveTrack(file, type);
    await reloadData();
    e.target.value = '';
  };

  const handleDeleteTrack = async (id: string) => {
    await SoundboardService.deleteTrack(id);
    setActiveStates(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await reloadData();
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;
    const activeIds = Object.keys(activeStates).filter(k => activeStates[k]);
    await SoundboardService.savePreset(newPresetName.trim(), activeIds, volumes);
    setNewPresetName('');
    setIsCreatingPreset(false);
    await reloadData();
  };

  const handleApplyPreset = async (preset: SoundboardPreset) => {
    handleStopAll();
    const newActive: Record<string, boolean> = {};
    const newVols = { ...volumes, ...preset.volumes };
    setVolumes(newVols);

    for (const channelId of preset.activeChannelIds) {
      const builtin = BUILTIN_CHANNELS.find(b => b.id === channelId);
      const vol = newVols[channelId] ?? 0.5;
      if (builtin) {
        const url = `/audio/${builtin.fileBasenames[0]}?t=${Date.now()}`;
        const started = await SoundboardService.playStaticOrUrlAmbience(channelId, url, vol);
        if (started) newActive[channelId] = true;
      } else {
        const started = await SoundboardService.toggleCustomAmbience(channelId, vol);
        if (started) newActive[channelId] = true;
      }
    }
    setActiveStates(newActive);
  };

  const handleDeletePreset = async (id: string) => {
    await SoundboardService.deletePreset(id);
    await reloadData();
  };

  const customLoops = customTracks.filter(t => t.type === 'ambience');
  const customSfx = customTracks.filter(t => t.type === 'sfx');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d13] text-slate-200 select-none overflow-hidden font-sans">
      <div className="h-14 px-8 border-b border-white/5 bg-[#121620]/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Volume2 size={18} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Table Atmosphere & Audio Engine
          </span>
          <span className="text-xs text-slate-500 font-mono">
            (Multi-Channel Offline Mixer)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSyncToPlayerDisplay(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              syncToPlayerDisplay
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
            title="When active, triggers SFX through player display window too"
          >
            <Tv size={13} />
            <span>Cast to Table: {syncToPlayerDisplay ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setIsCreatingPreset(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition-colors"
          >
            <Bookmark size={13} className="text-amber-400" /> Save Preset
          </button>
          <button
            onClick={handleStopAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
          >
            <Square size={11} /> Stop All Audio
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full flex flex-col gap-8">
        <input
          ref={ambienceUploadRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => handleFileUpload(e, 'ambience')}
        />
        <input
          ref={sfxUploadRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => handleFileUpload(e, 'sfx')}
        />

        {isCreatingPreset && (
          <div className="p-4 rounded-2xl bg-[#141b26] border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bookmark size={16} className="text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                Save active atmosphere configuration:
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <input
                type="text"
                placeholder="e.g. Rainy Tavern Ambush..."
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                className="w-full bg-[#0b0e14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400"
              />
              <button
                onClick={handleSavePreset}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors shrink-0"
              >
                Save
              </button>
              <button
                onClick={() => setIsCreatingPreset(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 text-xs rounded-lg transition-colors shrink-0"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {presets.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bookmark size={13} className="text-amber-400" /> Atmosphere Presets ({presets.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141b25] border border-white/10 hover:border-amber-500/30 transition-colors"
                >
                  <button
                    onClick={() => handleApplyPreset(p)}
                    className="text-xs font-semibold text-slate-200 hover:text-amber-400 flex items-center gap-1.5"
                  >
                    <Play size={10} className="text-amber-400 fill-amber-400" />
                    {p.name}
                  </button>
                  <button
                    onClick={() => handleDeletePreset(p.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors ml-1"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sliders size={14} /> Core Environmental Channels
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {BUILTIN_CHANNELS.map(ch => {
              const isPlaying = Boolean(activeStates[ch.id]);
              return (
                <div
                  key={ch.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    isPlaying
                      ? 'bg-[#18212e] border-amber-500/40 shadow-xl shadow-amber-500/5'
                      : 'bg-[#111722] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-white/5">{ch.icon}</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{ch.name}</h4>
                        <span className="text-[10px] text-slate-500">
                          {isPlaying ? 'Active Channel' : 'Muted'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleBuiltin(ch)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {isPlaying ? <Square size={12} /> : <Play size={12} className="ml-0.5" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {ch.description}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <Volume2 size={12} className="text-slate-500" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volumes[ch.id] ?? 0.5}
                      onChange={e => handleVolumeChange(ch.id, parseFloat(e.target.value))}
                      className="w-full accent-amber-500 bg-white/10 h-1 rounded outline-none cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Music size={14} /> Custom Audio & Ambient Loops ({customLoops.length})
            </span>
            <button
              onClick={() => ambienceUploadRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors"
            >
              <Upload size={12} /> Upload Audio (.mp3, .wav, .ogg)
            </button>
          </div>

          {customLoops.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-1.5">
              <span className="text-xs text-slate-400">No custom ambient loops uploaded.</span>
              <span className="text-[10px] text-slate-600">Files are decoded and saved locally in IndexedDB.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {customLoops.map(track => {
                const isPlaying = Boolean(activeStates[track.id]);
                return (
                  <div
                    key={track.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isPlaying
                        ? 'bg-[#18212e] border-amber-500/40 shadow-xl shadow-amber-500/5'
                        : 'bg-[#111722] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                          <Music size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-100 truncate">{track.name}</h4>
                          <span className="text-[10px] text-slate-500">{isPlaying ? 'Looping' : 'Stopped'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleCustomLoop(track.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            isPlaying
                              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {isPlaying ? <Square size={11} /> : <Play size={11} className="ml-0.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          className="p-1 hover:text-red-400 text-slate-600 transition-colors"
                        >
                          <Trash2 size={13} />
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
                        value={volumes[track.id] ?? 0.5}
                        onChange={e => handleVolumeChange(track.id, parseFloat(e.target.value))}
                        className="w-full accent-amber-500 bg-white/10 h-1 rounded outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" /> Table SFX & Combat Action Pads
            </span>
            <button
              onClick={() => sfxUploadRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-colors"
            >
              <Upload size={12} /> Add One-Shot SFX
            </button>
          </div>

          <div className="grid grid-cols-6 gap-3">
            <button
              onClick={() => triggerSfx('crit')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Crit Fanfare</span>
            </button>

            <button
              onClick={() => triggerSfx('fail')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-red-500/40 hover:bg-red-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Crit Fumble</span>
            </button>

            <button
              onClick={() => triggerSfx('sword')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Swords size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Blade Clash</span>
            </button>

            <button
              onClick={() => triggerSfx('magic')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Spell Cast</span>
            </button>

            <button
              onClick={() => triggerSfx('coins')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-yellow-500/40 hover:bg-yellow-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Coins size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Gold Loot</span>
            </button>

            <button
              onClick={() => triggerSfx('thunder')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Thunder Clap</span>
            </button>
          </div>

          {customSfx.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-2">
              {customSfx.map(s => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 bg-[#141b25] border border-white/10 rounded-xl px-3 py-2"
                >
                  <button
                    onClick={() => triggerCustomSfx(s.id)}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-amber-400"
                  >
                    <Play size={10} className="text-amber-400 fill-amber-400" />
                    <span className="truncate max-w-[150px]">{s.name}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTrack(s.id)}
                    className="text-slate-600 hover:text-red-400 ml-1.5"
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
