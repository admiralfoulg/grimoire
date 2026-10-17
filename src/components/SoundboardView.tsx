import React, { useState, useEffect, useRef } from 'react';
import { SoundboardService } from '../services/soundboard';
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
  Music
} from 'lucide-react';

interface AmbienceChannel {
  id: string;
  name: string;
  fileBasenames: string[]; // Variations to match Windows case/extension differences
  icon: React.ReactNode;
  description: string;
}

const BUILTIN_AMBIENCE: AmbienceChannel[] = [
  { 
    id: 'amb-fire', 
    name: 'Campfire & Hearth', 
    fileBasenames: ['fireplace.mp3', 'fireplace.mp3.mp3', 'Fireplace.mp3'],
    icon: <Flame size={18} className="text-amber-400" />, 
    description: 'Warm embers and gentle crackling pine' 
  },
  { 
    id: 'amb-rain', 
    name: 'Thunderous Rainfall', 
    fileBasenames: ['Rain-thunder.mp3', 'Rain-thunder.mp3.mp3', 'rain-thunder.mp3', 'rain.mp3'],
    icon: <CloudRain size={18} className="text-blue-400" />, 
    description: 'Continuous storm downpour and low rumble' 
  },
  { 
    id: 'amb-crypt', 
    name: 'Whispering Catacomb', 
    fileBasenames: ['Catacombs.mp3', 'Catacombs.mp3.mp3', 'catacombs.mp3'],
    icon: <Skull size={18} className="text-purple-400" />, 
    description: 'Deep eerie atmospheric dungeon ambiance' 
  }
];

export const SoundboardView: React.FC = () => {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({
    'amb-fire': 0.5,
    'amb-rain': 0.5,
    'amb-crypt': 0.5
  });
  const [customTracks, setCustomTracks] = useState<{ id: string; name: string; type: 'ambience' | 'sfx' }[]>([]);

  // Persistent audio elements for the 3 primary loops
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  const ambienceUploadRef = useRef<HTMLInputElement | null>(null);
  const sfxUploadRef = useRef<HTMLInputElement | null>(null);

  const loadTracks = async () => {
    const list = await SoundboardService.listCustomTracks();
    setCustomTracks(list);
  };

  useEffect(() => {
    loadTracks();

    const cacheBuster = Date.now();
    const elements: Record<string, HTMLAudioElement> = {};

    BUILTIN_AMBIENCE.forEach(ch => {
      const primaryUrl = `/audio/${ch.fileBasenames[0]}?t=${cacheBuster}`;
      const audio = new Audio(primaryUrl);
      audio.loop = true;
      audio.preload = 'auto';

      let fallbackIndex = 0;
      audio.onerror = () => {
        fallbackIndex += 1;
        if (fallbackIndex < ch.fileBasenames.length) {
          audio.src = `/audio/${ch.fileBasenames[fallbackIndex]}?t=${cacheBuster}`;
          audio.load();
        }
      };

      elements[ch.id] = audio;
    });

    audioElementsRef.current = elements;

    return () => {
      Object.values(elements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  const toggleBuiltinTrack = async (channel: AmbienceChannel) => {
    const id = channel.id;
    const vol = volumes[id] ?? 0.5;
    const audio = audioElementsRef.current[id];

    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      setActiveStates(prev => ({ ...prev, [id]: false }));
    } else {
      audio.volume = vol;
      try {
        await audio.play();
        setActiveStates(prev => ({ ...prev, [id]: true }));
      } catch (err) {
        console.error(`Audio playback error for ${channel.name}:`, err);
        alert(`Could not play ${channel.name}. Ensure ${channel.fileBasenames[0]} is placed inside public/audio/.`);
      }
    }
  };

  const toggleCustomLoop = async (id: string) => {
    const vol = volumes[id] ?? 0.5;
    const isNowPlaying = await SoundboardService.toggleCustomAmbience(id, vol);
    setActiveStates(prev => ({ ...prev, [id]: isNowPlaying }));
  };

  const handleVolumeChange = (id: string, vol: number) => {
    setVolumes(prev => ({ ...prev, [id]: vol }));
    const audio = audioElementsRef.current[id];
    if (audio) {
      audio.volume = vol;
    } else {
      SoundboardService.setVolume(id, vol);
    }
  };

  const handleStopAll = () => {
    Object.values(audioElementsRef.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    SoundboardService.stopAll();
    setActiveStates({});
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ambience' | 'sfx') => {
    const file = e.target.files?.[0];
    if (!file) return;
    await SoundboardService.saveCustomTrack(file, type);
    await loadTracks();
    e.target.value = '';
  };

  const handleDeleteCustom = async (id: string) => {
    await SoundboardService.deleteCustomTrack(id);
    setActiveStates(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await loadTracks();
  };

  const customLoops = customTracks.filter(t => t.type === 'ambience');
  const customSfx = customTracks.filter(t => t.type === 'sfx');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d13] text-slate-200 select-none overflow-hidden font-sans">
      <div className="h-14 px-8 border-b border-white/5 bg-[#121620]/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Volume2 size={16} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Table Atmosphere & Audio Engine
          </span>
          <span className="text-xs text-slate-500 font-mono">
            (Offline Local Audio)
          </span>
        </div>

        <button
          onClick={handleStopAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
        >
          <Square size={11} /> Stop All Audio
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
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

        {/* Ambient Loops */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Ambient Background Loops
          </span>

          <div className="grid grid-cols-3 gap-4">
            {BUILTIN_AMBIENCE.map(ch => {
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
                        <span className="text-[10px] text-slate-500">{isPlaying ? 'Playing loop' : 'Muted'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleBuiltinTrack(ch)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isPlaying 
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' 
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {isPlaying ? <Square size={12} /> : <Play size={12} className="ml-0.5" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
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

        {/* Custom Uploaded Loops */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Music size={14} /> Custom Music & Loops ({customLoops.length})
            </span>
            <button
              onClick={() => ambienceUploadRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors"
            >
              <Upload size={12} /> Upload Music (.mp3, .wav)
            </button>
          </div>

          {customLoops.length > 0 && (
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
                          onClick={() => handleDeleteCustom(track.id)}
                          className="p-1 hover:text-red-400 text-slate-600 transition-colors"
                          title="Delete track"
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

        {/* Custom SFX */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              Custom Sound Effect Pads ({customSfx.length})
            </span>
            <button
              onClick={() => sfxUploadRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-colors"
            >
              <Upload size={12} /> Add One-Shot SFX
            </button>
          </div>

          {customSfx.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {customSfx.map(s => (
                <div key={s.id} className="flex items-center gap-1.5 bg-[#141b25] border border-white/10 rounded-xl px-3 py-2">
                  <button
                    onClick={() => SoundboardService.playCustomSfx(s.id)}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-amber-400"
                  >
                    <Play size={10} className="text-amber-400 fill-amber-400" />
                    <span className="truncate max-w-[140px]">{s.name}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCustom(s.id)}
                    className="text-slate-600 hover:text-red-400 ml-1.5"
                    title="Remove SFX"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Built-in SFX */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Table SFX Pads
          </span>

          <div className="grid grid-cols-5 gap-3">
            <button
              onClick={() => SoundboardService.playSfx('crit')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Critical Success</span>
            </button>

            <button
              onClick={() => SoundboardService.playSfx('fail')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-red-500/40 hover:bg-red-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Critical Fumble</span>
            </button>

            <button
              onClick={() => SoundboardService.playSfx('sword')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Swords size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Sword Clash</span>
            </button>

            <button
              onClick={() => SoundboardService.playSfx('magic')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Spell Cast</span>
            </button>

            <button
              onClick={() => SoundboardService.playSfx('coins')}
              className="p-3.5 rounded-2xl bg-[#141b25] border border-white/5 hover:border-yellow-500/40 hover:bg-yellow-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Coins size={16} />
              </div>
              <span className="text-xs font-bold text-slate-200">Gold Loot</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
