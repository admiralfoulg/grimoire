import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { 
  Search, 
  BookOpen, 
  Map as MapIcon, 
  Network, 
  User, 
  MapPin, 
  Shield, 
  Gem, 
  Scroll, 
  ArrowRight,
  Command
} from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  character: <User size={13} className="text-amber-400" />,
  location: <MapPin size={13} className="text-blue-400" />,
  faction: <Shield size={13} className="text-red-400" />,
  item: <Gem size={13} className="text-emerald-400" />,
  lore: <Scroll size={13} className="text-purple-400" />
};

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { cards, maps, setActiveCard, setActiveMap, setActiveView } = useGrimoireStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: string;
      icon: React.ReactNode;
      action: () => void;
    }> = [];

    // System view shortcuts
    if (!q || 'codex documents cards'.includes(q)) {
      results.push({
        id: 'view-editor',
        title: 'Switch to Codex',
        subtitle: 'Entity cards and documents',
        type: 'View',
        icon: <BookOpen size={14} className="text-amber-400" />,
        action: () => { setActiveView('editor'); onClose(); }
      });
    }
    if (!q || 'atlas maps world'.includes(q)) {
      results.push({
        id: 'view-map',
        title: 'Switch to Atlas',
        subtitle: 'Interactive image maps and pins',
        type: 'View',
        icon: <MapIcon size={14} className="text-blue-400" />,
        action: () => { setActiveView('map'); onClose(); }
      });
    }
    if (!q || 'nexus graph relationships connections'.includes(q)) {
      results.push({
        id: 'view-graph',
        title: 'Switch to Nexus',
        subtitle: 'Relationship connection web',
        type: 'View',
        icon: <Network size={14} className="text-purple-400" />,
        action: () => { setActiveView('graph'); onClose(); }
      });
    }

    // Entity Cards
    cards.forEach(card => {
      const matchName = card.name.toLowerCase().includes(q);
      const matchAlias = (card.aliases || []).some(a => a.toLowerCase().includes(q));
      const matchType = card.type.toLowerCase().includes(q);

      if (!q || matchName || matchAlias || matchType) {
        results.push({
          id: `card-${card.id}`,
          title: card.name,
          subtitle: `${card.type.toUpperCase()} ${card.aliases?.length ? `• (${card.aliases.join(', ')})` : ''}`,
          type: card.type,
          icon: TYPE_ICONS[card.type] || <BookOpen size={14} />,
          action: () => {
            setActiveCard(card.id);
            setActiveView('editor');
            onClose();
          }
        });
      }
    });

    // Maps
    maps.forEach(map => {
      if (!q || map.name.toLowerCase().includes(q)) {
        results.push({
          id: `map-${map.id}`,
          title: map.name,
          subtitle: `Atlas Map • ${map.pins?.length || 0} pins`,
          type: 'Map',
          icon: <MapIcon size={14} className="text-amber-400" />,
          action: () => {
            setActiveMap(map.id);
            setActiveView('map');
            onClose();
          }
        });
      }
    });

    return results.slice(0, 10);
  }, [query, cards, maps, setActiveCard, setActiveMap, setActiveView, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        searchResults[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-start justify-center pt-24 select-none"
      onClick={onClose}
    >
      <div 
        className="w-[560px] bg-[#12151c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-[#151922]">
          <Search size={16} className="text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a card name, alias, map, or command..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 font-sans"
          />
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {searchResults.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching cards, maps, or commands found for "{query}".
            </div>
          ) : (
            searchResults.map((item, index) => (
              <button
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                  selectedIndex === index
                    ? 'bg-amber-500/15 text-slate-100 border border-amber-500/30'
                    : 'text-slate-400 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate text-slate-100">{item.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                    {item.type}
                  </span>
                  {selectedIndex === index && (
                    <ArrowRight size={13} className="text-amber-400" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/5 bg-[#0e1015] flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">ENTER</kbd> Select</span>
          </div>
          <span className="flex items-center gap-1 font-mono">
            <Command size={10} /> Grimoire Spotlight
          </span>
        </div>
      </div>
    </div>
  );
};
