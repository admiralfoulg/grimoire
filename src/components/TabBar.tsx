import React, { useState, useEffect, useRef } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import type { GrimoireTab, TabType } from '../store/useGrimoireStore';
import { 
  FileText, 
  Map, 
  MessageSquareCode, 
  FileSpreadsheet, 
  X, 
  Pin, 
  PinOff, 
  Plus, 
  ChevronRight,
  MoreVertical
} from 'lucide-react';

export const TabBar: React.FC = () => {
  const {
    tabs,
    cards,
    maps,
    sessions,
    activeTabId, 
    setActiveTabId, 
    closeTab, 
    reorderTabs, 
    togglePinTab, 
    closeOtherTabs, 
    closeTabsToRight,
    createCard
  } = useGrimoireStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

    const getTabTitle = (tab: GrimoireTab): string => {
    if (tab.type === 'card') {
      const card = cards.find(c => c.id === tab.id);
      return card?.title || (card as any)?.name || (card as any)?.fileName || (tab.title !== 'Untitled Card' ? tab.title : '') || 'Untitled Card';
    }
    if (tab.type === 'map') {
      const map = maps.find(m => m.id === tab.id);
      return map?.name || (map as any)?.title || tab.title || 'Untitled Map';
    }
    if (tab.type === 'session') {
      const session = sessions.find(s => s.id === tab.id);
      return session?.title || (session as any)?.name || tab.title || 'Untitled Session';
    }
    return tab.title || 'Document';
  };

  const getTabIcon = (type: TabType, size = 13) => {
    switch (type) {
      case 'map':

<Map size={size} className="text-blue-400 shrink-0" />
return ;
      case 'session':
        return <MessageSquareCode size={size} className="text-emerald-400 shrink-0" />;
      case 'pdf':
        return <FileText size={size} className="text-red-400 shrink-0" />;
      case 'card':
      default:
        return <FileSpreadsheet size={size} className="text-amber-400 shrink-0" />;
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderTabs(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId
    });
  };

  // If no tabs exist, show an empty strip with a quick + button
  return (
    <div className="h-9 w-full theme-bg-sidebar border-b border-white/5 flex items-center px-1 select-none z-10 shrink-0 relative">
      
      {/* Scrollable / Shrinkable Tab Container */}
      <div className="flex-1 flex items-center h-full gap-0.5 overflow-x-auto no-scrollbar">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;
          const isDragging = draggedIndex === idx;
          const isOver = dragOverIndex === idx;

          if (tab.pinned) {
            return (
              <div
                key={tab.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onContextMenu={(e) => handleContextMenu(e, tab.id)}
                onClick={() => setActiveTabId(tab.id)}
                onAuxClick={(e) => {
                  if (e.button === 1) { // Middle click
                    e.preventDefault();
                    closeTab(tab.id);
                  }
                }}
                className={`h-7 px-2.5 rounded-md flex items-center justify-center cursor-pointer transition-all border shrink-0 ${
                  isActive
                    ? 'theme-bg-surface text-slate-100 border-white/10 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
                } ${isOver ? 'border-amber-400/50 bg-amber-500/10' : ''} ${isDragging ? 'opacity-40' : ''}`}
                title={`${getTabTitle(tab)} (Pinned)`}
              >
                {getTabIcon(tab.type, 13)}
                <Pin size={10} className="ml-1 text-amber-400 opacity-60" />
              </div>
            );
          }

          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              onClick={() => setActiveTabId(tab.id)}
              onAuxClick={(e) => {
                if (e.button === 1) { // Middle click closes tab
                  e.preventDefault();
                  closeTab(tab.id);
                }
              }}
              className={`group h-7 flex-1 min-w-[36px] max-w-[190px] px-2.5 rounded-md flex items-center justify-between cursor-pointer transition-all border text-xs ${
                isActive
                  ? 'theme-bg-surface text-slate-100 border-white/10 shadow-sm font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
              } ${isOver ? 'border-amber-400/50 bg-amber-500/10' : ''} ${isDragging ? 'opacity-40' : ''}`}
              title={getTabTitle(tab)}
            >
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                {getTabIcon(tab.type)}
                <span className="truncate text-[11px] leading-tight">{tab.title}</span>
              </div>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="w-4 h-4 rounded hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                title="Close Tab (Middle-click)"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Add Tab Button */}
      <button
        onClick={() => createCard('New Note')}
        className="h-6 w-6 ml-1 rounded hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors shrink-0"
        title="Open New Card Tab"
      >
        <Plus size={13} />
      </button>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y + 4, left: contextMenu.x }}
          className="fixed w-44 bg-[#121824] border border-white/15 rounded-xl shadow-2xl p-1 z-50 text-xs text-slate-200 flex flex-col gap-0.5 animate-in fade-in"
        >
          <button
            onClick={() => {
              closeTab(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
          >
            <span>Close Tab</span>
            <span className="text-[10px] text-slate-500">M-Click</span>
          </button>
          
          <button
            onClick={() => {
              closeOtherTabs(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
          >
            <span>Close Other Tabs</span>
          </button>

          <button
            onClick={() => {
              closeTabsToRight(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
          >
            <span>Close Tabs to the Right</span>
          </button>

          <div className="h-px bg-white/10 my-0.5" />

          <button
            onClick={() => {
              togglePinTab(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
          >
            {tabs.find(t => t.id === contextMenu.tabId)?.pinned ? (
              <>
                <PinOff size={12} className="text-amber-400" />
                <span>Unpin Tab</span>
              </>
            ) : (
              <>
                <Pin size={12} className="text-amber-400" />
                <span>Pin Tab</span>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
