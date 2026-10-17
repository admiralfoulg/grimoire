import React, { useState, useEffect } from 'react';
import { ProjectionService, type ProjectionPayload } from '../services/broadcast';
import { Shield, Sparkles } from 'lucide-react';

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

  const getTokenDimensionsStyle = (size: 'medium' | 'large' | 'huge' = 'medium') => {
    const cellW = 100 / cols;
    const cellH = 100 / rows;

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

  const renderPlayerAoEs = () => {
    if (payload.type !== 'MAP') return null;

    return (
      <svg 
        viewBox={`0 0 ${cols} ${rows}`} 
        className="absolute inset-0 w-full h-full pointer-events-none z-35 overflow-visible"
        preserveAspectRatio="none"
      >
        {(payload.tokens || []).map((token, idx) => {
          const aoe = token.aoe;
          if (!aoe || aoe.shape === 'none') return null;

          const centerCellX = (token.x / 100) * cols;
          const centerCellY = (token.y / 100) * rows;
          const color = aoe.color || '#ef4444';
          const radiusCells = aoe.radiusFt / 5;
          const angleRad = ((aoe.angleDeg || 0) * Math.PI) / 180;

          if (aoe.shape === 'circle') {
            return (
              <circle
                key={`pl-aoe-${idx}`}
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
                key={`pl-aoe-${idx}`}
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
                key={`pl-aoe-${idx}`}
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
    <div className="w-screen h-screen bg-[#05080e] text-slate-100 flex flex-col items-center justify-center overflow-hidden select-none relative font-sans">
      
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.03)_0%,_transparent_75%)]" />

      {/* Live Table Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-[11px] text-slate-400 z-50">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Grimoire Live Table</span>
      </div>

      {(!payload || payload.type === 'CLEAR') && (
        <div className="flex flex-col items-center gap-4 text-slate-600 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-amber-500/30 shadow-2xl">
            <Shield size={38} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-300 tracking-widest uppercase">Grimoire Player Display</h2>
            <p className="text-xs text-slate-500 mt-1">Waiting for the Dungeon Master to project a scene, map, or portrait...</p>
          </div>
        </div>
      )}

      {payload?.type === 'IMAGE' && (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-5xl max-h-[88vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/60 flex flex-col items-center backdrop-blur-md">
            <div className="flex-1 flex items-center justify-center overflow-hidden p-2">
              <img 
                src={payload.imageUrl} 
                alt={payload.title} 
                className="max-h-[76vh] w-auto max-w-full object-contain rounded-2xl shadow-xl"
              />
            </div>
            <div className="w-full px-6 py-4 bg-[#0d121a]/95 border-t border-white/5 text-center">
              <h3 className="text-lg font-bold text-amber-400 tracking-wide">{payload.title}</h3>
              {payload.subtitle && (
                <p className="text-xs text-slate-400 mt-0.5 tracking-wider uppercase font-semibold">
                  {payload.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {payload?.type === 'MAP' && (
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-black animate-in fade-in duration-200">
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img 
              src={payload.imageUrl} 
              alt={payload.name} 
              className="max-h-[92vh] max-w-[95vw] w-auto object-contain rounded-xl shadow-2xl"
            />

            {/* Ambient Lighting Atmospheric Tint */}
            {payload.mapType === 'tactical' && (
              <div 
                className={`absolute inset-0 pointer-events-none transition-colors duration-500 z-10 ${
                  lighting === 'darkness'
                    ? 'bg-indigo-950/60 mix-blend-multiply'
                    : lighting === 'dim'
                    ? 'bg-amber-950/30 mix-blend-multiply'
                    : 'bg-transparent'
                }`}
              />
            )}

            {/* PLAYER FOG OF WAR */}
            {payload.mapType === 'tactical' && fog?.enabled && (
              <div className="absolute inset-0 pointer-events-none z-30">
                {Array.from({ length: rows }).map((_, r) => (
                  <div key={r} className="flex w-full" style={{ height: `${100 / rows}%` }}>
                    {Array.from({ length: cols }).map((_, c) => {
                      const isRevealed = revealedSet.has(`${c},${r}`);
                      if (isRevealed) return <div key={c} style={{ width: `${100 / cols}%` }} />;

                      return (
                        <div 
                          key={c}
                          style={{ width: `${100 / cols}%` }}
                          className="bg-[#05080e]"
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Projected Active Token-Anchored AoE Spell Templates */}
            {payload.mapType === 'tactical' && renderPlayerAoEs()}

            {/* Projected Active Ruler Line */}
            {payload.mapType === 'tactical' && payload.activeRuler && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-45">
                <line
                  x1={`${payload.activeRuler.startX}%`}
                  y1={`${payload.activeRuler.startY}%`}
                  x2={`${payload.activeRuler.endX}%`}
                  y2={`${payload.activeRuler.endY}%`}
                  stroke={payload.activeRuler.color || '#f59e0b'}
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
                <circle cx={`${payload.activeRuler.startX}%`} cy={`${payload.activeRuler.startY}%`} r="5" fill="#f59e0b" />
                <circle cx={`${payload.activeRuler.endX}%`} cy={`${payload.activeRuler.endY}%`} r="5" fill="#f59e0b" />
                <text
                  x={`${(payload.activeRuler.startX + payload.activeRuler.endX) / 2}%`}
                  y={`${(payload.activeRuler.startY + payload.activeRuler.endY) / 2}%`}
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="2"
                  paintOrder="stroke fill"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  dy="-8"
                >
                  {payload.activeRuler.distanceFt} ft
                </text>
              </svg>
            )}

            {/* Projected Public World Pins */}
            {payload.mapType === 'world' && (payload.pins || []).map((pin, idx) => (
              <div
                key={idx}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20"
              >
                <div 
                  style={{ backgroundColor: pin.color || '#f59e0b' }}
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-lg"
                />
                <span className="mt-1 px-1.5 py-0.5 rounded bg-black/85 border border-white/10 text-[9px] font-bold text-slate-100 whitespace-nowrap shadow-md">
                  {pin.label}
                </span>
              </div>
            ))}

            {/* Projected Tokens with Full Circle Portrait Art */}
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
                    backgroundColor: token.imageUrl ? 'transparent' : (token.color || '#ef4444'),
                    borderColor: token.imageUrl ? (token.color || '#f59e0b') : '#ffffff'
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-2xl flex flex-col items-center justify-center pointer-events-none transition-all duration-100 overflow-hidden z-40"
                >
                  {token.imageUrl ? (
                    <img 
                      src={token.imageUrl} 
                      alt={token.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="font-bold text-white uppercase truncate px-1">
                      {token.name.substring(0, 2)}
                    </span>
                  )}

                  <span className="absolute -bottom-5 px-1.5 py-0.5 rounded bg-black/85 border border-white/10 text-[8px] font-bold text-slate-100 whitespace-nowrap shadow-md">
                    {token.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-6 left-6 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center gap-2.5 shadow-2xl z-40">
            <Sparkles size={15} className="text-amber-400" />
            <span className="text-sm font-bold text-slate-200">{payload.name}</span>
            <span className="text-[10px] text-slate-400 uppercase font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
              {payload.mapType === 'tactical' ? `${lighting?.toUpperCase()} LIGHT` : 'World Map'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
