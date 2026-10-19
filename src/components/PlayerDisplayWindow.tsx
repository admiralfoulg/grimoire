import React, { useState, useEffect } from 'react';
import { ProjectionService, type ProjectionPayload } from '../services/broadcast';
import { Shield, Swords, UserCheck } from 'lucide-react';

const ChestIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2.5" y="9" width="19" height="12" rx="1.5" fill="#8B4513" stroke="#D4AF37" strokeWidth="1.5"/>
    <path d="M2.5 10C2.5 5.5 6 3 12 3C18 3 21.5 5.5 21.5 10H2.5Z" fill="#A0522D" stroke="#D4AF37" strokeWidth="1.5"/>
    <line x1="7" y1="3.5" x2="7" y2="21" stroke="#D4AF37" strokeWidth="1.5"/>
    <line x1="17" y1="3.5" x2="17" y2="21" stroke="#D4AF37" strokeWidth="1.5"/>
    <line x1="2.5" y1="10" x2="21.5" y2="10" stroke="#222" strokeWidth="1"/>
    <rect x="10.5" y="9" width="3" height="4" rx="0.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.8"/>
  </svg>
);

export const PlayerDisplayWindow: React.FC = () => {
  const [payload, setPayload] = useState<ProjectionPayload>(ProjectionService.getPayload());

  useEffect(() => {
    const unsub = ProjectionService.subscribe(p => setPayload(p));
    return () => unsub();
  }, []);

  const cols = payload.type === 'MAP' && payload.gridCols ? payload.gridCols : 25;
  const rows = payload.type === 'MAP' && payload.gridRows ? payload.gridRows : 30;
  const fog = payload.type === 'MAP' ? payload.fogOfWar : null;
  const lighting = payload.type === 'MAP' ? payload.ambientLighting : 'bright';
  const revealedSet = new Set(fog?.revealedCells || []);
  const combatTracker = payload.type === 'MAP' ? payload.combatTracker : null;

  const getTokenDimensionsStyle = (size: 'medium' | 'large' | 'huge' = 'medium') => {
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    if (size === 'large') return { width: `${cellW * 2}%`, height: `${cellH * 2}%`, fontSize: '11px' };
    if (size === 'huge') return { width: `${cellW * 3}%`, height: `${cellH * 3}%`, fontSize: '13px' };
    return { width: `${cellW * 0.95}%`, height: `${cellH * 0.95}%`, fontSize: '9px' };
  };

  return (
    <div className="w-screen h-screen bg-[#05080e] text-slate-100 flex flex-col items-center justify-center overflow-hidden select-none relative font-sans">
      
      {/* TOP INITIATIVE BANNER */}
      {payload?.type === 'MAP' && combatTracker && combatTracker.combatants.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 shadow-2xl max-w-[92vw] overflow-x-auto">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/20 text-red-300 font-bold text-xs uppercase tracking-wider shrink-0 border border-red-500/30">
            <Swords size={12} />
            <span>R{combatTracker.round}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {combatTracker.combatants.map((c, idx) => {
              const isActive = idx === combatTracker.currentTurnIndex;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all border shrink-0 ${
                    isActive ? 'bg-amber-500 text-black border-amber-300 font-extrabold shadow-lg scale-105' : 'bg-white/5 border-white/5 text-slate-300 font-semibold text-xs'
                  }`}
                >
                  {isActive && <UserCheck size={12} className="text-black" />}
                  <span className="text-xs truncate max-w-[120px]">{c.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-[11px] text-slate-400 z-40">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Grimoire Live Table</span>
      </div>

      {(!payload || payload.type === 'CLEAR') && (
        <div className="flex flex-col items-center gap-4 text-slate-600">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-amber-500/30 shadow-2xl">
            <Shield size={38} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-300 tracking-widest uppercase">Grimoire Player Display</h2>
            <p className="text-xs text-slate-500 mt-1">Waiting for Dungeon Master projection...</p>
          </div>
        </div>
      )}

      {payload?.type === 'MAP' && (
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-black animate-in fade-in duration-200">
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img 
              src={payload.imageUrl} 
              alt={payload.name} 
              style={{
                filter: lighting === 'darkness' ? 'brightness(0.35) contrast(1.2) saturate(0.8)' : lighting === 'dim' ? 'brightness(0.7) contrast(1.1) sepia(0.2)' : 'none'
              }}
              className="max-h-[92vh] max-w-[95vw] w-auto object-contain rounded-xl shadow-2xl transition-[filter] duration-500"
            />

            {/* Projected Obstacles & Props */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible">
              {(payload.obstacles || []).filter(o => !o.isSecret && o.type === 'block').map((obs, i) => {
                if (obs.x1 === undefined || obs.y1 === undefined || obs.x2 === undefined || obs.y2 === undefined) return null;
                return (
                  <rect
                    key={`p-block-${i}`}
                    x={`${Math.min(obs.x1, obs.x2)}%`}
                    y={`${Math.min(obs.y1, obs.y2)}%`}
                    width={`${Math.abs(obs.x2 - obs.x1)}%`}
                    height={`${Math.abs(obs.y2 - obs.y1)}%`}
                    fill="#ef444455"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                );
              })}

              {(payload.obstacles || []).filter(o => !o.isSecret && o.type === 'circle').map((obs, i) => {
                if (obs.cx === undefined || obs.cy === undefined || obs.radius === undefined) return null;
                return (
                  <circle
                    key={`p-circle-${i}`}
                    cx={`${obs.cx}%`}
                    cy={`${obs.cy}%`}
                    r={`${obs.radius}%`}
                    fill="#a855f755"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                  />
                );
              })}

              {(payload.obstacles || []).filter(o => !o.isSecret && (o.type === 'wall' || o.type === 'door' || o.type === 'window')).map((obs, i) => {
                if (obs.x1 === undefined || obs.y1 === undefined || obs.x2 === undefined || obs.y2 === undefined) return null;
                const isDoor = obs.type === 'door';
                const isWindow = obs.type === 'window';
                const strokeColor = isWindow ? '#38bdf8' : isDoor ? (obs.isOpen ? '#10b981' : '#f59e0b') : '#f59e0b';
                return (
                  <line
                    key={`p-obs-${i}`}
                    x1={`${obs.x1}%`}
                    y1={`${obs.y1}%`}
                    x2={`${obs.x2}%`}
                    y2={`${obs.y2}%`}
                    stroke={strokeColor}
                    strokeWidth={isDoor || isWindow ? 5 : 4}
                    strokeLinecap="round"
                    strokeDasharray={isDoor && !obs.isOpen ? '6 4' : isWindow ? '2 2' : undefined}
                  />
                );
              })}
            </svg>

            {/* Projected Tile Props (Chests & Tables) */}
            {(payload.obstacles || []).filter(o => !o.isSecret && (o.type === 'chest' || o.type === 'table')).map((obs, i) => {
              if (obs.col === undefined || obs.row === undefined) return null;
              const cellW = 100 / cols;
              const cellH = 100 / rows;
              return (
                <div
                  key={`p-prop-${i}`}
                  style={{
                    left: `${obs.col * cellW}%`,
                    top: `${obs.row * cellH}%`,
                    width: `${cellW}%`,
                    height: `${cellH}%`
                  }}
                  className="absolute z-25 flex items-center justify-center pointer-events-none"
                >
                  {obs.type === 'chest' ? <ChestIcon size={16} /> : <span className="text-xs">🪑</span>}
                </div>
              );
            })}

            {/* PLAYER FOG OF WAR */}
            {payload.mapType === 'tactical' && fog?.enabled && (
              <div className="absolute inset-0 pointer-events-none z-30">
                {Array.from({ length: rows }).map((_, r) => (
                  <div key={r} className="flex w-full" style={{ height: `${100 / rows}%` }}>
                    {Array.from({ length: cols }).map((_, c) => {
                      const isRevealed = revealedSet.has(`${c},${r}`);
                      if (isRevealed) return <div key={c} style={{ width: `${100 / cols}%` }} />;
                      return <div key={c} style={{ width: `${100 / cols}%` }} className="bg-[#05080e]" />;
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Projected Tokens */}
            {payload.mapType === 'tactical' && (payload.tokens || []).map((token, idx) => {
              const dimensions = getTokenDimensionsStyle(token.size);
              return (
                <div
                  key={idx}
                  style={{ 
                    left: `${token.x}%`, 
                    top: `${token.y}%`,
                    width: dimensions.width,
                    height: dimensions.height,
                    fontSize: dimensions.fontSize,
                    backgroundColor: token.imageUrl ? 'transparent' : (token.color || '#ef4444')
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-2xl flex items-center justify-center z-40 overflow-hidden"
                >
                  {token.imageUrl ? (
                    <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="font-bold text-white uppercase">{token.name.substring(0, 2)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
