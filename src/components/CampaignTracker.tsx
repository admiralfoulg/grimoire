import React, { useState } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import type { Combatant, TokenCondition } from '../services/storage';
import { 
  Swords, 
  Shield, 
  Heart, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  UserPlus, 
  Crosshair, 
  Sparkles, 
  Skull,
  Eye,
  Activity
} from 'lucide-react';

const ALL_CONDITIONS: TokenCondition[] = [
  'blinded', 'charmed', 'concentrating', 'deafened', 'frightened',
  'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified',
  'poisoned', 'prone', 'restrained', 'stunned', 'unconscious', 'dead'
];

const CONDITION_COLORS: Record<TokenCondition, string> = {
  blinded: 'bg-zinc-700 text-zinc-200 border-zinc-600',
  charmed: 'bg-pink-900/60 text-pink-300 border-pink-700/60',
  concentrating: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/60',
  deafened: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  frightened: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
  grappled: 'bg-stone-800 text-stone-300 border-stone-600',
  incapacitated: 'bg-red-950 text-red-300 border-red-800',
  invisible: 'bg-blue-950 text-blue-300 border-blue-700',
  paralyzed: 'bg-indigo-950 text-indigo-300 border-indigo-700',
  petrified: 'bg-slate-700 text-slate-300 border-slate-500',
  poisoned: 'bg-emerald-950 text-emerald-300 border-emerald-700',
  prone: 'bg-orange-950 text-orange-300 border-orange-700',
  restrained: 'bg-yellow-950 text-yellow-300 border-yellow-700',
  stunned: 'bg-purple-950 text-purple-300 border-purple-700',
  unconscious: 'bg-rose-950 text-rose-300 border-rose-800',
  dead: 'bg-red-900 text-white border-red-500'
};

export const CampaignTracker: React.FC = () => {
  const { 
    combats, 
    activeCombatId, 
    cards, 
    updateCombat, 
    deleteCombat, 
    createCombat, 
    nextTurn, 
    prevTurn,
    selectedCombatantId,
    selectCombatant,
    toggleCombatantCondition,
    adjustCombatantHp,
    setActiveView
  } = useGrimoireStore();

  const currentCombat = combats.find(c => c.id === activeCombatId);

  // Modal & Form State
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'player' | 'npc' | 'monster'>('monster');
  const [initiative, setInitiative] = useState(10);
  const [hp, setHp] = useState(25);
  const [ac, setAc] = useState(13);
  const [selectedCardId, setSelectedCardId] = useState('');

  const [isCreatingEncounter, setIsCreatingEncounter] = useState(false);
  const [newEncounterName, setNewEncounterName] = useState('');
  const [activeConditionMenuId, setActiveConditionMenuId] = useState<string | null>(null);

  if (!currentCombat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#121620] p-6 text-slate-400 select-none">
        <Swords size={36} className="text-amber-400/40 mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">No Active Encounter</h3>
        <p className="text-xs text-slate-500 mb-4">Create a combat encounter to begin tracking turns and tokens.</p>
        <button
          onClick={() => setIsCreatingEncounter(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-xl shadow-lg"
        >
          Create First Encounter
        </button>

        {isCreatingEncounter && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (newEncounterName.trim()) {
                createCombat(newEncounterName.trim());
                setNewEncounterName('');
                setIsCreatingEncounter(false);
              }
            }}
            className="mt-4 p-4 rounded-xl bg-[#161c26] border border-white/10 flex flex-col gap-2 w-72"
          >
            <input
              type="text"
              autoFocus
              placeholder="Encounter Name..."
              value={newEncounterName}
              onChange={e => setNewEncounterName(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500/50"
            />
            <div className="flex justify-end gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setIsCreatingEncounter(false)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-amber-500 text-black font-semibold text-xs rounded-lg"
              >
                Create
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  const handleAddCombatant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCombatant: Combatant = {
      id: crypto.randomUUID(),
      name: name.trim(),
      kind,
      initiative: Number(initiative),
      hpCurrent: Number(hp),
      hpMax: Number(hp),
      ac: Number(ac),
      conditions: [],
      linkedCardId: selectedCardId || undefined
    };

    const updatedCombatants = [...currentCombat.combatants, newCombatant].sort((a, b) => b.initiative - a.initiative);
    updateCombat({ ...currentCombat, combatants: updatedCombatants });
    setName('');
    setIsAdding(false);
  };

  const handleDeleteCombatant = (combatantId: string) => {
    const updated = currentCombat.combatants.filter(c => c.id !== combatantId);
    updateCombat({ ...currentCombat, combatants: updated });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1b232f]/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden m-2.5 text-slate-200 shadow-2xl relative select-none">
      
      {/* Header Controller */}
      <div className="h-12 px-6 flex items-center justify-between text-slate-400 border-b border-white/5 bg-[#141b25]/50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Swords size={15} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">{currentCombat.name}</h3>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/5 rounded-full text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Round</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{currentCombat.round}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevTurn(currentCombat.id)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/5 transition-colors"
          >
            <ChevronLeft size={13} /> Prev
          </button>
          
          <button
            onClick={() => nextTurn(currentCombat.id)}
            className="flex items-center gap-1 px-4 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-md"
          >
            Next Turn <ChevronRight size={13} />
          </button>

          <span className="text-white/10 mx-1">|</span>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/5 transition-colors"
          >
            <UserPlus size={13} /> Add Combatant
          </button>

          <button
            onClick={() => deleteCombat(currentCombat.id)}
            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete Encounter"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Initiative Queue */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
          {currentCombat.combatants.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-16">
              No combatants in this encounter. Click "Add Combatant" or link a token from the tactical battlemap.
            </div>
          ) : (
            currentCombat.combatants.map((c, index) => {
              const isCurrentTurn = index === currentCombat.currentTurnIndex;
              const isSelected = selectedCombatantId === c.id;
              const hpPercent = Math.max(0, Math.min(100, (c.hpCurrent / c.hpMax) * 100));

              return (
                <div
                  key={c.id}
                  onClick={() => selectCombatant(isSelected ? null : c.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrentTurn
                      ? 'bg-[#1e2738] border-amber-500/50 shadow-xl shadow-amber-500/5 ring-1 ring-amber-500/30'
                      : isSelected
                      ? 'bg-[#1c2433] border-cyan-500/60 shadow-lg ring-1 ring-cyan-500/30'
                      : 'bg-[#141a24]/80 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Left: Initiative, Name, Linked Token */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-mono font-bold shrink-0 ${
                      isCurrentTurn
                        ? 'bg-amber-500 text-black'
                        : isSelected
                        ? 'bg-cyan-500 text-black'
                        : 'bg-black/40 text-slate-400 border border-white/5'
                    }`}>
                      <span className="text-xs">{c.initiative}</span>
                      <span className="text-[8px] uppercase tracking-tighter opacity-70">INIT</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100 truncate">{c.name}</span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${
                          c.kind === 'player' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          c.kind === 'monster' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {c.kind}
                        </span>

                        {isCurrentTurn && (
                          <span className="text-[10px] font-bold text-amber-400 animate-pulse">● ACTIVE</span>
                        )}

                        {c.linkedTokenId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectCombatant(c.id);
                              setActiveView('map');
                            }}
                            className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 transition-colors"
                            title="Jump to Token on Map"
                          >
                            <Crosshair size={10} />
                            <span>Map Token</span>
                          </button>
                        )}
                      </div>

                      {/* Conditions Badges */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {c.conditions.map(cond => (
                          <span
                            key={cond}
                            className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border flex items-center gap-1 ${CONDITION_COLORS[cond] || 'bg-purple-900/40 text-purple-300 border-purple-700/50'}`}
                          >
                            <span>{cond}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCombatantCondition(c.id, cond);
                              }}
                              className="opacity-70 hover:opacity-100 hover:text-red-400"
                            >
                              ×
                            </button>
                          </span>
                        ))}

                        {/* Add Condition Popover Button */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveConditionMenuId(activeConditionMenuId === c.id ? null : c.id);
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 flex items-center gap-0.5"
                          >
                            <Sparkles size={9} /> + condition
                          </button>

                          {activeConditionMenuId === c.id && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 top-6 z-50 w-52 bg-[#121620] border border-white/15 rounded-xl shadow-2xl p-2 grid grid-cols-2 gap-1 backdrop-blur-xl"
                            >
                              {ALL_CONDITIONS.map(cond => {
                                const active = c.conditions.includes(cond);
                                return (
                                  <button
                                    key={cond}
                                    onClick={() => toggleCombatantCondition(c.id, cond)}
                                    className={`text-[10px] text-left px-2 py-1 rounded capitalize transition-all ${
                                      active 
                                        ? 'bg-amber-500 text-black font-semibold' 
                                        : 'text-slate-300 hover:bg-white/5'
                                    }`}
                                  >
                                    {cond}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: AC & HP Controls */}
                  <div className="flex items-center gap-5 shrink-0" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Shield size={13} className="text-slate-500" />
                      <span className="font-mono font-bold text-slate-200">{c.ac}</span>
                      <span className="text-[9px] text-slate-500">AC</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end w-24">
                        <div className="flex items-center gap-1 text-xs font-mono font-bold">
                          <Heart size={11} className={c.hpCurrent === 0 ? 'text-red-500' : 'text-amber-400'} />
                          <span className={c.hpCurrent === 0 ? 'text-red-400' : 'text-slate-100'}>{c.hpCurrent}</span>
                          <span className="text-slate-500 text-[10px]">/{c.hpMax}</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mt-1 border border-white/5">
                          <div 
                            className={`h-full transition-all ${
                              hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => adjustCombatantHp(c.id, -5)}
                          className="px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-mono"
                        >-5</button>
                        <button
                          onClick={() => adjustCombatantHp(c.id, -1)}
                          className="px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-mono"
                        >-1</button>
                        <button
                          onClick={() => adjustCombatantHp(c.id, 1)}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-mono"
                        >+1</button>
                        <button
                          onClick={() => adjustCombatantHp(c.id, 5)}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-mono"
                        >+5</button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCombatant(c.id)}
                      className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-84 bg-[#161c26]/95 border border-white/10 rounded-2xl p-5 shadow-2xl z-50 backdrop-blur-2xl">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">Add to Initiative</h3>
          <form onSubmit={handleAddCombatant} className="flex flex-col gap-2.5">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">From Existing Card</label>
              <select
                value={selectedCardId}
                onChange={e => {
                  setSelectedCardId(e.target.value);
                  const found = cards.find(c => c.id === e.target.value);
                  if (found) {
                    setName(found.name);
                    setKind(found.type === 'character' ? 'player' : 'monster');
                  }
                }}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
              >
                <option value="">-- Custom Combatant --</option>
                {cards.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Dire Wolf..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Kind</label>
                <select
                  value={kind}
                  onChange={e => setKind(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none"
                >
                  <option value="player">Player</option>
                  <option value="monster">Monster</option>
                  <option value="npc">NPC</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Initiative</label>
                <input
                  type="number"
                  required
                  value={initiative}
                  onChange={e => setInitiative(parseInt(e.target.value, 10))}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Max HP</label>
                <input
                  type="number"
                  required
                  value={hp}
                  onChange={e => setHp(parseInt(e.target.value, 10))}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Armor Class</label>
                <input
                  type="number"
                  required
                  value={ac}
                  onChange={e => setAc(parseInt(e.target.value, 10))}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
