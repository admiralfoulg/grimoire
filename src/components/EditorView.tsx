import React, { useState } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { ProjectionService } from '../services/broadcast';
import { StatblockView } from './StatblockView';
import { 
  Eye, 
  Trash2, 
  Upload, 
  ChevronDown, 
  ChevronRight,
  Cast,
  GripVertical,
  Maximize2,
  Minimize2,
  Plus,
  SlidersHorizontal
} from 'lucide-react';

export const EditorView: React.FC = () => {
  const { cards, activeCardId, updateCard, deleteCard } = useGrimoireStore();
  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];
  const [previewMode, setPreviewMode] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isAttributesCollapsed, setIsAttributesCollapsed] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!activeCard) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
        No card selected. Select or create one from the left sidebar.
      </div>
    );
  }

  // Baseline VVD modular block definitions with box formatting
  const defaultSections = [
    { id: 'sec-who', title: 'Who they are', content: '', placeholder: 'Two or three lines you could read aloud to introduce them.', width: 'half' as const, blockType: 'text' as const },
    { id: 'sec-afraid', title: 'Afraid of', content: '', placeholder: 'They would do almost anything to avoid...', width: 'half' as const, blockType: 'text' as const },
    { id: 'sec-wants', title: 'Wants', content: '', placeholder: 'Right now, more than anything, they want...', width: 'half' as const, blockType: 'text' as const }
  ];

  const currentBlocks = activeCard.blocks && activeCard.blocks.length > 0 
    ? activeCard.blocks 
    : defaultSections;

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBlockWidth = (id: string) => {
    const next = currentBlocks.map(b => {
      if (b.id !== id) return b;
      const nextWidth: 'half' | 'full' = b.width === 'full' ? 'half' : 'full';
      return { ...b, width: nextWidth };
    });
    updateCard({ ...activeCard, blocks: next });
  };

  const deleteBlock = (id: string) => {
    const next = currentBlocks.filter(b => b.id !== id);
    updateCard({ ...activeCard, blocks: next });
  };

  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const reordered = [...currentBlocks];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    setDraggedIndex(targetIdx);
    updateCard({ ...activeCard, blocks: reordered });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateCard({
        ...activeCard,
        properties: {
          ...activeCard.properties,
          portraitUrl: reader.result as string
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleProjectArt = () => {
    if (activeCard.properties?.portraitUrl) {
      ProjectionService.project({
        type: 'IMAGE',
        title: activeCard.name,
        imageUrl: activeCard.properties.portraitUrl,
        subtitle: `${activeCard.type.toUpperCase()} • ${activeCard.properties?.alignment || ''}`
      });
    } else {
      alert("Please upload a portrait/image first before projecting to player screen.");
    }
  };

  const updateProperty = (key: string, value: string) => {
    updateCard({
      ...activeCard,
      properties: {
        ...activeCard.properties,
        [key]: value
      }
    });
  };

  const updateBlockContent = (id: string, text: string) => {
    const next = currentBlocks.map(b => b.id === id ? { ...b, content: text } : b);
    updateCard({ ...activeCard, blocks: next });
  };

  const updateBlockTitle = (id: string, title: string) => {
    const next = currentBlocks.map(b => b.id === id ? { ...b, title } : b);
    updateCard({ ...activeCard, blocks: next });
  };

  const addCustomSection = () => {
    const newBlock = {
      id: crypto.randomUUID(),
      title: 'New Section',
      content: '',
      width: 'half' as const,
      blockType: 'text' as const
    };
    updateCard({ ...activeCard, blocks: [...currentBlocks, newBlock] });
  };

  const addStatblock = () => {
    const newBlock = {
      id: crypto.randomUUID(),
      title: 'Combat Statblock',
      content: '',
      width: 'full' as const,
      blockType: 'statblock' as const,
      statblock: {
        armorClass: 14,
        hitPoints: 28,
        hitDice: '4d8',
        speed: '30 ft',
        proficiencyBonus: 2,
        abilities: { str: 10, dex: 14, con: 12, int: 16, wis: 12, cha: 10 },
        actions: [
          { id: 'act-1', name: 'Arcane Bolt', type: 'spell' as const, toHit: 5, damageDice: '1d10+3', description: 'Force damage at 60ft.' }
        ]
      }
    };
    updateCard({ ...activeCard, blocks: [...currentBlocks, newBlock] });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d121a] text-slate-200 overflow-hidden font-sans select-none">
      
      {/* Top Sub-Bar */}
      <div className="h-9 px-6 border-b border-white/5 bg-[#101622]/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span>Folder:</span>
          <span className="text-slate-200 font-medium">Root (Unfiled)</span>
          <ChevronDown size={11} className="text-slate-500" />
        </div>

        <div className="flex items-center gap-3">
          {activeCard.properties?.portraitUrl && (
            <button
              onClick={handleProjectArt}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-semibold transition-colors"
              title="Cast to Player Screen"
            >
              <Cast size={11} />
              <span>Project</span>
            </button>
          )}

          <button 
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors"
          >
            <Eye size={12} />
            <span>Preview</span>
          </button>
          {/* Top-right delete removed to prevent accidental deletion */}
        </div>
      </div>

      {/* Main Sheet Workspace */}
      <div className="flex-1 overflow-y-auto px-12 py-8 max-w-5xl mx-auto w-full">
        
        {/* Title & Portrait Row */}
        <div className="flex items-start justify-between gap-8 mb-6">
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Title & Archetype Pill */}
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={activeCard.name}
                onChange={e => updateCard({ ...activeCard, name: e.target.value })}
                className="text-2xl font-bold text-white bg-transparent outline-none hover:border-b hover:border-white/20 focus:border-amber-500 pb-0.5 flex-1"
                placeholder="Character Name..."
              />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold">
                <span>👤</span>
                <span className="capitalize">{activeCard.type}</span>
                <ChevronDown size={11} className="text-purple-400" />
              </div>
            </div>

            {/* Aliases */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-amber-400 font-semibold text-[11px]">🏷️ Aliases</span>
              <span>+ Add</span>
            </div>

            {/* Collapsible Attributes Header */}
            <div className="flex flex-col gap-2 pt-2">
              <div 
                onClick={() => setIsAttributesCollapsed(!isAttributesCollapsed)}
                className="flex items-center justify-between cursor-pointer group text-slate-400 hover:text-slate-200 select-none pb-1 border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  {isAttributesCollapsed ? <ChevronRight size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-300">
                    Attributes & Background
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 group-hover:text-slate-400">
                  {isAttributesCollapsed ? 'Click to expand' : 'Click to collapse'}
                </span>
              </div>

              {/* 2-Column Metadata Attribute Grid */}
              {!isAttributesCollapsed && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 pt-1 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Alignment</span>
                    <input
                      type="text"
                      placeholder="e.g. Neutral Good"
                      value={activeCard.properties?.alignment || ''}
                      onChange={e => updateProperty('alignment', e.target.value)}
                      className="bg-transparent text-right text-slate-200 outline-none placeholder:text-slate-600 focus:text-amber-300 w-36"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Challenge</span>
                    <input
                      type="text"
                      placeholder="e.g. CR 12"
                      value={activeCard.properties?.challenge || ''}
                      onChange={e => updateProperty('challenge', e.target.value)}
                      className="bg-transparent text-right text-slate-200 outline-none placeholder:text-slate-600 focus:text-amber-300 w-36"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Home</span>
                    <input
                      type="text"
                      placeholder="e.g. Grand Capital"
                      value={activeCard.properties?.home || ''}
                      onChange={e => updateProperty('home', e.target.value)}
                      className="bg-transparent text-right text-slate-200 outline-none placeholder:text-slate-600 focus:text-amber-300 w-36"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Allegiance</span>
                    <input
                      type="text"
                      placeholder="e.g. High Council"
                      value={activeCard.properties?.allegiance || ''}
                      onChange={e => updateProperty('allegiance', e.target.value)}
                      className="bg-transparent text-right text-slate-200 outline-none placeholder:text-slate-600 focus:text-amber-300 w-36"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Role in story</span>
                    <input
                      type="text"
                      placeholder="e.g. Court Wizard"
                      value={activeCard.properties?.role || ''}
                      onChange={e => updateProperty('role', e.target.value)}
                      className="bg-transparent text-right text-slate-200 outline-none placeholder:text-slate-600 focus:text-amber-300 w-36"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Age</span>
                    <input
                      type="text"
                      placeholder="e.g. 142 years"
                      value={activeCard.properties?.age || ''}
                      onChange={e => updateProperty('age', e.target.value)}
                      className="bg-transparent text-right text-slate-200 outline-none placeholder:text-slate-600 focus:text-amber-300 w-36"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Status</span>
                    <input
                      type="text"
                      placeholder="e.g. Active"
                      value={activeCard.properties?.status || ''}
                      onChange={e => updateProperty('status', e.target.value)}
                      className="bg-transparent text-right text-slate-200 outline-none placeholder:text-slate-600 focus:text-amber-300 w-36"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Portrait Art Card */}
          <div className="w-56 aspect-[3/4] rounded-2xl bg-[#141b25]/80 border border-white/5 overflow-hidden shrink-0 relative group flex flex-col items-center justify-center">
            {activeCard.properties?.portraitUrl ? (
              <>
                <img 
                  src={activeCard.properties.portraitUrl} 
                  alt={activeCard.name}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  <button
                    onClick={handleProjectArt}
                    className="px-3 py-1.5 rounded-lg bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg"
                  >
                    <Cast size={12} /> Project Art
                  </button>
                  <label className="text-[10px] text-slate-300 hover:text-white cursor-pointer underline">
                    Change Picture
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </>
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-300 p-4 text-center">
                <Upload size={20} className="opacity-60" />
                <span className="text-xs font-semibold">Click to Upload</span>
                <span className="text-[10px] text-slate-600">or hover for URL</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </div>

        {/* Modular Prompt Sections Grid ("Who they are", "Afraid of", "Wants", Statblocks) */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          {currentBlocks.map((block, idx) => {
            const isCollapsed = Boolean(collapsedSections[block.id]);
            const isFullWidth = block.width === 'full';

            if (block.blockType === 'statblock') {
              return (
                <div 
                  key={block.id} 
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className="col-span-2 p-4 rounded-2xl bg-[#141b25] border border-white/5 relative group transition-all"
                >
                  {/* Collapsible Header for Statblock */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400" title="Drag to reorder">
                        <GripVertical size={14} />
                      </div>
                      <button 
                        onClick={() => toggleSection(block.id)}
                        className="text-slate-500 hover:text-slate-200 p-0.5"
                        title={isCollapsed ? 'Expand Statblock' : 'Collapse Statblock'}
                      >
                        {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <span className="font-bold text-xs text-slate-200">🛡️ {block.title}</span>
                      {isCollapsed && (
                        <span className="text-[10px] text-slate-500 font-mono ml-2">
                          (AC {block.statblock?.armorClass ?? 14} • HP {block.statblock?.hitPoints ?? 28})
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => deleteBlock(block.id)}
                      className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove Statblock"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {!isCollapsed && (
                    <StatblockView
                      data={block.statblock!}
                      previewMode={previewMode}
                      onChange={updated => {
                        const updatedBlocks = currentBlocks.map(b => b.id === block.id ? { ...b, statblock: updated } : b);
                        updateCard({ ...activeCard, blocks: updatedBlocks });
                      }}
                    />
                  )}
                </div>
              );
            }

            return (
              <div 
                key={block.id} 
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`p-4 rounded-2xl bg-[#141b25] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group ${
                  isFullWidth ? 'col-span-2' : 'col-span-1'
                } ${draggedIndex === idx ? 'opacity-40 border-amber-500/50' : ''}`}
              >
                {/* Block Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400" title="Drag to reorder">
                      <GripVertical size={14} />
                    </div>
                    <button 
                      onClick={() => toggleSection(block.id)}
                      className="text-slate-500 hover:text-slate-200 p-0.5"
                    >
                      {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </button>
                    <input
                      type="text"
                      value={block.title}
                      onChange={e => updateBlockTitle(block.id, e.target.value)}
                      className="font-bold text-xs bg-transparent outline-none text-slate-200 hover:text-amber-400 focus:text-amber-400"
                    />
                  </div>

                  {/* Block Controls: Shrink/Expand & Delete */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleBlockWidth(block.id)}
                      className="p-1 text-slate-500 hover:text-amber-400 rounded hover:bg-white/5 transition-colors"
                      title={isFullWidth ? 'Shrink to half-width' : 'Expand to full-width'}
                    >
                      {isFullWidth ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    </button>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                      title="Delete block"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Block Textarea Body */}
                {!isCollapsed && (
                  <textarea
                    rows={isFullWidth ? 4 : 3}
                    value={block.content}
                    onChange={e => updateBlockContent(block.id, e.target.value)}
                    placeholder={block.placeholder || 'Type details here...'}
                    className="w-full bg-black/25 border border-white/5 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 outline-none resize-none leading-relaxed focus:border-amber-500/30 transition-colors"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions: Add Section / Add Statblock */}
        <div className="flex items-center gap-6 pt-10 text-xs text-slate-500">
          <button 
            onClick={addCustomSection}
            className="hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <Plus size={13} />
            <span>Add section</span>
          </button>
          
          <button 
            onClick={addStatblock}
            className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
          >
            <span>🛡️</span>
            <span>Add 5e/Daggerheart Statblock</span>
          </button>
        </div>

      </div>

    </div>
  );
};

