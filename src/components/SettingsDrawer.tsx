import React, { useState, useEffect } from 'react';
import { 
  X, 
  Palette, 
  Sparkles, 
  Sliders, 
  RotateCcw, 
  Check,
  Sun,
  Moon
} from 'lucide-react';

export interface ThemePreset {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  bgDark: string;
  bgSidebar: string;
  bgSurface: string;
  bgElevated: string;
  textMain: string;
  textMuted: string;
  textFaint: string;
  border: string;
  accent: string;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  // --- DARK PRESETS ---
  {
    id: 'obsidian',
    name: 'Grimoire Obsidian',
    mode: 'dark',
    bgDark: '#0a0f17',
    bgSidebar: '#0d121b',
    bgSurface: '#121824',
    bgElevated: '#18212e',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    textFaint: '#64748b',
    border: 'rgba(255, 255, 255, 0.08)',
    accent: '#f59e0b',
    description: 'Classic dark fantasy grimoire workstation'
  },
  {
    id: 'midnight',
    name: 'Arcane Midnight',
    mode: 'dark',
    bgDark: '#070a16',
    bgSidebar: '#0b1024',
    bgSurface: '#121838',
    bgElevated: '#1b2352',
    textMain: '#f1f5f9',
    textMuted: '#93c5fd',
    textFaint: '#60a5fa',
    border: 'rgba(147, 197, 253, 0.12)',
    accent: '#6366f1',
    description: 'Deep cosmic indigo with starry blue notes'
  },
  {
    id: 'emerald',
    name: 'Eldritch Emerald',
    mode: 'dark',
    bgDark: '#05120a',
    bgSidebar: '#091b10',
    bgSurface: '#0f291a',
    bgElevated: '#163b26',
    textMain: '#f0fdf4',
    textMuted: '#86efac',
    textFaint: '#4ade80',
    border: 'rgba(52, 211, 153, 0.12)',
    accent: '#10b981',
    description: 'Mossy ruins and ancient forbidden alchemy'
  },
  {
    id: 'crimson',
    name: 'Blood Moon',
    mode: 'dark',
    bgDark: '#140609',
    bgSidebar: '#1d0a0e',
    bgSurface: '#2b0f16',
    bgElevated: '#3e1720',
    textMain: '#fff1f2',
    textMuted: '#fda4af',
    textFaint: '#fb7185',
    border: 'rgba(244, 63, 94, 0.12)',
    accent: '#f43f5e',
    description: 'Vampiric gothic dark red aesthetic'
  },
  {
    id: 'void',
    name: 'Abyssal Void',
    mode: 'dark',
    bgDark: '#000000',
    bgSidebar: '#070709',
    bgSurface: '#0e0f14',
    bgElevated: '#181922',
    textMain: '#ffffff',
    textMuted: '#a1a1aa',
    textFaint: '#71717a',
    border: 'rgba(255, 255, 255, 0.07)',
    accent: '#a855f7',
    description: 'True pure-black OLED high contrast'
  },

  // --- LIGHT PRESETS ---
  {
    id: 'parchment',
    name: "Scribe's Parchment",
    mode: 'light',
    bgDark: '#e9dfcb',       // Desk backdrop
    bgSidebar: '#dfd2ba',    // Aged papyrus sidebar
    bgSurface: '#fbf7ee',    // Note page crisp parchment
    bgElevated: '#d6c6a8',   // Folder & active highlights
    textMain: '#2b1b0d',     // Rich dark walnut ink
    textMuted: '#5c452e',
    textFaint: '#876b50',
    border: 'rgba(100, 70, 20, 0.18)',
    accent: '#b45309',       // Tooled leather amber
    description: 'Authentic warm fantasy parchment and dark ink'
  },
  {
    id: 'paladin',
    name: "Paladin's Codex",
    mode: 'light',
    bgDark: '#eef2f6',       // Silver marble desk
    bgSidebar: '#e2e8f0',    // Light steel sidebar
    bgSurface: '#ffffff',    // Crisp white notebook page
    bgElevated: '#cbd5e1',   // Slate folders
    textMain: '#0f172a',     // Deep slate ink
    textMuted: '#334155',
    textFaint: '#64748b',
    border: 'rgba(15, 23, 42, 0.12)',
    accent: '#0284c7',       // Luminous sky sapphire
    description: 'Clean bright journal with crisp legible pages'
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    mode: 'light',
    bgDark: '#eee8d5',
    bgSidebar: '#e0d7be',
    bgSurface: '#fdf6e3',    // Classic solarized page
    bgElevated: '#d4c7a6',
    textMain: '#073642',
    textMuted: '#586e75',
    textFaint: '#839496',
    border: 'rgba(88, 110, 117, 0.2)',
    accent: '#cb4b16',       // Rust terracotta
    description: 'Scientifically calibrated low-strain reading light'
  },
  {
    id: 'herbarium',
    name: "Alchemist's Herbarium",
    mode: 'light',
    bgDark: '#dce8dd',
    bgSidebar: '#d0ded2',
    bgSurface: '#f4f8f4',    // Botanical paper page
    bgElevated: '#bed3c2',
    textMain: '#132e1a',     // Pine ink
    textMuted: '#315438',
    textFaint: '#5a7861',
    border: 'rgba(20, 60, 30, 0.16)',
    accent: '#15803d',       // Deep forest green
    description: 'Soft herbalist paper with botanical dark green ink'
  }
];

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'dark' | 'light'>('all');
  
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem('grimoire_theme_id') || 'obsidian';
  });

  const [customAccent, setCustomAccent] = useState<string>(() => {
    return localStorage.getItem('grimoire_custom_accent') || '#f59e0b';
  });

  const applyTheme = (preset: ThemePreset, overrideAccent?: string) => {
    const accent = overrideAccent || preset.accent;
    const root = document.documentElement;

    if (preset.mode === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    }

    root.style.setProperty('--vvd-bg-dark', preset.bgDark);
    root.style.setProperty('--vvd-bg-sidebar', preset.bgSidebar);
    root.style.setProperty('--vvd-bg-surface', preset.bgSurface);
    root.style.setProperty('--vvd-bg-elevated', preset.bgElevated);
    root.style.setProperty('--vvd-text-main', preset.textMain);
    root.style.setProperty('--vvd-text-muted', preset.textMuted);
    root.style.setProperty('--vvd-text-faint', preset.textFaint);
    root.style.setProperty('--vvd-border', preset.border);
    root.style.setProperty('--vvd-gold', accent);

    localStorage.setItem('grimoire_theme_id', preset.id);
    localStorage.setItem('grimoire_custom_accent', accent);
    setActiveThemeId(preset.id);
    if (overrideAccent) setCustomAccent(overrideAccent);
  };

  useEffect(() => {
    const savedThemeId = localStorage.getItem('grimoire_theme_id') || 'obsidian';
    const savedAccent = localStorage.getItem('grimoire_custom_accent') || '#f59e0b';
    const preset = THEME_PRESETS.find(t => t.id === savedThemeId) || THEME_PRESETS[0];
    applyTheme(preset, savedAccent);
  }, []);

  const handleSelectPreset = (preset: ThemePreset) => {
    applyTheme(preset, preset.accent);
  };

  const handleCustomAccentChange = (hex: string) => {
    setCustomAccent(hex);
    const activePreset = THEME_PRESETS.find(t => t.id === activeThemeId) || THEME_PRESETS[0];
    applyTheme(activePreset, hex);
  };

  const handleResetDefaults = () => {
    const def = THEME_PRESETS[0];
    applyTheme(def, def.accent);
  };

  const filteredPresets = THEME_PRESETS.filter(p => {
    if (filterMode === 'all') return true;
    return p.mode === filterMode;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0d121b] border-l border-white/10 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#121824]/80">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">Workstation Themes</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              title="Close Settings"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 text-xs text-slate-300">
            
            {/* Filter Tabs: All | Dark | Light */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Palette size={13} className="text-amber-400" /> Palettes & Papers
                </span>
                
                <div className="flex items-center bg-black/30 p-0.5 rounded-lg border border-white/10">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      filterMode === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({THEME_PRESETS.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('dark')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      filterMode === 'dark' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon size={10} /> Dark
                  </button>
                  <button
                    onClick={() => setFilterMode('light')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      filterMode === 'light' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun size={10} /> Light
                  </button>
                </div>
              </div>

              {/* Theme Preset Cards */}
              <div className="grid grid-cols-1 gap-2">
                {filteredPresets.map((preset) => {
                  const isActive = activeThemeId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isActive 
                          ? 'border-amber-400/60 bg-[#18212e] shadow-lg ring-1 ring-amber-400/30' 
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-5 h-5 rounded-full border border-white/20 shadow-inner shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: preset.accent }}
                        >
                          {isActive && <Check size={11} className="text-black font-bold" />}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
                              {preset.name}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold tracking-wider ${
                              preset.mode === 'light' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              {preset.mode}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 leading-tight">
                            {preset.description}
                          </span>
                        </div>
                      </div>
                      
                      {/* Swatches: Desk, Sidebar, Note Page Paper */}
                      <div className="flex items-center gap-1 pl-2 shrink-0">
                        <div className="w-3.5 h-3.5 rounded border border-white/15" style={{ backgroundColor: preset.bgDark }} title="Backdrop Desk" />
                        <div className="w-3.5 h-3.5 rounded border border-white/15" style={{ backgroundColor: preset.bgSidebar }} title="Sidebar" />
                        <div className="w-3.5 h-3.5 rounded border border-white/15" style={{ backgroundColor: preset.bgSurface }} title="Note Page Paper" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Accent Color Picker */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-white/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" /> Custom Accent Hex
              </span>
              
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-lg border border-white/20 overflow-hidden cursor-pointer shadow-md shrink-0">
                    <input 
                      type="color" 
                      value={customAccent}
                      onChange={(e) => handleCustomAccentChange(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div 
                      className="w-full h-full flex items-center justify-center font-mono text-[9px] text-black font-bold"
                      style={{ backgroundColor: customAccent }}
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Hex Code</label>
                    <input 
                      type="text" 
                      value={customAccent}
                      onChange={(e) => handleCustomAccentChange(e.target.value)}
                      placeholder="#f59e0b"
                      maxLength={7}
                      className="bg-[#121824] border border-white/10 rounded-lg px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400/50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#d97706'].map((paletteHex) => (
                    <button
                      key={paletteHex}
                      onClick={() => handleCustomAccentChange(paletteHex)}
                      className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                        customAccent.toLowerCase() === paletteHex.toLowerCase() 
                          ? 'border-white ring-2 ring-white/30' 
                          : 'border-white/10'
                      }`}
                      style={{ backgroundColor: paletteHex }}
                      title={paletteHex}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col gap-1 text-[11px] text-amber-200/80">
              <span className="font-semibold text-amber-300">Instant Workstation Re-Skin:</span>
              <span>All changes automatically adapt note pages, text ink, sidebars, scratchpads, and attributes across all campaign worlds.</span>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-white/10 bg-[#121824]/80 flex items-center justify-between">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs"
            >
              <RotateCcw size={12} />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-md shadow-amber-500/20"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
