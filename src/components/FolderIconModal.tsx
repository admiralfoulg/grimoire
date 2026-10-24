import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  Book,
  BookOpen,
  Scroll,
  Shield,
  Swords,
  Skull,
  MapPin,
  Compass,
  Castle,
  Flame,
  Crown,
  Key,
  Gem,
  Coins,
  Wand2,
  Users,
  Eye,
  Crosshair,
  Search,
  X,
  RotateCcw
} from 'lucide-react';

type IconProps = { size?: number; className?: string };

// Custom RPG SVGs
export const ChestIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M48 96v320h416V96H48zm32 32h352v64H80v-64zm0 96h144v96H80v-96zm176 0h176v96H256v-96zm-32 16h64v64h-64v-64zm-144 112h352v64H80v-64z"/>
    <path d="M60 90h40v330H60zm352 0h40v330h-40zM210 195h92v138h-92z"/>
    <circle cx="256" cy="240" r="14" fill="currentColor" />
    <path d="M250 240h12v40h-12z" fill="currentColor"/>
  </svg>
);

export const WantedPosterIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M80 32v448l48-24 48 24 48-24 48 24 48-24 48 24 48-24 48 24V32l-48 24-48-24-48 24-48-24-48 24-48-24-48 24L80 32zm48 72h256v40H128v-40zm32 72h192v176H160V176zm32 128c0-18 14-32 32-32s32 14 32 32v16h-64v-16zm32-48a24 24 0 100-48 24 24 0 000 48zm-64 80h192v24H160v-24zm0 40h128v20H160v-20z"/>
  </svg>
);

export const TreasureMapIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M64 48l128 32 128-32 128 32v384l-128-32-128 32-128-32V48zm32 48v310l96 24V120L96 96zm128 24v310l96-24V96l-96 24zm128 0v310l64 16V104l-64 16z"/>
    <path d="M160 200l24-24 24 24-24 24zm140 100l32-32 32 32-32 32z"/>
    <path d="M340 330l30-30m-30 0l30 30" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
  </svg>
);

export const PirateFlagIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M256 64c-70.7 0-128 57.3-128 128 0 42.4 20.6 79.9 52.4 103.2L160 384h192l-20.4-88.8c31.8-23.3 52.4-60.8 52.4-103.2 0-70.7-57.3-128-128-128zm-48 112a24 24 0 110 48 24 24 0 010-48zm96 0a24 24 0 110 48 24 24 0 010-48zm-48 80l16 32h-32l16-32z"/>
    <path d="M96 384l96-64-32-32-96 64zm320 0l-96-64 32-32 96 64z"/>
    <path d="M64 160l64-32 32 32-64 32zm384 0l-64-32-32 32 64 32z"/>
  </svg>
);

export const SwordAltarIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M240 32v192h-48v32h48v64h32v-64h48v-32h-48V32h-32zm-16 320l-64 128h192l-64-128H224zm-128 96l32 32h256l32-32H96z"/>
    <path d="M64 480h384v16H64z"/>
  </svg>
);

export const MedievalVillageIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M128 48L32 144v320h192V144L128 48zm320 128l-80-64-80 64v288h160V176zM96 208h64v64H96v-64zm224 32h64v64h-64v-64zM96 352h64v112H96V352zm224 0h64v112h-64V352z"/>
    <path d="M384 64h32v48h-32z"/>
  </svg>
);

export const PotionNectarIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M224 32v64h64V32h-64zm-96 160c0 98.4 62.5 182.2 150.3 213.6L256 480l-22.3-74.4C145.9 374.2 83.4 290.4 83.4 192c0-38 10.2-73.6 28.1-104.4l36.3 21C134.6 131.7 128 160.9 128 192zm256 0c0-31.1-6.6-60.3-19.8-83.4l36.3-21c17.9 30.8 28.1 66.4 28.1 104.4 0 98.4-62.5 182.2-150.3 213.6L256 480l22.3-74.4C366.1 374.2 428.6 290.4 428.6 192z"/>
    <circle cx="256" cy="272" r="48" fill="currentColor"/>
    <path d="M200 80h112v32H200z"/>
  </svg>
);

export const DwarfHelmetIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M256 32C149.9 32 64 117.9 64 224v64h384v-64c0-106.1-85.9-192-192-192zm-16 48h32v80h-32V80zm-96 176h224v32H144v-32zm-48 80l48 144h64l-32-144H96zm320 0l-48 144h-64l32-144h80zm-176 32h32v112h-32V368z"/>
  </svg>
);

export const WarlordHelmetIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M64 64c32 96 64 160 96 192-32 32-64 96-96 192 96-32 160-64 192-96 32 32 96 64 192 96-32-96-64-160-96-192 32-32 64-96 96-192-96 32-160 64-192 96-32-32-96-64-192-96zm192 128c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64z"/>
    <path d="M232 288h48v96h-48z"/>
  </svg>
);

export const CoinPouchIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" className={className}>
    <path d="M256 48c-44 0-80 20-96 48h192c-16-28-52-48-96-48zm-112 80c-48 32-80 96-80 176 0 97.2 86 176 192 176s192-78.8 192-176c0-80-32-144-80-176H144zm48 144h128v32H192v-32zm0 64h128v32H192v-32z"/>
    <circle cx="112" cy="416" r="32" fill="currentColor"/>
    <circle cx="160" cy="448" r="24" fill="currentColor"/>
  </svg>
);

// 28 Pack SVG Icons
export const MetaWorkbenchIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 15h20M7 15v5M17 15v5M4 11h16M6 7l2-4h8l2 4"/>
  </svg>
);

export const CampaignSessionsIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2zM12 7v6l5 3"/>
  </svg>
);

export const CharactersMasterIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5zM4 22a8 8 0 0 1 16 0"/>
  </svg>
);

export const AtlasWorldIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>
  </svg>
);

export const FactionsMasterIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 3v18M4 5l9-2v9l-9 2M15 11l5-1.5v6L15 17"/>
  </svg>
);

export const CodexCanonIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5zM9 10h6M9 14h4"/>
  </svg>
);

export const DashboardSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);

export const InboxSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);

export const TemplatesSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h4"/>
  </svg>
);

export const AssetsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

export const AdventuresSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export const SessionLogsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
  </svg>
);

export const HouseRulesSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m14 13-7.5 7.5c-.8.8-2 .8-2.8 0s-.8-2 0-2.8L11 10M16 3l5 5L8 21l-5-5L16 3z"/>
  </svg>
);

export const HandoutsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>
  </svg>
);

export const PartySubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export const NpcsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="7" r="4"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/>
  </svg>
);

export const MonstersSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m14 12-2 2-2-2M12 2a9 9 0 0 0-9 9c0 7 9 11 9 11s9-4 9-11a9 9 0 0 0-9-9zM9 10h.01M15 10h.01"/>
  </svg>
);

export const RealmsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>
  </svg>
);

export const SettlementsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

export const DungeonsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M9 21v-6a3 3 0 0 1 6 0v6M9 9h6"/>
  </svg>
);

export const NobilitySubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z"/>
  </svg>
);

export const GuildsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m14 12 4-4-2-2-4 4M8 12l-4 4 2 2 4-4M14 8l2 2M8 14l2 2M21 21l-6-6M9 9 3 3"/>
  </svg>
);

export const CultsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
  </svg>
);

export const CosmologySubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20"/>
  </svg>
);

export const HistorySubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

export const ItemsRelicsSubIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/><line x1="2" x2="22" y1="9" y2="9"/><line x1="12" x2="18" y1="22" y2="9"/><line x1="12" x2="6" y1="22" y2="9"/>
  </svg>
);

export const QuickNoteLightningIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

// Catalog Export
export const FOLDER_ICON_MAP: Record<string, React.FC<IconProps>> = {
  // Master Category Grimoire Icons
  'master_00_meta_workbench': MetaWorkbenchIcon,
  'master_01_campaign_sessions': CampaignSessionsIcon,
  'master_02_characters': CharactersMasterIcon,
  'master_03_atlas_world': AtlasWorldIcon,
  'master_04_factions': FactionsMasterIcon,
  'master_05_codex_canon': CodexCanonIcon,

  // Subfolder Grimoire Icons
  'sub_00_dashboard': DashboardSubIcon,
  'sub_00_inbox': InboxSubIcon,
  'sub_00_templates': TemplatesSubIcon,
  'sub_00_assets': AssetsSubIcon,
  'sub_01_adventures': AdventuresSubIcon,
  'sub_01_session_logs': SessionLogsSubIcon,
  'sub_01_house_rules': HouseRulesSubIcon,
  'sub_01_handouts': HandoutsSubIcon,
  'sub_02_party': PartySubIcon,
  'sub_02_npcs': NpcsSubIcon,
  'sub_02_monsters': MonstersSubIcon,
  'sub_03_realms': RealmsSubIcon,
  'sub_03_settlements': SettlementsSubIcon,
  'sub_03_dungeons': DungeonsSubIcon,
  'sub_04_nobility': NobilitySubIcon,
  'sub_04_guilds': GuildsSubIcon,
  'sub_04_cults': CultsSubIcon,
  'sub_05_cosmology': CosmologySubIcon,
  'sub_05_history': HistorySubIcon,
  'sub_05_items_relics': ItemsRelicsSubIcon,

  // Quick Action
  'quick_note_lightning': QuickNoteLightningIcon,

  // RPG Artifacts & Helmets
  'chest': ChestIcon,
  'bounty': WantedPosterIcon,
  'treasureMap': TreasureMapIcon,
  'pirateFlag': PirateFlagIcon,
  'swordAltar': SwordAltarIcon,
  'village': MedievalVillageIcon,
  'potion': PotionNectarIcon,
  'dwarfHelmet': DwarfHelmetIcon,
  'warlordHelmet': WarlordHelmetIcon,
  'pouch': CoinPouchIcon,

  // Standard Lucide Set
  'folder': Folder,
  'folderOpen': FolderOpen,
  'swords': Swords,
  'shield': Shield,
  'book': Book,
  'bookOpen': BookOpen,
  'scroll': Scroll,
  'skull': Skull,
  'mapPin': MapPin,
  'compass': Compass,
  'castle': Castle,
  'flame': Flame,
  'crown': Crown,
  'key': Key,
  'gem': Gem,
  'coins': Coins,
  'wand': Wand2,
  'users': Users,
  'eye': Eye,
  'crosshair': Crosshair
};

interface FolderIconModalProps {
  isOpen: boolean;
  folderName: string;
  currentIcon?: string;
  onSelect: (iconKey: string | undefined) => void;
  onClose: () => void;
}

export const FolderIconModal: React.FC<FolderIconModalProps> = ({
  isOpen,
  folderName,
  currentIcon,
  onSelect,
  onClose
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredIcons = Object.keys(FOLDER_ICON_MAP).filter(key =>
    key.toLowerCase().includes(search.toLowerCase().replace(/[\s-_]+/g, '')) ||
    key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[#131924] border border-white/15 p-5 shadow-2xl flex flex-col gap-4 text-xs select-none"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-100">Select Icon</span>
            <span className="text-[11px] text-amber-400 font-medium truncate max-w-[260px]">
              {folderName}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search all icons (e.g. meta, sessions, dungeon, chest)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-500 font-sans"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Icons Grid */}
        <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1 bg-black/20 rounded-xl border border-white/5">
          {filteredIcons.map(key => {
            const IconComp = FOLDER_ICON_MAP[key];
            const isSelected = currentIcon === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onSelect(key);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400/80 text-amber-300 ring-2 ring-amber-400/30'
                    : 'bg-white/5 border-white/5 hover:border-amber-400/40 hover:bg-white/10 text-slate-300'
                }`}
                title={key}
              >
                <IconComp size={18} />
                <span className="text-[8.5px] mt-1 text-slate-400 font-mono truncate max-w-full text-center">
                  {key.replace(/^(master_|sub_)/, '').replace(/_/g, ' ')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              onSelect(undefined);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Default Icon</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
