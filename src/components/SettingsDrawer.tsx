import React, { useState, useEffect } from 'react';
import { X, Palette, Check } from 'lucide-react';

export interface ThemePreset {
  id: string;
  name: string;
  accent: string;
  bgDark: string;
  bgPanel: string;
  bgSurface: string;
  border: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'gold',
    name: 'Obsidian Gold',
    accent: '#c8963e',
    bgDark: '#0e1015',
    bgPanel: '#14171f',
    bgSurface: '#181b24',
    border: 'rgba(255, 255, 255, 0.08)'
  },
  {
    id: 'arcane',
    name: 'Arcane Purple',
    accent: '#a855f7',
    bgDark: '#0d0b14',
    bgPanel: '#151022',
    bgSurface: '#1c152e',
    border: 'rgba(168, 85, 247, 0.15)'
  },
  {
    id: 'emerald',
    name: 'Emerald Grove',
    accent: '#10b981',
    bgDark: '#0a120e',
    bgPanel: '#101d17',
    bgSurface: '#15261f',
    border: 'rgba(16, 185, 129, 0.15)'
  },
  {
    id: 'bloodline',
    name: 'Bloodline Crimson',
    accent: '#ef4444',
    bgDark: '#140a0a',
    bgPanel: '#1f1010',
    bgSurface: '#291515',
    border: 'rgba(239, 68, 68, 0.15)'
  },
  {
    id: 'slate',
    name: 'Midnight Slate',
    accent: '#38bdf8',
    bgDark: '#0b111e',
    bgPanel: '#10192a',
    bgSurface: '#162238',
    border: 'rgba(56, 189, 248, 0.15)'
  }
];

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
    return localStorage.getItem('grimoire_theme_id') || 'gold';
  });
  const [customHex, setCustomHex] = useState<string>(() => {
    return localStorage.getItem('grimoire_custom_hex') || '#c8963e';
  });
  const [useCustomHex, setUseCustomHex] = useState<boolean>(() => {
    return localStorage.getItem('grimoire_use_custom_hex') === 'true';
  });

  const applyTheme = (theme: ThemePreset, overrideHex?: string) => {
    const root = document.documentElement;
    const accent = overrideHex || theme.accent;
    root.style.setProperty('--vvd-gold', accent);
    root.style.setProperty('--vvd-bg-dark', theme.bgDark);
    root.style.setProperty('--vvd-bg-panel', theme.bgPanel);
    root.style.setProperty('--vvd-bg-surface', theme.bgSurface);
    root.style.setProperty('--vvd-border', theme.border);
  };

  useEffect(() => {
    const theme = THEME_PRESETS.find(t => t.id === selectedThemeId) || THEME_PRESETS[0];
    applyTheme(theme, useCustomHex ? customHex : undefined);
  }, []);

  const handleSelectPreset = (preset: ThemePreset) => {
    setSelectedThemeId(preset.id);
    setUseCustomHex(false);
    localStorage.setItem('grimoire_theme_id', preset.id);
    localStorage.setItem('grimoire_use_custom_hex', 'false');
    applyTheme(preset);
  };

  const handleHexChange = (hex: string) => {
    setCustomHex(hex);
    setUseCustomHex(true);
    localStorage.setItem('grimoire_custom_hex', hex);
    localStorage.setItem('grimoire_use_custom_hex', 'true');
    const baseTheme = THEME_PRESETS.find(t => t.id === selectedThemeId) || THEME_PRESETS[0];
    applyTheme(baseTheme, hex);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div 
        className="w-80 h-full p-5 border-l shadow-2xl flex flex-col justify-between"
        style={{
          backgroundColor: 'var(--vvd-bg-panel)',
          borderColor: 'var(--vvd-border)'
        }}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--vvd-border)' }}>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5" style={{ color: 'var(--vvd-gold)' }} />
              <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-100">Workstation Settings</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold tracking-wider uppercase text-slate-400 block">
              UI Color Palette
            </label>
            <div className="grid grid-cols-1 gap-2">
              {THEME_PRESETS.map((preset) => {
                const isActive = !useCustomHex && selectedThemeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center justify-between p-2.5 rounded-md border text-xs font-medium transition-all"
                    style={{
                      backgroundColor: preset.bgSurface,
                      borderColor: isActive ? preset.accent : 'rgba(255, 255, 255, 0.08)',
                      color: isActive ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" 
                        style={{ backgroundColor: preset.accent }} 
                      />
                      <span>{preset.name}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5" style={{ color: preset.accent }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-slate-400 block">
              Custom Hex Accent
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={customHex}
                onChange={(e) => handleHexChange(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-white/10 bg-transparent p-0"
              />
              <input 
                type="text" 
                value={customHex}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#c8963e"
                className="flex-1 px-3 py-1.5 rounded text-xs font-mono bg-black/40 border border-white/10 text-slate-200 uppercase focus:outline-none focus:border-white/30"
              />
            </div>
            {useCustomHex && (
              <span className="text-[11px] text-amber-400/90 block">
                Custom accent applied over {THEME_PRESETS.find(t => t.id === selectedThemeId)?.name || 'Default'} base.
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t text-[11px] text-slate-500 text-center" style={{ borderColor: 'var(--vvd-border)' }}>
          Grimoire Workstation • Local Offline
        </div>
      </div>
    </div>
  );
};
