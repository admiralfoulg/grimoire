import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { ProjectionService, type ActiveRulerData, type PlayerCombatantView } from '../services/broadcast';
import type { MapToken, SightType, ObstacleType, SavedTokenTemplate, WorldMap, Combatant, CombatSoundTrigger } from '../services/storage';
import { 
  Globe, 
  Swords, 
  Plus, 
  Trash2, 
  Cast, 
  MapPin as PinIcon, 
  X,
  Radio,
  UserPlus,
  Upload,
  Grid,
  Magnet,
  Heart,
  Eye,
  EyeOff,
  ChevronDown,
  Cloud,
  Eraser,
  Brush,
  Sun,
  Moon,
  Flame,
  DoorClosed,
  DoorOpen,
  Square,
  Box,
  Image as ImageIcon,
  BookmarkCheck,
  Users,
  Map as MapIcon,
  Check,
  Lock,
  Ruler,
  Sparkles,
  Edit2,
  RefreshCw,
  RotateCw,
  RotateCcw,
  Crosshair,
  Zap,
  MousePointer,
  AlertCircle,
  UserCheck,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronLeft,
  GripHorizontal,
  Minimize2,
  Maximize2,
  Shield,
  Volume2,
  Play,
  Square as StopSquare
,
  Footprints,
  Route,
  Pause
} from 'lucide-react';

const DND_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Concentrating',
  'Dead',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious'
];

const CONDITION_COLORS: Record<string, string> = {
  Blinded: 'bg-zinc-700 text-zinc-100 border-zinc-400 ring-zinc-300',
  Charmed: 'bg-pink-700 text-pink-100 border-pink-400 ring-pink-300',
  Concentrating: 'bg-blue-600 text-blue-100 border-blue-400 ring-blue-300',
  Dead: 'bg-red-950 text-red-200 border-red-500 ring-red-400',
  Frightened: 'bg-amber-700 text-amber-100 border-amber-400 ring-amber-300',
  Grappled: 'bg-orange-700 text-orange-100 border-orange-400 ring-orange-300',
  Incapacitated: 'bg-purple-800 text-purple-100 border-purple-400 ring-purple-300',
  Invisible: 'bg-cyan-800 text-cyan-100 border-cyan-400 ring-cyan-300',
  Paralyzed: 'bg-yellow-700 text-yellow-100 border-yellow-400 ring-yellow-300',
  Petrified: 'bg-stone-700 text-stone-100 border-stone-400 ring-stone-300',
  Poisoned: 'bg-emerald-700 text-emerald-100 border-emerald-400 ring-emerald-300',
  Prone: 'bg-indigo-700 text-indigo-100 border-indigo-400 ring-indigo-300',
  Restrained: 'bg-teal-700 text-teal-100 border-teal-400 ring-teal-300',
  Stunned: 'bg-violet-700 text-violet-100 border-violet-400 ring-violet-300',
  Unconscious: 'bg-rose-900 text-rose-100 border-rose-500 ring-rose-400'
};

const ChestIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="2.5" y="9" width="19" height="12" rx="1.5" fill="#8B4513" stroke="#D4AF37" strokeWidth="1.5"/>
    <path d="M2.5 10C2.5 5.5 6 3 12 3C18 3 21.5 5.5 21.5 10H2.5Z" fill="#A0522D" stroke="#D4AF37" strokeWidth="1.5"/>
    <line x1="7" y1="3.5" x2="7" y2="21" stroke="#D4AF37" strokeWidth="1.5"/>
    <line x1="17" y1="3.5" x2="17" y2="21" stroke="#D4AF37" strokeWidth="1.5"/>
    <line x1="2.5" y1="10" x2="21.5" y2="10" stroke="#222" strokeWidth="1"/>
    <rect x="10.5" y="9" width="3" height="4" rx="0.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.8"/>
    <circle cx="12" cy="10.5" r="0.7" fill="#1a1a1a"/>
    <line x1="12" y1="10.8" x2="12" y2="12.2" stroke="#1a1a1a" strokeWidth="0.8"/>
  </svg>
);

interface ContextMenuState {
  x: number;
  y: number;
  mapX: number;
  mapY: number;
  targetTokenId?: string;
  targetObstacleId?: string;
}

interface MapDropdownContextMenu {
  x: number;
  y: number;
  map: WorldMap;
}

interface RosterContextMenu {
  x: number;
  y: number;
  template: SavedTokenTemplate;
}

// 2D Line Segment Intersection Algorithm with Gap-Sealing Endpoint Buffering (epsilon)
const segmentIntersectsSegment = (
  p1x: number, p1y: number, p2x: number, p2y: number,
  q1x: number, q1y: number, q2x: number, q2y: number,
  epsilon: number = 0.15
): boolean => {
  const dx = q2x - q1x;
  const dy = q2y - q1y;
  const len = Math.sqrt(dx * dx + dy * dy);
  let ax = q1x;
  let ay = q1y;
  let bx = q2x;
  let by = q2y;

  if (len > 0.0001 && epsilon > 0) {
    const ux = (dx / len) * epsilon;
    const uy = (dy / len) * epsilon;
    ax = q1x - ux;
    ay = q1y - uy;
    bx = q2x + ux;
    by = q2y + uy;
  }

  const cross = (vx: number, vy: number, wx: number, wy: number) => vx * wy - vy * wx;

  const rX = p2x - p1x;
  const rY = p2y - p1y;
  const sX = bx - ax;
  const sY = by - ay;

  const rxs = cross(rX, rY, sX, sY);
  const qpx = ax - p1x;
  const qpy = ay - p1y;

  if (Math.abs(rxs) < 1e-9) {
    return false;
  }

  const t = cross(qpx, qpy, sX, sY) / rxs;
  const u = cross(qpx, qpy, rX, rY) / rxs;

  return (t >= 0.0 && t <= 1.0 && u >= 0.0 && u <= 1.0);
};


// Parses a name into a normalized base and distinct index: "concordants 2" -> { base: "concordant", num: "2" }
const parseEntityKey = (name: string): string => {
  const clean = (name || '').trim().toLowerCase();
  const match = clean.match(/^(.*?)(?:\s*#?\s*(\d+))?$/);
  let base = (match?.[1] || clean).trim();
  const num = match?.[2] || '';
  base = base.replace(/[^a-z0-9]/g, '').replace(/s$/, '');
  return num ? `${base}:${num}` : base;
};

// Returns next auto-numbered name: e.g. "Goblin" -> "Goblin 1", "Goblin 2"
const getAutoNumberedTokenName = (rawName: string, existingTokens: { name: string }[]): string => {
  const clean = (rawName || '').trim();
  const match = clean.match(/^(.*?)(?:\s*#?\s*(\d+))?$/);
  const baseName = (match?.[1] || clean).trim();
  const baseLower = baseName.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');

  let highestNum = 0;
  let hasBaseNameMatch = false;

  for (const t of existingTokens) {
    const tClean = (t.name || '').trim();
    const tMatch = tClean.match(/^(.*?)(?:\s*#?\s*(\d+))?$/);
    const tBase = (tMatch?.[1] || tClean).trim();
    const tBaseLower = tBase.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');

    if (tBaseLower === baseLower) {
      hasBaseNameMatch = true;
      const num = parseInt(tMatch?.[2] || '0', 10);
      if (!isNaN(num) && num > highestNum) {
        highestNum = num;
      }
    }
  }

  if (highestNum > 0) {
    return `${baseName} ${highestNum + 1}`;
  }
  return hasBaseNameMatch ? `${baseName} 2` : `${baseName} 1`;
};


// Traces all grid cell coordinates (col, row) between two points
const getTilesAlongLine = (x1: number, y1: number, x2: number, y2: number, cols: number, rows: number): { col: number; row: number }[] => {
  let c0 = Math.floor((x1 / 100) * cols);
  let r0 = Math.floor((y1 / 100) * rows);
  const c1 = Math.floor((x2 / 100) * cols);
  const r1 = Math.floor((y2 / 100) * rows);

  const tiles: { col: number; row: number }[] = [];
  const dx = Math.abs(c1 - c0);
  const dy = Math.abs(r1 - r0);
  const sx = c0 < c1 ? 1 : -1;
  const sy = r0 < r1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    tiles.push({ col: c0, row: r0 });
    if (c0 === c1 && r0 === r1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      c0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      r0 += sy;
    }
  }
  return tiles;
};


// Checks if a 2D coordinate is inside an arbitrary polygon
const isPointInsidePolygon = (x: number, y: number, polygon: { x: number; y: number }[]): boolean => {
  if (!polygon || polygon.length < 3) return true;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export const MapView: React.FC<{ mapId?: string }> = ({ mapId }) => {
  const {
    cards,
    updateCard,
    setActiveCard,
    setActiveView,
    maps, 
    activeMapId, 
    combats,
    activeCombatId,
    savedTokens,
    combatSounds,
    selectedTokenId,
    setSelectedTokenId,
    createMap, 
    deleteMap, 
    setActiveMap, 
    setMapLighting,
    setMapGridDimensions,
    addPinToMap, 
    deletePinFromMap,
    addTokenToMap,
    updateToken,
    updateTokenPosition,
    deleteTokenFromMap,
    saveTokenToVault,
    deleteTokenFromVault,
    addObstacleToMap,
    toggleDoorState,
    toggleObstacleSecret,
    deleteObstacleFromMap,
    toggleFogOfWar,
    toggleDynamicVision,
    setFogCells,
    updateCombat,
    saveCombatSoundTrigger,
    deleteCombatSoundTrigger,
    nextTurn,
    prevTurn
  } = useGrimoireStore();

  const effectiveMapId = mapId || activeMapId;
  const activeMap = maps.find(m => m.id === effectiveMapId) || maps[0];
  const isTactical = (activeMap?.mapType || 'world') === 'tactical';
  const activeCombat = combats.find(c => c.id === activeCombatId);

  const [isProjecting, setIsProjecting] = useState(false);
  const [isAddingPin, setIsAddingPin] = useState(false);



  const [newPinLabel, setNewPinLabel] = useState('');
  const [newPinColor, setNewPinColor] = useState('#f59e0b');
  const [newPinSecret, setNewPinSecret] = useState(false);

  // Zoom & Pan State
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showCombatSidebar, setShowCombatSidebar] = useState<boolean>(true);
  const [isCombatSidebarMinimized, setIsCombatSidebarMinimized] = useState<boolean>(false);
  const [sidebarPos, setSidebarPos] = useState<{ x: number; y: number }>({ x: 20, y: 68 });
  const [sidebarWidth, setSidebarWidth] = useState<number>(230);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState<'left' | 'right' | null>(null);
  const dragSidebarOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(230);
  const [expandedCombatantId, setExpandedCombatantId] = useState<string | null>(null);

  // Sound Bar Tool State
  const [showSoundPopover, setShowSoundPopover] = useState(false);
  const [activeAudioObj, setActiveAudioObj] = useState<HTMLAudioElement | null>(null);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [isCreatingSound, setIsCreatingSound] = useState(false);
  const [soundFormName, setSoundFormName] = useState('');
  const [soundFormIcon, setSoundFormIcon] = useState('⚔️');
  const [soundFormDataUrl, setSoundFormDataUrl] = useState('');

  // Dropdowns
  const [showMapsMenu, setShowMapsMenu] = useState(false);
  const [showObjectsMenu, setShowObjectsMenu] = useState(false);
  const [showFogMenu, setShowFogMenu] = useState(false);
  const [showGridDropdown, setShowGridDropdown] = useState(false);
  const [showAddTokenMenu, setShowAddTokenMenu] = useState(false);
  const [tokenTrayTab, setTokenTrayTab] = useState<'codex' | 'party' | 'custom'>('codex');
  const [codexSearchQuery, setCodexSearchQuery] = useState('');
  const [vaultSaveSuccess, setVaultSaveSuccess] = useState(false);

  // Context Menus
  const [mapContextMenu, setMapContextMenu] = useState<MapDropdownContextMenu | null>(null);
  const [rosterContextMenu, setRosterContextMenu] = useState<RosterContextMenu | null>(null);
  const [renamingMapId, setRenamingMapId] = useState<string | null>(null);
  const [renamingMapName, setRenamingMapName] = useState('');

  // Tools
  const [blockerShapeStart, setBlockerShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDragPos, setCurrentDragPos] = useState<{ x: number; y: number } | null>(null);
  const [toolMode, setToolMode] = useState<'select' | 'ruler' | 'addToken' | 'addWall' | 'addDoor' | 'addSecretDoor' | 'addWindow' | 'addChest' | 'addSecretChest' | 'addTable' | 'eraseObstacle' | 'fogReveal' | 'fogShroud' | 'addBlockerCircle' | 'addBlockerBox' | 'addBlockerCircle' | 'addBlockerBox'>('select');

  // Vector Drawing State
    const [lineStartPoint, setLineStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);

  // Ruler Tool State
  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null);
  const [activeRuler, setActiveRuler] = useState<ActiveRulerData | null>(null);

  // Token Deployment State
  const [tokenName, setTokenName] = useState('Hero');
  const [tokenColor] = useState('#ef4444');
  const [tokenImageUrl, setTokenImageUrl] = useState<string>('');
  const [tokenSize, setTokenSize] = useState<'medium' | 'large' | 'huge'>('medium');
  const [tokenHp, setTokenHp] = useState<number>(30);
  const [tokenSecret] = useState(false);
  const [tokenIsPlayer, setTokenIsPlayer] = useState(true);
  const [tokenVisionRange] = useState<number>(6);
  const [tokenSightType] = useState<SightType>('normal');

  // Synchronous Anti-Bounce Token Coordinate Store
  const tokenCoordsRef = useRef<Record<string, { x: number; y: number }>>({});
  const [, forceUpdate] = useState({});

  // Continuous Drag-Painting State
  const [isMouseDownOnCanvas, setIsMouseDownOnCanvas] = useState(false);
    
  // Custom Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Grid Settings
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [gridStyle, setGridStyle] = useState<'dark' | 'bold' | 'light'>('dark');
  const gridCols = activeMap?.gridCols ?? 25;
  const gridRows = activeMap?.gridRows ?? 30;

  // Snapping helper: snaps directly to nearest grid vertex/corner
  
  // Checks if a straight path from (x1, y1) to (x2, y2) crosses any solid wall or closed door
  const isMovementBlocked = (x1: number, y1: number, x2: number, y2: number): boolean => {
    const obstacles = activeMap?.obstacles || [];
    for (const obs of obstacles) {
      if (obs.x1 !== undefined && obs.y1 !== undefined && obs.x2 !== undefined && obs.y2 !== undefined) {
        if (obs.type === 'door' && obs.isOpen) continue;
        if (obs.type === 'window') continue;
        if (segmentIntersectsSegment(x1, y1, x2, y2, obs.x1, obs.y1, obs.x2, obs.y2, 0.15)) {
          return true;
        }
      }
    }
    return false;
  };

  
  // Checks if moving from (fromX, fromY) to (toX, toY) is blocked by ANY wall or closed door (tile or vector)
  const isMoveBlocked = (fromX: number, fromY: number, toX: number, toY: number): boolean => {
    if (!activeMap) return false;
    const toCol = Math.floor((toX / 100) * gridCols);
    const toRow = Math.floor((toY / 100) * gridRows);

    const obstacles = activeMap.obstacles || [];
    for (const obs of obstacles) {
      const isSolid = obs.type === 'wall' || (obs.type === 'door' && !obs.isOpen);
      if (!isSolid) continue;

      // Check Tile-based walls
      if (obs.col !== undefined && obs.row !== undefined) {
        if (obs.col === toCol && obs.row === toRow) {
          return true;
        }
      }

      
      // Check Free-Floating Blocker Boxes (Cubes)
      if (obs.type === 'table' || (obs as any).shapeType === 'box') {
        const bx = (obs as any).boxX ?? ((obs.col ?? 0) * (100 / gridCols));
        const by = (obs as any).boxY ?? ((obs.row ?? 0) * (100 / gridRows));
        const bw = (obs as any).boxW ?? (100 / gridCols);
        const bh = (obs as any).boxH ?? (100 / gridRows);
        if (toX >= bx && toX <= bx + bw && toY >= by && toY <= by + bh) {
          return true;
        }
      }

      // Check Free-Floating Blocker Circles (Blocks entry if >50% of tile is covered)
      if ((obs as any).shapeType === 'circle' && (obs as any).circleR) {
        const cx = (obs as any).circleX ?? 0;
        const cy = (obs as any).circleY ?? 0;
        const cr = (obs as any).circleR ?? 0;
        
        // Calculate cell center
        const cellCenterX = (toCol + 0.5) * (100 / gridCols);
        const cellCenterY = (toRow + 0.5) * (100 / gridRows);
        const cellRadius = (100 / Math.max(gridCols, gridRows)) * 0.5;
        
        // Distance from circle center to grid cell center
        const dist = Math.hypot(cellCenterX - cx, cellCenterY - cy);
        
        // Coverage threshold: If circle covers >50% of the square's inscribed area
        if (dist < cr + (cellRadius * 0.15) && cr >= cellRadius * 0.707) {
          return true;
        }
      }

      // Check Vector-based line walls
      if (obs.x1 !== undefined && obs.y1 !== undefined && obs.x2 !== undefined && obs.y2 !== undefined) {
        if (typeof segmentIntersectsSegment === 'function') {
          if (segmentIntersectsSegment(fromX, fromY, toX, toY, obs.x1, obs.y1, obs.x2, obs.y2, 0.15)) {
            return true;
          }
        } else if (typeof linesIntersect === 'function') {
          if (linesIntersect(fromX, fromY, toX, toY, obs.x1, obs.y1, obs.x2, obs.y2)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const snapPointToGrid = useCallback((x: number, y: number): { x: number; y: number } => {
    if (!snapToGrid || gridCols <= 0 || gridRows <= 0) return { x, y };
    const stepX = 100 / gridCols;
    const stepY = 100 / gridRows;
    return {
      x: Math.round(x / stepX) * stepX,
      y: Math.round(y / stepY) * stepY
    };
  }, [snapToGrid, gridCols, gridRows]);

  // Map Creation Modal State
  const [isCreatingMap, setIsCreatingMap] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newMapCategory, setNewMapCategory] = useState<'world' | 'tactical'>('tactical');
  const [newMapDataUrl, setNewMapDataUrl] = useState('');
  const [isSubmittingMap, setIsSubmittingMap] = useState(false);

  // Dragging State
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeMap?.tokens) {
      activeMap.tokens.forEach(t => {
        if (!tokenCoordsRef.current[t.id]) {
          tokenCoordsRef.current[t.id] = { x: t.x, y: t.y };
        }
      });
    }
  }, [activeMap?.tokens]);

  const [isTokenDrawerOpen, setIsTokenDrawerOpen] = useState(false);
  const rawSelectedToken = activeMap?.tokens?.find(t => t.id === selectedTokenId) || null;
  const selectedToken = rawSelectedToken ? {
    ...rawSelectedToken,
    x: tokenCoordsRef.current[rawSelectedToken.id]?.x ?? rawSelectedToken.x,
    y: tokenCoordsRef.current[rawSelectedToken.id]?.y ?? rawSelectedToken.y
  } : null;

  const contextToken = activeMap?.tokens?.find(t => t.id === contextMenu?.targetTokenId) || null;

  const fogEnabled = activeMap?.fogOfWar?.enabled ?? false;
  const dynamicVisionEnabled = activeMap?.fogOfWar?.dynamicVision ?? true;
  const ambientLighting = activeMap?.ambientLighting || 'bright';
  const revealedCellsSet = new Set(activeMap?.fogOfWar?.revealedCells || []);

  const solidObstaclesSet = new Set(
    (activeMap?.obstacles || [])
      .filter(o => o.type === 'wall' || o.type === 'table' || (o.type === 'door' && !o.isOpen))
      .map(o => `${o.col},${o.row}`)
  );

  const hasLineOfSight = (c0: number, r0: number, c1: number, r1: number): boolean => {
    const obstacles = activeMap?.obstacles || [];
    const cellW = 100 / gridCols;
    const cellH = 100 / gridRows;

    const startX = (c0 + 0.5) * cellW;
    const startY = (r0 + 0.5) * cellH;
    const endX = (c1 + 0.5) * cellW;
    const endY = (r1 + 0.5) * cellH;

    for (const obs of obstacles) {
      if (obs.x1 !== undefined && obs.y1 !== undefined && obs.x2 !== undefined && obs.y2 !== undefined) {
        if (obs.type === 'door' && obs.isOpen) continue;
        if (obs.type === 'window') continue;
        if (segmentIntersectsSegment(startX, startY, endX, endY, obs.x1, obs.y1, obs.x2, obs.y2, 0.15)) {
          return false;
        }
      }
    }
    let dx = Math.abs(c1 - c0);
    let dy = Math.abs(r1 - r0);
    let sx = c0 < c1 ? 1 : -1;
    let sy = r0 < r1 ? 1 : -1;
    let err = dx - dy;

    let currC = c0;
    let currR = r0;

    while (currC !== c1 || currR !== r1) {
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currC += sx;
      }
      if (e2 < dx) {
        err += dx;
        currR += sy;
      }

      if ((currC !== c1 || currR !== r1) && solidObstaclesSet.has(`${currC},${currR}`)) {
        return false;
      }
    }
    return true;
  };

  const calculateTokenSightCells = useCallback((token: MapToken, posX?: number, posY?: number): string[] => {
    const x = posX ?? token.x;
    const y = posY ?? token.y;
    const tokenCol = Math.floor((x / 100) * gridCols);
    const tokenRow = Math.floor((y / 100) * gridRows);

    let effectiveRange = token.visionRange ?? 6;
    const sight = token.sightType || 'normal';

    if (ambientLighting === 'darkness' && sight === 'normal') {
      effectiveRange = 1;
    } else if (ambientLighting === 'dim' && sight === 'normal') {
      effectiveRange = Math.max(2, Math.floor(effectiveRange / 2));
    }

    const visible: string[] = [];
    visible.push(`${tokenCol},${tokenRow}`);

    for (let r = -effectiveRange; r <= effectiveRange; r++) {
      for (let c = -effectiveRange; c <= effectiveRange; c++) {
        if (c === 0 && r === 0) continue;
        const dist = Math.sqrt(c * c + r * r);
        if (dist <= effectiveRange + 0.3) {
          const targetCol = tokenCol + c;
          const targetRow = tokenRow + r;
          if (targetCol >= 0 && targetCol < gridCols && targetRow >= 0 && targetRow < gridRows) {
            if (hasLineOfSight(tokenCol, tokenRow, targetCol, targetRow)) {
              visible.push(`${targetCol},${targetRow}`);
            }
          }
        }
      }
    }
    return visible;
  }, [gridCols, gridRows, ambientLighting, solidObstaclesSet]);

  const revealVisionForToken = useCallback((token: MapToken, posX?: number, posY?: number) => {
    if (!activeMap || !fogEnabled || !dynamicVisionEnabled || !token.isPlayer) return;
    const sightCells = calculateTokenSightCells(token, posX, posY);
    const updated = new Set(activeMap.fogOfWar?.revealedCells || []);
    let changed = false;

    sightCells.forEach(cell => {
      if (!updated.has(cell)) {
        updated.add(cell);
        changed = true;
      }
    });

    if (changed) {
      setFogCells(activeMap.id, Array.from(updated));
    }
  }, [activeMap, fogEnabled, dynamicVisionEnabled, calculateTokenSightCells, setFogCells]);

  const recalculateAllPlayerVision = () => {
    if (!activeMap || !fogEnabled || !dynamicVisionEnabled) return;
    const playerTokens = (activeMap.tokens || []).filter(t => t.isPlayer);
    const updated = new Set(activeMap.fogOfWar?.revealedCells || []);
    let changed = false;

    playerTokens.forEach(t => {
      const coord = tokenCoordsRef.current[t.id] || { x: t.x, y: t.y };
      const sight = calculateTokenSightCells(t, coord.x, coord.y);
      sight.forEach(c => {
        if (!updated.has(c)) {
          updated.add(c);
          changed = true;
        }
      });
    });

    if (changed) {
      setFogCells(activeMap.id, Array.from(updated));
    }
  };

  const keyCooldown = useRef<boolean>(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (!selectedToken || !isTactical || !activeMap) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteTokenFromMap(activeMap.id, selectedToken.id);
        setSelectedTokenId(null);
        return;
      }

      const cellW = 100 / gridCols;
      const cellH = 100 / gridRows;

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp' || e.code === 'KeyW') dy = -cellH;
      else if (e.key === 'ArrowDown' || e.code === 'KeyS') dy = cellH;
      else if (e.key === 'ArrowLeft' || e.code === 'KeyA') dx = -cellW;
      else if (e.key === 'ArrowRight' || e.code === 'KeyD') dx = cellW;
      else return;

      e.preventDefault();

      if (keyCooldown.current) return;
      keyCooldown.current = true;
      setTimeout(() => { keyCooldown.current = false; }, 40);

      const current = tokenCoordsRef.current[selectedToken.id] || { x: selectedToken.x, y: selectedToken.y };
      const newX = Math.max(cellW / 2, Math.min(100 - cellW / 2, current.x + dx));
      const newY = Math.max(cellH / 2, Math.min(100 - cellH / 2, current.y + dy));

      if (isMoveBlocked(current.x, current.y, newX, newY)) {
        return;
      }

      // Block token from moving into or through any wall or closed door
      if (isMoveBlocked(current.x, current.y, newX, newY)) {
        return;
      }

      tokenCoordsRef.current[selectedToken.id] = { x: newX, y: newY };
      forceUpdate({});

      updateTokenPosition(activeMap.id, selectedToken.id, newX, newY);

      if (selectedToken.isPlayer) {
        revealVisionForToken(selectedToken, newX, newY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedToken, isTactical, activeMap, gridCols, gridRows, solidObstaclesSet, updateTokenPosition, deleteTokenFromMap, setSelectedTokenId, revealVisionForToken]);

  // Autonomous Movement & Waypoint State
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
  const [isRecordingPath, setIsRecordingPath] = useState<boolean>(false);
  const [isDrawingBoundary, setIsDrawingBoundary] = useState<boolean>(false);
  const [activeDrawingPolygon, setActiveDrawingPolygon] = useState<{ x: number; y: number }[]>([]);
  const boundaryStartRef = useRef<{ x: number; y: number } | null>(null);
  const patrolIndicesRef = useRef<Record<string, number>>({});
  const lastMoveTimesRef = useRef<Record<string, number>>({});
  const tokenOriginsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Autonomous wandering and patrol loop
  useEffect(() => {
    if (!isSimulationRunning || !activeMap || !activeMap.tokens) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const cols = gridCols || 25;
      const rows = gridRows || 25;
      const cellW = 100 / cols;
      const cellH = 100 / rows;

      activeMap.tokens.forEach(token => {
        if (token.isPlayer || !token.movementMode || token.movementMode === 'still') return;

        const intervalMs = (token.moveInterval || 3) * 1000;
        const lastMove = lastMoveTimesRef.current[token.id] || 0;
        if (now - lastMove < intervalMs) return;

        const currentPos = tokenCoordsRef.current[token.id] || { x: token.x, y: token.y };

        // 1. PATROL MODE: Straight grid walking from waypoint to waypoint
        if (token.movementMode === 'patrol' && token.patrolPath && token.patrolPath.length > 1) {
          let targetIndex = patrolIndicesRef.current[token.id] ?? 0;
          if (targetIndex >= token.patrolPath.length) targetIndex = 0;
          let target = token.patrolPath[targetIndex];

          const currC = Math.floor((currentPos.x / 100) * cols);
          const currR = Math.floor((currentPos.y / 100) * rows);
          const targetC = Math.floor((target.x / 100) * cols);
          const targetR = Math.floor((target.y / 100) * rows);

          // If reached or already at this waypoint, cycle to the next
          if (currC === targetC && currR === targetR) {
            targetIndex = (targetIndex + 1) % token.patrolPath.length;
            patrolIndicesRef.current[token.id] = targetIndex;
            target = token.patrolPath[targetIndex];
          }

          const nextTargetC = Math.floor((target.x / 100) * cols);
          const nextTargetR = Math.floor((target.y / 100) * rows);

          let stepC = currC;
          let stepR = currR;

          // Step strictly along the straight vector
          if (stepC < nextTargetC) stepC++;
          else if (stepC > nextTargetC) stepC--;

          if (stepR < nextTargetR) stepR++;
          else if (stepR > nextTargetR) stepR--;

          const nextX = (stepC + 0.5) * cellW;
          const nextY = (stepR + 0.5) * cellH;

          if (!isMoveBlocked(currentPos.x, currentPos.y, nextX, nextY)) {
            tokenCoordsRef.current[token.id] = { x: nextX, y: nextY };
            lastMoveTimesRef.current[token.id] = now;
            updateTokenPosition(activeMap.id, token.id, nextX, nextY);
            forceUpdate({});
          } else {
            // Blocked by obstacle or door - advance to next waypoint
            patrolIndicesRef.current[token.id] = (targetIndex + 1) % token.patrolPath.length;
          }
        } 
        // 2. WANDER MODE: Safe roaming inside polygon/boundary
        else if (token.movementMode === 'wander') {
          const directions = [
            { dx: 0, dy: -cellH },
            { dx: 0, dy: cellH },
            { dx: -cellW, dy: 0 },
            { dx: cellW, dy: 0 },
            { dx: -cellW, dy: -cellH },
            { dx: cellW, dy: -cellH },
            { dx: -cellW, dy: cellH },
            { dx: cellW, dy: cellH }
          ];

          const shuffled = [...directions].sort(() => Math.random() - 0.5);

          for (const dir of shuffled) {
            const candX = Math.max(cellW / 2, Math.min(100 - cellW / 2, currentPos.x + dir.dx));
            const candY = Math.max(cellH / 2, Math.min(100 - cellH / 2, currentPos.y + dir.dy));

            // Check Multi-point Polygon Boundary
            if (token.wanderPolygon && token.wanderPolygon.length >= 3) {
              if (!isPointInsidePolygon(candX, candY, token.wanderPolygon)) {
                continue;
              }
            } else if (token.wanderBounds) {
              const b = token.wanderBounds;
              if (candX < b.minX || candX > b.maxX || candY < b.minY || candY > b.maxY) {
                continue;
              }
            }

            if (!isMoveBlocked(currentPos.x, currentPos.y, candX, candY)) {
              tokenCoordsRef.current[token.id] = { x: candX, y: candY };
              lastMoveTimesRef.current[token.id] = now;
              updateTokenPosition(activeMap.id, token.id, candX, candY);
              forceUpdate({});
              break;
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulationRunning, activeMap, gridCols, gridRows, isMoveBlocked, updateTokenPosition]);

  const snapCoordinate = (coordPercent: number, totalUnits: number, size: 'medium' | 'large' | 'huge' = 'medium') => {
    if (!snapToGrid || totalUnits <= 0) return coordPercent;
    const unitPercent = 100 / totalUnits;

    if (size === 'large') {
      const nearestLine = Math.round(coordPercent / unitPercent);
      const clampedLine = Math.max(1, Math.min(totalUnits - 1, nearestLine));
      return clampedLine * unitPercent;
    } else {
      const unitIndex = Math.floor(coordPercent / unitPercent);
      return Math.max(unitPercent / 2, Math.min(100 - unitPercent / 2, (unitIndex + 0.5) * unitPercent));
    }
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
      setMapContextMenu(null);
      setRosterContextMenu(null);
      setShowMapsMenu(false);
      setShowObjectsMenu(false);
      setShowFogMenu(false);
      setShowGridDropdown(false);
      setShowAddTokenMenu(false);
      setShowSoundPopover(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handlePlayCombatSound = (sound: CombatSoundTrigger) => {
    if (activeAudioObj) {
      activeAudioObj.pause();
      activeAudioObj.currentTime = 0;
    }
    if (playingSoundId === sound.id) {
      setPlayingSoundId(null);
      return;
    }
    const audio = new Audio(sound.url);
    audio.volume = sound.volume ?? 0.8;
    audio.play().catch(e => console.warn('Audio play failed:', e));
    audio.onended = () => {
      setPlayingSoundId(null);
    };
    setActiveAudioObj(audio);
    setPlayingSoundId(sound.id);
  };

  const handleAddCustomSoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soundFormName.trim() || !soundFormDataUrl.trim()) return;
    await saveCombatSoundTrigger({
      name: soundFormName.trim(),
      url: soundFormDataUrl.trim(),
      icon: soundFormIcon.trim() || '🔊',
      volume: 0.8
    });
    setSoundFormName('');
    setSoundFormDataUrl('');
    setIsCreatingSound(false);
  };

  const handleSoundFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSoundFormDataUrl(reader.result as string);
      if (!soundFormName) {
        setSoundFormName(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const unsub = ProjectionService.subscribe(payload => {
      if (payload.type === 'MAP' && activeMap && payload.mapId === activeMap.id) {
        setIsProjecting(true);
      } else if (payload.type === 'CLEAR') {
        setIsProjecting(false);
      }
    });
    return () => unsub();
  }, [activeMap]);

  useEffect(() => {
    if (isProjecting && activeMap && activeMap.imageUrl) {
      const publicPins = (activeMap.pins || []).filter(p => !p.isSecret);
      const publicZones = (activeMap.zones || []).filter(z => !z.isSecret);
      const secretTokens = (activeMap.tokens || []).filter(t => t.isSecret);
      const secretTokenIds = new Set(secretTokens.map(t => t.id));
      const secretEntityKeys = new Set(secretTokens.map(t => parseEntityKey(t.name)));

      const isCombatantSecret = (c: { id: string; name: string }) => {
        if (secretTokenIds.has(c.id)) return true;
        const cKey = parseEntityKey(c.name);
        return secretEntityKeys.has(cKey);
      };

      const publicTokens = (activeMap.tokens || []).filter(t => !t.isSecret).map(t => ({
        id: t.id,
        mapId: t.mapId,
        x: tokenCoordsRef.current[t.id]?.x ?? t.x,
        y: tokenCoordsRef.current[t.id]?.y ?? t.y,
        name: t.name,
        imageUrl: t.imageUrl,
        color: t.color,
        size: t.size,
        isPlayer: t.isPlayer,
        visionRange: t.visionRange,
        sightType: t.sightType,
        aoe: t.aoe,
        conditions: t.conditions
      }));

      let projectedCombat: { round: number; currentTurnIndex: number; combatants: PlayerCombatantView[] } | null = null;
      if (activeCombat && activeCombat.combatants.length > 0) {
        const publicCombatants: PlayerCombatantView[] = [];
        let publicActiveTurnIndex = -1;

        activeCombat.combatants.forEach((c, idx) => {
          const isSecret = isCombatantSecret(c);
          if (!isSecret) {
            if (idx === activeCombat.currentTurnIndex) {
              publicActiveTurnIndex = publicCombatants.length;
            }
            publicCombatants.push({
              id: c.id,
              name: c.name,
              kind: c.kind,
              conditions: c.conditions || []
            });
          }
        });

        projectedCombat = {
          round: activeCombat.round,
          currentTurnIndex: publicActiveTurnIndex,
          combatants: publicCombatants
        };
      }

      ProjectionService.project({
        type: 'MAP',
        mapId: activeMap.id,
        imageUrl: activeMap.imageUrl,
        name: activeMap.name,
        mapType: activeMap.mapType || 'world',
        gridCols,
        gridRows,
        ambientLighting: activeMap.ambientLighting || 'bright',
        activeRuler,
        fogOfWar: activeMap.fogOfWar,
        pins: publicPins,
        zones: publicZones,
        tokens: publicTokens,
        combatTracker: projectedCombat
      });
    }
  }, [activeMap, isProjecting, gridCols, gridRows, activeRuler, activeCombat]);

  const handleToggleProject = () => {
    if (!activeMap || !activeMap.imageUrl) return;

    if (isProjecting) {
      ProjectionService.clear();
      setIsProjecting(false);
    } else {
      const publicPins = (activeMap.pins || []).filter(p => !p.isSecret);
      const publicZones = (activeMap.zones || []).filter(z => !z.isSecret);
      const secretTokens = (activeMap.tokens || []).filter(t => t.isSecret);
      const secretTokenIds = new Set(secretTokens.map(t => t.id));
      const secretEntityKeys = new Set(secretTokens.map(t => parseEntityKey(t.name)));

      const isCombatantSecret = (c: { id: string; name: string }) => {
        if (secretTokenIds.has(c.id)) return true;
        const cKey = parseEntityKey(c.name);
        return secretEntityKeys.has(cKey);
      };

      const publicTokens = (activeMap.tokens || []).filter(t => !t.isSecret).map(t => ({
        id: t.id,
        mapId: t.mapId,
        x: tokenCoordsRef.current[t.id]?.x ?? t.x,
        y: tokenCoordsRef.current[t.id]?.y ?? t.y,
        name: t.name,
        imageUrl: t.imageUrl,
        color: t.color,
        size: t.size,
        isPlayer: t.isPlayer,
        visionRange: t.visionRange,
        sightType: t.sightType,
        aoe: t.aoe,
        conditions: t.conditions
      }));

      let projectedCombat: { round: number; currentTurnIndex: number; combatants: PlayerCombatantView[] } | null = null;
      if (activeCombat && activeCombat.combatants.length > 0) {
        const publicCombatants: PlayerCombatantView[] = [];
        let publicActiveTurnIndex = -1;

        activeCombat.combatants.forEach((c, idx) => {
          const isSecret = isCombatantSecret(c);
          if (!isSecret) {
            if (idx === activeCombat.currentTurnIndex) {
              publicActiveTurnIndex = publicCombatants.length;
            }
            publicCombatants.push({
              id: c.id,
              name: c.name,
              kind: c.kind,
              conditions: c.conditions || []
            });
          }
        });

        projectedCombat = {
          round: activeCombat.round,
          currentTurnIndex: publicActiveTurnIndex,
          combatants: publicCombatants
        };
      }

      ProjectionService.project({
        type: 'MAP',
        mapId: activeMap.id,
        imageUrl: activeMap.imageUrl,
        name: activeMap.name,
        mapType: activeMap.mapType || 'world',
        gridCols,
        gridRows,
        ambientLighting: activeMap.ambientLighting || 'bright',
        activeRuler,
        fogOfWar: activeMap.fogOfWar,
        pins: publicPins,
        zones: publicZones,
        tokens: publicTokens,
        combatTracker: projectedCombat
      });
      setIsProjecting(true);
    }
  };

  const applyToolAtTile = (col: number, row: number) => {
    if (!activeMap) return;
    if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return;

    if (['addChest', 'addSecretChest', 'addTable'].includes(toolMode)) {
      const isSecret = toolMode === 'addSecretDoor' || toolMode === 'addSecretChest';
      let type: ObstacleType = 'wall';
      if (toolMode === 'addDoor' || toolMode === 'addSecretDoor') type = 'door';
      if (toolMode === 'addChest' || toolMode === 'addSecretChest') type = 'chest';
      if (toolMode === 'addTable') type = 'table';

      const exists = (activeMap.obstacles || []).some(o => o.col === col && o.row === row);
      if (!exists) {
        addObstacleToMap(activeMap.id, { type, col, row, isOpen: false, isSecret });
        recalculateAllPlayerVision();
      }
    } else if (toolMode === 'eraseObstacle') {
      const obstacle = (activeMap.obstacles || []).find(o => o.col === col && o.row === row);
      if (obstacle) {
        deleteObstacleFromMap(activeMap.id, obstacle.id);
        recalculateAllPlayerVision();
      }
    } else if (toolMode === 'fogReveal' || toolMode === 'fogShroud') {
      const cellKey = `${col},${row}`;
      const nextSet = new Set(activeMap.fogOfWar?.revealedCells || []);
      if (toolMode === 'fogReveal') {
        nextSet.add(cellKey);
      } else {
        nextSet.delete(cellKey);
      }
      setFogCells(activeMap.id, Array.from(nextSet));
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsMouseDownOnCanvas(true);
    if (toolMode === 'addBlockerCircle' || toolMode === 'addBlockerBox') {
      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (rect) {
        const rawX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const rawY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setBlockerShapeStart({ x: rawX, y: rawY });
        setCurrentDragPos({ x: rawX, y: rawY });
        return;
      }
    }
    if (!activeMap || !mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const rawY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const col = Math.floor((rawX / 100) * gridCols);
    const row = Math.floor((rawY / 100) * gridRows);

    if (['addWall', 'addDoor', 'addSecretDoor', 'addWindow'].includes(toolMode)) {
      const snapped = snapPointToGrid(rawX, rawY);
      setCurrentMousePos(snapped);
    }

    if (toolMode === 'addBlockerCircle' || toolMode === 'addBlockerBox') {
      setBlockerShapeStart({ x: rawX, y: rawY });
      return;
    }

    if (toolMode === 'ruler') {
      const snappedX = snapCoordinate(rawX, gridCols);
      const snappedY = snapCoordinate(rawY, gridRows);
      setRulerStart({ x: snappedX, y: snappedY });
      setActiveRuler({ startX: snappedX, startY: snappedY, endX: snappedX, endY: snappedY, distanceFt: 0 });
      return;
    }

    if (['addWall', 'addDoor', 'addSecretDoor', 'addChest', 'addSecretChest', 'addTable', 'eraseObstacle', 'fogReveal', 'fogShroud'].includes(toolMode)) {
      applyToolAtTile(col, row);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeMap || !mapContainerRef.current) return;
    setContextMenu(null);
    const rect = mapContainerRef.current.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const rawY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    // Multi-Point Boundary Area Drawing (Left-click adds corners)
    if (isDrawingBoundary && selectedToken) {
      const snapped = snapPointToGrid(rawX, rawY);
      const updatedPoly = [...activeDrawingPolygon, snapped];
      setActiveDrawingPolygon(updatedPoly);
      updateToken(activeMap.id, {
        ...selectedToken,
        movementMode: 'wander',
        wanderPolygon: updatedPoly
      });
      return;
    }

    // Patrol Waypoints Drawing (Left-click adds path nodes)
    if (isRecordingPath && selectedToken) {
      const snapped = snapPointToGrid(rawX, rawY);
      const existing = selectedToken.patrolPath && selectedToken.patrolPath.length > 0
        ? selectedToken.patrolPath
        : [{ x: selectedToken.x, y: selectedToken.y }];
      const updatedPath = [...existing, snapped];
      updateToken(activeMap.id, { ...selectedToken, movementMode: 'patrol', patrolPath: updatedPath });
      return;
    }

    // Continuous Vector Wall/Door/Window Chaining
    if (['addWall', 'addDoor', 'addSecretDoor', 'addWindow'].includes(toolMode)) {
      const snapped = snapPointToGrid(rawX, rawY);
      if (!lineStartPoint) {
        setLineStartPoint(snapped);
      } else {
        const dist = Math.hypot(snapped.x - lineStartPoint.x, snapped.y - lineStartPoint.y);
        if (dist > 0.4) {
          const isSecret = toolMode === 'addSecretDoor';
          let type: ObstacleType = 'wall';
          if (toolMode === 'addDoor' || toolMode === 'addSecretDoor') type = 'door';
          if (toolMode === 'addWindow') type = 'window';

          addObstacleToMap(activeMap.id, {
            type,
            x1: lineStartPoint.x,
            y1: lineStartPoint.y,
            x2: snapped.x,
            y2: snapped.y,
            isOpen: false,
            isSecret
          });
          setLineStartPoint(snapped);
          recalculateAllPlayerVision();
        }
      }
      return;
    }

    if (isAddingPin) {
      addPinToMap(activeMap.id, {
        x: rawX,
        y: rawY,
        label: newPinLabel.trim() || 'POI Marker',
        color: newPinColor,
        isSecret: newPinSecret
      });
      setIsAddingPin(false);
      setNewPinLabel('');
    } else if (toolMode === 'addToken') {
      const finalX = snapCoordinate(rawX, gridCols, tokenSize);
      const finalY = snapCoordinate(rawY, gridRows, tokenSize);

      const newTokenData: Omit<MapToken, 'id' | 'mapId'> = {
        x: finalX,
        y: finalY,
        name: tokenName.trim() || 'Hero',
        imageUrl: tokenImageUrl.trim() || undefined,
        color: tokenColor,
        size: tokenSize,
        hpCurrent: tokenHp,
        hpMax: tokenHp,
        isSecret: tokenSecret,
        isPlayer: tokenIsPlayer,
        visionRange: tokenVisionRange,
        sightType: tokenSightType,
        aoe: { shape: 'none', radiusFt: 15, angleDeg: 0, color: '#ef4444' },
        conditions: []
      };

      addTokenToMap(activeMap.id, newTokenData);
      
      if (tokenIsPlayer && fogEnabled && dynamicVisionEnabled) {
        revealVisionForToken({ ...newTokenData, id: 'temp', mapId: activeMap.id });
      }

      setToolMode('select');
    } else if (toolMode === 'select') {
      setSelectedTokenId(null);
      setIsTokenDrawerOpen(false);
    }
  };

  const handleMapContextMenu = (e: React.MouseEvent<HTMLDivElement>, tokenId?: string, obstacleId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (lineStartPoint) {
      setLineStartPoint(null);
      setCurrentMousePos(null);
      return;
    }

    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const rawY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const finalX = snapCoordinate(rawX, gridCols, 'medium');
    const finalY = snapCoordinate(rawY, gridRows, 'medium');

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      mapX: finalX,
      mapY: finalY,
      targetTokenId: tokenId,
      targetObstacleId: obstacleId
    });

    if (tokenId) {
      setSelectedTokenId(tokenId);
      setIsTokenDrawerOpen(true);
    }
  };

  const handleTokenClick = (e: React.MouseEvent, tokenId: string) => {
    e.stopPropagation();
    setSelectedTokenId(tokenId);
    // Left-click selects without forcing the side drawer open
  };

  const handleTokenMouseDown = (e: React.MouseEvent, tokenId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedTokenId(tokenId);
    setDraggingTokenId(tokenId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isResizingSidebar) {
      if (isResizingSidebar === 'right') {
        const delta = e.clientX - resizeStartX.current;
        setSidebarWidth(Math.max(170, Math.min(400, resizeStartWidth.current + delta)));
      } else {
        const delta = resizeStartX.current - e.clientX;
        setSidebarWidth(Math.max(170, Math.min(400, resizeStartWidth.current + delta)));
      }
      return;
    }

    if (isDraggingSidebar) {
      setSidebarPos({
        x: Math.max(10, Math.min(window.innerWidth - 180, e.clientX - dragSidebarOffset.current.x)),
        y: Math.max(60, Math.min(window.innerHeight - 150, e.clientY - dragSidebarOffset.current.y))
      });
      return;
    }

    if (!mapContainerRef.current || !activeMap) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const rawY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const col = Math.floor((rawX / 100) * gridCols);
    const row = Math.floor((rawY / 100) * gridRows);

    if (toolMode === 'ruler' && rulerStart && isMouseDownOnCanvas) {
      const snappedX = snapCoordinate(rawX, gridCols);
      const snappedY = snapCoordinate(rawY, gridRows);

      const dCol = Math.abs((snappedX / 100) * gridCols - (rulerStart.x / 100) * gridCols);
      const dRow = Math.abs((snappedY / 100) * gridRows - (rulerStart.y / 100) * gridRows);
      const gridDist = Math.round(Math.sqrt(dCol * dCol + dRow * dRow));

      setActiveRuler({
        startX: rulerStart.x,
        startY: rulerStart.y,
        endX: snappedX,
        endY: snappedY,
        distanceFt: gridDist * 5
      });
      return;
    }

    if (blockerShapeStart && (toolMode === 'addBlockerCircle' || toolMode === 'addBlockerBox')) {
      setCurrentDragPos({ x: rawX, y: rawY });
      return;
    }

    if (isMouseDownOnCanvas && ['addWall', 'addDoor', 'addSecretDoor', 'addChest', 'addSecretChest', 'addTable', 'eraseObstacle', 'fogReveal', 'fogShroud'].includes(toolMode)) {
      applyToolAtTile(col, row);
      return;
    }

    if (draggingTokenId) {
      const token = activeMap.tokens?.find(t => t.id === draggingTokenId);
      const size = token?.size || 'medium';
      const finalX = snapCoordinate(rawX, gridCols, size);
      const finalY = snapCoordinate(rawY, gridRows, size);
      const current = tokenCoordsRef.current[draggingTokenId] || { x: token?.x ?? finalX, y: token?.y ?? finalY };

      // Prevent dragging tokens through solid walls or closed doors
      if (isMoveBlocked(current.x, current.y, finalX, finalY)) {
        return;
      }

      tokenCoordsRef.current[draggingTokenId] = { x: finalX, y: finalY };
      forceUpdate({});

      updateTokenPosition(activeMap.id, draggingTokenId, finalX, finalY);

      if (token && token.isPlayer) {
        revealVisionForToken({ ...token, x: finalX, y: finalY });
      }
    }
  };

  const handleMouseUp = () => {
    if (blockerShapeStart && currentDragPos && activeMap) {
      if (toolMode === 'addBlockerCircle') {
        const r = Math.hypot(currentDragPos.x - blockerShapeStart.x, currentDragPos.y - blockerShapeStart.y);
        if (r > 0.5) {
          addObstacleToMap(activeMap.id, {
            type: 'wall',
            shapeType: 'circle',
            circleX: blockerShapeStart.x,
            circleY: blockerShapeStart.y,
            circleR: r,
            isSecret: true
          } as any);
        }
      } else if (toolMode === 'addBlockerBox') {
        const bx = Math.min(blockerShapeStart.x, currentDragPos.x);
        const by = Math.min(blockerShapeStart.y, currentDragPos.y);
        const bw = Math.abs(currentDragPos.x - blockerShapeStart.x);
        const bh = Math.abs(currentDragPos.y - blockerShapeStart.y);
        if (bw > 0.5 && bh > 0.5) {
          addObstacleToMap(activeMap.id, {
            type: 'wall',
            shapeType: 'box',
            boxX: bx,
            boxY: by,
            boxW: bw,
            boxH: bh,
            isSecret: true
          } as any);
        }
      }
      setBlockerShapeStart(null);
      setCurrentDragPos(null);
      setToolMode('select');
    }
    setDraggingTokenId(null);
    setIsMouseDownOnCanvas(false);
    setIsDraggingSidebar(false);
    setIsResizingSidebar(null);
    if (toolMode === 'ruler') {
      setRulerStart(null);
    }
    if (blockerShapeStart && currentMousePos && activeMap) {
      if (toolMode === 'addBlockerCircle') {
        const r = Math.hypot(currentMousePos.x - blockerShapeStart.x, currentMousePos.y - blockerShapeStart.y);
        if (r > 0.8) {
          addObstacleToMap(activeMap.id, {
            type: 'wall',
            shapeType: 'circle',
            circleX: blockerShapeStart.x,
            circleY: blockerShapeStart.y,
            circleR: r,
            isSecret: true
          } as any);
        }
      } else if (toolMode === 'addBlockerBox') {
        const bx = Math.min(blockerShapeStart.x, currentMousePos.x);
        const by = Math.min(blockerShapeStart.y, currentMousePos.y);
        const bw = Math.abs(currentMousePos.x - blockerShapeStart.x);
        const bh = Math.abs(currentMousePos.y - blockerShapeStart.y);
        if (bw > 0.8 && bh > 0.8) {
          addObstacleToMap(activeMap.id, {
            type: 'wall',
            shapeType: 'box',
            boxX: bx,
            boxY: by,
            boxW: bw,
            boxH: bh,
            isSecret: true
          } as any);
        }
      }
      setBlockerShapeStart(null);
      setToolMode('select');
    }
  };

  const toggleTokenVisibility = (token: MapToken) => {
    if (!activeMap) return;
    updateToken(activeMap.id, { ...token, isSecret: !token.isSecret });
  };

      // Synchronized Token HP adjustment (strictly syncs Token <-> Combat Tracker; Card is a 1-way hub)
  const adjustTokenHp = async (token: MapToken, amount: number) => {
    if (!activeMap) return;
    const newHp = Math.max(0, (token.hpCurrent ?? 0) + amount);
    await setTokenExactHp(token, newHp);
  };

  const setTokenExactHp = async (token: MapToken, exactVal: number) => {
    if (!activeMap) return;
    const newHp = Math.max(0, exactVal);

    // 1. Update Map Token
    updateToken(activeMap.id, { ...token, hpCurrent: newHp });

    // 2. Sync to Active Combat Tracker
    if (activeCombat && activeCombat.combatants) {
      const hasMatch = activeCombat.combatants.some(
        c => c.id === token.id || c.name.toLowerCase() === token.name.toLowerCase()
      );
      if (hasMatch) {
        const updatedCombatants = activeCombat.combatants.map(c => 
          (c.id === token.id || c.name.toLowerCase() === token.name.toLowerCase())
            ? { ...c, hpCurrent: newHp }
            : c
        );
        updateCombat({ ...activeCombat, combatants: updatedCombatants });
      }
    }
  };

  const adjustCombatantHp = (combatant: Combatant, delta: number) => {
    if (!activeCombat) return;
    const newHp = Math.max(0, combatant.hpCurrent + delta);
    setCombatantExactHp(combatant, newHp);
  };

  const setCombatantExactHp = async (combatant: Combatant, exactVal: number) => {
    if (!activeCombat) return;
    const newHp = Math.max(0, exactVal);

    // 1. Update Initiative Combatant
    const updatedCombatants = activeCombat.combatants.map(c => c.id === combatant.id ? { ...c, hpCurrent: newHp } : c);
    updateCombat({ ...activeCombat, combatants: updatedCombatants });

    // 2. Sync to matching Token on active map
    if (activeMap && activeMap.tokens) {
      const matchingToken = activeMap.tokens.find(
        t => t.id === combatant.id || t.name.toLowerCase() === combatant.name.toLowerCase()
      );
      if (matchingToken) {
        updateToken(activeMap.id, { ...matchingToken, hpCurrent: newHp });
      }
    }
  };

  const toggleTokenCondition = (token: MapToken, condition: string) => {
    if (!activeMap) return;
    const current = token.conditions || [];
    const exists = current.includes(condition);
    const updated = exists ? current.filter(c => c !== condition) : [...current, condition];
    updateToken(activeMap.id, { ...token, conditions: updated });
  };

  const handleSaveToVault = async (token: MapToken) => {
    await saveTokenToVault({
      name: token.name,
      imageUrl: token.imageUrl,
      color: token.color,
      size: token.size,
      hpMax: token.hpMax || 30,
      isPlayer: token.isPlayer ?? true,
      visionRange: token.visionRange ?? 6,
      sightType: token.sightType || 'normal',
      conditions: token.conditions || []
    });
    setVaultSaveSuccess(true);
    setTimeout(() => setVaultSaveSuccess(false), 2000);
  };

  const handleDeploySavedTemplate = (template: SavedTokenTemplate) => {
    if (!activeMap) return;
    const centerCol = Math.floor(gridCols / 2);
    const centerRow = Math.floor(gridRows / 2);
    const cellW = 100 / gridCols;
    const cellH = 100 / gridRows;

    const x = (centerCol + 0.5) * cellW;
    const y = (centerRow + 0.5) * cellH;

    const newToken: Omit<MapToken, 'id' | 'mapId'> = {
      x,
      y,
      name: template.name,
      imageUrl: template.imageUrl,
      color: template.color,
      size: template.size,
      hpCurrent: template.hpMax,
      hpMax: template.hpMax,
      isSecret: false,
      isPlayer: template.isPlayer,
      visionRange: template.visionRange,
      sightType: template.sightType,
      aoe: { shape: 'none', radiusFt: 15, angleDeg: 0, color: '#ef4444' },
      conditions: template.conditions || []
    };

    addTokenToMap(activeMap.id, newToken);
    if (template.isPlayer && fogEnabled && dynamicVisionEnabled) {
      revealVisionForToken({ ...newToken, id: 'temp', mapId: activeMap.id });
    }
    setShowAddTokenMenu(false);
    setToolMode('select');
  };

  
  // Spawn token directly from a Codex Monster/NPC Card
  const handleSpawnFromCard = (card: any, targetX?: number, targetY?: number) => {
    if (!activeMap) return;

    // Search for a statblock block in the card
    const statBlock = (card.blocks || []).find((b: any) => b.blockType === 'statblock' && b.statblock);
    const sb = statBlock ? statBlock.statblock : null;

    const hp = sb?.hitPoints || 10;
    const ac = sb?.armorClass || 10;
    const isPlayer = card.type === 'character';

    // Auto-derive token size if statblock has size hints
    let tokenSize: 'medium' | 'large' | 'huge' = 'medium';
    if (card.content && /\b(huge|gargantuan)\b/i.test(card.content)) tokenSize = 'huge';
    else if (card.content && /\blarge\b/i.test(card.content)) tokenSize = 'large';

    const cols = gridCols || 25;
    const rows = gridRows || 25;
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    const spawnX = targetX !== undefined ? targetX : snapCoordinate(50, cellW);
    const spawnY = targetY !== undefined ? targetY : snapCoordinate(50, cellH);

    const tokenColor = isPlayer ? '#3b82f6' : card.type === 'monster' ? '#dc2626' : '#f59e0b';

    addTokenToMap(activeMap.id, {
      x: spawnX,
      y: spawnY,
      name: card.name,
      imageUrl: card.imageUrl,
      color: tokenColor,
      size: tokenSize,
      hpCurrent: hp,
      hpMax: hp,
      ac,
      cardId: card.id,
      isPlayer,
      isSecret: false,
      movementMode: 'still'
    });

    setShowAddTokenMenu(false);
  };

  const handleSpawnCustomTokenCenter = () => {
    if (!activeMap) return;
    const centerCol = Math.floor(gridCols / 2);
    const centerRow = Math.floor(gridRows / 2);
    const cellW = 100 / gridCols;
    const cellH = 100 / gridRows;

    const x = (centerCol + 0.5) * cellW;
    const y = (centerRow + 0.5) * cellH;

    const newTokenData: Omit<MapToken, 'id' | 'mapId'> = {
      x,
      y,
      name: tokenName.trim() || 'Hero',
      imageUrl: tokenImageUrl.trim() || undefined,
      color: tokenColor,
      size: tokenSize,
      hpCurrent: tokenHp,
      hpMax: tokenHp,
      isSecret: tokenSecret,
      isPlayer: tokenIsPlayer,
      visionRange: tokenVisionRange,
      sightType: tokenSightType,
      aoe: { shape: 'none', radiusFt: 15, angleDeg: 0, color: '#ef4444' },
      conditions: []
    };

    addTokenToMap(activeMap.id, newTokenData);
    if (tokenIsPlayer && fogEnabled && dynamicVisionEnabled) {
      revealVisionForToken({ ...newTokenData, id: 'temp', mapId: activeMap.id });
    }
    setShowAddTokenMenu(false);
    setToolMode('select');
  };

  const handleQuickSpawnToken = (isSecret: boolean) => {
    if (!activeMap || !contextMenu) return;
    addTokenToMap(activeMap.id, {
      x: contextMenu.mapX,
      y: contextMenu.mapY,
      name: isSecret ? 'Ambush' : 'Hero',
      color: isSecret ? '#dc2626' : '#3b82f6',
      size: 'medium',
      hpCurrent: 20,
      hpMax: 20,
      isSecret,
      isPlayer: !isSecret,
      visionRange: 6,
      sightType: 'normal',
      aoe: { shape: 'none', radiusFt: 15, angleDeg: 0, color: '#ef4444' },
      conditions: []
    });
    setContextMenu(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewMapDataUrl(reader.result as string);
      if (!newMapName) {
        setNewMapName(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTokenImageUpload = (e: React.ChangeEvent<HTMLInputElement>, targetToken?: MapToken) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (targetToken && activeMap) {
        updateToken(activeMap.id, { ...targetToken, imageUrl: url });
      } else {
        setTokenImageUrl(url);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNewMapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim() || !newMapDataUrl.trim() || isSubmittingMap) return;
    setIsSubmittingMap(true);
    try {
      await createMap(newMapName.trim(), newMapDataUrl.trim(), newMapCategory);
      setNewMapName('');
      setNewMapDataUrl('');
      setIsCreatingMap(false);
    } catch (err) {
      console.error("Failed to create map:", err);
    } finally {
      setIsSubmittingMap(false);
    }
  };

  const handleSaveMapRename = async (map: WorldMap) => {
    if (!renamingMapName.trim()) return;
    const { maps } = useGrimoireStore.getState();
    const updated = { ...map, name: renamingMapName.trim(), updatedAt: Date.now() };
    const { StorageService } = await import('../services/storage');
    await StorageService.saveMap(updated);
    useGrimoireStore.setState({
      maps: maps.map(m => m.id === map.id ? updated : m)
    });
    setRenamingMapId(null);
    setRenamingMapName('');
  };

  const handleToggleMapType = async (map: WorldMap) => {
    const newType = (map.mapType || 'world') === 'world' ? 'tactical' : 'world';
    const { maps } = useGrimoireStore.getState();
    const updated = { ...map, mapType: newType as 'world' | 'tactical', updatedAt: Date.now() };
    const { StorageService } = await import('../services/storage');
    await StorageService.saveMap(updated);
    useGrimoireStore.setState({
      maps: maps.map(m => m.id === map.id ? updated : m)
    });
    setMapContextMenu(null);
  };

  const getTokenDimensionsStyle = (size: 'medium' | 'large' | 'huge') => {
    const cellW = 100 / gridCols;
    const cellH = 100 / gridRows;

    if (size === 'large') {
      return {
        width: `${cellW * 2}%`,
        height: `${cellH * 2}%`,
        fontSize: '11px'
      };
    } else if (size === 'huge') {
      return {
        width: `${cellW * 3}%`,
        height: `${cellH * 3}%`,
        fontSize: '13px'
      };
    } else {
      return {
        width: `${cellW * 0.95}%`,
        height: `${cellH * 0.95}%`,
        fontSize: '9px'
      };
    }
  };

  const renderTokenAoEs = () => {
    if (!isTactical) return null;

    return (
      <svg 
        viewBox={`0 0 ${gridCols} ${gridRows}`} 
        className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        preserveAspectRatio="none"
      >
        {(activeMap.tokens || []).map(token => {
          const aoe = token.aoe;
          if (!aoe || aoe.shape === 'none') return null;

          const posX = tokenCoordsRef.current[token.id]?.x ?? token.x;
          const posY = tokenCoordsRef.current[token.id]?.y ?? token.y;

          const centerCellX = (posX / 100) * gridCols;
          const centerCellY = (posY / 100) * gridRows;

          const color = aoe.color || '#ef4444';
          const radiusCells = aoe.radiusFt / 5;
          const angleRad = ((aoe.angleDeg || 0) * Math.PI) / 180;

          if (aoe.shape === 'circle') {
            return (
              <circle
                key={`aoe-${token.id}`}
                cx={centerCellX}
                cy={centerCellY}
                r={radiusCells}
                fill={`${color}33`}
                stroke={color}
                strokeWidth={0.08}
                strokeDasharray="0.3 0.2"
                className="animate-pulse"
              />
            );
          }

          if (aoe.shape === 'cone') {
            const halfAngle = 0.4636;
            const a1 = angleRad - halfAngle;
            const a2 = angleRad + halfAngle;

            const p1X = centerCellX + Math.cos(a1) * radiusCells;
            const p1Y = centerCellY + Math.sin(a1) * radiusCells;
            const p2X = centerCellX + Math.cos(a2) * radiusCells;
            const p2Y = centerCellY + Math.sin(a2) * radiusCells;

            const d = `M ${centerCellX} ${centerCellY} L ${p1X} ${p1Y} A ${radiusCells} ${radiusCells} 0 0 1 ${p2X} ${p2Y} Z`;

            return (
              <path
                key={`aoe-${token.id}`}
                d={d}
                fill={`${color}33`}
                stroke={color}
                strokeWidth={0.08}
                strokeDasharray="0.3 0.2"
                className="animate-pulse"
              />
            );
          }

          if (aoe.shape === 'line') {
            const halfWidth = 0.5;
            const perpAngle = angleRad + Math.PI / 2;

            const wx = Math.cos(perpAngle) * halfWidth;
            const wy = Math.sin(perpAngle) * halfWidth;

            const dx = Math.cos(angleRad) * radiusCells;
            const dy = Math.sin(angleRad) * radiusCells;

            const pt1 = `${centerCellX - wx},${centerCellY - wy}`;
            const pt2 = `${centerCellX + wx},${centerCellY + wy}`;
            const pt3 = `${centerCellX + dx + wx},${centerCellY + dy + wy}`;
            const pt4 = `${centerCellX + dx - wx},${centerCellY + dy - wy}`;

            return (
              <polygon
                key={`aoe-${token.id}`}
                points={`${pt1} ${pt2} ${pt3} ${pt4}`}
                fill={`${color}33`}
                stroke={color}
                strokeWidth={0.08}
                strokeDasharray="0.3 0.2"
                className="animate-pulse"
              />
            );
          }

          return null;
        })}
      </svg>
    );
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      className="flex-1 flex flex-col h-full bg-[#080c14] text-slate-200 select-none overflow-hidden font-sans relative"
    >
      {/* Top Bar - Clean Compact Icon Toolbar with Tooltips */}
      <div className="h-14 px-4 border-b border-white/5 bg-[#0f1521]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        
        {/* Left: Maps Dropdown & Active Indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMapsMenu(!showMapsMenu);
                setShowObjectsMenu(false);
                setShowFogMenu(false);
                setShowGridDropdown(false);
                setShowAddTokenMenu(false);
                setShowSoundPopover(false);
                setMapContextMenu(null);
                setRosterContextMenu(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-xs font-bold text-slate-100 transition-colors shadow-sm"
              title="Switch or manage maps"
            >
              <MapIcon size={14} className={isTactical ? "text-red-400" : "text-blue-400"} />
              <span className="truncate max-w-[150px]">{activeMap ? activeMap.name : 'Select Map'}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showMapsMenu && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-11 left-0 z-50 p-2 rounded-2xl bg-[#121824] border border-white/15 shadow-2xl flex flex-col gap-2 w-72 animate-in fade-in max-h-[75vh] overflow-y-auto"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-red-400 flex items-center justify-between px-2">
                    <span className="flex items-center gap-1.5"><Swords size={12} /> Encounter Battlemaps</span>
                    <span className="text-[9px] text-slate-500 font-normal">R-Click to edit</span>
                  </span>
                  {maps.filter(m => m.mapType === 'tactical').map(m => (
                    <div
                      key={m.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMapContextMenu({ x: e.clientX, y: e.clientY, map: m });
                      }}
                      onClick={() => {
                        setActiveMap(m.id);
                        setSelectedTokenId(null);
                        setShowMapsMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer group ${
                        activeMap?.id === m.id ? 'bg-red-500/20 text-red-300 font-bold' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      {renamingMapId === m.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={renamingMapName}
                          onChange={e => setRenamingMapName(e.target.value)}
                          onBlur={() => handleSaveMapRename(m)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveMapRename(m); }}
                          onClick={e => e.stopPropagation()}
                          className="bg-black/80 border border-amber-400 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                        />
                      ) : (
                        <>
                          <span className="truncate">{m.name}</span>
                          {activeMap?.id === m.id && <Check size={12} className="shrink-0" />}
                        </>
                      )}
                    </div>
                  ))}
                  {maps.filter(m => m.mapType === 'tactical').length === 0 && (
                    <span className="text-[11px] text-slate-500 italic px-2">No encounter maps uploaded</span>
                  )}
                </div>

                
                      {/* Grid Line Tone / Darkness Controls */}
                      {showGridOverlay && (
                        <div className="flex flex-col gap-1 pt-0.5">
                          <span className="text-[9px] uppercase font-bold text-slate-500">Grid Line Darkness</span>
                          <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                            {(['dark', 'bold', 'light'] as const).map(style => (
                              <button
                                key={style}
                                onClick={() => setGridStyle(style)}
                                className={`py-1 text-[10px] font-bold rounded capitalize transition-all ${
                                  gridStyle === style
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                {style === 'bold' ? 'Heavy' : style}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="h-px bg-white/5" />

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-blue-400 flex items-center justify-between px-2">
                    <span className="flex items-center gap-1.5"><Globe size={12} /> World & Regional Maps</span>
                    <span className="text-[9px] text-slate-500 font-normal">R-Click to edit</span>
                  </span>
                  {maps.filter(m => (m.mapType || 'world') === 'world').map(m => (
                    <div
                      key={m.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMapContextMenu({ x: e.clientX, y: e.clientY, map: m });
                      }}
                      onClick={() => {
                        setActiveMap(m.id);
                        setSelectedTokenId(null);
                        setShowMapsMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer group ${
                        activeMap?.id === m.id ? 'bg-blue-500/20 text-blue-300 font-bold' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      {renamingMapId === m.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={renamingMapName}
                          onChange={e => setRenamingMapName(e.target.value)}
                          onBlur={() => handleSaveMapRename(m)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveMapRename(m); }}
                          onClick={e => e.stopPropagation()}
                          className="bg-black/80 border border-amber-400 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full"
                        />
                      ) : (
                        <>
                          <span className="truncate">{m.name}</span>
                          {activeMap?.id === m.id && <Check size={12} className="shrink-0" />}
                        </>
                      )}
                    </div>
                  ))}
                  {maps.filter(m => (m.mapType || 'world') === 'world').length === 0 && (
                    <span className="text-[11px] text-slate-500 italic px-2">No world maps uploaded</span>
                  )}
                </div>

                <div className="h-px bg-white/5" />

                <button
                  onClick={() => {
                    setIsCreatingMap(true);
                    setShowMapsMenu(false);
                  }}
                  className="w-full py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus size={13} />
                  <span>Upload New Map</span>
                </button>
              </div>
            )}
          </div>

          {/* ACTIVE TOOL & SELECTION STATUS BADGE */}
          {toolMode !== 'select' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.9)] text-amber-300 text-xs font-bold animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {toolMode === 'addToken' && 'Click Map to Place'}
                {toolMode === 'ruler' && 'Measuring'}
                {toolMode === 'addWall' && 'Drawing Walls'}
                {toolMode === 'addDoor' && 'Placing Doors'}
                {toolMode === 'addSecretDoor' && 'Placing Secret Doors'}
                {toolMode === 'addChest' && 'Placing Chests'}
                {toolMode === 'addSecretChest' && 'Placing Secret Chests'}
                {toolMode === 'addTable' && 'Placing Tables'}
                {toolMode === 'eraseObstacle' && 'Erasing'}
                {toolMode === 'fogReveal' && 'Revealing Fog'}
                {toolMode === 'fogShroud' && 'Shrouding Fog'}
              </span>
              <button
                onClick={() => setToolMode('select')}
                className="ml-0.5 p-0.5 rounded hover:bg-amber-500/30 text-amber-200"
                title="Cancel tool (ESC)"
              >
                <X size={11} />
              </button>
            </div>
          ) : selectedToken ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold animate-in fade-in">
              <Crosshair size={12} className="text-blue-400 animate-spin" />
              <span className="truncate max-w-[120px]">{selectedToken.name}</span>
              <span className="text-[10px] text-emerald-400 font-mono">HP {selectedToken.hpCurrent}/{selectedToken.hpMax}</span>
              <button
                onClick={() => setSelectedTokenId(null)}
                className="ml-0.5 p-0.5 rounded hover:bg-blue-500/30 text-blue-200"
                title="Deselect token"
              >
                <X size={11} />
              </button>
            </div>
          ) : null}
        </div>

        {/* MAP DROPDOWN RIGHT-CLICK CONTEXT MENU */}
        {mapContextMenu && (
          <div
            style={{ top: `${mapContextMenu.y}px`, left: `${mapContextMenu.x}px` }}
            className="fixed z-60 min-w-[180px] p-1.5 rounded-xl bg-[#121824] border border-white/15 shadow-2xl backdrop-blur-md flex flex-col gap-0.5 text-xs text-slate-200 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-white/5 truncate">
              {mapContextMenu.map.name}
            </div>

            <button
              onClick={() => {
                setRenamingMapId(mapContextMenu.map.id);
                setRenamingMapName(mapContextMenu.map.name);
                setMapContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs transition-colors"
            >
              <span>Rename Map</span>
              <Edit2 size={12} className="text-amber-400" />
            </button>

            <button
              onClick={() => handleToggleMapType(mapContextMenu.map)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs transition-colors"
            >
              <span>Change to {mapContextMenu.map.mapType === 'tactical' ? 'World Map' : 'Encounter Battlemap'}</span>
              <RefreshCw size={12} className="text-blue-400" />
            </button>

            <button
              onClick={() => {
                deleteMap(mapContextMenu.map.id);
                setMapContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 flex items-center justify-between text-xs border-t border-white/5 mt-0.5 transition-colors"
            >
              <span>Delete Map</span>
              <Trash2 size={12} className="text-red-400" />
            </button>
          </div>
        )}

        {/* ROSTER RIGHT-CLICK DELETE CONTEXT MENU */}
        {rosterContextMenu && (
          <div
            style={{ top: `${rosterContextMenu.y}px`, left: `${rosterContextMenu.x}px` }}
            className="fixed z-60 min-w-[180px] p-1.5 rounded-xl bg-[#121824] border border-white/15 shadow-2xl backdrop-blur-md flex flex-col gap-0.5 text-xs text-slate-200 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-white/5 truncate">
              Roster: {rosterContextMenu.template.name}
            </div>

            <button
              onClick={() => {
                deleteTokenFromVault(rosterContextMenu.template.id);
                setRosterContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 flex items-center justify-between text-xs transition-colors"
            >
              <span>Remove from Roster</span>
              <Trash2 size={12} className="text-red-400" />
            </button>
          </div>
        )}

        {/* Right: Icon-Only Tool Controls with Clean Tooltips */}
        <div className="flex items-center gap-1.5">
          {activeMap && (
            <>
              {/* COMBAT SOUND TRIGGER TOOL */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSoundPopover(!showSoundPopover);
                    setShowObjectsMenu(false);
                    setShowFogMenu(false);
                    setShowGridDropdown(false);
                    setShowAddTokenMenu(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                    showSoundPopover || playingSoundId
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-black/40 hover:bg-black/60 text-amber-300 border-white/5'
                  }`}
                  title="Combat Audio Effects & SFX Trigger"
                >
                  <Volume2 size={15} className={playingSoundId ? 'animate-bounce' : ''} />
                </button>

                {showSoundPopover && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-11 right-0 z-50 p-3 rounded-2xl bg-[#121824] border border-white/15 shadow-2xl flex flex-col gap-2.5 w-64 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                        <Volume2 size={13} />
                        <span>Combat SFX</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIsCreatingSound(!isCreatingSound)}
                          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold"
                          title="Add / Upload custom audio"
                        >
                          {isCreatingSound ? 'Cancel' : '+ Add SFX'}
                        </button>
                        <button onClick={() => setShowSoundPopover(false)} className="text-slate-500 hover:text-white">
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    {/* New Sound Creator Drawer */}
                    {isCreatingSound ? (
                      <form onSubmit={handleAddCustomSoundSubmit} className="flex flex-col gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Add Sound Effect</span>
                        <input
                          type="text"
                          placeholder="Name (e.g. Fireball, Sword Clash)"
                          value={soundFormName}
                          onChange={e => setSoundFormName(e.target.value)}
                          className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Emoji"
                            value={soundFormIcon}
                            onChange={e => setSoundFormIcon(e.target.value)}
                            className="w-12 bg-black/60 border border-white/10 rounded px-1 text-center text-xs text-white outline-none"
                          />
                          <label className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 cursor-pointer text-center text-[10px] font-bold">
                            <span>{soundFormDataUrl ? '✓ File Loaded' : 'Upload Audio'}</span>
                            <input type="file" accept="audio/*" className="hidden" onChange={handleSoundFileUpload} />
                          </label>
                        </div>
                        <button
                          type="submit"
                          disabled={!soundFormName || !soundFormDataUrl}
                          className="py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-[10px] transition-colors"
                        >
                          Save SFX Trigger
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-0.5">
                        {combatSounds.map(s => {
                          const isPlaying = playingSoundId === s.id;
                          return (
                            <div 
                              key={s.id}
                              className={`p-1.5 rounded-xl border flex items-center justify-between text-xs transition-colors group ${
                                isPlaying ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                              }`}
                            >
                              <button 
                                onClick={() => handlePlayCombatSound(s)}
                                className="flex items-center gap-2 flex-1 text-left overflow-hidden"
                              >
                                <span className="text-sm shrink-0">{s.icon || '🔊'}</span>
                                <span className="font-bold text-[11px] truncate">{s.name}</span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handlePlayCombatSound(s)}
                                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                                  title={isPlaying ? "Stop" : "Play"}
                                >
                                  {isPlaying ? <StopSquare size={11} className="text-red-400 fill-current" /> : <Play size={11} className="fill-current text-emerald-400" />}
                                </button>
                                <button
                                  onClick={() => deleteCombatSoundTrigger(s.id)}
                                  className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete sound effect"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* INITIATIVE SIDEBAR TOGGLE ICON */}
              {isTactical && activeCombat && (
                <button
                  onClick={() => setShowCombatSidebar(!showCombatSidebar)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                    showCombatSidebar
                      ? 'bg-red-500 text-white border-red-400 shadow-md ring-2 ring-red-400/50'
                      : 'bg-black/40 hover:bg-black/60 text-red-300 border-white/5'
                  }`}
                  title={`Toggle Initiative Tracker (${activeCombat.combatants.length} combatants)`}
                >
                  <Swords size={15} className={showCombatSidebar ? 'animate-pulse' : ''} />
                </button>
              )}

              {/* Lighting */}
              {isTactical && (
                <div className="flex items-center bg-black/40 border border-white/5 p-1 rounded-xl gap-0.5">
                  <button
                    onClick={() => setMapLighting(activeMap.id, 'bright')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      ambientLighting === 'bright' ? 'bg-amber-500/20 text-amber-300 border border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.9)]' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Atmosphere: Bright Light"
                  >
                    <Sun size={14} />
                  </button>

                  <button
                    onClick={() => setMapLighting(activeMap.id, 'dim')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      ambientLighting === 'dim' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Atmosphere: Dim Light"
                  >
                    <Flame size={14} />
                  </button>

                  <button
                    onClick={() => setMapLighting(activeMap.id, 'darkness')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      ambientLighting === 'darkness' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Atmosphere: Pitch Darkness"
                  >
                    <Moon size={14} />
                  </button>
                </div>
              )}

              {/* Measurement Ruler Tool */}
              {isTactical && (
                <button
                  onClick={() => {
                    if (toolMode === 'ruler') {
                      setToolMode('select');
                      setActiveRuler(null);
                    } else {
                      setToolMode('ruler');
                    }
                  }}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors border ${
                    toolMode === 'ruler'
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-black/40 hover:bg-black/60 text-slate-300 border-white/5'
                  }`}
                  title="Distance Ruler (Click & drag to measure)"
                >
                  <Ruler size={15} />
                </button>
              )}

              {/* Objects & Barriers Dropdown Icon */}
              {isTactical && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowObjectsMenu(!showObjectsMenu);
                      setShowFogMenu(false);
                      setShowGridDropdown(false);
                      setShowMapsMenu(false);
                      setShowAddTokenMenu(false);
                      setShowSoundPopover(false);
                      setRosterContextMenu(null);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition-colors border ${
                      ['addWall', 'addDoor', 'addSecretDoor', 'addChest', 'addSecretChest', 'addTable', 'eraseObstacle'].includes(toolMode)
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md ring-2 ring-amber-400/50'
                        : 'bg-black/40 hover:bg-black/60 text-slate-300 border-white/5'
                    }`}
                    title="Objects, Doors & Walls"
                  >
                    <Box size={15} />
                  </button>

              {showObjectsMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-11 right-0 z-40 p-2 rounded-2xl bg-[#121824] border border-white/15 shadow-2xl flex flex-col gap-1 w-56 animate-in fade-in"
                >
                  <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tactical Barriers</div>

                  <button
                    onClick={() => { setToolMode('addWall'); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'addWall' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-sm bg-yellow-400 border border-yellow-200" />
                    <span>Walls (Yellow Barrier)</span>
                  </button>

                  <button
                    onClick={() => { setToolMode('addWindow'); setLineStartPoint(null); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'addWindow' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-sm bg-sky-400 border border-sky-200 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                    <span>Windows (Bright Blue)</span>
                  </button>

                  <button
                    onClick={() => { setToolMode('addDoor'); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'addDoor' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <DoorClosed size={13} className="text-amber-400" />
                    <span>Place Door</span>
                  </button>

                  <button
                    onClick={() => { setToolMode('addSecretDoor'); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'addSecretDoor' ? 'bg-red-500/20 text-red-300 font-bold' : 'hover:bg-white/5 text-red-400'
                    }`}
                  >
                    <Lock size={13} className="text-red-400" />
                    <span>Secret Door (DM Only)</span>
                  </button>

                  <div className="h-px bg-white/5 my-1" />
                  <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Restricted Zones (DM Only)</div>

                  <button
                    onClick={() => { setToolMode('addBlockerCircle'); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'addBlockerCircle' ? 'bg-red-500/20 text-red-300 font-bold' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border-2 border-red-400 bg-red-500/30" />
                    <span>Restricted Circle (&gt;50% Rule)</span>
                  </button>

                  <button
                    onClick={() => { setToolMode('addBlockerBox'); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'addBlockerBox' ? 'bg-orange-500/20 text-orange-300 font-bold' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <Square size={13} className="text-orange-400" />
                    <span>Restricted Square / Cube</span>
                  </button>

                  <div className="h-px bg-white/5 my-1" />
                  <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Props & Items</div>

                  <button
                    onClick={() => { setToolMode('addChest'); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'addChest' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <ChestIcon size={14} className="shrink-0" />
                    <span>Treasure Chest</span>
                  </button>

                  <button
                    onClick={() => { setToolMode('addSecretChest'); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'addSecretChest' ? 'bg-red-500/20 text-red-300 font-bold' : 'hover:bg-white/5 text-red-400'
                    }`}
                  >
                    <ChestIcon size={14} className="shrink-0" />
                    <span>Hidden Chest (DM Only)</span>
                  </button>

                  <button
                    onClick={() => { setToolMode('addTable'); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'addTable' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="text-xs">🪑</span>
                    <span>Table / Cover</span>
                  </button>

                  <div className="h-px bg-white/5 my-1" />

                  <button
                    onClick={() => { setToolMode('eraseObstacle'); setShowObjectsMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                      toolMode === 'eraseObstacle' ? 'bg-red-500/20 text-red-300 font-bold' : 'hover:bg-white/5 text-red-300'
                    }`}
                  >
                    <Eraser size={13} className="text-red-400" />
                    <span>Click to Erase Any Object</span>
                  </button>
                </div>
              )}
                </div>
              )}

              {/* Fog of War Dropdown Icon */}
              {isTactical && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFogMenu(!showFogMenu);
                      setShowObjectsMenu(false);
                      setShowGridDropdown(false);
                      setShowMapsMenu(false);
                      setShowAddTokenMenu(false);
                      setShowSoundPopover(false);
                      setRosterContextMenu(null);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition-colors border ${
                      fogEnabled
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-black/40 hover:bg-black/60 text-slate-400 border-white/5'
                    }`}
                    title={`Fog of War (${fogEnabled ? 'Enabled' : 'Disabled'})`}
                  >
                    <Cloud size={15} />
                  </button>

                  {showFogMenu && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-11 right-0 z-40 p-2 rounded-xl bg-[#121824] border border-white/10 shadow-2xl flex flex-col gap-1.5 w-48 animate-in fade-in"
                    >
                      <button
                        onClick={() => toggleFogOfWar(activeMap.id, !fogEnabled)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold transition-colors ${
                          fogEnabled ? 'bg-purple-500 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <span>Fog of War:</span>
                        <span>{fogEnabled ? 'ENABLED' : 'DISABLED'}</span>
                      </button>

                      {fogEnabled && (
                        <>
                          <button
                            onClick={() => toggleDynamicVision(activeMap.id, !dynamicVisionEnabled)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-white/5"
                          >
                            <span>Auto Vision:</span>
                            <span className={dynamicVisionEnabled ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                              {dynamicVisionEnabled ? 'ON' : 'MANUAL'}
                            </span>
                          </button>

                          <div className="h-px bg-white/5 my-0.5" />

                          <button
                            onClick={() => { setToolMode('fogReveal'); setShowFogMenu(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                              toolMode === 'fogReveal' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <Brush size={12} className="text-amber-400" />
                            <span>Reveal Brush (Drag)</span>
                          </button>

                          <button
                            onClick={() => { setToolMode('fogShroud'); setShowFogMenu(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                              toolMode === 'fogShroud' ? 'bg-red-500/20 text-red-300' : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <Eraser size={12} className="text-red-400" />
                            <span>Shroud Brush (Drag)</span>
                          </button>

                          <button
                            onClick={() => { setFogCells(activeMap.id, []); setShowFogMenu(false); }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium hover:bg-red-500/20 text-red-300"
                          >
                            <X size={12} />
                            <span>Reset (Shroud All)</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* COMBINED GRID DROPDOWN: Grid lines, Snap, and Dimensions */}
              {isTactical && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGridDropdown(!showGridDropdown);
                      setShowObjectsMenu(false);
                      setShowFogMenu(false);
                      setShowMapsMenu(false);
                      setShowAddTokenMenu(false);
                      setShowSoundPopover(false);
                      setRosterContextMenu(null);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                      showGridOverlay || showGridDropdown
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                        : 'bg-black/40 hover:bg-black/60 text-slate-400 border-white/5'
                    }`}
                    title="Grid Controls (Snap, Lines & Dimensions)"
                  >
                    <Grid size={15} />
                  </button>

                  {showGridDropdown && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-11 right-0 z-40 p-3 rounded-2xl bg-[#121824] border border-white/10 shadow-2xl flex flex-col gap-2.5 w-52 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                          <Grid size={12} /> Grid Settings
                        </span>
                        <button onClick={() => setShowGridDropdown(false)} className="text-slate-500 hover:text-white">
                          <X size={12} />
                        </button>
                      </div>

                      {/* Snap toggle */}
                      <button
                        onClick={() => setSnapToGrid(!snapToGrid)}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-semibold transition-colors ${
                          snapToGrid ? 'bg-amber-500/20 text-amber-300 border border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.9)]' : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><Magnet size={12} /> Grid Snap</span>
                        <span className="text-[10px] font-bold">{snapToGrid ? 'ON' : 'OFF'}</span>
                      </button>

                      {/* Grid lines toggle */}
                      <button
                        onClick={() => setShowGridOverlay(!showGridOverlay)}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-semibold transition-colors ${
                          showGridOverlay ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><Grid size={12} /> Grid Overlay</span>
                        <span className="text-[10px] font-bold">{showGridOverlay ? 'VISIBLE' : 'HIDDEN'}</span>
                      </button>

                      <div className="h-px bg-white/5" />

                      {/* Custom Dimensions */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] uppercase font-bold text-slate-500">Dimensions (Columns × Rows)</span>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded px-2 py-1 flex-1">
                            <span className="text-[10px] text-slate-500">W:</span>
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={gridCols}
                              onChange={e => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setMapGridDimensions(activeMap.id, val, gridRows);
                              }}
                              className="w-full bg-transparent text-center text-xs text-amber-300 font-mono outline-none"
                            />
                          </div>
                          <span className="text-slate-500">×</span>
                          <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded px-2 py-1 flex-1">
                            <span className="text-[10px] text-slate-500">H:</span>
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={gridRows}
                              onChange={e => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setMapGridDimensions(activeMap.id, gridCols, val);
                              }}
                              className="w-full bg-transparent text-center text-xs text-amber-300 font-mono outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="flex justify-between gap-1 pt-1 border-t border-white/5">
                        <button onClick={() => setMapGridDimensions(activeMap.id, 20, 20)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] text-slate-400">20×20</button>
                        <button onClick={() => setMapGridDimensions(activeMap.id, 25, 30)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] text-slate-400">25×30</button>
                        <button onClick={() => setMapGridDimensions(activeMap.id, 30, 20)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] text-slate-400">30×20</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Broadcast Icon */}
              <button
                onClick={handleToggleProject}
                className={`p-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                  isProjecting
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25 ring-2 ring-amber-400/50'
                    : 'bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border border-purple-500/40'
                }`}
                title={isProjecting ? "Projecting Live to Player Screen (Click to stop)" : "Project Map to Player Screen"}
              >
                {isProjecting ? (
                  <Radio size={15} className="animate-pulse text-red-950" />
                ) : (
                  <Cast size={15} />
                )}
              </button>

              {/* TOOL PRIMARY ACTION: ADD PIN (World) or ADD TOKEN DROPDOWN (Tactical) */}
              {!isTactical ? (
                <button
                  onClick={() => setIsAddingPin(!isAddingPin)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                    isAddingPin
                      ? 'bg-amber-500 text-black border-amber-500 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                  title="Add Pin Marker"
                >
                  <PinIcon size={15} />
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddTokenMenu(!showAddTokenMenu);
                      setShowObjectsMenu(false);
                      setShowFogMenu(false);
                      setShowGridDropdown(false);
                      setShowSoundPopover(false);
                      setRosterContextMenu(null);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                      toolMode === 'addToken' || showAddTokenMenu
                        ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30 ring-2 ring-red-400/50'
                        : 'bg-red-500/20 hover:bg-red-500/35 text-red-300 border-red-500/40'
                    }`}
                    title="Deploy Token / Party Roster"
                  >
                    <UserPlus size={15} />
                  </button>

                  {/* DEDICATED TOP-RIGHT ADD TOKEN DROPDOWN */}
                  {showAddTokenMenu && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-11 right-0 z-50 p-3.5 rounded-2xl bg-[#121824] border border-white/15 shadow-2xl flex flex-col gap-3 w-96 animate-in fade-in max-h-[88vh] overflow-y-auto text-xs font-sans select-none"
                    >
                      {/* Header with Tab Selectors */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-100">
                          <Users size={14} className="text-amber-400" />
                          <span>Deploy Tokens</span>
                        </div>
                        <button onClick={() => setShowAddTokenMenu(false)} className="text-slate-400 hover:text-white p-0.5">
                          <X size={14} />
                        </button>
                      </div>

                      {/* Navigation Tabs: Codex Tray, Party Vault, Custom */}
                      <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-[11px] font-bold">
                        <button
                          onClick={() => setTokenTrayTab('codex')}
                          className={`py-1.5 rounded-lg transition-all ${
                            tokenTrayTab === 'codex' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Codex Bestiary
                        </button>
                        <button
                          onClick={() => setTokenTrayTab('party')}
                          className={`py-1.5 rounded-lg transition-all ${
                            tokenTrayTab === 'party' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Party Roster
                        </button>
                        <button
                          onClick={() => setTokenTrayTab('custom')}
                          className={`py-1.5 rounded-lg transition-all ${
                            tokenTrayTab === 'custom' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Custom
                        </button>
                      </div>

                      {/* TAB 1: CODEX BESTIARY & NPC TRAY */}
                      {tokenTrayTab === 'codex' && (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Search monsters, NPCs, characters..."
                            value={codexSearchQuery}
                            onChange={e => setCodexSearchQuery(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-400/50"
                          />

                          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                            {(() => {
                              const candidateCards = (cards || []).filter(c => {
                                const isRelevant = ['monster', 'npc', 'character'].includes(c.type) || 
                                  (c.blocks || []).some((b: any) => b.blockType === 'statblock');
                                if (!isRelevant) return false;
                                if (!codexSearchQuery.trim()) return true;
                                return c.name.toLowerCase().includes(codexSearchQuery.toLowerCase());
                              });

                              if (candidateCards.length === 0) {
                                return (
                                  <div className="text-center py-6 text-slate-500 text-[11px] italic">
                                    No matching Codex cards found.
                                  </div>
                                );
                              }

                              return candidateCards.map(c => {
                                const sbBlock = (c.blocks || []).find((b: any) => b.blockType === 'statblock' && b.statblock);
                                const sb = sbBlock ? sbBlock.statblock : null;
                                const hp = sb?.hitPoints || c.properties?.hp || 10;
                                const ac = sb?.armorClass || c.properties?.ac || 10;

                                return (
                                  <div
                                    key={c.id}
                                    className="flex items-center justify-between p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/15 transition-all group"
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                        c.type === 'character' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                        c.type === 'monster' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      }`}>
                                        {c.name.charAt(0).toUpperCase()}
                                      </div>

                                      <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-slate-200 truncate text-[11px] group-hover:text-amber-300 transition-colors">
                                          {c.name}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                          <span>AC: {ac}</span>
                                          <span>•</span>
                                          <span>HP: {hp}</span>
                                          <span>•</span>
                                          <span className="capitalize">{c.type}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => handleSpawnFromCard(c)}
                                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-[10px] border border-amber-500/40 transition-all shrink-0"
                                    >
                                      Deploy
                                    </button>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}

                      {/* TAB 2: SAVED PARTY ROSTER */}
                      {tokenTrayTab === 'party' && (
                        <div className="flex flex-col gap-2">
                          {savedTokens.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 text-[11px] italic">
                              No saved party tokens in vault yet.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                              {savedTokens.map(template => (
                                <div
                                  key={template.id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 transition-all group"
                                >
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center font-bold text-[10px] text-white shrink-0"
                                      style={{ backgroundColor: template.color }}
                                    >
                                      {template.name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-slate-200 text-[11px]">{template.name}</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleSpawnSavedToken(template)}
                                      className="px-2 py-0.5 rounded-lg bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white font-bold text-[10px] border border-blue-500/30 transition-all"
                                    >
                                      Spawn
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 3: CUSTOM TOKEN BUILDER */}
                       {tokenTrayTab === 'custom' && (
                         <div className="flex flex-col gap-2">

                        <input
                          type="text"
                          placeholder="Token Name (e.g. Goblin, Dragon)"
                          value={tokenName}
                          onChange={e => setTokenName(e.target.value)}
                          className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
                        />

                        {/* Portrait file upload */}
                        <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                            {tokenImageUrl ? (
                              <img src={tokenImageUrl} className="w-6 h-6 rounded-full object-cover border border-amber-400" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-slate-500">
                                <ImageIcon size={11} />
                              </div>
                            )}
                            <span className="text-[10px] text-slate-300 font-medium">Portrait Art</span>
                          </div>
                          <label className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 cursor-pointer text-[10px] font-bold">
                            <span>{tokenImageUrl ? 'Replace' : 'Upload'}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleTokenImageUpload(e)} />
                          </label>
                        </div>

                        {/* Controlled by: Player / Monster */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Type:</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setTokenIsPlayer(true)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                                tokenIsPlayer ? 'bg-blue-500 text-white shadow-sm ring-1 ring-blue-400' : 'bg-white/5 text-slate-400'
                              }`}
                            >
                              Player
                            </button>
                            <button
                              type="button"
                              onClick={() => setTokenIsPlayer(false)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                                !tokenIsPlayer ? 'bg-red-500 text-white shadow-sm ring-1 ring-red-400' : 'bg-white/5 text-slate-400'
                              }`}
                            >
                              Monster
                            </button>
                          </div>
                        </div>

                        {/* Size & HP */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {(['medium', 'large', 'huge'] as const).map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setTokenSize(s)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                  tokenSize === s ? 'bg-amber-500 text-black shadow-sm font-extrabold' : 'bg-white/5 text-slate-400'
                                }`}
                              >
                                {s === 'medium' ? '1x1' : s === 'large' ? '2x2' : '3x3'}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-emerald-400 font-bold">HP:</span>
                            <input
                              type="number"
                              value={tokenHp}
                              onChange={e => setTokenHp(parseInt(e.target.value) || 0)}
                              className="w-12 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-center text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Action Buttons: Instant Center Spawn or Click Map */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/5">
                          <button
                            onClick={handleSpawnCustomTokenCenter}
                            className="py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-colors"
                          >
                            <Zap size={12} />
                            <span>Spawn Center</span>
                          </button>

                          <button
                            onClick={() => {
                              setToolMode('addToken');
                              setShowAddTokenMenu(false);
                            }}
                            className="py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <MousePointer size={12} />
                              <span>Click Map</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* DEDICATED DM RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div 
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 min-w-[190px] p-1.5 rounded-xl bg-[#111723] border border-white/15 shadow-2xl backdrop-blur-md flex flex-col gap-0.5 text-xs text-slate-200 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {contextToken ? (
            <>
              <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-500 border-b border-white/5 flex items-center justify-between">
                <span>{contextToken.name}</span>
                <span className="font-mono text-emerald-400">HP {contextToken.hpCurrent}</span>
              </div>

              {contextToken.isPlayer && (
                <button
                  onClick={() => {
                    revealVisionForToken(contextToken);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 text-amber-300 flex items-center justify-between text-xs transition-colors"
                >
                  <span>Reveal Token Sight</span>
                  <Eye size={12} />
                </button>
              )}

              <button
                onClick={() => {
                  toggleTokenVisibility(contextToken);
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs transition-colors"
              >
                <span>{contextToken.isSecret ? 'Reveal to Players' : 'Hide from Players'}</span>
                {contextToken.isSecret ? <Eye size={12} className="text-emerald-400" /> : <EyeOff size={12} className="text-red-400" />}
              </button>

              <div className="px-2 py-1 flex items-center justify-between border-t border-white/5 mt-0.5">
                <span className="text-[10px] text-slate-400">Quick HP:</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => adjustTokenHp(contextToken, -5)} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-red-500/20 text-red-300 text-[10px]">-5</button>
                  <button onClick={() => adjustTokenHp(contextToken, -1)} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-red-500/20 text-red-300 text-[10px]">-1</button>
                  <button onClick={() => adjustTokenHp(contextToken, 1)} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-[10px]">+1</button>
                  <button onClick={() => adjustTokenHp(contextToken, 5)} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-[10px]">+5</button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (activeMap) deleteTokenFromMap(activeMap.id, contextToken.id);
                  setContextMenu(null);
                  setSelectedTokenId(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 flex items-center justify-between text-xs border-t border-white/5 mt-0.5 transition-colors"
              >
                <span>Delete Token</span>
                <Trash2 size={11} />
              </button>
            </>
          ) : (
            <>
              <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-500 border-b border-white/5">
                Tactical Placement
              </div>
              <button
                onClick={() => handleQuickSpawnToken(false)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Place Player Token</span>
              </button>
              <button
                onClick={() => handleQuickSpawnToken(true)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Place Secret Ambush</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* DRAGGABLE & EDGE-RESIZABLE INITIATIVE SIDEBAR ON BATTLEMAP */}
      {isTactical && activeCombat && showCombatSidebar && (
        <div 
          style={{ 
            left: `${sidebarPos.x}px`, 
            top: `${sidebarPos.y}px`,
            width: isCombatSidebarMinimized ? '170px' : `${sidebarWidth}px`,
            position: 'absolute'
          }}
          className="z-30 rounded-2xl bg-[#121824]/95 border border-white/15 shadow-2xl backdrop-blur-md flex flex-col gap-2 p-2.5 text-xs animate-in fade-in transition-all duration-75 relative group/sidebar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Edge Resize Handle */}
          {!isCombatSidebarMinimized && (
            <div
              onMouseDown={(e) => {
                if (e.button === 0) {
                  e.stopPropagation();
                  setIsResizingSidebar('left');
                  resizeStartX.current = e.clientX;
                  resizeStartWidth.current = sidebarWidth;
                }
              }}
              className="absolute left-0 top-3 bottom-3 w-2.5 cursor-ew-resize hover:bg-amber-400/40 rounded-l transition-colors"
              title="Drag edge to resize width"
            />
          )}

          {/* Right Edge Resize Handle */}
          {!isCombatSidebarMinimized && (
            <div
              onMouseDown={(e) => {
                if (e.button === 0) {
                  e.stopPropagation();
                  setIsResizingSidebar('right');
                  resizeStartX.current = e.clientX;
                  resizeStartWidth.current = sidebarWidth;
                }
              }}
              className="absolute right-0 top-3 bottom-3 w-2.5 cursor-ew-resize hover:bg-amber-400/40 rounded-r transition-colors"
              title="Drag edge to resize width"
            />
          )}

          {/* Draggable Header */}
          <div 
            onMouseDown={(e) => {
              if (e.button === 0) {
                setIsDraggingSidebar(true);
                dragSidebarOffset.current = {
                  x: e.clientX - sidebarPos.x,
                  y: e.clientY - sidebarPos.y
                };
              }
            }}
            className="flex items-center justify-between border-b border-white/10 pb-1.5 cursor-grab active:cursor-grabbing select-none"
            title="Drag to reposition sidebar"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <GripHorizontal size={14} className="text-slate-500 shrink-0" />
              <Swords size={13} className="text-red-400 shrink-0" />
              <span className="font-bold text-slate-100 truncate text-[11px]">{activeCombat.name}</span>
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                R{activeCombat.round}
              </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button 
                onClick={() => setIsCombatSidebarMinimized(!isCombatSidebarMinimized)} 
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                title={isCombatSidebarMinimized ? "Expand initiative list" : "Minimize initiative list"}
              >
                {isCombatSidebarMinimized ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
              </button>
              <button 
                onClick={() => setShowCombatSidebar(false)} 
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                title="Close sidebar"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {!isCombatSidebarMinimized && (
            <>
              {/* Turn Advance Bar */}
              <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded-xl border border-white/5">
                <button onClick={() => prevTurn(activeCombat.id)} className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300" title="Previous turn">
                  <ChevronLeft size={12} />
                </button>
                <span className="text-[10px] font-mono font-bold text-amber-300 truncate px-1">
                  Turn {activeCombat.currentTurnIndex + 1}/{activeCombat.combatants.length}
                </span>
                <button onClick={() => nextTurn(activeCombat.id)} className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-400 text-white font-bold text-[10px] flex items-center gap-0.5 shrink-0" title="Next turn">
                  <span>Next</span>
                  <ChevronRight size={11} />
                </button>
              </div>

              {/* Combatants List with L-Click HP Adjust & R-Click Full Controls */}
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[55vh] pr-0.5">
                {activeCombat.combatants.map((c, idx) => {
                  const isActiveTurn = idx === activeCombat.currentTurnIndex;
                  const isSelected = selectedTokenId === c.id || (activeMap?.tokens?.find(t => t.id === selectedTokenId)?.name.toLowerCase() === c.name.toLowerCase());
                  const isExpanded = expandedCombatantId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setExpandedCombatantId(isExpanded ? null : c.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const match = activeMap?.tokens?.find(t => t.id === c.id || t.name.toLowerCase() === c.name.toLowerCase());
                        if (match) {
                          setSelectedTokenId(match.id);
                        }
                      }}
                      className={`p-2 rounded-xl border flex flex-col gap-1.5 cursor-pointer transition-all ${
                        isActiveTurn
                          ? 'bg-amber-500/20 border-amber-400 shadow-sm ring-1 ring-amber-300'
                          : isSelected
                          ? 'bg-blue-500/20 border-blue-400'
                          : 'bg-black/40 hover:bg-white/5 border-white/5'
                      }`}
                      title="Left-Click: Quick HP Adjust | Right-Click: Open Token Controls"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="w-5 h-5 rounded-md bg-black/60 border border-white/10 flex items-center justify-center font-mono font-bold text-amber-400 text-[10px] shrink-0">
                            {c.initiative}
                          </span>
                          <span className="font-bold text-[11px] text-slate-100 truncate">{c.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Visible Armor Class (AC) Display */}
                          <span className="flex items-center gap-0.5 text-[9px] font-mono text-slate-400 px-1 py-0.2 rounded bg-black/50 border border-white/5" title="Armor Class (AC)">
                            <Shield size={9} className="text-slate-500" />
                            <span>{c.ac}</span>
                          </span>

                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            {c.hpCurrent}/{c.hpMax}
                          </span>

                          {isActiveTurn && (
                            <span className="px-1 py-0.2 rounded bg-amber-400 text-black font-extrabold text-[7px] uppercase tracking-wider">
                              TURN
                            </span>
                          )}
                        </div>
                      </div>

                      {/* INLINE HP ADJUSTMENT CONTROLS */}
                      {isExpanded && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between pt-1 border-t border-white/5 mt-0.5 animate-in fade-in flex-wrap gap-1"
                        >
                          <span className="text-[9px] text-slate-400 flex items-center gap-1">
                            <Heart size={10} className="text-red-400" /> HP:
                          </span>
                          
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => adjustCombatantHp(c, -5)} className="px-1 py-0.5 rounded bg-white/5 hover:bg-red-500/20 text-red-300 text-[8px] font-bold">-5</button>
                            <button onClick={() => adjustCombatantHp(c, -1)} className="px-1 py-0.5 rounded bg-white/5 hover:bg-red-500/20 text-red-300 text-[8px] font-bold">-1</button>
                            <input 
                              type="number"
                              value={c.hpCurrent}
                              onChange={(e) => setCombatantExactHp(c, parseInt(e.target.value) || 0)}
                              className="w-9 bg-black/70 border border-white/10 rounded px-0.5 py-0.2 text-center text-[10px] text-emerald-400 font-mono"
                            />
                            <button onClick={() => adjustCombatantHp(c, 1)} className="px-1 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-[8px] font-bold">+1</button>
                            <button onClick={() => adjustCombatantHp(c, 5)} className="px-1 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-[8px] font-bold">+5</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TOKEN INSPECTOR & SIGHT DRAWER */}
      {selectedToken && isTactical && isTokenDrawerOpen && (
        <div className="absolute top-16 right-6 z-30 p-4 rounded-2xl bg-[#121824]/95 border border-white/10 shadow-2xl backdrop-blur-md flex flex-col gap-3 text-xs w-84 animate-in fade-in max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              {selectedToken.imageUrl ? (
                <img 
                  src={selectedToken.imageUrl} 
                  alt={selectedToken.name} 
                  className="w-6 h-6 rounded-full object-cover border border-white/80"
                />
              ) : (
                <span 
                  className="w-3.5 h-3.5 rounded-full border border-white/50" 
                  style={{ backgroundColor: selectedToken.color || '#ef4444' }} 
                />
              )}
              <span className="font-bold text-slate-200">Token Controls</span>
            </div>
            <button onClick={() => { setSelectedTokenId(null); setIsTokenDrawerOpen(false); }} className="text-slate-500 hover:text-white">
              <X size={13} />
            </button>
          </div>

          <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Arrow Keys:</span>
            <span className="text-amber-300 font-mono font-semibold">Move 1 sq (WASD / Arrows)</span>
          </div>

          {/* Token Portrait Upload */}
          <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-2.5">
              {selectedToken.imageUrl ? (
                <img src={selectedToken.imageUrl} className="w-9 h-9 rounded-full object-cover border-2 border-amber-400 shadow-md" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-slate-500">
                  <ImageIcon size={16} />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-200 font-semibold">Circle Portrait</span>
                <span className="text-[9px] text-slate-500">Fills circle completely</span>
              </div>
            </div>
            <label className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 cursor-pointer font-bold text-[10px] transition-colors">
              <span>{selectedToken.imageUrl ? 'Change Art' : 'Upload Art'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleTokenImageUpload(e, selectedToken)} />
            </label>
          </div>

          {/* D&D 5E CONDITIONS PANEL WITH ACTIVE GLOWING HIGHLIGHTS */}
          <div className="flex flex-col gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 text-[11px]">
                <AlertCircle size={12} /> Status & Conditions
              </span>
              {(selectedToken.conditions || []).length > 0 && (
                <button
                  onClick={() => updateToken(activeMap.id, { ...selectedToken, conditions: [] })}
                  className="text-[9px] text-slate-400 hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto pr-1">
              {DND_CONDITIONS.map(cond => {
                const isActive = (selectedToken.conditions || []).includes(cond);
                return (
                  <button
                    key={cond}
                    onClick={() => toggleTokenCondition(selectedToken, cond)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all text-center flex items-center justify-center gap-1 ${
                      isActive 
                        ? `${CONDITION_COLORS[cond]} ring-2 shadow-lg font-black scale-[1.02]` 
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/5'
                    }`}
                  >
                    {isActive && <Check size={10} className="shrink-0 stroke-[3]" />}
                    <span className="truncate">{cond}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CREATURE SPELL / ATTACK AOE SETTINGS WITH VISIBLE HIGHLIGHTS */}
          <div className="flex flex-col gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-amber-400 font-bold flex items-center gap-1.5 text-[11px]">
              <Sparkles size={12} /> Creature AoE Template
            </span>

            {/* Shape Buttons with Clear Highlight Badges */}
            <div className="grid grid-cols-4 gap-1">
              {(['none', 'circle', 'cone', 'line'] as const).map(shape => {
                const isSelectedShape = (selectedToken.aoe?.shape || 'none') === shape;
                return (
                  <button
                    key={shape}
                    onClick={() => {
                      const currentAoE = selectedToken.aoe || { shape: 'none', radiusFt: 15, angleDeg: 0, color: '#ef4444' };
                      updateToken(activeMap.id, {
                        ...selectedToken,
                        aoe: { ...currentAoE, shape }
                      });
                    }}
                    className={`py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                      isSelectedShape
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md font-extrabold ring-1 ring-amber-300'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/5'
                    }`}
                  >
                    {shape}
                  </button>
                );
              })}
            </div>

            {selectedToken.aoe && selectedToken.aoe.shape !== 'none' && (
              <>
                {/* Distance Selector with Clear Highlight Badges */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {selectedToken.aoe.shape === 'circle' ? 'Radius:' : 'Length:'}
                  </span>
                  <div className="flex items-center gap-1">
                    {(selectedToken.aoe.shape === 'line' ? [30, 60, 100] : [10, 15, 20, 30, 60]).map(ft => {
                      const isSelectedFt = selectedToken.aoe!.radiusFt === ft;
                      return (
                        <button
                          key={ft}
                          onClick={() => {
                            updateToken(activeMap.id, {
                              ...selectedToken,
                              aoe: { ...selectedToken.aoe!, radiusFt: ft }
                            });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            isSelectedFt
                              ? 'bg-amber-500 text-black border-amber-400 shadow-sm font-extrabold ring-1 ring-amber-300'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                          }`}
                        >
                          {ft}ft
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rotation for Cone / Line */}
                {(selectedToken.aoe.shape === 'cone' || selectedToken.aoe.shape === 'line') && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Aim Direction:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const curAngle = selectedToken.aoe!.angleDeg || 0;
                          const nextAngle = ((curAngle - 45) % 360 + 360) % 360;
                          updateToken(activeMap.id, {
                            ...selectedToken,
                            aoe: { ...selectedToken.aoe!, angleDeg: nextAngle }
                          });
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300"
                        title="Rotate -45°"
                      >
                        <RotateCcw size={11} />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-amber-300 w-8 text-center bg-black/60 py-0.5 rounded border border-white/10">
                        {Math.round(selectedToken.aoe.angleDeg || 0)}°
                      </span>
                      <button
                        onClick={() => {
                          const curAngle = selectedToken.aoe!.angleDeg || 0;
                          const nextAngle = ((curAngle + 45) % 360 + 360) % 360;
                          updateToken(activeMap.id, {
                            ...selectedToken,
                            aoe: { ...selectedToken.aoe!, angleDeg: nextAngle }
                          });
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300"
                        title="Rotate +45°"
                      >
                        <RotateCw size={11} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Color */}
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                  <span className="text-[10px] text-slate-400">Spell Color Tint:</span>
                  <input
                    type="color"
                    value={selectedToken.aoe.color || '#ef4444'}
                    onChange={e => {
                      updateToken(activeMap.id, {
                        ...selectedToken,
                        aoe: { ...selectedToken.aoe!, color: e.target.value }
                      });
                    }}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </>
            )}
          </div>

          {/* Token Type with Highlighting */}
          <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/5">
            <span className="text-slate-400">Token Type:</span>
            <div className="flex gap-1">
              <button
                onClick={() => updateToken(activeMap.id, { ...selectedToken, isPlayer: true })}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  selectedToken.isPlayer ? 'bg-blue-500 text-white shadow-sm ring-1 ring-blue-300 font-extrabold' : 'bg-white/5 text-slate-400'
                }`}
              >
                Player
              </button>
              <button
                onClick={() => updateToken(activeMap.id, { ...selectedToken, isPlayer: false })}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  !selectedToken.isPlayer ? 'bg-red-500 text-white shadow-sm ring-1 ring-red-300 font-extrabold' : 'bg-white/5 text-slate-400'
                }`}
              >
                NPC / Monster
              </button>
            </div>
          </div>

          {selectedToken.isPlayer && (
            <div className="flex flex-col gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                  <Eye size={12} /> Sight Type:
                </span>
                <select
                  value={selectedToken.sightType || 'normal'}
                  onChange={e => {
                    const sight = e.target.value as SightType;
                    const updated = { ...selectedToken, sightType: sight };
                    updateToken(activeMap.id, updated);
                    revealVisionForToken(updated);
                  }}
                  className="bg-[#18212e] text-xs text-slate-200 rounded px-2 py-0.5 outline-none border border-white/10"
                >
                  <option value="normal">Normal Sight</option>
                  <option value="darkvision">Darkvision</option>
                  <option value="blindsight">Blindsight</option>
                  <option value="truesight">Truesight</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Vision Range (Squares):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={selectedToken.visionRange ?? 6}
                    onChange={e => {
                      const range = parseInt(e.target.value) || 1;
                      const updated = { ...selectedToken, visionRange: range };
                      updateToken(activeMap.id, updated);
                      revealVisionForToken(updated);
                    }}
                    className="w-12 bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-center text-xs text-amber-300 font-mono outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({(selectedToken.visionRange ?? 6) * 5} ft)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/5">
            <span className="text-slate-400">Player Screen:</span>
            <button
              onClick={() => toggleTokenVisibility(selectedToken)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                selectedToken.isSecret
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {selectedToken.isSecret ? (
                <>
                  <EyeOff size={12} />
                  <span>Hidden (Secret)</span>
                </>
              ) : (
                <>
                  <Eye size={12} />
                  <span>Visible to Players</span>
                </>
              )}
            </button>
          </div>

          {/* Save to World Vault Button with Visual Confirmation */}
          <button
            onClick={() => handleSaveToVault(selectedToken)}
            className={`w-full py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
              vaultSaveSuccess 
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30' 
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.9)]'
            }`}
          >
            {vaultSaveSuccess ? (
              <>
                <Check size={13} />
                <span>Saved to Roster! ✓</span>
              </>
            ) : (
              <>
                <BookmarkCheck size={13} />
                <span>Save to Party Roster (World Vault)</span>
              </>
            )}
          </button>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Token Name</span>
            <input
              type="text"
              value={selectedToken.name}
              onChange={e => updateToken(activeMap.id, { ...selectedToken, name: e.target.value })}
              className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>

          
          
              {/* Linked Codex Card Vitals & Navigation */}
              {selectedToken.cardId && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Linked Statblock Card</span>
                    <span className="text-xs font-bold text-slate-100 truncate max-w-[140px]">{selectedToken.name}</span>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedToken.cardId) {
                        setActiveCard(selectedToken.cardId);
                        setActiveView('editor');
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[10px] hover:bg-amber-400 transition-colors shadow-sm"
                  >
                    <span>Open Card</span>
                  </button>
                </div>
              )}

          {/* Autonomous Movement Settings for Monsters & NPCs */}
          {!selectedToken.isPlayer && (
            <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Footprints size={12} className="text-amber-400" />
                  Autonomous Motion
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-mono">
                  {selectedToken.movementMode || 'still'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5 text-[10px]">
                {(['still', 'wander', 'patrol'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setIsRecordingPath(false);
                      setIsDrawingBoundary(false);
                      updateToken(activeMap.id, { ...selectedToken, movementMode: mode });
                    }}
                    className={`py-1 rounded font-bold uppercase transition-all ${
                      (selectedToken.movementMode || 'still') === mode
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Wander Controls (Multi-Point Polygon Boundary) */}
              {selectedToken.movementMode === 'wander' && (
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setIsRecordingPath(false);
                        const nextState = !isDrawingBoundary;
                        setIsDrawingBoundary(nextState);
                        if (nextState) {
                          setActiveDrawingPolygon(selectedToken.wanderPolygon || []);
                        }
                      }}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                        isDrawingBoundary
                          ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:border-amber-400'
                      }`}
                    >
                      {isDrawingBoundary ? 'Click Map Corners (Done)' : 'Draw Boundary Area'}
                    </button>
                    {selectedToken.wanderPolygon && selectedToken.wanderPolygon.length > 0 && (
                      <button
                        onClick={() => {
                          setIsDrawingBoundary(false);
                          setActiveDrawingPolygon([]);
                          updateToken(activeMap.id, { ...selectedToken, wanderPolygon: undefined });
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                        title="Clear Boundary"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 italic text-center">
                    {(selectedToken.wanderPolygon || []).length} boundary corner(s) saved
                  </span>
                </div>
              )}

              {/* Patrol Controls (Sequential Waypoints & Highlighted Path) */}
              {selectedToken.movementMode === 'patrol' && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setIsDrawingBoundary(false);
                        setIsRecordingPath(!isRecordingPath);
                      }}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                        isRecordingPath
                          ? 'bg-blue-500 text-white border-blue-400 animate-pulse'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                      }`}
                    >
                      <Route size={11} />
                      {isRecordingPath ? 'Clicking Waypoints (Done)' : 'Select Waypoints'}
                    </button>
                    <button
                      onClick={() => {
                        setIsRecordingPath(false);
                        updateToken(activeMap.id, {
                          ...selectedToken,
                          patrolPath: [{ x: selectedToken.x, y: selectedToken.y }]
                        });
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] bg-white/5 border border-white/5 text-slate-400 hover:text-red-400"
                      title="Clear Waypoints"
                    >
                      Clear
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 italic text-center">
                    {(selectedToken.patrolPath || []).length} waypoint(s) on highlighted route
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Size with Clear Active Highlighting */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Size:</span>
            <div className="flex gap-1">
              {(['medium', 'large', 'huge'] as const).map(s => {
                const isSelectedSize = selectedToken.size === s;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      const finalX = snapCoordinate(selectedToken.x, gridCols, s);
                      const finalY = snapCoordinate(selectedToken.y, gridRows, s);
                      tokenCoordsRef.current[selectedToken.id] = { x: finalX, y: finalY };
                      updateToken(activeMap.id, { ...selectedToken, size: s, x: finalX, y: finalY });
                    }}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      isSelectedSize
                        ? 'bg-amber-500 text-black shadow-sm font-extrabold ring-1 ring-amber-300'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 bg-black/40 p-2 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Heart size={12} /> HP: {selectedToken.hpCurrent ?? 0} / {selectedToken.hpMax ?? 0}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => adjustTokenHp(selectedToken, -5)} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-red-500/20 text-red-300 text-[10px]">-5</button>
                <button onClick={() => adjustTokenHp(selectedToken, -1)} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-red-500/20 text-red-300 text-[10px]">-1</button>
                <button onClick={() => adjustTokenHp(selectedToken, 1)} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-[10px]">+1</button>
                <button onClick={() => adjustTokenHp(selectedToken, 5)} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-[10px]">+5</button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Ring Color:</span>
              <input
                type="color"
                value={selectedToken.color || '#ef4444'}
                onChange={e => updateToken(activeMap.id, { ...selectedToken, color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </div>

            <button
              onClick={() => {
                deleteTokenFromMap(activeMap.id, selectedToken.id);
                setSelectedTokenId(null);
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-red-400 text-[11px] p-1"
            >
              <Trash2 size={12} /> Delete Token
            </button>
          </div>
        </div>
      )}

      {/* Pin Creator Drawer */}
      {isAddingPin && !isTactical && (
        <div className="absolute top-16 left-8 z-30 p-4 rounded-2xl bg-[#121824] border border-white/10 shadow-2xl flex flex-col gap-3 text-xs w-72 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider">New Map Pin</span>
            <button onClick={() => setIsAddingPin(false)} className="text-slate-500 hover:text-white">
              <X size={13} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Location label (e.g. Iron Citadel)"
            value={newPinLabel}
            onChange={e => setNewPinLabel(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500"
          />

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Marker Color:</span>
            <input
              type="color"
              value={newPinColor}
              onChange={e => setNewPinColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={newPinSecret}
              onChange={e => setNewPinSecret(e.target.checked)}
              className="accent-amber-500"
            />
            <span>DM Secret (Hidden from Players)</span>
          </label>
        </div>
      )}

      {/* Upload New Map Modal */}
      {isCreatingMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateNewMapSubmit} className="w-full max-w-md p-6 rounded-2xl bg-[#121824] border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Upload New Map
              </h3>
              <button type="button" onClick={() => setIsCreatingMap(false)} className="text-slate-500 hover:text-white">
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Map Category:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewMapCategory('world')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                    newMapCategory === 'world'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-black/30 border-white/5 text-slate-400'
                  }`}
                >
                  <Globe size={18} />
                  <span>World / Regional Map</span>
                  <span className="text-[9px] font-normal text-slate-500">Zoning, Scale & POI Pins</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewMapCategory('tactical')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                    newMapCategory === 'tactical'
                      ? 'bg-red-500/20 border-red-500 text-red-300'
                      : 'bg-black/30 border-white/5 text-slate-400'
                  }`}
                >
                  <Swords size={18} />
                  <span>Encounter Battlemap</span>
                  <span className="text-[9px] font-normal text-slate-500">Vision, Doors & Walls</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Map Name (e.g. Sunken Crypt, Goblin Redoubt)"
              value={newMapName}
              onChange={e => setNewMapName(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
            />

            <div className="flex flex-col gap-1">
              <label className="border border-dashed border-white/15 hover:border-amber-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-black/20 hover:bg-black/40 transition-colors">
                <Upload size={20} className="text-amber-400" />
                <span className="text-xs text-slate-300 font-semibold">Select image file from computer</span>
                <span className="text-[10px] text-slate-500">JPG, PNG, WebP stored 100% offline</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>

              {newMapDataUrl && (
                <span className="text-[10px] text-emerald-400 text-center font-medium">✓ Image file loaded and ready</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsCreatingMap(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newMapName || !newMapDataUrl || isSubmittingMap}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs"
              >
                {isSubmittingMap ? 'Saving Map...' : 'Save Map'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Canvas Viewport with Pan, Zoom & Full-Fill Size */}
      <div 
        className="flex-1 relative overflow-auto flex items-center justify-center p-0"
        onWheel={(e) => {
          if (e.ctrlKey || e.altKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            setZoomScale(prev => Math.min(2.5, Math.max(0.6, prev + delta)));
          }
        }}
      >
        {activeMap && activeMap.imageUrl ? (
          <div 
            ref={mapContainerRef}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onContextMenu={(e) => handleMapContextMenu(e)}
            style={{ 
              transform: `scale(${zoomScale})`, 
              transformOrigin: 'center center', 
              transition: 'transform 0.1s ease-out' 
            }}
            className={`relative max-w-full max-h-[96vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 ${
              toolMode !== 'select' ? 'cursor-crosshair' : 'cursor-default'
            }`}
          >
            <img
              src={activeMap.imageUrl}
              alt={activeMap.name}
              className="max-h-[95vh] w-auto object-contain block pointer-events-none"
            />

            {/* Ambient Lighting Atmospheric Tint */}
            {isTactical && (
              <div 
                className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
                  ambientLighting === 'darkness'
                    ? 'bg-indigo-950/40 mix-blend-multiply'
                    : ambientLighting === 'dim'
                    ? 'bg-amber-950/25 mix-blend-multiply'
                    : 'bg-transparent'
                }`}
              />
            )}

            {/* Independent X/Y Visual Grid Overlay */}
            {isTactical && showGridOverlay && (
              <div 
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  backgroundImage: gridStyle === 'light'
                    ? `
                        linear-gradient(to right, rgba(255, 255, 255, 0.45) 1.5px, transparent 1.5px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.45) 1.5px, transparent 1.5px)
                      `
                    : gridStyle === 'dark'
                    ? `
                        linear-gradient(to right, rgba(0, 0, 0, 0.75) 1.5px, transparent 1.5px),
                        linear-gradient(to bottom, rgba(0, 0, 0, 0.75) 1.5px, transparent 1.5px)
                      `
                    : `
                        linear-gradient(to right, rgba(0, 0, 0, 0.95) 2px, transparent 2px),
                        linear-gradient(to bottom, rgba(0, 0, 0, 0.95) 2px, transparent 2px)
                      `,
                  backgroundSize: `${100 / gridCols}% ${100 / gridRows}%`
                }}
              />
            )}

            {/* DM FOG OF WAR: Semi-Transparent Shroud */}
            {isTactical && fogEnabled && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: gridRows }).map((_, r) => (
                  <div key={r} className="flex w-full" style={{ height: `${100 / gridRows}%` }}>
                    {Array.from({ length: gridCols }).map((_, c) => {
                      const isRevealed = revealedCellsSet.has(`${c},${r}`);
                      if (isRevealed) return <div key={c} style={{ width: `${100 / gridCols}%` }} />;

                      return (
                        <div 
                          key={c}
                          style={{ width: `${100 / gridCols}%` }}
                          className="bg-[#090d14]/65 border border-white/5 backdrop-blur-[1px] relative"
                        >
                          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,_transparent_1px)] [background-size:6px_6px]" />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* True Grid-Unit Token AoE Layer */}
            {renderTokenAoEs()}

            {/* Active Distance Ruler SVG */}
            {isTactical && activeRuler && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-45">
                <line
                  x1={`${activeRuler.startX}%`}
                  y1={`${activeRuler.startY}%`}
                  x2={`${activeRuler.endX}%`}
                  y2={`${activeRuler.endY}%`}
                  stroke="#fde047"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
                <circle cx={`${activeRuler.startX}%`} cy={`${activeRuler.startY}%`} r="5" fill="#f59e0b" />
                <circle cx={`${activeRuler.endX}%`} cy={`${activeRuler.endY}%`} r="5" fill="#f59e0b" />
                <text
                  x={`${(activeRuler.startX + activeRuler.endX) / 2}%`}
                  y={`${(activeRuler.startY + activeRuler.endY) / 2}%`}
                  fill="#ffffff"
                  stroke="#facc15"
                  strokeWidth="2"
                  paintOrder="stroke fill"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  dy="-8"
                >
                  {activeRuler.distanceFt} ft ({activeRuler.distanceFt / 5} sq)
                </text>
              </svg>
            )}

            {/* VECTOR OBSTACLES: SVG Thin Walls, Doors & Windows */}
            {isTactical && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible">
                <defs>
                  <filter id="wallGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#facc15" floodOpacity="0.95"/>
                  </filter>
                  <filter id="secretGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#ef4444" floodOpacity="0.8"/>
                  </filter>
                  <filter id="windowGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.95"/>
                  </filter>
                </defs>

                {(activeMap.obstacles || []).map(obs => {
                  if (obs.x1 === undefined || obs.y1 === undefined || obs.x2 === undefined || obs.y2 === undefined) {
                    return null;
                  }

                  const midX = (obs.x1 + obs.x2) / 2;
                  const midY = (obs.y1 + obs.y2) / 2;

                  if (obs.type === 'wall') {
                    return (
                      <g key={obs.id} className="pointer-events-auto group cursor-pointer">
                        <line
                          x1={`${obs.x1}%`}
                          y1={`${obs.y1}%`}
                          x2={`${obs.x2}%`}
                          y2={`${obs.y2}%`}
                          stroke="#facc15"
                          strokeWidth="7"
                          strokeLinecap="round"
                        />
                        <line
                          x1={`${obs.x1}%`}
                          y1={`${obs.y1}%`}
                          x2={`${obs.x2}%`}
                          y2={`${obs.y2}%`}
                          stroke="#facc15"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          filter="url(#wallGlow)"
                          className="group-hover:stroke-red-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toolMode === 'eraseObstacle' || toolMode === 'select') {
                              deleteObstacleFromMap(activeMap.id, obs.id);
                              recalculateAllPlayerVision();
                            }
                          }}
                        />
                      </g>
                    );
                  }

                  if (obs.type === 'window') {
                    return (
                      <g key={obs.id} className="pointer-events-auto group cursor-pointer">
                        <line
                          x1={`${obs.x1}%`}
                          y1={`${obs.y1}%`}
                          x2={`${obs.x2}%`}
                          y2={`${obs.y2}%`}
                          stroke="#38bdf8"
                          strokeWidth="3.5"
                          strokeDasharray="4 3"
                          strokeLinecap="round"
                          filter="url(#windowGlow)"
                          className="group-hover:stroke-red-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteObstacleFromMap(activeMap.id, obs.id);
                            recalculateAllPlayerVision();
                          }}
                        />
                      </g>
                    );
                  }

                  if (obs.type === 'door') {
                    return (
                      <g key={obs.id} className="pointer-events-auto">
                        <line
                          x1={`${obs.x1}%`}
                          y1={`${obs.y1}%`}
                          x2={`${obs.x2}%`}
                          y2={`${obs.y2}%`}
                          stroke={obs.isOpen ? "#10b981" : (obs.isSecret ? "#ef4444" : "#b45309")}
                          strokeWidth="4"
                          strokeDasharray={obs.isSecret ? "5 3" : undefined}
                          strokeLinecap="round"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toolMode === 'eraseObstacle') {
                              deleteObstacleFromMap(activeMap.id, obs.id);
                            } else {
                              toggleDoorState(activeMap.id, obs.id);
                            }
                            recalculateAllPlayerVision();
                          }}
                        />

                        {/* Interactive Door Midpoint Badge Handle */}
                        <foreignObject
                          x={`calc(${midX}% - 12px)`}
                          y={`calc(${midY}% - 12px)`}
                          width="24"
                          height="24"
                          className="overflow-visible"
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (toolMode === 'eraseObstacle') {
                                deleteObstacleFromMap(activeMap.id, obs.id);
                              } else {
                                toggleDoorState(activeMap.id, obs.id);
                              }
                              recalculateAllPlayerVision();
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleObstacleSecret(activeMap.id, obs.id);
                            }}
                            className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-125 ${
                              obs.isOpen 
                                ? 'bg-emerald-600/90 border-emerald-300 text-white' 
                                : obs.isSecret 
                                ? 'bg-red-600/90 border-white text-white ring-2 ring-red-400' 
                                : 'bg-amber-700/90 border-amber-300 text-amber-100'
                            }`}
                            title={
                              obs.isSecret 
                                ? "Secret Door (Click to swing open/shut, right-click to reveal)" 
                                : "Door (Click to swing open/shut, right-click to make secret)"
                            }
                          >
                            {obs.isOpen ? (
                              <DoorOpen size={12} />
                            ) : (
                              <DoorClosed size={12} className={obs.isSecret ? "text-red-200" : "text-amber-200"} />
                            )}
                          </div>
                        </foreignObject>
                      </g>
                    );
                  }

                  return null;
                })}

                {/* Live Vector Rubber-Banding Preview Line */}
                {lineStartPoint && currentMousePos && (
                  <line
                    x1={`${lineStartPoint.x}%`}
                    y1={`${lineStartPoint.y}%`}
                    x2={`${currentMousePos.x}%`}
                    y2={`${currentMousePos.y}%`}
                    stroke={
                      toolMode === 'addWall' ? '#facc15' :
                      toolMode === 'addWindow' ? '#38bdf8' :
                      toolMode === 'addSecretDoor' ? '#ef4444' : '#10b981'
                    }
                    strokeWidth="3.5"
                    strokeDasharray="4 2"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                )}
              </svg>
            )}

            
              {/* SVG Layer for DM Restricted Area Shapes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-22 overflow-visible">
                
              {/* Pattern definition for DM Fog Red Shroud */}
              <defs>
                <pattern id="redFogDots" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#ef4444" opacity="0.45" />
                  <circle cx="6" cy="6" r="1" fill="#dc2626" opacity="0.3" />
                </pattern>
                <filter id="crimsonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#dc2626" floodOpacity="0.8"/>
                </filter>
              </defs>


                {/* Render Placed Shape Blockers */}
                {(activeMap.obstacles || []).map((obs: any) => {
                  if (obs.shapeType === 'circle' && obs.circleR) {
                    return (
                      <g key={obs.id}>
                        {/* Red Fog Translucent Fill */}
                        <circle
                          cx={`${obs.circleX}%`}
                          cy={`${obs.circleY}%`}
                          r={`${obs.circleR}%`}
                          fill="rgba(185, 28, 28, 0.45)"
                          className={toolMode === 'eraseObstacle' ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toolMode === 'eraseObstacle' || toolMode === 'select') {
                              deleteObstacleFromMap(activeMap.id, obs.id);
                            }
                          }}
                        />
                        {/* Dot Matrix Fog Overlay */}
                        <circle
                          cx={`${obs.circleX}%`}
                          cy={`${obs.circleY}%`}
                          r={`${obs.circleR}%`}
                          fill="url(#redFogDots)"
                          className={toolMode === 'eraseObstacle' ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toolMode === 'eraseObstacle' || toolMode === 'select') {
                              deleteObstacleFromMap(activeMap.id, obs.id);
                            }
                          }}
                        />
                        {/* Perimeter Barrier */}
                        <circle
                          cx={`${obs.circleX}%`}
                          cy={`${obs.circleY}%`}
                          r={`${obs.circleR}%`}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3.5"
                          strokeDasharray="5 3"
                          filter="url(#crimsonGlow)"
                          className="pointer-events-auto cursor-pointer hover:stroke-yellow-300 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toolMode === 'eraseObstacle' || toolMode === 'select') {
                              deleteObstacleFromMap(activeMap.id, obs.id);
                            }
                          }}
                        >
                          <title>Restricted Circle (Click with Eraser to remove)</title>
                        </circle>
                      </g>
                    );
                  }

                  if (obs.shapeType === 'box' && obs.boxW) {
                    return (
                      <g key={obs.id}>
                        <rect
                          x={`${obs.boxX}%`}
                          y={`${obs.boxY}%`}
                          width={`${obs.boxW}%`}
                          height={`${obs.boxH}%`}
                          fill="rgba(185, 28, 28, 0.45)"
                          className={toolMode === 'eraseObstacle' ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toolMode === 'eraseObstacle' || toolMode === 'select') {
                              deleteObstacleFromMap(activeMap.id, obs.id);
                            }
                          }}
                        />
                        <rect
                          x={`${obs.boxX}%`}
                          y={`${obs.boxY}%`}
                          width={`${obs.boxW}%`}
                          height={`${obs.boxH}%`}
                          fill="url(#redFogDots)"
                          className={toolMode === 'eraseObstacle' ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toolMode === 'eraseObstacle' || toolMode === 'select') {
                              deleteObstacleFromMap(activeMap.id, obs.id);
                            }
                          }}
                        />
                        <rect
                          x={`${obs.boxX}%`}
                          y={`${obs.boxY}%`}
                          width={`${obs.boxW}%`}
                          height={`${obs.boxH}%`}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3.5"
                          strokeDasharray="5 3"
                          filter="url(#crimsonGlow)"
                          className="pointer-events-auto cursor-pointer hover:stroke-yellow-300 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toolMode === 'eraseObstacle' || toolMode === 'select') {
                              deleteObstacleFromMap(activeMap.id, obs.id);
                            }
                          }}
                        >
                          <title>Restricted Square (Click with Eraser to remove)</title>
                        </rect>
                      </g>
                    );
                  }
                  return null;
                })}

                {/* Live Drawing Preview */}
                {blockerShapeStart && currentDragPos && toolMode === 'addBlockerCircle' && (
                  <g>
                    <circle
                      cx={`${blockerShapeStart.x}%`}
                      cy={`${blockerShapeStart.y}%`}
                      r={`${Math.hypot(currentDragPos.x - blockerShapeStart.x, currentDragPos.y - blockerShapeStart.y)}%`}
                      fill="rgba(220, 38, 38, 0.4)"
                    />
                    <circle
                      cx={`${blockerShapeStart.x}%`}
                      cy={`${blockerShapeStart.y}%`}
                      r={`${Math.hypot(currentDragPos.x - blockerShapeStart.x, currentDragPos.y - blockerShapeStart.y)}%`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      className="animate-pulse"
                    />
                  </g>
                )}

                {blockerShapeStart && currentDragPos && toolMode === 'addBlockerBox' && (
                  <g>
                    <rect
                      x={`${Math.min(blockerShapeStart.x, currentDragPos.x)}%`}
                      y={`${Math.min(blockerShapeStart.y, currentDragPos.y)}%`}
                      width={`${Math.abs(currentDragPos.x - blockerShapeStart.x)}%`}
                      height={`${Math.abs(currentDragPos.y - blockerShapeStart.y)}%`}
                      fill="rgba(220, 38, 38, 0.4)"
                    />
                    <rect
                      x={`${Math.min(blockerShapeStart.x, currentDragPos.x)}%`}
                      y={`${Math.min(blockerShapeStart.y, currentDragPos.y)}%`}
                      width={`${Math.abs(currentDragPos.x - blockerShapeStart.x)}%`}
                      height={`${Math.abs(currentDragPos.y - blockerShapeStart.y)}%`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      className="animate-pulse"
                    />
                  </g>
                )}
              </svg>

            {/* TACTICAL OBSTACLES */}
            {isTactical && (activeMap.obstacles || []).map(obs => {
              const cellW = 100 / gridCols;
              const cellH = 100 / gridRows;

              if (obs.type === 'wall') {
                return (
                  <div
                    key={obs.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteObstacleFromMap(activeMap.id, obs.id);
                      recalculateAllPlayerVision();
                    }}
                    style={{
                      left: `${(obs.col ?? 0) * cellW}%`,
                      top: `${(obs.row ?? 0) * cellH}%`,
                      width: `${cellW}%`,
                      height: `${cellH}%`
                    }}
                    className="absolute bg-yellow-400/90 border-2 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.8)] z-25 flex items-center justify-center cursor-pointer hover:border-red-500 group"
                    title="Wall (Click with Eraser tool to delete)"
                  >
                    <span className="text-[10px] text-black font-extrabold group-hover:hidden tracking-wider">WALL</span>
                    <Trash2 size={10} className="text-red-400 hidden group-hover:block" />
                  </div>
                );
              }

              if (obs.type === 'door') {
                return (
                  <div
                    key={obs.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toolMode === 'eraseObstacle') {
                        deleteObstacleFromMap(activeMap.id, obs.id);
                      } else {
                        toggleDoorState(activeMap.id, obs.id);
                      }
                      recalculateAllPlayerVision();
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleObstacleSecret(activeMap.id, obs.id);
                    }}
                    style={{
                      left: `${(obs.col ?? 0) * cellW}%`,
                      top: `${(obs.row ?? 0) * cellH}%`,
                      width: `${cellW}%`,
                      height: `${cellH}%`
                    }}
                    className={`absolute z-25 flex items-center justify-center cursor-pointer border transition-colors ${
                      obs.isOpen 
                        ? 'bg-emerald-500/25 border-emerald-400/80 hover:bg-emerald-500/40' 
                        : 'bg-amber-800/80 border-amber-400 hover:bg-amber-800'
                    } ${obs.isSecret ? 'ring-2 ring-red-500 border-dashed' : ''}`}
                    title={
                      obs.isSecret 
                        ? "Secret Door (DM Secret - Right-click to make public, click to open/shut)" 
                        : (obs.isOpen ? "Open Door (Click to shut)" : "Closed Door (Click to open, right-click to hide)")
                    }
                  >
                    {obs.isOpen ? (
                      <DoorOpen size={13} className="text-emerald-300" />
                    ) : (
                      <DoorClosed size={13} className={obs.isSecret ? "text-red-300" : "text-amber-300"} />
                    )}
                    {obs.isSecret && (
                      <span className="absolute -top-1 -right-1 text-[7px] bg-red-600 text-white px-0.5 rounded font-bold">S</span>
                    )}
                  </div>
                );
              }

              if (obs.type === 'chest') {
                return (
                  <div
                    key={obs.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toolMode === 'eraseObstacle') {
                        deleteObstacleFromMap(activeMap.id, obs.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleObstacleSecret(activeMap.id, obs.id);
                    }}
                    style={{
                      left: `${(obs.col ?? 0) * cellW}%`,
                      top: `${(obs.row ?? 0) * cellH}%`,
                      width: `${cellW}%`,
                      height: `${cellH}%`
                    }}
                    className={`absolute z-25 flex items-center justify-center cursor-pointer bg-amber-500/10 border rounded p-0.5 hover:scale-110 transition-transform ${
                      obs.isSecret ? 'border-dashed border-red-500 bg-red-500/15' : 'border-amber-400/30'
                    }`}
                    title={obs.isSecret ? "Hidden Chest (DM Secret - Right-click to reveal to players)" : "Treasure Chest (Right-click to hide)"}
                  >
                    <ChestIcon size={18} className="drop-shadow-md" />
                    {obs.isSecret && (
                      <span className="absolute -top-1 -right-1 text-[7px] bg-red-600 text-white px-0.5 rounded font-bold">S</span>
                    )}
                  </div>
                );
              }

              if (obs.type === 'table') {
                return (
                  <div
                    key={obs.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toolMode === 'eraseObstacle') {
                        deleteObstacleFromMap(activeMap.id, obs.id);
                        recalculateAllPlayerVision();
                      }
                    }}
                    style={{
                      left: `${(obs.col ?? 0) * cellW}%`,
                      top: `${(obs.row ?? 0) * cellH}%`,
                      width: `${cellW}%`,
                      height: `${cellH}%`
                    }}
                    className="absolute z-25 flex items-center justify-center cursor-pointer bg-amber-950/70 border border-amber-700/60 rounded"
                    title="Table / Low Cover"
                  >
                    <span className="text-sm select-none">🪑</span>
                  </div>
                );
              }

              return null;
            })}

            {/* Active Selected Player Token Vision Radius Indicator */}
            {selectedToken && selectedToken.isPlayer && (
              <div
                style={{
                  left: `${(tokenCoordsRef.current[selectedToken.id]?.x ?? selectedToken.x)}%`,
                  top: `${(tokenCoordsRef.current[selectedToken.id]?.y ?? selectedToken.y)}%`,
                  width: `${((selectedToken.visionRange ?? 6) * 2 / gridCols) * 100}%`,
                  height: `${((selectedToken.visionRange ?? 6) * 2 / gridRows) * 100}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400/50 bg-amber-400/5 pointer-events-none z-15 transition-all duration-75"
              />
            )}

            {/* WORLD MODE: Render Map Pins */}
            {!isTactical && (activeMap.pins || []).map(pin => (
              <div
                key={pin.id}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
              >
                <div 
                  style={{ backgroundColor: pin.color || '#f59e0b' }}
                  className={`w-4 h-4 rounded-full border-2 border-white/80 shadow-md flex items-center justify-center cursor-pointer transition-transform group-hover:scale-125 ${
                    pin.isSecret ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  {pin.isSecret && <span className="text-[8px] text-white font-bold leading-none">S</span>}
                </div>

                <div className="absolute left-1/2 bottom-5 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-black/95 border border-white/15 text-[11px] text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 shadow-2xl z-20">
                  <span className="font-semibold">{pin.label}</span>
                  {pin.isSecret && <span className="text-red-400 font-bold text-[9px] uppercase">(Secret)</span>}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePinFromMap(activeMap.id, pin.id);
                    }}
                    className="text-slate-500 hover:text-red-400 p-0.5 ml-1"
                    title="Delete Pin"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}

            {/* TACTICAL MODE: Render Draggable Tokens */}
            {isTactical && (activeMap.tokens || []).map(token => {
              const dimensions = getTokenDimensionsStyle(token.size);
              const isSelected = selectedTokenId === token.id;
              const isDead = (token.conditions || []).includes('Dead');

              const activeCombatant = activeCombat?.combatants[activeCombat.currentTurnIndex];
              const isActiveTurn = Boolean(activeCombatant && (activeCombatant.id === token.id || activeCombatant.name.toLowerCase() === token.name.toLowerCase()));
              
              const posX = tokenCoordsRef.current[token.id]?.x ?? token.x;
              const posY = tokenCoordsRef.current[token.id]?.y ?? token.y;

              return (
                <div
                  key={token.id}
                  onClick={(e) => handleTokenClick(e, token.id)}
                  onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
                  onContextMenu={(e) => handleMapContextMenu(e, token.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-grab active:cursor-grabbing border-2 shadow-2xl z-25 flex flex-col items-center justify-center ${
                    isActiveTurn
                      ? 'ring-4 ring-amber-400 shadow-amber-400/80 scale-110 z-35 animate-pulse'
                      : isSelected 
                      ? 'ring-4 ring-blue-400 shadow-blue-400/80 scale-105 z-30' 
                      : ''
                  } ${isDead ? 'opacity-65 grayscale' : ''}`}
                  style={{ 
                    left: `${posX}%`, 
                    top: `${posY}%`,
                    width: dimensions.width,
                    height: dimensions.height,
                    fontSize: dimensions.fontSize,
                    backgroundColor: token.imageUrl ? 'transparent' : (token.color || '#ef4444'),
                    borderColor: token.imageUrl ? (token.color || '#f59e0b') : '#ffffff',
                    transition: draggingTokenId === token.id ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out'
                  }}
                >
                  {/* Targeting Reticle Overlay */}
                  {isSelected && (
                    <div className="absolute -inset-2 pointer-events-none rounded-full border-2 border-dashed border-amber-300 animate-spin-slow">
                      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-amber-400" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-amber-400" />
                    </div>
                  )}

                  {/* Token Art */}
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative">
                    {token.imageUrl ? (
                      <img 
                        src={token.imageUrl} 
                        alt={token.name} 
                        className="w-full h-full object-cover rounded-full pointer-events-none select-none block"
                      />
                    ) : (
                      <>
                        <span className="font-bold text-white uppercase truncate px-1 pointer-events-none">
                          {token.name.substring(0, 2)}
                        </span>

                        {token.isPlayer && (
                          <div className="absolute top-0 left-0 w-3 h-3 rounded-full bg-blue-600 border border-white flex items-center justify-center z-30">
                            <span className="text-[6px] text-white font-bold leading-none">P</span>
                          </div>
                        )}
                      </>
                    )}

                    {isDead && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-red-500 font-extrabold text-lg select-none">
                        ✕
                      </div>
                    )}
                  </div>

                  {token.isSecret && (
                    <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-600 border border-white flex items-center justify-center z-30">
                      <EyeOff size={7} className="text-white" />
                    </div>
                  )}

                  {/* Overhead Conditions Stack on Battlemap */}
                  {(token.conditions || []).length > 0 && (
                    <div className="absolute -top-4 flex items-center gap-0.5 flex-wrap justify-center pointer-events-none z-50">
                      {token.conditions!.slice(0, 3).map((cond, cIdx) => (
                        <span 
                          key={cIdx} 
                          className={`px-1 py-0.2 rounded text-[7px] font-bold border uppercase leading-tight ${
                            CONDITION_COLORS[cond] || 'bg-slate-800 text-slate-200 border-slate-600'
                          }`}
                        >
                          {cond === 'Concentrating' ? 'CONC' : cond}
                        </span>
                      ))}
                      {token.conditions!.length > 3 && (
                        <span className="px-0.5 text-[6px] font-bold bg-black text-amber-300 rounded border border-amber-500">
                          +{token.conditions!.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Floating Active Turn Badge */}
                  {isActiveTurn && (
                    <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-amber-400 text-black font-extrabold text-[8px] uppercase tracking-wider whitespace-nowrap shadow-xl flex items-center gap-1 z-50">
                      <UserCheck size={9} />
                      <span>Active Turn</span>
                    </div>
                  )}

                  {/* Floating Overhead Name Badge on Selection */}
                  {isSelected && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-blue-500 text-white font-extrabold text-[8px] uppercase tracking-wider whitespace-nowrap shadow-lg flex items-center gap-1 pointer-events-none z-45">
                      <span>{token.name}</span>
                    </div>
                  )}

                  {/* Hover Info Tooltip */}
                  {!isSelected && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 border border-white/10 text-[9px] text-slate-200 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1 shadow-xl z-40">
                      <span className="font-semibold">{token.name}</span>
                      {token.isPlayer && (
                        <span className="text-amber-300 font-mono text-[8px] uppercase">
                          ({token.sightType || 'normal'} {(token.visionRange ?? 6) * 5}ft)
                        </span>
                      )}
                      {token.hpMax && (
                        <span className="text-emerald-400 font-mono">HP {token.hpCurrent}/{token.hpMax}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <MapIcon size={36} className="opacity-40 text-blue-400" />
            <span className="text-xs">
              No maps loaded. Open the top-left Maps dropdown to choose or upload one!
            </span>
          </div>
        )}

        {/* COMPACT FLOATING ZOOM CONTROLS (DOCKED DIRECTLY NEXT TO THE COMPACT DICE ICON) */}
        {activeMap && (
          <div className="fixed bottom-3 right-14 z-50 flex items-center gap-1 bg-[#121824]/90 backdrop-blur-md border border-white/10 p-1 rounded-2xl shadow-2xl">
            <button
              onClick={() => setZoomScale(prev => Math.max(0.6, prev - 0.15))}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={() => setZoomScale(prev => Math.min(2.5, prev + 0.15))}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn size={15} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
