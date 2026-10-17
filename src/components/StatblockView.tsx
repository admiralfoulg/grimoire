import React, { useState } from 'react';
import type { StatblockData } from '../services/storage';
import { DiceService } from '../services/dice';
import { Shield, Heart, Zap, Swords, Dices, BookOpen, ChevronDown } from 'lucide-react';

interface StatblockViewProps {
  data: StatblockData;
  onChange: (updated: StatblockData) => void;
  previewMode: boolean;
}

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export const STATBLOCK_PRESETS: Record<string, { label: string; data: StatblockData }> = {
  custom: {
    label: 'Custom Base',
    data: {
      armorClass: 10,
      hitPoints: 10,
      hitDice: '1d8',
      speed: '30 ft',
      proficiencyBonus: 2,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      actions: [
        { id: 'act-1', name: 'Unarmed Strike', type: 'melee', toHit: 2, damageDice: '1d4', description: 'Bludgeoning attack.' }
      ]
    }
  },
  goblin: {
    label: 'Goblin Skirmisher',
    data: {
      armorClass: 15,
      hitPoints: 7,
      hitDice: '2d6',
      speed: '30 ft',
      proficiencyBonus: 2,
      abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
      actions: [
        { id: 'act-1', name: 'Scimitar', type: 'melee', toHit: 4, damageDice: '1d6+2', description: 'Slashing blade attack.' },
        { id: 'act-2', name: 'Shortbow', type: 'ranged', toHit: 4, damageDice: '1d6+2', description: 'Range 80/320 ft.' }
      ]
    }
  },
  guard: {
    label: 'City Guard',
    data: {
      armorClass: 16,
      hitPoints: 16,
      hitDice: '2d8+2',
      speed: '30 ft',
      proficiencyBonus: 2,
      abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 },
      actions: [
        { id: 'act-1', name: 'Spear', type: 'melee', toHit: 3, damageDice: '1d6+1', description: 'Versatile (1d8+1).' },
        { id: 'act-2', name: 'Heavy Crossbow', type: 'ranged', toHit: 3, damageDice: '1d10+1', description: 'Range 100/400 ft.' }
      ]
    }
  },
  mage: {
    label: 'Archmage / Court Wizard',
    data: {
      armorClass: 15,
      hitPoints: 40,
      hitDice: '9d8',
      speed: '30 ft',
      proficiencyBonus: 3,
      abilities: { str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11 },
      actions: [
        { id: 'act-1', name: 'Arcane Dagger', type: 'melee', toHit: 5, damageDice: '1d4+2', description: 'Light, finesse.' },
        { id: 'act-2', name: 'Fire Bolt', type: 'spell', toHit: 6, damageDice: '2d10', description: 'Ranged spell attack.' }
      ]
    }
  },
  dragon: {
    label: 'Young Red Dragon',
    data: {
      armorClass: 18,
      hitPoints: 178,
      hitDice: '17d10+85',
      speed: '40 ft, fly 80 ft',
      proficiencyBonus: 4,
      abilities: { str: 23, dex: 10, con: 21, int: 14, wis: 11, cha: 19 },
      actions: [
        { id: 'act-1', name: 'Bite', type: 'melee', toHit: 10, damageDice: '2d10+6', description: 'Plus 1d6 fire damage.' },
        { id: 'act-2', name: 'Claw', type: 'melee', toHit: 10, damageDice: '2d6+6', description: 'Slashing strike.' },
        { id: 'act-3', name: 'Fire Breath', type: 'special', toHit: 0, damageDice: '16d6', description: 'DC 17 Dex save or take fire damage.' }
      ]
    }
  }
};

export const StatblockView: React.FC<StatblockViewProps> = ({ data, onChange, previewMode }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleScoreChange = (key: keyof StatblockData['abilities'], val: number) => {
    onChange({
      ...data,
      abilities: {
        ...data.abilities,
        [key]: Math.max(1, Math.min(30, val || 10))
      }
    });
  };

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = STATBLOCK_PRESETS[presetKey];
    if (preset) {
      onChange(JSON.parse(JSON.stringify(preset.data)));
    }
  };

  const handleRollAbility = (label: string, score: number) => {
    const mod = Math.floor((score - 10) / 2);
    const formula = mod >= 0 ? `1d20+${mod}` : `1d20${mod}`;
    const result = DiceService.roll(formula, `${label.toUpperCase()} Check`);
    alert(`[${label.toUpperCase()} CHECK] Rolled ${formula}: Result = ${result.total} (${result.dice[0].result} + ${mod})`);
  };

  const handleRollAction = (actionName: string, toHit: number, damageDice: string) => {
    const hitFormula = toHit >= 0 ? `1d20+${toHit}` : `1d20${toHit}`;
    const hitRes = DiceService.roll(hitFormula, `${actionName} (To Hit)`);
    const dmgRes = DiceService.roll(damageDice, `${actionName} (Damage)`);
    alert(`[${actionName}]\nAttack Roll: ${hitRes.total} (${hitFormula})\nDamage Roll: ${dmgRes.total} (${damageDice})`);
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-black/40 border border-white/10 font-sans select-none">
      
      {/* Top Preset Template Selector (Edit Mode Only) */}
      {!previewMode && (
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <BookOpen size={12} className="text-amber-400" /> Template Preset:
          </span>
          <select
            value={selectedPreset}
            onChange={e => handlePresetSelect(e.target.value)}
            className="bg-[#141b25] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-amber-300 outline-none cursor-pointer"
          >
            {Object.entries(STATBLOCK_PRESETS).map(([k, p]) => (
              <option key={k} value={k} className="bg-[#141b25] text-slate-200">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Vitals Bar (AC, HP, Speed, Prof) */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Shield size={11} className="text-amber-400" /> AC
          </span>
          {previewMode ? (
            <span className="text-base font-bold text-slate-100 font-mono mt-0.5">{data.armorClass}</span>
          ) : (
            <input
              type="number"
              value={data.armorClass}
              onChange={e => onChange({ ...data, armorClass: parseInt(e.target.value, 10) || 10 })}
              className="w-12 text-center bg-transparent text-base font-bold text-slate-100 outline-none font-mono"
            />
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Heart size={11} className="text-red-400" /> Max HP
          </span>
          {previewMode ? (
            <span className="text-base font-bold text-slate-100 font-mono mt-0.5">{data.hitPoints}</span>
          ) : (
            <input
              type="number"
              value={data.hitPoints}
              onChange={e => onChange({ ...data, hitPoints: parseInt(e.target.value, 10) || 10 })}
              className="w-12 text-center bg-transparent text-base font-bold text-slate-100 outline-none font-mono"
            />
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Zap size={11} className="text-blue-400" /> Speed
          </span>
          {previewMode ? (
            <span className="text-base font-bold text-slate-100 font-mono mt-0.5">{data.speed}</span>
          ) : (
            <input
              type="text"
              value={data.speed}
              onChange={e => onChange({ ...data, speed: e.target.value })}
              className="w-16 text-center bg-transparent text-base font-bold text-slate-100 outline-none font-mono"
            />
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Dices size={11} className="text-purple-400" /> Prof
          </span>
          <span className="text-base font-bold text-amber-400 font-mono mt-0.5">+{data.proficiencyBonus}</span>
        </div>
      </div>

      {/* Ability Scores Matrix (STR, DEX, CON, INT, WIS, CHA) */}
      <div className="grid grid-cols-6 gap-2">
        {ABILITY_KEYS.map(key => {
          const score = data.abilities[key] || 10;
          const mod = getModifier(score);

          return (
            <div
              key={key}
              onClick={() => handleRollAbility(key, score)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all cursor-pointer group"
              title={`Click to roll ${key.toUpperCase()} check`}
            >
              <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-amber-300">
                {key}
              </span>

              <span className="text-lg font-bold text-slate-100 font-mono my-0.5 group-hover:text-amber-400">
                {mod}
              </span>

              {previewMode ? (
                <span className="text-[10px] text-slate-500 font-mono">{score}</span>
              ) : (
                <input
                  type="number"
                  onClick={e => e.stopPropagation()}
                  value={score}
                  onChange={e => handleScoreChange(key, parseInt(e.target.value, 10))}
                  className="w-8 text-center bg-transparent text-[10px] text-slate-500 font-mono outline-none"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Action / Attack Roster */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
          <Swords size={12} className="text-amber-400" /> Actions & Attacks
        </span>

        <div className="flex flex-col gap-1.5">
          {data.actions.map(act => (
            <div
              key={act.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">{act.name}</span>
                <span className="text-[10px] text-slate-500">({act.type})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRollAction(act.name, act.toHit, act.damageDice)}
                  className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-mono text-[11px] font-semibold transition-colors"
                >
                  +{act.toHit} to hit • {act.damageDice}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
