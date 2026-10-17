import React, { useState } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import type { Combatant } from '../services/storage';
import { 
  Swords, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Heart, 
  Shield, 
  Trash2, 
  Dices,
  Crosshair,
  Map as MapIcon,
  Download,
  Upload,
  UserCheck
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

export const CampaignTracker: React.FC = () => {
  const { 
    combats, 
    activeCombatId, 
    maps,
    activeMapId,
    selectedTokenId,
    setSelectedTokenId,
    setActiveView,
    createCombat, 
    updateCombat, 
    setActiveCombat,
    nextTurn,
    prevTurn,
    importMapTokensToCombat,
    deployCombatantsToMap
  } = useGrimoireStore();

  const currentCombat = combats.find(c => c.id === activeCombatId) || combats[0];
  const activeMap = maps.find(m => m.id === activeMapId) || maps[0];

  const [newCombatName, setNewCombatName] = useState('');
  const [isCreatingCombat, setIsCreatingCombat] = useState(false);

  // New Combatant form state
  const [combName, setCombName] = useState('');
  const [combKind, setCombKind] = useState<'player' | 'monster'>('monster');
  const [combInit, setCombInit] = useState(10);
  const [combHp, setCombHp] = useState(25);
  const [combAc, setCombAc] = useState(13);

  const handleCreateCombatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCombatName.trim()) return;
    await createCombat(newCombatName.trim());
    setNewCombatName('');
    setIsCreatingCombat(false);
  };

  const handleAddCombatant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCombat || !combName.trim()) return;

    const newCombatant: Combatant = {
      id: crypto.randomUUID(),
      name: combName.trim(),
      kind: combKind,
      initiative: combInit,
      hpCurrent: combHp,
      hpMax: combHp,
      ac: combAc,
      conditions: []
    };

    const updatedCombatants = [...currentCombat.combatants, newCombatant].sort((a, b) => b.initiative - a.initiative);
    await updateCombat({ ...currentCombat, combatants: updatedCombatants });

    setCombName('');
  };

  const handleDeleteCombatant = async (combatantId: string) => {
    if (!currentCombat) return;
    const remaining = currentCombat.combatants.filter(c => c.id !== combatantId);
    let nextIndex = currentCombat.currentTurnIndex;
    if (nextIndex >= remaining.length) nextIndex = Math.max(0, remaining.length - 1);
    await updateCombat({ ...currentCombat, combatants: remaining, currentTurnIndex: nextIndex });
  };

  const handleAdjustHp = async (combatant: Combatant, delta: number) => {
    if (!currentCombat) return;
    const newHp = Math.max(0, combatant.hpCurrent + delta);
    const updated = currentCombat.combatants.map(c => c.id === combatant.id ? { ...c, hpCurrent: newHp } : c);
    await updateCombat({ ...currentCombat, combatants: updated });
  };

  const handleToggleCondition = async (combatant: Combatant, condition: string) => {
    if (!currentCombat) return;
    const exists = combatant.conditions.includes(condition);
    const newConditions = exists 
      ? combatant.conditions.filter(c => c !== condition)
      : [...combatant.conditions, condition];
    const updated = currentCombat.combatants.map(c => c.id === combatant.id ? { ...c, conditions: newConditions } : c);
    await updateCombat({ ...currentCombat, combatants: updated });
  };

  const handleJumpToMapToken = (combatant: Combatant) => {
    // Find token matching either combatant ID or combatant Name
    if (activeMap?.tokens) {
      const match = activeMap.tokens.find(t => t.id === combatant.id || t.name.toLowerCase() === combatant.name.toLowerCase());
      if (match) {
        setSelectedTokenId(match.id);
      }
    }
    setActiveView('map');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080c14] text-slate-200 select-none overflow-hidden font-sans">
      
      {/* Top Header */}
      <div className="h-14 px-6 border-b border-white/5 bg-[#0f1521]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Swords size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{currentCombat ? currentCombat.name : 'Combat Tracker'}</span>
              {currentCombat && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  Round {currentCombat.round}
                </span>
              )}
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              Synchronized with Battlemap Tokens
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* MAP SYNC ACTIONS */}
          {activeMap && currentCombat && (
            <>
              <button
                onClick={() => importMapTokensToCombat(activeMap.id, currentCombat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-bold text-xs transition-colors shadow-sm"
                title="Import all non-secret tokens from active battlemap into initiative"
              >
                <Download size={13} />
                <span>Import from Map</span>
              </button>

              <button
                onClick={() => deployCombatantsToMap(currentCombat.id, activeMap.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-colors shadow-sm"
                title="Deploy all combatants as tokens onto the center of the active map"
              >
                <Upload size={13} />
                <span>Deploy to Map</span>
              </button>
            </>
          )}

          {/* Turn controls */}
          {currentCombat && currentCombat.combatants.length > 0 && (
            <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-1 rounded-xl">
              <button
                onClick={() => prevTurn(currentCombat.id)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                title="Previous turn"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-mono px-2 text-amber-300 font-bold">
                Turn {currentCombat.currentTurnIndex + 1}/{currentCombat.combatants.length}
              </span>
              <button
                onClick={() => nextTurn(currentCombat.id)}
                className="px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-red-500/25"
                title="Next turn"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsCreatingCombat(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300"
          >
            <Plus size={13} />
            <span>New Encounter</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left Column: Initiative List */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          {currentCombat && currentCombat.combatants.map((c, index) => {
            const isActiveTurn = index === currentCombat.currentTurnIndex;
            const isSelected = selectedTokenId === c.id || (activeMap?.tokens?.find(t => t.id === selectedTokenId)?.name.toLowerCase() === c.name.toLowerCase());

            return (
              <div
                key={c.id}
                onClick={() => {
                  const match = activeMap?.tokens?.find(t => t.id === c.id || t.name.toLowerCase() === c.name.toLowerCase());
                  if (match) setSelectedTokenId(match.id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                  isActiveTurn 
                    ? 'bg-amber-500/15 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30' 
                    : isSelected
                    ? 'bg-blue-500/15 border-blue-400/80 shadow-md ring-2 ring-blue-400/30'
                    : 'bg-[#121824]/90 hover:bg-[#121824] border-white/5'
                }`}
              >
                {/* Active Turn Marker */}
                {isActiveTurn && (
                  <div className="absolute -top-2.5 left-6 px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[8px] uppercase tracking-wider shadow-md flex items-center gap-1">
                    <UserCheck size={10} />
                    <span>Active Turn</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
                      {c.initiative}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <span>{c.name}</span>
                        <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                          c.kind === 'player' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {c.kind}
                        </span>
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Shield size={12} className="text-slate-500" /> AC {c.ac}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
                          <Heart size={12} /> HP {c.hpCurrent}/{c.hpMax}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & HP Adjust */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                      <button onClick={(e) => { e.stopPropagation(); handleAdjustHp(c, -5); }} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-red-500/20 text-red-300 text-[10px]">-5</button>
                      <button onClick={(e) => { e.stopPropagation(); handleAdjustHp(c, -1); }} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-red-500/20 text-red-300 text-[10px]">-1</button>
                      <button onClick={(e) => { e.stopPropagation(); handleAdjustHp(c, 1); }} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-[10px]">+1</button>
                      <button onClick={(e) => { e.stopPropagation(); handleAdjustHp(c, 5); }} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 text-[10px]">+5</button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJumpToMapToken(c);
                      }}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 text-slate-400 transition-colors"
                      title="Focus on Battlemap"
                    >
                      <MapIcon size={14} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCombatant(c.id);
                      }}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-slate-500 transition-colors"
                      title="Delete combatant"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Conditions Row */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                  {DND_CONDITIONS.map(cond => {
                    const hasCondition = c.conditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCondition(c, cond);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-colors ${
                          hasCondition
                            ? 'bg-amber-500 text-black border border-amber-400 font-extrabold shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-slate-500'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {(!currentCombat || currentCombat.combatants.length === 0) && (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-8 text-slate-500">
              <Swords size={32} className="opacity-30 mb-2" />
              <p className="text-xs">No combatants in this encounter yet.</p>
              <p className="text-[10px] text-slate-600 mt-1">Use "Import from Map" above or add combatants on the right!</p>
            </div>
          )}
        </div>

        {/* Right Column: Quick Add Combatant Panel */}
        <div className="w-80 p-5 rounded-2xl bg-[#121824] border border-white/10 shadow-2xl flex flex-col gap-4 shrink-0">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Plus size={14} className="text-amber-400" />
            <span>Add Combatant</span>
          </h3>

          <form onSubmit={handleAddCombatant} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Name (e.g. Eldrin, Ogre 1)"
              value={combName}
              onChange={e => setCombName(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
            />

            <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400">Combatant Type:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCombKind('player')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    combKind === 'player' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  Player
                </button>
                <button
                  type="button"
                  onClick={() => setCombKind('monster')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    combKind === 'monster' ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  Monster
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-bold">Init Roll</span>
                <input
                  type="number"
                  value={combInit}
                  onChange={e => setCombInit(parseInt(e.target.value) || 0)}
                  className="bg-black/50 border border-white/10 rounded-lg p-1.5 text-center text-xs text-amber-300 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-bold">Max HP</span>
                <input
                  type="number"
                  value={combHp}
                  onChange={e => setCombHp(parseInt(e.target.value) || 0)}
                  className="bg-black/50 border border-white/10 rounded-lg p-1.5 text-center text-xs text-emerald-400 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-bold">Armor Class</span>
                <input
                  type="number"
                  value={combAc}
                  onChange={e => setCombAc(parseInt(e.target.value) || 0)}
                  className="bg-black/50 border border-white/10 rounded-lg p-1.5 text-center text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!combName.trim()}
              className="mt-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs shadow-md transition-colors"
            >
              Add to Encounter
            </button>
          </form>
        </div>

      </div>

      {/* New Encounter Modal */}
      {isCreatingCombat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateCombatSubmit} className="w-full max-w-sm p-6 rounded-2xl bg-[#121824] border border-white/10 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">New Encounter</h3>
            <input
              type="text"
              placeholder="Encounter Name (e.g. Ambush at the Bridge)"
              value={newCombatName}
              onChange={e => setNewCombatName(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreatingCombat(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" disabled={!newCombatName.trim()} className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white font-bold text-xs">Create</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
