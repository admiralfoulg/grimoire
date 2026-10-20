import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { findEntityMentions } from '../services/autolink';
import { DiceService } from '../services/dice';
import { StatblockView } from './StatblockView';
import type { CardBlock, StatblockData } from '../services/storage';
import { StorageService } from '../services/storage-folders';
import { 
  Eye, 
  Edit3, 
  Link2, 
  MoreHorizontal, 
  Square, 
  X, 
  Type, 
  MapPin, 
  Landmark, 
  Activity, 
  Shield, 
  Calendar, 
  GripVertical, 
  Flag, 
  Globe2, 
  Users, 
  Swords, 
  Gem, 
  ChevronDown, 
  ChevronRight, 
  Dices, 
  Plus, 
  Upload, 
  Link, 
  Folder as FolderIcon, 
  Compass, 
  Sparkles, 
  StickyNote 
} from 'lucide-react';

const AutoExpandingTextarea: React.FC<{
  value: string;
  placeholder?: string;
  minHeight?: number;
  onChange: (val: string) => void;
}> = ({ value, placeholder, minHeight = 48, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(minHeight, textareaRef.current.scrollHeight)}px`;
    }
  }, [value, minHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-xs text-slate-300 outline-none resize-none leading-relaxed placeholder:text-slate-500/70 pt-1 font-sans overflow-hidden transition-[height] duration-75"
    />
  );
};

interface SchemaField {
  key: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
}

export type SupportedCardType = 'character' | 'faction' | 'location' | 'item' | 'monster' | 'quest' | 'quicknote';

const SCHEMAS: Record<SupportedCardType, { label: string; icon: string; col1: SchemaField[]; col2: SchemaField[]; defaultBlocks: CardBlock[] }> = {
  character: {
    label: 'Character & NPC',
    icon: '👤',
    col1: [
      { key: 'role', label: 'Role', icon: <Landmark size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Court Wizard / Underworld Informant' },
      { key: 'location', label: 'Location', icon: <MapPin size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Grand Capital (Citadel Upper Ward)' },
      { key: 'allegiance', label: 'Allegiance', icon: <Flag size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. High Council / House Vane' },
      { key: 'status', label: 'Status', icon: <Activity size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Active / In Hiding / Possessed' }
    ],
    col2: [
      { key: 'challengeClass', label: 'Challenge / Class', icon: <Swords size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. CR 12 (Wizard 14)' },
      { key: 'partyStanding', label: 'Party Standing', icon: <Users size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Cautiously Friendly / Transactional' },
      { key: 'voiceDialect', label: 'Voice / Dialect', icon: <Type size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Whispers; speaks in short clipped sentences' },
      { key: 'mannerismQuirk', label: 'Mannerism / Quirk', icon: <Sparkles size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Constantly cleans spectacles; avoids eye contact' }
    ],
    defaultBlocks: [
      { id: 'block-who', title: 'Who they are', content: '', placeholder: 'Two or three lines you could read aloud to introduce them at the table.', width: 'half', collapsed: false },
      { id: 'block-secret', title: 'Secret / Hidden Agenda', content: '', placeholder: 'What they will never admit willingly unless pressed or bribed.', width: 'half', collapsed: false },
      { id: 'block-wants', title: 'Wants', content: '', placeholder: 'Right now, more than anything, they want...', width: 'half', collapsed: false },
      { id: 'block-afraid', title: 'Afraid of', content: '', placeholder: 'They would do almost anything to avoid...', width: 'half', collapsed: false },
      { id: 'block-knows', title: 'What they know (Rumors & Clues)', content: '', placeholder: 'Key pieces of campaign information or quest hooks this NPC can drop.', width: 'full', collapsed: false }
    ]
  },
  faction: {
    label: 'Faction & Organization',
    icon: '🛡️',
    col1: [
      { key: 'leader', label: 'Leader / Figurehead', icon: <Users size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Grand Justiciar Valen' },
      { key: 'headquarters', label: 'Headquarters', icon: <Landmark size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. The Obsidian Spire (Grand Capital)' },
      { key: 'reachInfluence', label: 'Reach & Influence', icon: <Globe2 size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Continental / Local Syndicate' },
      { key: 'currentStatus', label: 'Current Status', icon: <Activity size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Mobilizing for War / Internal Schism' }
    ],
    col2: [
      { key: 'militaryStrength', label: 'Military Strength', icon: <Swords size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. 3,000 Heavy Knights, 2 War Galleys' },
      { key: 'partyReputation', label: 'Party Reputation', icon: <Flag size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Wanted / Honored Guests (+2)' },
      { key: 'primaryAsset', label: 'Primary Asset', icon: <Gem size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Arcane Teleportation Network' },
      { key: 'mainRival', label: 'Main Rival / Enemy', icon: <Swords size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. The Silver Syndicate' }
    ],
    defaultBlocks: [
      { id: 'block-creed', title: 'Creed & Public Face', content: '', placeholder: 'What they claim to believe and how the average citizen views them.', width: 'half', collapsed: false },
      { id: 'block-dark-reality', title: 'The Dark Reality (Covert Scheme)', content: '', placeholder: 'Their actual end goal and how far they will go to achieve it.', width: 'half', collapsed: false },
      { id: 'block-ranks', title: 'Ranks & Structure', content: '', placeholder: 'The command ladder from foot soldier to inner council.', width: 'half', collapsed: false },
      { id: 'block-offer', title: 'What They Offer the Party', content: '', placeholder: 'Contracts, safe passage, rare equipment, or political backing.', width: 'half', collapsed: false },
      { id: 'block-threat-clock', title: 'Threat Clock / Next Move', content: '', placeholder: 'What happens if the players do nothing to interfere.', width: 'full', collapsed: false }
    ]
  },
  location: {
    label: 'Location & Settlement',
    icon: '📍',
    col1: [
      { key: 'typeScale', label: 'Type / Scale', icon: <Globe2 size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Fortified Port City / Frontier Outpost' },
      { key: 'regionRealm', label: 'Region / Realm', icon: <MapPin size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Sunken Reach / Iron Marches' },
      { key: 'population', label: 'Population', icon: <Users size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. ~45,000 (Dominant: Dwarves, Humans)' },
      { key: 'statusMood', label: 'Status / Mood', icon: <Activity size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Under Curfew / Prospering / Rioting' }
    ],
    col2: [
      { key: 'rulerAuthority', label: 'Ruler / Authority', icon: <Landmark size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Lord Regent Malakor / Merchant Council' },
      { key: 'lawEnforcement', label: 'Law Enforcement', icon: <Shield size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Corrupt City Watch / Inquisitorial Guard' },
      { key: 'primaryTrade', label: 'Primary Trade', icon: <Gem size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Black Iron, Smoked Fish, Arcane Glass' },
      { key: 'dangerLevel', label: 'Danger Level', icon: <Swords size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Moderate (Safe on main roads; lethal after dark)' }
    ],
    defaultBlocks: [
      { id: 'block-first-impressions', title: 'First Impressions & Atmosphere', content: '', placeholder: 'Sensory details (smell of brine, soot in the air, clanging harbor bells) when the party arrives.', width: 'half', collapsed: false },
      { id: 'block-active-tension', title: 'Active Local Tension', content: '', placeholder: 'The current crisis threatening to boil over right now.', width: 'half', collapsed: false },
      { id: 'block-landmarks', title: 'Notable Landmarks & Districts', content: '', placeholder: 'Key areas (The Drowned Ward, High Citadel, Sunken Bazaar).', width: 'half', collapsed: false },
      { id: 'block-inns-shops', title: 'Inns, Taverns & Shops', content: '', placeholder: 'Primary establishments where the party can rest, drink, and barter.', width: 'half', collapsed: false },
      { id: 'block-rumors-hooks', title: 'Rumors & Hooks', content: '', placeholder: 'Whispers heard around town that lead to surrounding dungeons or quests.', width: 'full', collapsed: false }
    ]
  },
  item: {
    label: 'Magic Item & Relic',
    icon: '💎',
    col1: [
      { key: 'itemType', label: 'Item Type', icon: <Gem size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Wondrous Item / Longsword' },
      { key: 'rarity', label: 'Rarity', icon: <Sparkles size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Very Rare / Artifact' },
      { key: 'attunement', label: 'Attunement', icon: <Activity size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Requires Attunement by a Spellcaster' },
      { key: 'weightBulk', label: 'Weight & Bulk', icon: <Shield size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. 3 lbs / Fits in palm' }
    ],
    col2: [
      { key: 'estimatedValue', label: 'Estimated Value', icon: <Landmark size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. 7,500 gp (Black Market: 12,000 gp)' },
      { key: 'chargesRecharge', label: 'Charges / Recharge', icon: <Dices size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. 7 charges (Regains 1d6+1 at dawn)' },
      { key: 'currentBearer', label: 'Current Bearer', icon: <Users size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Party Bag of Holding / Crypt of Kings' },
      { key: 'creatorAge', label: 'Creator / Age', icon: <Calendar size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. High Elven Empire (~800 years old)' }
    ],
    defaultBlocks: [
      { id: 'block-visual', title: 'Visual & Sensory Details', content: '', placeholder: 'What it looks, feels, and hums like when held.', width: 'half', collapsed: false },
      { id: 'block-curse', title: 'Hidden Curse / Complication', content: '', placeholder: 'The downside, risk, or personality conflict (if sentient).', width: 'half', collapsed: false },
      { id: 'block-properties', title: 'Core Properties & Spells', content: '', placeholder: 'Action economy, mechanical bonuses, and activated powers.', width: 'half', collapsed: false },
      { id: 'block-passive', title: 'Passive Benefits', content: '', placeholder: 'Resistances, senses, or continuous buffs granted while carried.', width: 'half', collapsed: false },
      { id: 'block-legend', title: 'Legend & Past Bearers', content: '', placeholder: 'Who died wielding it and how it got to its resting place.', width: 'full', collapsed: false }
    ]
  },
  monster: {
    label: 'Monster & Encounter',
    icon: '🐉',
    col1: [
      { key: 'challengeCR', label: 'Challenge (CR)', icon: <Swords size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. CR 9 (5,000 XP)' },
      { key: 'creatureType', label: 'Creature Type / Size', icon: <Users size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Huge Fiend (Demon)' },
      { key: 'acHp', label: 'Armor Class & HP', icon: <Shield size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. AC 17 • HP 168 (16d12+64)' },
      { key: 'speed', label: 'Speed & Movement', icon: <Activity size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. 40 ft, Fly 60 ft (hover)' }
    ],
    col2: [
      { key: 'combatRole', label: 'Combat Role', icon: <Swords size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Ranged Artillery / Disruptive Brute' },
      { key: 'keyDefenses', label: 'Key Defenses', icon: <Shield size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Immune: Fire/Poison; Resists: Cold, Nonmagical Bludgeoning' },
      { key: 'habitatLair', label: 'Habitat / Lair', icon: <MapPin size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Volcanic Caldera / Sunken Catacombs' },
      { key: 'moralStance', label: 'Moral Stance', icon: <Type size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Chaotic Evil (Predatory & Spiteful)' }
    ],
    defaultBlocks: [
      { id: 'block-appearance', title: 'Appearance & Presence', content: '', placeholder: 'Visual tell and audio description when it enters the battlefield (smell of ozone, chitin scraping).', width: 'half', collapsed: false },
      { id: 'block-tactics', title: 'Combat Instincts & Tactics', content: '', placeholder: 'How it fights (targets spellcasters first, retreats if reduced below 40 HP).', width: 'half', collapsed: false },
      { id: 'block-lair', title: 'Lair Actions & Hazards', content: '', placeholder: 'Environmental complications that happen on initiative count 20.', width: 'half', collapsed: false },
      { id: 'block-loot', title: 'Loot & Harvestables', content: '', placeholder: 'Trophy organs, pelts, venom sacs, or coins carried on its person.', width: 'half', collapsed: false },
      { id: 'block-setup', title: 'Encounter Setup & Reinforcements', content: '', placeholder: 'How it ambushes the players and what minions arrive if an alarm sounds.', width: 'full', collapsed: false }
    ]
  },
  quest: {
    label: 'Quest & Adventure Arc',
    icon: '🧭',
    col1: [
      { key: 'questGiver', label: 'Quest Giver', icon: <Users size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. High Inquisitor Vane' },
      { key: 'locationHub', label: 'Location / Hub', icon: <MapPin size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Grand Capital Lower Slums' },
      { key: 'targetObjective', label: 'Target / Objective', icon: <Compass size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Recover the Stolen Sunstone' },
      { key: 'status', label: 'Status', icon: <Activity size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. In Progress / Clues Missing / Failed' }
    ],
    col2: [
      { key: 'rewardPromised', label: 'Reward Promised', icon: <Gem size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. 2,500 gp & Royal Writ of Safe Conduct' },
      { key: 'urgencyClock', label: 'Urgency / Clock', icon: <Calendar size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. 3 Days before the Eclipse' },
      { key: 'difficultyTier', label: 'Difficulty / Tier', icon: <Swords size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Tier 2 (Level 5–8)' },
      { key: 'complicationLevel', label: 'Complication Level', icon: <Shield size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. High (Multiple Factions Active)' }
    ],
    defaultBlocks: [
      { id: 'block-hook', title: 'The Hook', content: '', placeholder: 'How the players get pulled into this problem.', width: 'half', collapsed: false },
      { id: 'block-stakes', title: 'The Stakes', content: '', placeholder: 'What breaks or who dies if the party fails.', width: 'half', collapsed: false },
      { id: 'block-clues', title: '3 Key Clues / Discoveries', content: '', placeholder: 'Direct leads the party can follow.', width: 'half', collapsed: false },
      { id: 'block-twist', title: 'The Twist', content: '', placeholder: 'The unexpected truth that subverts the initial assignment.', width: 'half', collapsed: false },
      { id: 'block-milestones', title: 'Step-by-Step Milestones', content: '', placeholder: 'The sequence of beats connecting the intro scene to the climax.', width: 'full', collapsed: false }
    ]
  },
  quicknote: {
    label: 'Quick Note',
    icon: '📝',
    col1: [
      { key: 'topic', label: 'Topic / Tags', icon: <StickyNote size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Brainstorm, Session Clue, Idea' },
      { key: 'status', label: 'Status', icon: <Activity size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Raw / To Organize / Sorted' }
    ],
    col2: [
      { key: 'context', label: 'Context / Hook', icon: <Sparkles size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. Spontaneous encounter idea' },
      { key: 'importance', label: 'Priority', icon: <Flag size={13} className="text-slate-500 shrink-0" />, placeholder: 'e.g. High / Low / Backlog' }
    ],
    defaultBlocks: [
      { 
        id: 'block-wordbank', 
        title: 'Word Bank & Scratchpad', 
        content: '', 
        placeholder: 'Dump thoughts, freeform dialogue, vocabulary, brainstormed names, key lore snippets, or quick table notes here...', 
        width: 'full', 
        collapsed: false 
      }
    ]
  }
};

const DEFAULT_STATBLOCK: StatblockData = {
  armorClass: 16,
  hitPoints: 48,
  hitDice: '8d8+16',
  speed: '30 ft',
  proficiencyBonus: 3,
  abilities: { str: 10, dex: 14, con: 14, int: 18, wis: 12, cha: 11 },
  actions: [
    { id: 'act-1', name: 'Arcane Staff', type: 'melee', toHit: 7, damageDice: '1d8+4', description: 'Strikes with crackling magical energy.' },
    { id: 'act-2', name: 'Fire Bolt', type: 'spell', toHit: 7, damageDice: '2d10', description: 'Hurls a mote of fire.' }
  ]
};

export const EditorView: React.FC = () => {
  const { cards, folders, activeCardId, updateCard, setActiveCard, moveCardToFolder, openTab } = useGrimoireStore();
  const currentCard = cards.find(c => c.id === activeCardId);

  const [title, setTitle] = useState('');
  const [currentType, setCurrentType] = useState<SupportedCardType>('quicknote');
  const [previewMode, setPreviewMode] = useState(false);
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [blocks, setBlocks] = useState<CardBlock[]>([]);
  const [aliases, setAliases] = useState<string[]>([]);
  const [newAlias, setNewAlias] = useState('');
  const [isAddingAlias, setIsAddingAlias] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isAttributesCollapsed, setIsAttributesCollapsed] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const resolveType = (typeStr?: string): SupportedCardType => {
    const raw = (typeStr || '').toLowerCase();
    if (raw.includes('quick') || raw.includes('scratch') || raw.includes('wordbank') || raw.includes('inbox')) return 'quicknote';
    if (raw.includes('monster') || raw.includes('encounter') || raw.includes('creature')) return 'monster';
    if (raw.includes('location') || raw.includes('place') || raw.includes('atlas') || raw.includes('settlement')) return 'location';
    if (raw.includes('faction') || raw.includes('guild') || raw.includes('order')) return 'faction';
    if (raw.includes('item') || raw.includes('relic') || raw.includes('weapon')) return 'item';
    if (raw.includes('quest') || raw.includes('adventure') || raw.includes('arc')) return 'quest';
    if (raw.includes('character') || raw.includes('npc')) return 'character';
    return 'quicknote';
  };

  useEffect(() => {
    if (currentCard) {
      setTitle(currentCard.name || '');
      const parsedType = resolveType(currentCard.type);
      setCurrentType(parsedType);
      setAliases(currentCard.aliases || []);
      setProperties(currentCard.properties || {});
      const fallback = (SCHEMAS[parsedType] || SCHEMAS.quicknote).defaultBlocks;
      setBlocks(currentCard.blocks && currentCard.blocks.length > 0 ? currentCard.blocks : fallback);
      setShowUrlInput(false);

      if (!currentCard.name || currentCard.name === 'Untitled' || currentCard.name === 'New Document') {
        setTimeout(() => {
          titleInputRef.current?.select();
        }, 50);
      }
    }
  }, [currentCard?.id]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
    };
    if (isTypeDropdownOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isTypeDropdownOpen]);

  // Strictly Alphabetized List of Archetypes for the Dropdown (A -> Z)
  const sortedArchetypes = useMemo(() => {
    return (Object.keys(SCHEMAS) as SupportedCardType[]).sort((a, b) => 
      SCHEMAS[a].label.localeCompare(SCHEMAS[b].label, undefined, { sensitivity: 'base' })
    );
  }, []);

  if (!currentCard) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        No document selected. Click + on the sidebar to create one.
      </div>
    );
  }

  const activeSchema = SCHEMAS[currentType] || SCHEMAS.quicknote;

  const syncCard = (updatedFields: Partial<typeof currentCard>) => {
    updateCard({
      ...currentCard,
      ...updatedFields,
      type: updatedFields.type ?? currentType,
      properties: updatedFields.properties ?? properties,
      blocks: updatedFields.blocks ?? blocks,
      aliases: updatedFields.aliases ?? aliases
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    
    useGrimoireStore.setState((state) => ({
      cards: state.cards.map((c) =>
        c.id === currentCard.id ? { ...c, name: newTitle, updatedAt: Date.now() } : c
      )
    }));

    StorageService.renameCard(currentCard.id, newTitle);
  };

  const handlePropertyChange = (key: string, value: string) => {
    const updated = { ...properties, [key]: value };
    setProperties(updated);
    syncCard({ properties: updated });
  };

  const handleBlockChange = (id: string, field: 'title' | 'content', val: string) => {
    const updated = blocks.map(b => b.id === id ? { ...b, [field]: val } : b);
    setBlocks(updated);
    syncCard({ blocks: updated });
  };

  const toggleBlockCollapse = (id: string) => {
    const updated = blocks.map(b => b.id === id ? { ...b, collapsed: !b.collapsed } : b);
    setBlocks(updated);
    syncCard({ blocks: updated });
  };

  const handleStatblockUpdate = (blockId: string, updatedStatblock: StatblockData) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, statblock: updatedStatblock } : b);
    setBlocks(updated);
    syncCard({ blocks: updated });
  };

  const handleTypeChange = (newType: SupportedCardType) => {
    setCurrentType(newType);
    const targetSchema = SCHEMAS[newType];
    const isPristine = blocks.length === 0 || blocks.every(b => !b.content.trim() && b.blockType !== 'statblock');
    const nextBlocks = isPristine ? targetSchema.defaultBlocks : blocks;

    setBlocks(nextBlocks);
    setIsTypeDropdownOpen(false);

    updateCard({
      ...currentCard,
      type: newType,
      blocks: nextBlocks
    });
  };

  const handleAddTextBlock = () => {
    const newBlock: CardBlock = {
      id: crypto.randomUUID(),
      title: 'New Section',
      content: '',
      placeholder: 'Write notes here...',
      width: 'full',
      blockType: 'text',
      collapsed: false
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    syncCard({ blocks: updated });
  };

  const handleAddStatblock = () => {
    const newBlock: CardBlock = {
      id: crypto.randomUUID(),
      title: 'TTRPG Statblock',
      content: '',
      width: 'full',
      blockType: 'statblock',
      collapsed: false,
      statblock: DEFAULT_STATBLOCK
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    syncCard({ blocks: updated });
  };

  const handleDeleteBlock = (id: string) => {
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    syncCard({ blocks: updated });
  };

  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    setDraggedIndex(targetIdx);
    setBlocks(reordered);
    syncCard({ blocks: reordered });
  };

  const handleAddAliasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim()) return;
    const updated = [...aliases, newAlias.trim()];
    setAliases(updated);
    setNewAlias('');
    setIsAddingAlias(false);
    syncCard({ aliases: updated });
  };

  const handleRemoveAlias = (alias: string) => {
    const updated = aliases.filter(a => a !== alias);
    setAliases(updated);
    syncCard({ aliases: updated });
  };

  const handlePortraitFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handlePropertyChange('portraitUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const renderAutoLinkedContent = (rawText: string) => {
    if (!rawText) return null;
    const autoMatches = findEntityMentions(rawText, cards.filter(c => c.id !== currentCard.id));
    const explicitRegex = /\[\[(.*?)\]\]/g;
    const diceRegex = /\b(\d+d\d+([+-]\d+)?)\b/gi;

    let match;
    const tokens: { start: number; end: number; kind: 'entity' | 'dice'; payload: string; cardId?: string }[] = [];

    for (const m of autoMatches) {
      tokens.push({ start: m.start, end: m.end, kind: 'entity', payload: m.text, cardId: m.cardId });
    }

    while ((match = explicitRegex.exec(rawText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const targetName = match[1].trim();
      const targetCard = cards.find(c => c.name.toLowerCase() === targetName.toLowerCase());

      for (let i = tokens.length - 1; i >= 0; i--) {
        if (tokens[i].start >= start && tokens[i].end <= end) {
          tokens.splice(i, 1);
        }
      }

      tokens.push({ start, end, kind: 'entity', payload: targetName, cardId: targetCard?.id });
    }

    while ((match = diceRegex.exec(rawText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = tokens.some(t => (start >= t.start && start < t.end) || (end > t.start && end <= t.end));
      if (!overlaps) {
        tokens.push({ start, end, kind: 'dice', payload: match[1] });
      }
    }

    tokens.sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    tokens.forEach((token, idx) => {
      if (token.start > lastIndex) {
        elements.push(rawText.slice(lastIndex, token.start));
      }

      if (token.kind === 'dice') {
        elements.push(
          <button
            key={`dice-${idx}`}
            onClick={() => {
              const res = DiceService.roll(token.payload);
              alert(`Rolled ${token.payload}: Result = ${res.total}`);
            }}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 cursor-pointer font-mono text-[11px] transition-all"
          >
            <Dices size={11} className="opacity-75" />
            <span>{token.payload}</span>
          </button>
        );
      } else {
        const targetCard = cards.find(c => c.id === token.cardId || c.name.toLowerCase() === token.payload.toLowerCase());
        elements.push(
          <span
            key={`link-${idx}`}
            className="wiki-link inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer"
            onClick={(e) => {
              if (!targetCard) return;
              if (e.ctrlKey || e.metaKey) {
                // Background tab open
                openTab({ id: targetCard.id, title: targetCard.title, type: 'card' });
              } else {
                setActiveCard(targetCard.id);
              }
            }}
            onAuxClick={(e) => {
              if (e.button === 1 && targetCard) {
                // Middle-click opens in tab
                e.preventDefault();
                openTab({ id: targetCard.id, title: targetCard.title, type: 'card' });
              }
            }}
          >
            <Link2 size={11} className="opacity-70" />
            <span>{token.payload}</span>
          </span>
        );
      }

      lastIndex = token.end;
    });

    if (lastIndex < rawText.length) {
      elements.push(rawText.slice(lastIndex));
    }
    return elements;
  };

  const showStatblockOption = currentType === 'character' || currentType === 'monster';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1b232f]/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden m-2.5 text-slate-200 shadow-2xl relative font-sans">
      
      {/* Top Action Header */}
      <div className="h-8 px-4 flex items-center justify-between text-slate-400 border-b border-white/5 bg-[#141b25]/50 select-none">
        <div className="flex items-center gap-1.5 text-xs">
          <FolderIcon size={12} className="text-slate-500" />
          <span className="text-[11px] text-slate-500">Folder:</span>
          <select
            value={currentCard.folderId || ''}
            onChange={e => moveCardToFolder && moveCardToFolder(currentCard.id, e.target.value || undefined)}
            className="bg-transparent text-slate-300 outline-none hover:text-white cursor-pointer text-xs"
          >
            <option value="" className="bg-[#141b25]">Root (Unfiled)</option>
            {folders.map(f => (
              <option key={f.id} value={f.id} className="bg-[#141b25]">{f.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/5 hover:text-slate-200 transition-colors"
          >
            {previewMode ? <Edit3 size={11} /> : <Eye size={11} />}
            <span>{previewMode ? 'Edit' : 'Preview'}</span>
          </button>
          <span className="text-white/10">|</span>
          <button className="hover:text-slate-200 transition-colors"><MoreHorizontal size={13} /></button>
          <button className="hover:text-slate-200 transition-colors"><Square size={11} /></button>
          <button className="hover:text-slate-200 transition-colors"><X size={13} /></button>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="flex-1 overflow-y-auto px-12 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          {/* Top Title, Type Pill, Aliases & Attributes Matrix with Portrait */}
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1 flex flex-col gap-2.5">
              
              {/* Document Title: Connected in real-time to sidebar */}
              <div className="flex items-center justify-between">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled Note..."
                  className="bg-transparent text-[28px] font-semibold text-slate-100 outline-none w-full tracking-tight placeholder:text-slate-500 focus:placeholder:text-slate-600"
                />

                <div className="flex items-center gap-2.5 shrink-0 relative" ref={dropdownRef}>
                  <button 
                    type="button"
                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-[11px] text-purple-300 font-medium transition-colors cursor-pointer"
                    title="Change card archetype"
                  >
                    <span className="text-[11px]">{activeSchema.icon}</span>
                    <span>{activeSchema.label}</span>
                    <ChevronDown size={11} className="text-purple-400" />
                  </button>

                  {/* Alphabetized Archetype Dropdown Menu */}
                  {isTypeDropdownOpen && (
                    <div className="absolute right-0 top-8 w-56 bg-[#151a24] border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5">
                      {sortedArchetypes.map((key) => {
                        const item = SCHEMAS[key];
                        const isSelected = currentType === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleTypeChange(key)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              isSelected ? 'bg-purple-500/20 text-purple-200 font-semibold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{item.icon}</span>
                              <span>{item.label}</span>
                            </span>
                            {isSelected && <span className="text-[11px] text-purple-400 font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Aliases */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-slate-500 text-[11px] flex items-center gap-1">🏷 Aliases</span>
                {aliases.map(a => (
                  <span key={a} className="bg-white/5 px-2 py-0.5 rounded text-[11px] text-slate-300 flex items-center gap-1 border border-white/5">
                    {a}
                    <button onClick={() => handleRemoveAlias(a)} className="hover:text-red-400 text-slate-500">×</button>
                  </span>
                ))}

                {isAddingAlias ? (
                  <form onSubmit={handleAddAliasSubmit} className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Add alias..."
                      value={newAlias}
                      onChange={e => setNewAlias(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white outline-none w-24"
                    />
                    <button type="submit" className="text-[10px] text-amber-400">Add</button>
                    <button type="button" onClick={() => setIsAddingAlias(false)} className="text-[10px] text-slate-500">✕</button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingAlias(true)}
                    className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-0.5"
                  >
                    + Add
                  </button>
                )}
              </div>

              {/* Collapsible Attributes Bar */}
              <div 
                onClick={() => setIsAttributesCollapsed(!isAttributesCollapsed)}
                className="flex items-center justify-between pt-3 pb-1 text-slate-400 hover:text-slate-200 cursor-pointer select-none group"
              >
                <div className="flex items-center gap-1.5">
                  {isAttributesCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Attributes & Background</span>
                </div>
                <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
                  {isAttributesCollapsed ? 'Click to expand' : 'Click to collapse'}
                </span>
              </div>

              {/* Header Attributes Grid */}
              {!isAttributesCollapsed && (
                <div className="grid grid-cols-2 gap-x-12 gap-y-2.5 pt-1 text-xs">
                  {/* Column 1 */}
                  <div className="flex flex-col gap-2.5">
                    {activeSchema.col1.map(field => (
                      <div key={field.key} className="flex items-center gap-2.5">
                        {field.icon}
                        <span className="text-slate-400 w-36 truncate font-medium">{field.label}</span>
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={properties[field.key] || ''}
                          onChange={e => handlePropertyChange(field.key, e.target.value)}
                          className="flex-1 bg-transparent border-b border-transparent hover:border-white/10 focus:border-white/20 outline-none text-slate-200 placeholder:text-slate-600 transition-colors"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Column 2 */}
                  <div className="flex flex-col gap-2.5">
                    {activeSchema.col2.map(field => (
                      <div key={field.key} className="flex items-center gap-2.5">
                        {field.icon}
                        <span className="text-slate-400 w-36 truncate font-medium">{field.label}</span>
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={properties[field.key] || ''}
                          onChange={e => handlePropertyChange(field.key, e.target.value)}
                          className="flex-1 bg-transparent border-b border-transparent hover:border-white/10 focus:border-white/20 outline-none text-slate-200 placeholder:text-slate-600 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right-Hand Portrait Box */}
            <div className="w-56 shrink-0 flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePortraitFileUpload}
                className="hidden"
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[3/4] rounded-2xl bg-[#141b25]/90 border border-white/10 hover:border-amber-500/40 overflow-hidden relative group shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-colors"
                title="Click to choose image file from your computer"
              >
                {properties.portraitUrl ? (
                  <img
                    src={properties.portraitUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500 p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:scale-110 transition-all">
                      <Upload size={18} />
                    </div>
                    <span className="text-xs font-medium text-slate-300">Click to Upload</span>
                    <span className="text-[10px] text-slate-500">or hover for URL</span>
                  </div>
                )}

                <div 
                  onClick={e => e.stopPropagation()}
                  className="absolute inset-x-2 bottom-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] text-slate-200 font-medium transition-colors"
                    title="Upload local file"
                  >
                    <Upload size={11} /> File
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] text-slate-200 font-medium transition-colors"
                    title="Paste web URL"
                  >
                    <Link size={11} /> URL
                  </button>

                  {properties.portraitUrl && (
                    <button
                      type="button"
                      onClick={() => handlePropertyChange('portraitUrl', '')}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {showUrlInput && (
                <div className="flex items-center gap-1 p-1 bg-black/60 border border-white/10 rounded-lg">
                  <input
                    type="text"
                    autoFocus
                    placeholder="https://... or paste URL"
                    value={properties.portraitUrl?.startsWith('data:') ? '' : (properties.portraitUrl || '')}
                    onChange={e => handlePropertyChange('portraitUrl', e.target.value)}
                    className="flex-1 bg-transparent px-2 py-0.5 text-[10px] text-white outline-none placeholder:text-slate-500"
                  />
                  <button 
                    onClick={() => setShowUrlInput(false)}
                    className="p-0.5 text-slate-500 hover:text-slate-300"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Modular Prompt Blocks */}
          <div className="flex flex-wrap gap-x-12 gap-y-7 pt-4 items-start">
            {blocks.map((block, idx) => {
              const isCollapsed = Boolean(block.collapsed);

              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  className={`flex flex-col gap-1.5 relative group ${
                    block.width === 'half' ? 'w-[calc(50%-24px)]' : 'w-full'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <button
                        onClick={() => toggleBlockCollapse(block.id)}
                        className="text-slate-400 hover:text-amber-400 transition-colors p-0.5 rounded shrink-0"
                        title={isCollapsed ? 'Expand section' : 'Collapse section'}
                      >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      </button>

                      <span className="text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shrink-0">
                        <GripVertical size={13} />
                      </span>

                      <input
                        type="text"
                        value={block.title}
                        onChange={e => handleBlockChange(block.id, 'title', e.target.value)}
                        className="bg-transparent text-sm font-semibold text-slate-100 outline-none w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const updated = blocks.map(b => 
                            b.id === block.id ? { ...b, width: (b.width === 'half' ? 'full' : 'half') as 'full' | 'half' } : b
                          );
                          setBlocks(updated);
                          syncCard({ blocks: updated });
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-300 px-1"
                      >
                        {block.width === 'half' ? 'Full' : 'Half'}
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="pt-0.5">
                      {block.blockType === 'statblock' && block.statblock ? (
                        <StatblockView
                          data={block.statblock}
                          onChange={updated => handleStatblockUpdate(block.id, updated)}
                          previewMode={previewMode}
                        />
                      ) : previewMode ? (
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap py-1 font-sans">
                          {renderAutoLinkedContent(block.content) || (
                            <span className="text-slate-500 font-sans italic">{block.placeholder}</span>
                          )}
                        </div>
                      ) : (
                        <AutoExpandingTextarea
                          value={block.content}
                          placeholder={block.placeholder}
                          minHeight={currentType === 'quicknote' ? 220 : 48}
                          onChange={val => handleBlockChange(block.id, 'content', val)}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section Adder Buttons */}
          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={handleAddTextBlock}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <Plus size={13} /> Add section
            </button>

            {showStatblockOption && (
              <>
                <span className="text-white/10">•</span>
                <button
                  onClick={handleAddStatblock}
                  className="text-xs text-amber-500/80 hover:text-amber-400 flex items-center gap-1 font-medium"
                >
                  <Shield size={13} /> Add 5e/Daggerheart Statblock
                </button>
              </>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
