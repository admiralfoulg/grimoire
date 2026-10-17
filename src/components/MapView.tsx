import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { ProjectionService, type ActiveRulerData } from '../services/broadcast';
import type { MapToken, MapLighting, SightType, MapObstacle, ObstacleType, SavedTokenTemplate, WorldMap, Combatant } from '../services/storage';
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
  Shield
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

export const MapView: React.FC = () => {
  const { 
    maps, 
    activeMapId, 
    combats,
    activeCombatId,
    savedTokens,
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
    nextTurn,
    prevTurn
  } = useGrimoireStore();

  const activeMap = maps.find(m => m.id === activeMapId) || maps[0];
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
  const [sidebarWidth, setSidebarWidth] = useState<number>(240);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState<'left' | 'right' | null>(null);
  const dragSidebarOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(240);
  const [expandedCombatantId, setExpandedCombatantId] = useState<string | null>(null);

  // Dropdowns
  const [showMapsMenu, setShowMapsMenu] = useState(false);
  const [showObjectsMenu, setShowObjectsMenu] = useState(false);
  const [showFogMenu, setShowFogMenu] = useState(false);
  const [showGridDropdown, setShowGridDropdown] = useState(false);
  const [showAddTokenMenu, setShowAddTokenMenu] = useState(false);
  const [vaultSaveSuccess, setVaultSaveSuccess] = useState(false);

  // Context Menus
  const [mapContextMenu, setMapContextMenu] = useState<MapDropdownContextMenu | null>(null);
  const [rosterContextMenu, setRosterContextMenu] = useState<RosterContextMenu | null>(null);
  const [renamingMapId, setRenamingMapId] = useState<string | null>(null);
  const [renamingMapName, setRenamingMapName] = useState('');

  // Tools
  const [toolMode, setToolMode] = useState<'select' | 'ruler' | 'addToken' | 'addWall' | 'addDoor' | 'addSecretDoor' | 'addChest' | 'addSecretChest' | 'addTable' | 'eraseObstacle' | 'fogReveal' | 'fogShroud'>('select');

  // Ruler Tool State
  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null);
  const [activeRuler, setActiveRuler] = useState<ActiveRulerData | null>(null);

  // Token Deployment State
  const [tokenName, setTokenName] = useState('Hero');
  const [tokenColor, setTokenColor] = useState('#ef4444');
  const [tokenImageUrl, setTokenImageUrl] = useState<string>('');
  const [tokenSize, setTokenSize] = useState<'medium' | 'large' | 'huge'>('medium');
  const [tokenHp, setTokenHp] = useState<number>(30);
  const [tokenSecret, setTokenSecret] = useState(false);
  const [tokenIsPlayer, setTokenIsPlayer] = useState(true);
  const [tokenVisionRange, setTokenVisionRange] = useState<number>(6);
  const [tokenSightType, setTokenSightType] = useState<SightType>('normal');

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
  const gridCols = activeMap?.gridCols ?? 25;
  const gridRows = activeMap?.gridRows ?? 30;

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

      const targetCol = Math.floor((newX / 100) * gridCols);
      const targetRow = Math.floor((newY / 100) * gridRows);
      if (solidObstaclesSet.has(`${targetCol},${targetRow}`)) {
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
  }, [selectedToken, isTactical, activeMap, gridCols, gridRows, solidObstaclesSet, updateTokenPosition, revealVisionForToken]);

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
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

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
        tokens: publicTokens
      });
    }
  }, [activeMap, isProjecting, gridCols, gridRows, activeRuler]);

  const handleToggleProject = () => {
    if (!activeMap || !activeMap.imageUrl) return;

    if (isProjecting) {
      ProjectionService.clear();
      setIsProjecting(false);
    } else {
      const publicPins = (activeMap.pins || []).filter(p => !p.isSecret);
      const publicZones = (activeMap.zones || []).filter(z => !z.isSecret);
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
        tokens: publicTokens
      });
      setIsProjecting(true);
    }
  };

  const applyToolAtTile = (col: number, row: number) => {
    if (!activeMap) return;
    if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return;

    if (['addWall', 'addDoor', 'addSecretDoor', 'addChest', 'addSecretChest', 'addTable'].includes(toolMode)) {
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
    if (!activeMap || !mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const rawY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const col = Math.floor((rawX / 100) * gridCols);
    const row = Math.floor((rawY / 100) * gridRows);

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
    if (!activeMap) return;
    setContextMenu(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const rawY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

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
    }
  };

  const handleMapContextMenu = (e: React.MouseEvent<HTMLDivElement>, tokenId?: string, obstacleId?: string) => {
    e.preventDefault();
    e.stopPropagation();

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
    }
  };

  const handleTokenClick = (e: React.MouseEvent, tokenId: string) => {
    e.stopPropagation();
    setSelectedTokenId(tokenId);
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
        setSidebarWidth(Math.max(180, Math.min(420, resizeStartWidth.current + delta)));
      } else {
        const delta = resizeStartX.current - e.clientX;
        setSidebarWidth(Math.max(180, Math.min(420, resizeStartWidth.current + delta)));
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

    if (isMouseDownOnCanvas && ['addWall', 'addDoor', 'addSecretDoor', 'addChest', 'addSecretChest', 'addTable', 'eraseObstacle', 'fogReveal', 'fogShroud'].includes(toolMode)) {
      applyToolAtTile(col, row);
      return;
    }

    if (draggingTokenId) {
      const token = activeMap.tokens?.find(t => t.id === draggingTokenId);
      const size = token?.size || 'medium';
      const finalX = snapCoordinate(rawX, gridCols, size);
      const finalY = snapCoordinate(rawY, gridRows, size);

      tokenCoordsRef.current[draggingTokenId] = { x: finalX, y: finalY };
      forceUpdate({});

      updateTokenPosition(activeMap.id, draggingTokenId, finalX, finalY);

      if (token && token.isPlayer) {
        revealVisionForToken({ ...token, x: finalX, y: finalY });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingTokenId(null);
    setIsMouseDownOnCanvas(false);
    setIsDraggingSidebar(false);
    setIsResizingSidebar(null);
    if (toolMode === 'ruler') {
      setRulerStart(null);
    }
  };

  const toggleTokenVisibility = (token: MapToken) => {
    if (!activeMap) return;
    updateToken(activeMap.id, { ...token, isSecret: !token.isSecret });
  };

  const adjustTokenHp = (token: MapToken, amount: number) => {
    if (!activeMap) return;
    const newHp = Math.max(0, (token.hpCurrent || 0) + amount);
    updateToken(activeMap.id, { ...token, hpCurrent: newHp });
  };

  const adjustCombatantHp = (combatant: Combatant, delta: number) => {
    if (!activeCombat) return;
    const newHp = Math.max(0, combatant.hpCurrent + delta);
    const updatedCombatants = activeCombat.combatants.map(c => c.id === combatant.id ? { ...c, hpCurrent: newHp } : c);
    updateCombat({ ...activeCombat, combatants: updatedCombatants });
  };

  const setCombatantExactHp = (combatant: Combatant, exactVal: number) => {
    if (!activeCombat) return;
    const updatedCombatants = activeCombat.combatants.map(c => c.id === combatant.id ? { ...c, hpCurrent: Math.max(0, exactVal) } : c);
    updateCombat({ ...activeCombat, combatants: updatedCombatants });
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-in fade-in">
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
                      ambientLighting === 'bright' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
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
                      className="absolute top-11 right-0 z-40 p-1.5 rounded-xl bg-[#121824] border border-white/10 shadow-2xl flex flex-col gap-1 w-48 animate-in fade-in"
                    >
                      <button
                        onClick={() => { setToolMode('addWall'); setShowObjectsMenu(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                          toolMode === 'addWall' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <Square size={12} className="text-amber-400" />
                        <span>Draw Walls</span>
                      </button>

                      <button
                        onClick={() => { setToolMode('addDoor'); setShowObjectsMenu(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                          toolMode === 'addDoor' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <DoorClosed size={12} className="text-amber-400" />
                        <span>Place Door</span>
                      </button>

                      <button
                        onClick={() => { setToolMode('addSecretDoor'); setShowObjectsMenu(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                          toolMode === 'addSecretDoor' ? 'bg-red-500/20 text-red-300 font-bold' : 'hover:bg-white/5 text-red-400'
                        }`}
                      >
                        <Lock size={12} className="text-red-400" />
                        <span>Secret Door (DM Only)</span>
                      </button>

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

                      <div className="h-px bg-white/5 my-0.5" />

                      <button
                        onClick={() => { setToolMode('eraseObstacle'); setShowObjectsMenu(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
                          toolMode === 'eraseObstacle' ? 'bg-red-500/20 text-red-300' : 'hover:bg-white/5 text-red-300'
                        }`}
                      >
                        <Eraser size={12} className="text-red-400" />
                        <span>Drag-to-Erase</span>
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
                          snapToGrid ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/5 text-slate-400'
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
                      className="absolute top-11 right-0 z-50 p-3 rounded-2xl bg-[#121824] border border-white/15 shadow-2xl flex flex-col gap-3 w-84 animate-in fade-in max-h-[85vh] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                        <span className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1.5">
                          <UserPlus size={12} /> Deploy Token
                        </span>
                        <button onClick={() => setShowAddTokenMenu(false)} className="text-slate-500 hover:text-white">
                          <X size={12} />
                        </button>
                      </div>

                      {/* Saved Party Roster */}
                      {savedTokens.length > 0 && (
                        <div className="flex flex-col gap-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-amber-400 uppercase flex items-center gap-1">
                              <Users size={11} /> Saved Party Roster
                            </span>
                            <span className="text-[9px] text-slate-500 italic">R-Click to delete</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            {savedTokens.map(template => (
                              <div
                                key={template.id}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setRosterContextMenu({ x: e.clientX, y: e.clientY, template });
                                }}
                                onClick={() => handleDeploySavedTemplate(template)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/25 border border-white/5 hover:border-amber-500/40 flex items-center justify-between text-left transition-colors cursor-pointer group"
                                title="Left-click to spawn, Right-click to remove"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {template.imageUrl ? (
                                    <img src={template.imageUrl} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0" style={{ backgroundColor: template.color }}>
                                      {template.name.substring(0, 2)}
                                    </span>
                                  )}
                                  <span className="font-bold text-[11px] text-slate-200 truncate group-hover:text-amber-300">
                                    {template.name}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTokenFromVault(template.id);
                                  }}
                                  className="text-slate-500 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete from roster"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Token Creator */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {savedTokens.length > 0 ? 'Or Custom Creature / Monster:' : 'Create Creature:'}
                        </span>

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
                        // Left-Click: ONLY toggle the quick inline HP adjustment drawer
                        setExpandedCombatantId(isExpanded ? null : c.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Right-Click: Open the FULL Token Controls drawer on the right side
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

                      {/* INLINE HP ADJUSTMENT CONTROLS (OPENS ON L-CLICK ONLY) */}
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
      {selectedToken && isTactical && (
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
            <button onClick={() => setSelectedTokenId(null)} className="text-slate-500 hover:text-white">
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
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
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
        {/* FLOATING ZOOM CONTROLS (MOVED TO TOP RIGHT UNDER HEADER) */}
        {activeMap && (
          <div className="absolute top-4 right-4 z-40 flex items-center gap-1 bg-[#121824]/90 backdrop-blur-md border border-white/10 p-1 rounded-2xl shadow-2xl">
            <button
              onClick={() => setZoomScale(prev => Math.max(0.6, prev - 0.15))}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={() => setZoomScale(1)}
              className="px-2 py-1 rounded-xl hover:bg-white/10 text-[10px] font-mono font-bold text-amber-300 transition-colors"
              title="Reset Zoom (100%)"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              onClick={() => setZoomScale(prev => Math.min(2.5, prev + 0.15))}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        )}

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
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
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
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
                <circle cx={`${activeRuler.startX}%`} cy={`${activeRuler.startY}%`} r="5" fill="#f59e0b" />
                <circle cx={`${activeRuler.endX}%`} cy={`${activeRuler.endY}%`} r="5" fill="#f59e0b" />
                <text
                  x={`${(activeRuler.startX + activeRuler.endX) / 2}%`}
                  y={`${(activeRuler.startY + activeRuler.endY) / 2}%`}
                  fill="#ffffff"
                  stroke="#000000"
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
                      left: `${obs.col * cellW}%`,
                      top: `${obs.row * cellH}%`,
                      width: `${cellW}%`,
                      height: `${cellH}%`
                    }}
                    className="absolute bg-slate-900/90 border border-amber-500/40 z-25 flex items-center justify-center cursor-pointer hover:border-red-400 group"
                    title="Solid Wall (Click or drag eraser to remove)"
                  >
                    <span className="text-[9px] text-amber-400/80 font-bold group-hover:hidden">WALL</span>
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
                      left: `${obs.col * cellW}%`,
                      top: `${obs.row * cellH}%`,
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
                      left: `${obs.col * cellW}%`,
                      top: `${obs.row * cellH}%`,
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
                      left: `${obs.col * cellW}%`,
                      top: `${obs.row * cellH}%`,
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
      </div>

    </div>
  );
};
