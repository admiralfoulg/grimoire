import React, { useState, useEffect, useRef } from 'react';
import type { StatblockData, StatblockAction, StatblockTrait } from '../services/storage';
import { DiceService } from '../services/dice';
import { 
  Shield, 
  Heart, 
  Zap, 
  Swords, 
  Dices, 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  ClipboardPaste, 
  Sparkles,
  Search,
  BookmarkPlus,
  Flame,
  Check
} from 'lucide-react';

interface StatblockViewProps {
  data: StatblockData;
  onChange: (updated: StatblockData) => void;
  previewMode: boolean;
}

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

export const DEFAULT_PRESETS: Record<string, { label: string; data: StatblockData }> = {
  custom: {
    label: 'Custom Base',
    data: {
      armorClass: 10,
      hitPoints: 10,
      hitDice: '1d8',
      speed: '30 ft',
      proficiencyBonus: 2,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      traits: [],
      actions: [
        { id: 'act-1', name: 'Unarmed Strike', type: 'melee', toHit: 2, damageDice: '1d4', description: 'Bludgeoning attack.', range: '5 ft' }
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
      traits: [
        { id: 'tr-1', name: 'Nimble Escape', description: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.' }
      ],
      actions: [
        { id: 'act-1', name: 'Scimitar', type: 'melee', toHit: 4, damageDice: '1d6+2', damageType: 'slashing', range: '5 ft', description: 'Slashing blade attack.' },
        { id: 'act-2', name: 'Shortbow', type: 'ranged', toHit: 4, damageDice: '1d6+2', damageType: 'piercing', range: '80/320 ft', description: 'Ranged arrow volley.' }
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
      traits: [],
      actions: [
        { id: 'act-1', name: 'Spear', type: 'melee', toHit: 3, damageDice: '1d6+1', damageType: 'piercing', range: '5 ft (20/60 thrown)', description: 'Versatile (1d8+1).' },
        { id: 'act-2', name: 'Heavy Crossbow', type: 'ranged', toHit: 3, damageDice: '1d10+1', damageType: 'piercing', range: '100/400 ft', description: 'Loading, two-handed.' }
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
      traits: [
        { id: 'tr-1', name: 'Magic Resistance', description: 'The mage has advantage on saving throws against spells and other magical effects.' }
      ],
      actions: [
        { id: 'act-1', name: 'Arcane Dagger', type: 'melee', toHit: 5, damageDice: '1d4+2', damageType: 'piercing', range: '5 ft', description: 'Light, finesse.' },
        { id: 'act-2', name: 'Fire Bolt', type: 'spell', toHit: 6, damageDice: '2d10', damageType: 'fire', range: '120 ft', description: 'Ranged spell attack.' }
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
      traits: [],
      actions: [
        { id: 'act-1', name: 'Bite', type: 'melee', toHit: 10, damageDice: '2d10+6', damageType: 'piercing', range: '10 ft', description: 'Plus 1d6 fire damage.' },
        { id: 'act-2', name: 'Claw', type: 'melee', toHit: 10, damageDice: '2d6+6', damageType: 'slashing', range: '5 ft', description: 'Slashing strike.' },
        { id: 'act-3', name: 'Fire Breath (Recharge 5-6)', type: 'special', toHit: 0, damageDice: '16d6', damageType: 'fire', range: '30 ft cone', saveDc: 17, saveType: 'dex', description: 'DC 17 Dex save or take 16d6 fire damage.' }
      ]
    }
  }
};

// Heuristic parser separating passive traits from attacks
export const parseRawStatblockText = (rawText: string): Partial<StatblockData> => {
  const parsed: Partial<StatblockData> = {
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    traits: [],
    actions: []
  };

  if (!rawText.trim()) return parsed;

  // 1. Armor Class
  const acMatch = rawText.match(/(?:Armor Class|AC)\s*[:]?\s*(\d+)/i);
  if (acMatch) parsed.armorClass = parseInt(acMatch[1], 10);

  // 2. Hit Points & Hit Dice
  const hpMatch = rawText.match(/(?:Hit Points|HP)\s*[:]?\s*(\d+)(?:\s*\(([^)]+)\))?/i);
  if (hpMatch) {
    parsed.hitPoints = parseInt(hpMatch[1], 10);
    if (hpMatch[2]) parsed.hitDice = hpMatch[2].trim();
  }

  // 3. Speed
  const speedMatch = rawText.match(/Speed\s*[:]?\s*([^\n\r]+)/i);
  if (speedMatch) {
    parsed.speed = speedMatch[1].split(/[.,]/)[0].trim();
  }

  // 4. Proficiency Bonus
  const profMatch = rawText.match(/(?:Proficiency Bonus|Prof)\s*[:]?\s*\+?(\d+)/i);
  if (profMatch) {
    parsed.proficiencyBonus = parseInt(profMatch[1], 10);
  }

  // 5. Abilities (STR, DEX, CON, INT, WIS, CHA)
  const abilityRegexes = {
    str: /\bSTR\b[^\d]*(\d+)/i,
    dex: /\bDEX\b[^\d]*(\d+)/i,
    con: /\bCON\b[^\d]*(\d+)/i,
    int: /\bINT\b[^\d]*(\d+)/i,
    wis: /\bWIS\b[^\d]*(\d+)/i,
    cha: /\bCHA\b[^\d]*(\d+)/i
  };

  Object.entries(abilityRegexes).forEach(([ab, regex]) => {
    const match = rawText.match(regex);
    if (match && parsed.abilities) {
      parsed.abilities[ab as keyof StatblockData['abilities']] = parseInt(match[1], 10);
    }
  });

  // 6. Section Partitioning (Traits vs Actions)
  let traitsSectionText = '';
  let actionsSectionText = '';

  const actionsHeaderMatch = rawText.match(/\bActions\b/i);

  if (actionsHeaderMatch && actionsHeaderMatch.index !== undefined) {
    const preActions = rawText.substring(0, actionsHeaderMatch.index);
    actionsSectionText = rawText.substring(actionsHeaderMatch.index).replace(/^Actions\s*/i, '');

    // Isolate traits (starts after Challenge / Languages / Senses / Saving Throws)
    const traitsAnchorMatch = preActions.match(/\b(?:Challenge|Languages|Senses|Condition Immunities|Damage Immunities|Damage Resistances|Skills|Saving Throws)[^\n\r]*[\n\r]+/i);
    if (traitsAnchorMatch && traitsAnchorMatch.index !== undefined) {
      traitsSectionText = preActions.substring(traitsAnchorMatch.index + traitsAnchorMatch[0].length).trim();
    }
  } else {
    actionsSectionText = rawText;
  }

  // Clean trailing blocks (Legendary Actions, Reactions)
  actionsSectionText = actionsSectionText.split(/\b(?:Legendary Actions|Bonus Actions|Reactions)\b/i)[0];

  const chunkSplitRegex = /(?:\r?\n\s*\r?\n|(?<=[.!?])\s+(?=[A-Z][A-Za-z0-9\s'()-]{1,35}\s*\.\s+)|\r?\n(?=[A-Z][A-Za-z0-9\s'()-]{1,35}\s*\.\s+))/g;

  // 7. Parse Traits (e.g. Keen Smell, Innate Spellcasting, Magic Resistance)
  if (traitsSectionText) {
    const traitChunks = traitsSectionText.split(chunkSplitRegex);
    const traitList: StatblockTrait[] = [];

    for (let chunk of traitChunks) {
      chunk = chunk.trim();
      if (!chunk || chunk.length < 5) continue;

      const titleMatch = chunk.match(/^([A-Za-z0-9\s'()-]{2,40})\.\s*([\s\S]*)$/);
      if (!titleMatch) continue;

      const traitName = titleMatch[1].trim();
      const body = titleMatch[2].trim();

      if (/^(Armor Class|Hit Points|Speed|STR|DEX|CON|INT|WIS|CHA|Senses|Languages|Challenge|Proficiency)/i.test(traitName)) {
        continue;
      }

      traitList.push({
        id: crypto.randomUUID(),
        name: traitName,
        description: body || chunk
      });
    }

    parsed.traits = traitList;
  }

  // 8. Parse Actions (e.g. Multiattack, Morningstar, Rock)
  const actionChunks = actionsSectionText.split(chunkSplitRegex);
  const actionsList: StatblockAction[] = [];

  for (let chunk of actionChunks) {
    chunk = chunk.trim().replace(/^Actions\s*/i, '');
    if (!chunk || chunk.length < 5) continue;

    const titleMatch = chunk.match(/^([A-Za-z0-9\s'()-]{2,40})\.\s*([\s\S]*)$/);
    if (!titleMatch) continue;

    const actName = titleMatch[1].trim();

    if (/^(Armor Class|Hit Points|Speed|STR|DEX|CON|INT|WIS|CHA|Senses|Languages|Challenge|Proficiency)/i.test(actName)) {
      continue;
    }

    let actType: StatblockAction['type'] = 'special';
    if (/ranged weapon attack|ranged spell attack|range \d+/i.test(chunk)) {
      actType = 'ranged';
    } else if (/melee weapon attack|melee spell attack|reach \d+/i.test(chunk)) {
      actType = 'melee';
    } else if (/spell attack|cantrip|casts/i.test(chunk)) {
      actType = 'spell';
    }

    const hitMatch = chunk.match(/([+-]\d+)\s*to hit/i);
    const toHit = hitMatch ? parseInt(hitMatch[1], 10) : 0;

    const dmgMatch = chunk.match(/Hit:\s*\d+\s*\(([^)]+)\)|(?:takes|taking)\s*\d+\s*\(([^)]+)\)|(?:takes|dealing|taking)\s*(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
    let damageDice = dmgMatch ? (dmgMatch[1] || dmgMatch[2] || dmgMatch[3]).replace(/\s+/g, '') : '';

    if (!damageDice) {
      const diceFound = chunk.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
      if (diceFound) damageDice = diceFound[1].replace(/\s+/g, '');
    }

    const typeMatch = chunk.match(/(slashing|piercing|bludgeoning|acid|fire|cold|lightning|poison|psychic|necrotic|radiant|force)\s+damage/i);
    const damageType = typeMatch ? typeMatch[1].toLowerCase() : undefined;

    const rangeMatch = chunk.match(/(?:reach\s*(\d+\s*ft)|range\s*([\d/]+\s*ft)|line that is\s*([^,]+))/i);
    const range = rangeMatch ? (rangeMatch[1] || rangeMatch[2] || rangeMatch[3]).trim() : undefined;

    const saveMatch = chunk.match(/DC\s*(\d+)\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|STR|DEX|CON|INT|WIS|CHA)/i);
    let saveDc: number | undefined;
    let saveType: StatblockAction['saveType'] | undefined;
    if (saveMatch) {
      saveDc = parseInt(saveMatch[1], 10);
      saveType = saveMatch[2].substring(0, 3).toLowerCase() as any;
    }

    actionsList.push({
      id: crypto.randomUUID(),
      name: actName,
      type: actType,
      toHit,
      damageDice: damageDice || '',
      range,
      saveDc,
      saveType,
      damageType,
      description: chunk
    });
  }

  if (actionsList.length > 0) {
    parsed.actions = actionsList;
  }

  return parsed;
};

export const StatblockView: React.FC<StatblockViewProps> = ({ data, onChange, previewMode }) => {
  const [userPresets, setUserPresets] = useState<Record<string, { label: string; data: StatblockData }>>(() => {
    try {
      const saved = localStorage.getItem('grimoire_statblock_presets');
      return saved ? { ...DEFAULT_PRESETS, ...JSON.parse(saved) } : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [templateSearch, setTemplateSearch] = useState('');
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Sections collapse state
  const [areTraitsCollapsed, setAreTraitsCollapsed] = useState(false);
  const [areActionsCollapsed, setAreActionsCollapsed] = useState(false);

  // Active editors
  const [editingAction, setEditingAction] = useState<StatblockAction | null>(null);
  const [editingTrait, setEditingTrait] = useState<StatblockTrait | null>(null);
  const [expandedActionIds, setExpandedActionIds] = useState<Set<string>>(new Set());
  const [expandedTraitIds, setExpandedTraitIds] = useState<Set<string>>(new Set());

  // Scratchpad
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState('');

  const templateMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    };
    if (isTemplateMenuOpen) window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [isTemplateMenuOpen]);

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
    setIsTemplateMenuOpen(false);
    const preset = userPresets[presetKey];
    if (preset) {
      onChange(JSON.parse(JSON.stringify(preset.data)));
    }
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const key = `custom_${Date.now()}`;
    const updated = {
      ...userPresets,
      [key]: {
        label: newTemplateName.trim(),
        data: JSON.parse(JSON.stringify(data))
      }
    };

    setUserPresets(updated);
    setSelectedPreset(key);
    try {
      localStorage.setItem('grimoire_statblock_presets', JSON.stringify(updated));
    } catch {}

    setNewTemplateName('');
    setIsSavingTemplate(false);
  };

  const toggleActionExpansion = (actId: string) => {
    setExpandedActionIds(prev => {
      const next = new Set(prev);
      if (next.has(actId)) next.delete(actId);
      else next.add(actId);
      return next;
    });
  };

  const toggleTraitExpansion = (traitId: string) => {
    setExpandedTraitIds(prev => {
      const next = new Set(prev);
      if (next.has(traitId)) next.delete(traitId);
      else next.add(traitId);
      return next;
    });
  };

  // Rolls exactly 2 dice into Dice Tray
  const handleRollAction = (e: React.MouseEvent, act: StatblockAction) => {
    e.stopPropagation();

    if (act.type !== 'special' || act.toHit !== 0) {
      const hitFormula = act.toHit >= 0 ? `1d20+${act.toHit}` : `1d20${act.toHit}`;
      DiceService.roll(hitFormula, `[ATTACK] ${act.name}`);
    }

    if (act.damageDice && act.damageDice.trim()) {
      const dmgLabel = act.damageType ? `[DAMAGE] ${act.name} (${act.damageType})` : `[DAMAGE] ${act.name}`;
      DiceService.roll(act.damageDice.trim(), dmgLabel);
    }
  };

  const handleRollAbility = (label: string, score: number) => {
    const mod = Math.floor((score - 10) / 2);
    const formula = mod >= 0 ? `1d20+${mod}` : `1d20${mod}`;
    DiceService.roll(formula, `${label.toUpperCase()} Check`);
  };

  // Actions CRUD
  const handleSaveActionDrawer = (actionToSave: StatblockAction) => {
    const existingIndex = data.actions.findIndex(a => a.id === actionToSave.id);
    let updatedActions: StatblockAction[];
    if (existingIndex >= 0) {
      updatedActions = data.actions.map(a => a.id === actionToSave.id ? actionToSave : a);
    } else {
      updatedActions = [...data.actions, actionToSave];
    }
    onChange({ ...data, actions: updatedActions });
    setEditingAction(null);
  };

  const handleDeleteAction = (actId: string) => {
    const updatedActions = data.actions.filter(a => a.id !== actId);
    onChange({ ...data, actions: updatedActions });
    if (editingAction?.id === actId) setEditingAction(null);
  };

  const handleAddNewAction = () => {
    const freshAction: StatblockAction = {
      id: crypto.randomUUID(),
      name: 'New Action',
      type: 'melee',
      toHit: data.proficiencyBonus + 2,
      damageDice: '1d8+2',
      damageType: 'slashing',
      range: '5 ft',
      description: 'Melee Weapon Attack.'
    };
    setEditingAction(freshAction);
  };

  // Traits CRUD
  const handleSaveTraitDrawer = (traitToSave: StatblockTrait) => {
    const currentTraits = data.traits || [];
    const existingIndex = currentTraits.findIndex(t => t.id === traitToSave.id);
    let updatedTraits: StatblockTrait[];
    if (existingIndex >= 0) {
      updatedTraits = currentTraits.map(t => t.id === traitToSave.id ? traitToSave : t);
    } else {
      updatedTraits = [...currentTraits, traitToSave];
    }
    onChange({ ...data, traits: updatedTraits });
    setEditingTrait(null);
  };

  const handleDeleteTrait = (traitId: string) => {
    const currentTraits = data.traits || [];
    const updatedTraits = currentTraits.filter(t => t.id !== traitId);
    onChange({ ...data, traits: updatedTraits });
    if (editingTrait?.id === traitId) setEditingTrait(null);
  };

  const handleAddNewTrait = () => {
    const freshTrait: StatblockTrait = {
      id: crypto.randomUUID(),
      name: 'Keen Senses',
      description: 'The creature has advantage on Wisdom (Perception) checks.'
    };
    setEditingTrait(freshTrait);
  };

  // Scratchpad
  const handleApplyScratchpad = () => {
    const parsed = parseRawStatblockText(scratchpadText);
    onChange({
      ...data,
      armorClass: parsed.armorClass ?? data.armorClass,
      hitPoints: parsed.hitPoints ?? data.hitPoints,
      hitDice: parsed.hitDice ?? data.hitDice,
      speed: parsed.speed ?? data.speed,
      proficiencyBonus: parsed.proficiencyBonus ?? data.proficiencyBonus,
      abilities: {
        ...data.abilities,
        ...(parsed.abilities || {})
      },
      traits: parsed.traits && parsed.traits.length > 0 ? parsed.traits : data.traits,
      actions: parsed.actions && parsed.actions.length > 0 ? parsed.actions : data.actions
    });
    setIsScratchpadOpen(false);
    setScratchpadText('');
  };

  const filteredPresets = Object.entries(userPresets).filter(([_, p]) =>
    p.label.toLowerCase().includes(templateSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-black/40 border border-white/10 font-sans select-none relative">
      
      {/* Top Header: Template Search, Save as Template & Scratchpad */}
      {!previewMode && (
        <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-2">
          
          {/* Template Search Bar & Dropdown */}
          <div className="flex items-center gap-2 relative" ref={templateMenuRef}>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <BookOpen size={12} className="text-amber-400" /> Template:
            </span>

            <button
              type="button"
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className="flex items-center gap-2 bg-[#141b25] border border-white/10 hover:border-amber-400/40 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-medium transition-colors"
            >
              <span>{userPresets[selectedPreset]?.label || 'Select Template'}</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {/* Save as Template Button */}
            <button
              type="button"
              onClick={() => setIsSavingTemplate(!isSavingTemplate)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="Save current statblock as reusable template"
            >
              <BookmarkPlus size={12} className="text-amber-400" />
              <span>Save to Template</span>
            </button>

            {/* Template Search Dropdown Popover */}
            {isTemplateMenuOpen && (
              <div className="absolute top-8 left-16 z-50 w-64 rounded-xl bg-[#131924] border border-white/15 shadow-2xl p-2 flex flex-col gap-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-lg px-2 py-1">
                  <Search size={12} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search templates..."
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-500"
                  />
                  {templateSearch && (
                    <button onClick={() => setTemplateSearch('')} className="text-slate-500 hover:text-white">
                      <X size={11} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto pr-0.5">
                  {filteredPresets.map(([k, p]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handlePresetSelect(k)}
                      className={`text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        selectedPreset === k ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{p.label}</span>
                      {selectedPreset === k && <Check size={11} />}
                    </button>
                  ))}
                  {filteredPresets.length === 0 && (
                    <div className="text-center py-3 text-[11px] text-slate-500 italic">No template match</div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Name Input to Save Custom Template */}
            {isSavingTemplate && (
              <form onSubmit={handleSaveCurrentAsTemplate} className="flex items-center gap-1 ml-1 animate-in fade-in">
                <input
                  type="text"
                  autoFocus
                  placeholder="Template Name..."
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-lg px-2 py-0.5 text-xs text-white outline-none w-36"
                />
                <button
                  type="submit"
                  disabled={!newTemplateName.trim()}
                  className="px-2 py-0.5 rounded bg-amber-500 text-black font-bold text-[10px] hover:bg-amber-400 transition-colors disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingTemplate(false)}
                  className="text-slate-500 hover:text-white p-0.5"
                >
                  <X size={12} />
                </button>
              </form>
            )}
          </div>

          <button
            onClick={() => setIsScratchpadOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all shadow-sm"
            title="Paste raw monster text to auto-populate statblock"
          >
            <ClipboardPaste size={12} />
            <span>Paste Statblock</span>
          </button>
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
            <span className="text-base font-bold text-slate-100 font-mono mt-0.5">
              {data.hitPoints} {data.hitDice && <span className="text-[10px] text-slate-500 font-normal">({data.hitDice})</span>}
            </span>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <input
                type="number"
                value={data.hitPoints}
                onChange={e => onChange({ ...data, hitPoints: parseInt(e.target.value, 10) || 10 })}
                className="w-10 text-center bg-transparent text-base font-bold text-slate-100 outline-none font-mono"
              />
              <input
                type="text"
                value={data.hitDice || ''}
                placeholder="2d8"
                onChange={e => onChange({ ...data, hitDice: e.target.value })}
                className="w-12 text-[10px] text-slate-400 bg-black/40 border border-white/10 rounded px-1 py-0.5 outline-none font-mono text-center"
                title="Hit Dice Formula"
              />
            </div>
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
              className="w-full text-center bg-transparent text-base font-bold text-slate-100 outline-none font-mono px-1"
            />
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Dices size={11} className="text-purple-400" /> Prof
          </span>
          {previewMode ? (
            <span className="text-base font-bold text-amber-400 font-mono mt-0.5">+{data.proficiencyBonus}</span>
          ) : (
            <input
              type="number"
              value={data.proficiencyBonus}
              onChange={e => onChange({ ...data, proficiencyBonus: parseInt(e.target.value, 10) || 2 })}
              className="w-10 text-center bg-transparent text-base font-bold text-amber-400 outline-none font-mono"
            />
          )}
        </div>
      </div>

      {/* Ability Scores Matrix */}
      <div className="grid grid-cols-6 gap-2">
        {ABILITY_KEYS.map(key => {
          const score = data.abilities[key] || 10;
          const mod = getModifier(score);

          return (
            <div
              key={key}
              onClick={() => handleRollAbility(key, score)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all cursor-pointer group"
              title={`Click to roll ${key.toUpperCase()} check into dice tray`}
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

      {/* SPECIAL ABILITIES & TRAITS SECTION (Keen Smell, Innate Spellcasting, etc.) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div 
            onClick={() => setAreTraitsCollapsed(!areTraitsCollapsed)}
            className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors"
          >
            {areTraitsCollapsed ? <ChevronRight size={13} className="text-amber-400" /> : <ChevronDown size={13} className="text-amber-400" />}
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" /> Special Traits & Abilities
            </span>
            <span className="text-[10px] text-slate-500 font-mono">({(data.traits || []).length})</span>
          </div>

          {!previewMode && !areTraitsCollapsed && (
            <button
              onClick={handleAddNewTrait}
              className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <Plus size={11} /> Add Trait
            </button>
          )}
        </div>

        {!areTraitsCollapsed && (
          <div className="flex flex-col gap-1.5">
            {(data.traits || []).length === 0 ? (
              <div className="text-[11px] text-slate-500 italic py-1 px-1">
                No special traits listed (e.g. Keen Smell, Innate Spellcasting). Click "+ Add Trait" or paste statblock.
              </div>
            ) : (
              (data.traits || []).map(trait => {
                const isExpanded = expandedTraitIds.has(trait.id);
                return (
                  <div
                    key={trait.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setEditingTrait(trait);
                    }}
                    className="flex flex-col rounded-xl bg-[#141b25] border border-white/10 hover:border-white/20 transition-all overflow-hidden"
                  >
                    <div
                      onClick={() => toggleTraitExpansion(trait.id)}
                      className="p-2.5 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTraitExpansion(trait.id);
                          }}
                          className="text-slate-500 group-hover:text-slate-300 transition-colors"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <span className="font-bold text-xs text-amber-300 truncate">{trait.name}</span>
                        {!isExpanded && (
                          <span className="text-[11px] text-slate-400 truncate opacity-70">
                            — {trait.description}
                          </span>
                        )}
                      </div>

                      {!previewMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrait(trait);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors shrink-0"
                          title="Edit Trait"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-white/5 text-[11px] text-slate-300 bg-black/20 leading-relaxed whitespace-pre-wrap">
                        {trait.description}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ACTIONS & ATTACKS SECTION */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div 
            onClick={() => setAreActionsCollapsed(!areActionsCollapsed)}
            className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors"
          >
            {areActionsCollapsed ? <ChevronRight size={13} className="text-amber-400" /> : <ChevronDown size={13} className="text-amber-400" />}
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Swords size={13} className="text-amber-400" /> Actions & Attacks
            </span>
            <span className="text-[10px] text-slate-500 font-mono">({data.actions.length})</span>
          </div>

          {!previewMode && !areActionsCollapsed && (
            <button
              onClick={handleAddNewAction}
              className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <Plus size={11} /> Add Action
            </button>
          )}
        </div>

        {!areActionsCollapsed && (
          <div className="flex flex-col gap-2">
            {data.actions.map(act => {
              const isExpanded = expandedActionIds.has(act.id);

              return (
                <div
                  key={act.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setEditingAction(act);
                  }}
                  className="flex flex-col rounded-xl bg-[#141b25] border border-white/10 hover:border-white/20 transition-all overflow-hidden"
                >
                  <div 
                    onClick={() => toggleActionExpansion(act.id)}
                    className="p-2.5 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActionExpansion(act.id);
                        }}
                        className="text-slate-500 group-hover:text-slate-300 transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      <span className="font-bold text-xs text-slate-100 truncate">{act.name}</span>

                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-slate-400 border border-white/5 font-mono capitalize">
                        {act.type}
                      </span>

                      {act.range && (
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                          • {act.range}
                        </span>
                      )}

                      {act.saveDc && (
                        <span className="text-[10px] text-purple-300 font-semibold px-1 rounded bg-purple-500/10 border border-purple-500/20 font-mono">
                          DC {act.saveDc} {act.saveType?.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleRollAction(e, act)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 font-mono text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
                        title="Left-click: Roll Attack & Damage | Right-click: Edit Action"
                      >
                        <Dices size={11} className="text-amber-400" />
                        <span>{act.toHit >= 0 ? `+${act.toHit}` : act.toHit} to hit</span>
                        <span className="opacity-40">•</span>
                        <span>{act.damageDice}</span>
                      </button>

                      {!previewMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAction(act);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
                          title="Edit Action"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/5 text-xs text-slate-300 flex flex-col gap-1.5 bg-black/20">
                      {act.description && (
                        <p className="leading-relaxed whitespace-pre-wrap text-slate-300 text-[11px]">
                          {act.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                        {act.range && <span>Range: <strong className="text-slate-200">{act.range}</strong></span>}
                        {act.damageType && <span>Damage Type: <strong className="text-amber-300 uppercase">{act.damageType}</strong></span>}
                        {act.saveDc && <span>Saving Throw: <strong className="text-purple-300">DC {act.saveDc} {act.saveType?.toUpperCase()}</strong></span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trait Edit Modal */}
      {editingTrait && (
        <div 
          onClick={() => setEditingTrait(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#151c27] border border-white/15 p-5 shadow-2xl flex flex-col gap-4 text-xs select-none"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Edit Special Trait / Ability
              </span>
              <button onClick={() => setEditingTrait(null)} className="text-slate-400 hover:text-white p-1">
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Trait Name</label>
              <input
                type="text"
                value={editingTrait.name}
                onChange={e => setEditingTrait({ ...editingTrait, name: e.target.value })}
                placeholder="e.g. Keen Smell, Innate Spellcasting"
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Rules Description</label>
              <textarea
                rows={4}
                value={editingTrait.description}
                onChange={e => setEditingTrait({ ...editingTrait, description: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none resize-none leading-relaxed"
                placeholder="Description of how this ability operates..."
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleDeleteTrait(editingTrait.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors font-semibold"
              >
                <Trash2 size={13} />
                <span>Delete Trait</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTrait(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveTraitDrawer(editingTrait)}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors shadow-md"
                >
                  <Check size={14} />
                  <span>Save Trait</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Edit Drawer Modal */}
      {editingAction && (
        <div 
          onClick={() => setEditingAction(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-[#151c27] border border-white/15 p-5 shadow-2xl flex flex-col gap-4 text-xs select-none"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Edit3 size={14} className="text-amber-400" />
                Edit Action: {editingAction.name}
              </span>
              <button onClick={() => setEditingAction(null)} className="text-slate-400 hover:text-white p-1">
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Action Name</label>
                <input
                  type="text"
                  value={editingAction.name}
                  onChange={e => setEditingAction({ ...editingAction, name: e.target.value })}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Action Type</label>
                <select
                  value={editingAction.type}
                  onChange={e => setEditingAction({ ...editingAction, type: e.target.value as any })}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none capitalize"
                >
                  <option value="melee">Melee Attack</option>
                  <option value="ranged">Ranged Attack</option>
                  <option value="spell">Spell Attack</option>
                  <option value="special">Special / Save</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">To-Hit Modifier (+ / -)</label>
                <input
                  type="number"
                  value={editingAction.toHit}
                  onChange={e => setEditingAction({ ...editingAction, toHit: parseInt(e.target.value, 10) || 0 })}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Damage Formula</label>
                <input
                  type="text"
                  value={editingAction.damageDice}
                  placeholder="e.g. 2d6+4"
                  onChange={e => setEditingAction({ ...editingAction, damageDice: e.target.value })}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Range / Reach</label>
                <input
                  type="text"
                  value={editingAction.range || ''}
                  placeholder="e.g. 5 ft or 60/120 ft"
                  onChange={e => setEditingAction({ ...editingAction, range: e.target.value })}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Damage Type</label>
                <input
                  type="text"
                  value={editingAction.damageType || ''}
                  placeholder="slashing, fire, radiant..."
                  onChange={e => setEditingAction({ ...editingAction, damageType: e.target.value })}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Save DC (Optional)</label>
                <input
                  type="number"
                  value={editingAction.saveDc || ''}
                  placeholder="e.g. 15"
                  onChange={e => setEditingAction({ ...editingAction, saveDc: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Save Ability</label>
                <select
                  value={editingAction.saveType || 'dex'}
                  onChange={e => setEditingAction({ ...editingAction, saveType: e.target.value as any })}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none uppercase font-mono"
                >
                  <option value="str">Strength (STR)</option>
                  <option value="dex">Dexterity (DEX)</option>
                  <option value="con">Constitution (CON)</option>
                  <option value="int">Intelligence (INT)</option>
                  <option value="wis">Wisdom (WIS)</option>
                  <option value="cha">Charisma (CHA)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Rules Description</label>
              <textarea
                rows={3}
                value={editingAction.description}
                onChange={e => setEditingAction({ ...editingAction, description: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none resize-none leading-relaxed"
                placeholder="Full attack text, secondary effects, conditions caused..."
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleDeleteAction(editingAction.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors font-semibold"
              >
                <Trash2 size={13} />
                <span>Delete Action</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAction(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveActionDrawer(editingAction)}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors shadow-md"
                >
                  <Check size={14} />
                  <span>Save Action</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heuristic Statblock Scratchpad Modal */}
      {isScratchpadOpen && (
        <div 
          onClick={() => setIsScratchpadOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-[#141b25] border border-white/15 p-6 shadow-2xl flex flex-col gap-4 text-xs font-sans select-none"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-sm font-bold text-slate-100">
                  Heuristic "Paste Statblock" Scratchpad
                </span>
              </div>
              <button onClick={() => setIsScratchpadOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Paste creature text here. The parser extracts <strong>AC, HP, Speed, Ability Scores</strong>, parses passive abilities into <strong>Special Traits & Abilities</strong> (e.g. Keen Smell, Innate Spellcasting), and formats attacks into <strong>Actions</strong>.
            </p>

            <textarea
              rows={11}
              value={scratchpadText}
              onChange={e => setScratchpadText(e.target.value)}
              placeholder="Paste raw statblock text here... (e.g. Cloud Giant with Keen Smell, Innate Spellcasting, Morningstar...)"
              className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-slate-200 outline-none resize-none font-mono text-[11px] leading-relaxed placeholder:text-slate-600 focus:border-amber-500/40"
            />

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[10px] text-slate-500">
                Non-destructive: Updates vitals, traits, and action matrices.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScratchpadOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!scratchpadText.trim()}
                  onClick={handleApplyScratchpad}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles size={13} />
                  <span>Parse & Apply to Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
