import React, { useState, useEffect } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { DiceService, type RollResult } from '../services/dice';
import type { PrepChecklistItem } from '../services/storage';
import { 
  BookMarked, 
  Plus, 
  Trash2, 
  Pin, 
  ExternalLink, 
  Clock,
  Dices,
  CheckCircle2,
  Circle,
  Swords,
  Map as MapIcon,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Split,
  Sparkles
} from 'lucide-react';

export const SessionView: React.FC = () => {
  const { 
    sessions, 
    activeSessionId, 
    cards,
    maps,
    combats,
    createSession, 
    updateSession, 
    deleteSession, 
    setActiveSession,
    togglePinCardInSession,
    setActiveCard,
    setActiveMap,
    setActiveCombat,
    setActiveView,
    openToSide,
    openTab
  } = useGrimoireStore();

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [cardToPinId, setCardToPinId] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isRecapExpanded, setIsRecapExpanded] = useState(true);
  
  // Auto-log dice rolls into scratchpad toggle
  const [autoLogDice, setAutoLogDice] = useState(true);
  const [recentRolls, setRecentRolls] = useState<RollResult[]>(DiceService.getHistory());

  useEffect(() => {
    const unsubscribe = DiceService.subscribe((roll) => {
      setRecentRolls([...DiceService.getHistory()]);

      if (autoLogDice && currentSession) {
        const diceDetails = roll.dice.map(d => d.result).join(', ');
        const modStr = roll.modifier ? (roll.modifier > 0 ? ` + ${roll.modifier}` : ` - ${Math.abs(roll.modifier)}`) : '';
        const rollLine = `\n[${roll.timestamp}] 🎲 ${roll.label ? `${roll.label}: ` : ''}Rolled **${roll.formula}** ➔ **${roll.total}** (Dice: [${diceDetails}]${modStr})`;
        
        updateSession({
          ...currentSession,
          notes: (currentSession.notes || '') + rollLine
        });
      }
    });

    return () => unsubscribe();
  }, [autoLogDice, currentSession?.id, currentSession?.notes]);

  const insertTimestamp = () => {
    if (!currentSession) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stamped = `${currentSession.notes}\n\n**[${now}]** `;
    updateSession({ ...currentSession, notes: stamped });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createSession(newTitle.trim());
    setNewTitle('');
    setIsCreating(false);
  };

  const handleOpenCard = (cardId: string) => {
    setActiveCard(cardId);
    setActiveView('editor');
  };

  // Checklist Actions
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim() || !currentSession) return;
    const newItem: PrepChecklistItem = {
      id: crypto.randomUUID(),
      text: newChecklistText.trim(),
      done: false
    };
    const updatedList = [...(currentSession.prepChecklist || []), newItem];
    updateSession({ ...currentSession, prepChecklist: updatedList });
    setNewChecklistText('');
  };

  const handleToggleChecklistItem = (itemId: string) => {
    if (!currentSession) return;
    const updatedList = (currentSession.prepChecklist || []).map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    updateSession({ ...currentSession, prepChecklist: updatedList });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    if (!currentSession) return;
    const updatedList = (currentSession.prepChecklist || []).filter(item => item.id !== itemId);
    updateSession({ ...currentSession, prepChecklist: updatedList });
  };

  const handleClearFinishedChecklist = () => {
    if (!currentSession) return;
    const updatedList = (currentSession.prepChecklist || []).filter(item => !item.done);
    updateSession({ ...currentSession, prepChecklist: updatedList });
  };

  // Launch Linked Combat
  const handleLaunchCombat = (combatId: string, toSide: boolean = false) => {
    if (setActiveCombat) setActiveCombat(combatId);
    const target = combats.find(c => c.id === combatId);
    if (toSide && openToSide) {
      openToSide({ id: combatId, title: target?.name || 'Combat Tracker', type: 'combat' });
    } else if (openTab) {
      openTab({ id: combatId, title: target?.name || 'Combat Tracker', type: 'combat' });
    } else {
      setActiveView('combat');
    }
  };

  // Launch Linked Battlemap
  const handleLaunchMap = (mapId: string, toSide: boolean = false) => {
    if (setActiveMap) setActiveMap(mapId);
    const target = maps.find(m => m.id === mapId);
    if (toSide && openToSide) {
      openToSide({ id: mapId, title: target?.name || 'Battlemap', type: 'map' });
    } else if (openTab) {
      openTab({ id: mapId, title: target?.name || 'Battlemap', type: 'map' });
    } else {
      setActiveView('map');
    }
  };

  if (!currentSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0d13] p-6 text-slate-400">
        <BookMarked size={36} className="text-amber-400/40 mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">No Session Logs</h3>
        <p className="text-xs text-slate-500 mb-4">Start recording live notes, scratchpad ideas, and pinned cards for game night.</p>
        <button
          onClick={() => createSession('Session 01')}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-xl"
        >
          Create Session 01
        </button>
      </div>
    );
  }

  const pinnedCards = cards.filter(c => currentSession.pinnedCardIds?.includes(c.id));
  const checklist = currentSession.prepChecklist || [];
  const completedCount = checklist.filter(c => c.done).length;

  return (
    <div className="flex-1 flex h-full bg-[#0a0d13] text-slate-200 overflow-hidden select-none">
      
      {/* Left Column: Session History List */}
      <aside className="w-56 border-r border-white/5 bg-[#0e121a]/90 flex flex-col justify-between shrink-0">
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <BookMarked size={13} className="text-amber-400" /> Sessions
          </span>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white"
            title="New Session"
          >
            <Plus size={14} />
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="p-2.5 bg-white/5 border-b border-white/5 flex flex-col gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Session Title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-[10px] bg-amber-500 text-black font-semibold px-2 py-0.5 rounded"
              >
                Add
              </button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {sessions.map(s => {
            const isActive = s.id === currentSession.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`w-full text-left p-2 rounded-xl flex flex-col transition-all ${
                  isActive
                    ? 'bg-[#18212e] text-white border border-white/10 shadow-md'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate flex-1">{s.title}</span>
                  <span className="text-[9px] font-mono opacity-50">#{s.sessionNumber}</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">{s.date}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Middle Column: Live DM Cockpit & Scratchpad */}
      <main className="flex-1 flex flex-col h-full bg-[#111722]/60 overflow-hidden">
        
        {/* Session Header Toolbar */}
        <div className="h-12 px-6 border-b border-white/5 flex items-center justify-between bg-[#141b25]/50 shrink-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={currentSession.title}
              onChange={e => updateSession({ ...currentSession, title: e.target.value })}
              className="bg-transparent text-sm font-semibold text-slate-100 outline-none w-72 hover:border-b hover:border-white/20"
            />
            <span className="text-xs text-slate-500 font-mono">({currentSession.date})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Log Dice Toggle */}
            <button
              onClick={() => setAutoLogDice(!autoLogDice)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                autoLogDice 
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' 
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
              title="Automatically record dice rolls into scratchpad"
            >
              <Dices size={12} className={autoLogDice ? 'text-amber-400' : 'text-slate-500'} />
              <span>Auto-Log Rolls</span>
            </button>

            <button
              onClick={insertTimestamp}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
              title="Add current time marker"
            >
              <Clock size={12} /> Timestamp
            </button>

            <button
              onClick={() => deleteSession(currentSession.id)}
              className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Session"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Quick Launch Cockpit Bar (Linked Encounters & Battlemaps) */}
        <div className="px-6 py-2.5 border-b border-white/5 bg-[#141b25]/30 flex flex-wrap items-center gap-4 text-xs shrink-0">
          {/* Linked Encounter Launcher */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1">
            <Swords size={13} className="text-red-400 shrink-0" />
            <select
              value={currentSession.linkedCombatId || ''}
              onChange={e => updateSession({ ...currentSession, linkedCombatId: e.target.value || undefined })}
              className="bg-transparent text-slate-300 outline-none text-[11px] max-w-[150px]"
            >
              <option value="" className="bg-[#141b25]">No Linked Encounter</option>
              {combats.map(c => (
                <option key={c.id} value={c.id} className="bg-[#141b25]">{c.name || 'Encounter'}</option>
              ))}
            </select>
            {currentSession.linkedCombatId && (
              <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                <button
                  onClick={() => handleLaunchCombat(currentSession.linkedCombatId!, true)}
                  className="p-1 hover:bg-white/10 rounded text-amber-400"
                  title="Launch Encounter to Side Pane"
                >
                  <Split size={12} />
                </button>
                <button
                  onClick={() => handleLaunchCombat(currentSession.linkedCombatId!, false)}
                  className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
                  title="Open Encounter Full View"
                >
                  <ExternalLink size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Linked Battlemap Launcher */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1">
            <MapIcon size={13} className="text-blue-400 shrink-0" />
            <select
              value={currentSession.linkedMapId || ''}
              onChange={e => updateSession({ ...currentSession, linkedMapId: e.target.value || undefined })}
              className="bg-transparent text-slate-300 outline-none text-[11px] max-w-[150px]"
            >
              <option value="" className="bg-[#141b25]">No Linked Battlemap</option>
              {maps.map(m => (
                <option key={m.id} value={m.id} className="bg-[#141b25]">{m.name || 'Battlemap'}</option>
              ))}
            </select>
            {currentSession.linkedMapId && (
              <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                <button
                  onClick={() => handleLaunchMap(currentSession.linkedMapId!, true)}
                  className="p-1 hover:bg-white/10 rounded text-amber-400"
                  title="Launch Battlemap to Side Pane"
                >
                  <Split size={12} />
                </button>
                <button
                  onClick={() => handleLaunchMap(currentSession.linkedMapId!, false)}
                  className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
                  title="Open Battlemap Full View"
                >
                  <ExternalLink size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle Body: Split into Prep/Recap & Scratchpad */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto gap-4">
          
          {/* Collapsible Previous Session Recap */}
          <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
            <button
              onClick={() => setIsRecapExpanded(!isRecapExpanded)}
              className="w-full px-4 py-2 bg-white/5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={13} className="text-amber-400" />
                <span>Last Session Recap (Read-Aloud Hook)</span>
              </span>
              {isRecapExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {isRecapExpanded && (
              <div className="p-3">
                <textarea
                  rows={3}
                  value={currentSession.recapNotes || ''}
                  onChange={e => updateSession({ ...currentSession, recapNotes: e.target.value })}
                  placeholder="Record what happened at the cliffhanger of the last session to read to your players..."
                  className="w-full bg-black/30 border border-white/5 rounded-lg p-2.5 text-xs text-slate-300 outline-none resize-none leading-relaxed font-sans placeholder:text-slate-600 focus:border-amber-400/40"
                />
              </div>
            )}
          </div>

          {/* Live Scratchpad Editor */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Live Session Scratchpad
            </span>
            <textarea
              value={currentSession.notes}
              onChange={e => updateSession({ ...currentSession, notes: e.target.value })}
              placeholder="Type live notes, player decisions, treasure gained, combat events..."
              className="w-full flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-xs text-slate-200 outline-none resize-none leading-relaxed font-mono placeholder:text-slate-600 focus:border-amber-400/40"
            />
          </div>
        </div>
      </main>

      {/* Right Column: DM Prep Checklist + Pinned Cards + Rolls Stream */}
      <aside className="w-80 border-l border-white/5 bg-[#0e121a]/95 flex flex-col shrink-0 overflow-hidden">
        
        {/* DM Prep Checklist Section */}
        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <CheckSquare size={13} className="text-amber-400" /> DM Prep Checklist ({completedCount}/{checklist.length})
          </span>
          {completedCount > 0 && (
            <button
              onClick={handleClearFinishedChecklist}
              className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors"
            >
              Clear Done
            </button>
          )}
        </div>

        {/* Add Checklist Item Form */}
        <form onSubmit={handleAddChecklistItem} className="p-2.5 border-b border-white/5 flex gap-1.5 bg-black/10">
          <input
            type="text"
            placeholder="Add prep task (e.g. Prep ambush DC)..."
            value={newChecklistText}
            onChange={e => setNewChecklistText(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-amber-400/40"
          />
          <button
            type="submit"
            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs"
          >
            <Plus size={13} />
          </button>
        </form>

        {/* Checklist Items List */}
        <div className="max-h-44 overflow-y-auto p-2 flex flex-col gap-1 border-b border-white/5">
          {checklist.length === 0 ? (
            <div className="text-center text-[11px] text-slate-600 py-3 italic">
              No prep tasks added yet.
            </div>
          ) : (
            checklist.map(item => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${
                  item.done 
                    ? 'bg-white/[0.02] border-white/5 text-slate-500 line-through' 
                    : 'bg-black/30 border-white/10 text-slate-200'
                }`}
              >
                <button
                  onClick={() => handleToggleChecklistItem(item.id)}
                  className="flex items-center gap-2 text-left flex-1 min-w-0"
                >
                  {item.done ? (
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Circle size={13} className="text-slate-500 shrink-0" />
                  )}
                  <span className="text-xs truncate">{item.text}</span>
                </button>
                <button
                  onClick={() => handleDeleteChecklistItem(item.id)}
                  className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pinned Cards Section */}
        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Pin size={13} className="text-amber-400" /> Pinned Cards ({pinnedCards.length})
          </span>

          <select
            value={cardToPinId}
            onChange={e => {
              if (e.target.value) {
                togglePinCardInSession(currentSession.id, e.target.value);
                setCardToPinId('');
              }
            }}
            className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-[11px] text-slate-300 outline-none max-w-[120px]"
          >
            <option value="">+ Pin Card</option>
            {cards.filter(c => !currentSession.pinnedCardIds?.includes(c.id)).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="max-h-48 overflow-y-auto p-2.5 flex flex-col gap-2 border-b border-white/5">
          {pinnedCards.length === 0 ? (
            <div className="text-center text-xs text-slate-600 py-3 italic">
              No cards pinned. Use "+ Pin Card" above.
            </div>
          ) : (
            pinnedCards.map(c => (
              <div 
                key={c.id} 
                className="p-2.5 rounded-xl bg-[#141b25] border border-white/10 hover:border-amber-500/30 flex flex-col gap-1.5 shadow-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleOpenCard(c.id)}
                    className="flex items-center gap-1.5 text-left group flex-1 mr-2 min-w-0"
                    title="Open card page"
                  >
                    <span className="text-xs">
                      {c.type === 'character' ? '👤' : c.type === 'location' ? '📍' : '🛡️'}
                    </span>
                    <span className="text-xs font-bold text-slate-100 group-hover:text-amber-400 truncate transition-colors">
                      {c.name}
                    </span>
                    <ExternalLink size={11} className="text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => togglePinCardInSession(currentSession.id, c.id)}
                    className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                    title="Unpin"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {c.properties && Object.keys(c.properties).filter(k => k !== 'portraitUrl').length > 0 && (
                  <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-white/5">
                    {Object.entries(c.properties).filter(([k]) => k !== 'portraitUrl').slice(0, 4).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500 capitalize">{k}:</span>
                        <span className="text-slate-300 truncate max-w-[70px]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Live Roll Log Stream */}
        <div className="p-2.5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Dices size={13} className="text-blue-400" /> Recent Rolls
          </span>
          <button
            onClick={() => {
              DiceService.clearHistory();
              setRecentRolls([]);
            }}
            className="text-[10px] text-slate-500 hover:text-slate-300"
          >
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5 font-mono text-xs">
          {recentRolls.length === 0 ? (
            <div className="text-center text-xs text-slate-600 py-4 italic font-sans">
              No recent rolls recorded.
            </div>
          ) : (
            recentRolls.slice(0, 15).map(r => (
              <div key={r.id} className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate max-w-[140px] font-sans">
                    {r.label || r.formula}
                  </span>
                  <span className="font-bold text-amber-400">{r.total}</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span>[{r.dice.map(d => d.result).join(', ')}]{r.modifier ? (r.modifier > 0 ? ` +${r.modifier}` : ` ${r.modifier}`) : ''}</span>
                  <span>{r.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </aside>

    </div>
  );
};
