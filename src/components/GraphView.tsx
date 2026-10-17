import React, { useMemo, useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MarkerType,
  type Connection,
  type Edge,
  type Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { 
  Network, 
  Plus, 
  X, 
  ExternalLink, 
  Filter
} from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  character: '#f59e0b',
  location: '#3b82f6',
  faction: '#ef4444',
  item: '#10b981',
  lore: '#a855f7'
};

const RELATION_COLORS: Record<string, string> = {
  'allied with': '#10b981',
  'ally': '#10b981',
  'enemy of': '#ef4444',
  'enemy': '#ef4444',
  'child of': '#a855f7',
  'parent of': '#a855f7',
  'ruler of': '#f59e0b',
  'wields': '#3b82f6',
  'member of': '#6366f1'
};

export const GraphView: React.FC = () => {
  const { cards, relationships, createRelationship, setActiveCard } = useGrimoireStore();
  
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    character: true,
    location: true,
    faction: true,
    item: true,
    lore: true
  });

  const [inspectedCardId, setInspectedCardId] = useState<string | null>(null);
  const inspectedCard = cards.find(c => c.id === inspectedCardId);

  const [isLinking, setIsLinking] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relLabel, setRelLabel] = useState('Allied with');

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const initialNodes: Node[] = useMemo(() => {
    const visibleCards = cards.filter(c => activeFilters[c.type]);
    const total = visibleCards.length;
    const radius = Math.max(180, total * 45);

    return visibleCards.map((card, idx) => {
      const angle = (idx / total) * 2 * Math.PI;
      const x = 450 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      const color = TYPE_COLORS[card.type] || '#f59e0b';

      return {
        id: card.id,
        position: { x, y },
        data: { 
          label: (
            <div className="flex items-center gap-2 px-1">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} 
              />
              <span className="font-semibold text-slate-100 text-xs truncate max-w-[120px]">
                {card.name}
              </span>
            </div>
          )
        },
        style: {
          background: '#151922',
          border: `1.5px solid ${color}50`,
          borderRadius: '12px',
          color: '#f8fafc',
          padding: '8px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }
      };
    });
  }, [cards, activeFilters]);

  const initialEdges: Edge[] = useMemo(() => {
    const nodeIds = new Set(initialNodes.map(n => n.id));

    return relationships
      .filter(rel => nodeIds.has(rel.sourceCardId) && nodeIds.has(rel.targetCardId))
      .map(rel => {
        const lowerType = (rel.relationType || '').toLowerCase();
        const strokeColor = RELATION_COLORS[lowerType] || '#c8963e';

        return {
          id: rel.id,
          source: rel.sourceCardId,
          target: rel.targetCardId,
          label: rel.relationType,
          animated: lowerType.includes('allied') || lowerType.includes('magic'),
          style: { stroke: strokeColor, strokeWidth: 2 },
          labelStyle: { fill: strokeColor, fontWeight: 600, fontSize: 10 },
          labelBgStyle: { fill: '#0e121a', fillOpacity: 0.85, rx: 4, ry: 4 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 14,
            height: 14
          }
        };
      });
  }, [relationships, initialNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      createRelationship(params.source, params.target, 'Connected to');
      setEdges((eds) => addEdge(params, eds));
    }
  }, [createRelationship, setEdges]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setInspectedCardId(node.id);
  };

  const handleManualLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;
    createRelationship(sourceId, targetId, relLabel);
    setIsLinking(false);
    setSourceId('');
    setTargetId('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d13] relative overflow-hidden select-none">
      <div className="h-12 border-b border-white/5 bg-[#121620]/90 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Network size={14} /> Nexus Canvas
          </span>
          <span className="text-xs text-slate-500">
            ({cards.length} Nodes, {relationships.length} Connections)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-slate-500 mr-1" />
          {Object.entries(activeFilters).map(([type, isActive]) => {
            const color = TYPE_COLORS[type];
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                  isActive 
                    ? 'border-white/20 text-white' 
                    : 'bg-transparent border-white/5 text-slate-600 opacity-50'
                }`}
                style={{ backgroundColor: isActive ? `${color}20` : 'transparent', borderColor: isActive ? `${color}60` : undefined }}
              >
                {type}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsLinking(true)}
          className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors"
        >
          <Plus size={13} /> Add Link
        </button>
      </div>

      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background color="#1f2937" gap={24} size={1} />
          <Controls className="!bg-[#151922] !border-white/10 !fill-slate-300" />
          <MiniMap 
            nodeColor={(n) => {
              const card = cards.find(c => c.id === n.id);
              return card ? (TYPE_COLORS[card.type] || '#f59e0b') : '#f59e0b';
            }}
            maskColor="rgba(10, 13, 19, 0.85)"
            className="!bg-[#151922] !border-white/10 !rounded-xl overflow-hidden" 
          />
        </ReactFlow>

        {inspectedCard && (
          <div className="absolute top-4 right-4 w-80 bg-[#161c26]/95 border border-white/10 rounded-2xl p-5 shadow-2xl z-40 backdrop-blur-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span 
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border"
                style={{ 
                  color: TYPE_COLORS[inspectedCard.type], 
                  backgroundColor: `${TYPE_COLORS[inspectedCard.type]}15`,
                  borderColor: `${TYPE_COLORS[inspectedCard.type]}30` 
                }}
              >
                {inspectedCard.type}
              </span>
              <button onClick={() => setInspectedCardId(null)} className="text-slate-500 hover:text-white p-1">
                <X size={14} />
              </button>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">{inspectedCard.name}</h3>
                {inspectedCard.aliases && inspectedCard.aliases.length > 0 && (
                  <span className="text-[11px] text-slate-500">Aliases: {inspectedCard.aliases.join(', ')}</span>
                )}
              </div>
              <button
                onClick={() => setActiveCard(inspectedCard.id)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Open <ExternalLink size={11} />
              </button>
            </div>

            {inspectedCard.properties && Object.keys(inspectedCard.properties).length > 0 && (
              <div className="flex flex-col gap-1 py-2 border-y border-white/5 text-xs">
                {Object.entries(inspectedCard.properties).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px]">
                    <span className="text-slate-500 capitalize">{k}:</span>
                    <span className="text-slate-300 font-medium truncate max-w-[140px]">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Connected Nodes
              </span>
              <div className="max-h-32 overflow-y-auto flex flex-col gap-1">
                {relationships
                  .filter(r => r.sourceCardId === inspectedCard.id || r.targetCardId === inspectedCard.id)
                  .map(r => {
                    const isSource = r.sourceCardId === inspectedCard.id;
                    const otherId = isSource ? r.targetCardId : r.sourceCardId;
                    const other = cards.find(c => c.id === otherId);
                    return (
                      <div key={r.id} className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 text-xs">
                        <span className="text-[11px] text-slate-400">{r.relationType}:</span>
                        <span className="font-semibold text-amber-400 truncate max-w-[120px]">
                          {other?.name || 'Unknown'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {isLinking && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-88 bg-[#161c26]/95 border border-white/10 rounded-2xl p-5 shadow-2xl z-50 backdrop-blur-2xl">
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Connect Two Entities</h3>
            <form onSubmit={handleManualLinkSubmit} className="flex flex-col gap-2.5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Source Node</label>
                <select
                  value={sourceId}
                  onChange={e => setSourceId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
                  required
                >
                  <option value="">-- Choose Origin Card --</option>
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Allied with, Ruler of, Child of..."
                  value={relLabel}
                  onChange={e => setRelLabel(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Node</label>
                <select
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
                  required
                >
                  <option value="">-- Choose Target Card --</option>
                  {cards.filter(c => c.id !== sourceId).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsLinking(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg"
                >
                  Link
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
