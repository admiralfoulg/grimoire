import React, { useState, useEffect } from 'react';
import { DiceService, type RollResult } from '../services/dice';
import { Dices, X, RotateCcw } from 'lucide-react';

export const DiceRoller: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [customDiceCount, setCustomDiceCount] = useState(1);
  const [customModifier, setCustomModifier] = useState(0);

  useEffect(() => {
    const unsubscribe = DiceService.subscribe((newRoll) => {
      setHistory(prev => [newRoll, ...prev.filter(r => r.id !== newRoll.id).slice(0, 29)]);
      setIsOpen(true);
    });
    return unsubscribe;
  }, []);

  const handleRoll = (sides: number) => {
    const res = DiceService.rollDice(customDiceCount, sides, customModifier);
    setHistory(prev => [res, ...prev.slice(0, 29)]);
  };

  const handleClearHistory = () => {
    DiceService.clearHistory();
    setHistory([]);
  };

  return (
    <>
      {/* Floating Compact Dice Trigger Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-3 right-3 z-50 p-2.5 rounded-2xl bg-[#121824]/90 hover:bg-[#18212e] border border-white/10 hover:border-amber-400/40 text-amber-400 shadow-2xl backdrop-blur-md transition-all group"
        title="Toggle Dice Roller"
      >
        <Dices size={18} className="transition-transform group-hover:rotate-12" />
      </button>

      {/* Expanded Dice Roller Panel */}
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-14 right-3 z-50 w-80 rounded-2xl bg-[#121824]/95 border border-white/15 shadow-2xl backdrop-blur-md p-4 text-xs animate-in fade-in zoom-in-95 flex flex-col gap-3 font-sans select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <Dices size={15} className="text-amber-400" />
              <span>Dice Tray</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                title="Clear Roll History"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Controls: Dice Count and Modifier */}
          <div className="flex items-center justify-between px-1 text-slate-300">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] mr-1">Dice:</span>
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setCustomDiceCount(num)}
                  className={`w-6 h-6 rounded-md font-mono text-[11px] font-bold transition-all ${
                    customDiceCount === num
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Mod:</span>
              <input
                type="number"
                value={customModifier || 0}
                onChange={(e) => setCustomModifier(parseInt(e.target.value, 10) || 0)}
                className="w-12 bg-black/50 border border-white/10 rounded-md px-1.5 py-0.5 text-center font-mono text-[11px] text-amber-300 outline-none"
              />
            </div>
          </div>

          {/* Quick Dice Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
              <button
                key={sides}
                onClick={() => handleRoll(sides)}
                className="py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 font-bold font-mono text-xs transition-all active:scale-95 flex items-center justify-center"
              >
                d{sides}
              </button>
            ))}
          </div>

          {/* Roll History Stream with Explicit Badges */}
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-0.5 border-t border-white/10 pt-2">
            {history.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-[11px] italic">
                No rolls yet. Click an action or die to roll.
              </div>
            ) : (
              history.map((roll) => {
                const labelLower = (roll.label || '').toLowerCase();
                const isAttack = labelLower.includes('attack') || labelLower.includes('hit');
                const isDamage = labelLower.includes('damage') || labelLower.includes('dmg');

                return (
                  <div
                    key={roll.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isAttack && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[9px] uppercase tracking-wider">
                            ATTACK
                          </span>
                        )}
                        {isDamage && (
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold text-[9px] uppercase tracking-wider">
                            DAMAGE
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-slate-200 truncate">
                          {roll.label || roll.formula}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {roll.formula} {roll.modifier ? (roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier) : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-base font-extrabold font-mono px-2 py-0.5 rounded-lg ${
                        isAttack
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                          : isDamage
                          ? 'text-red-400 bg-red-500/10 border border-red-500/30'
                          : 'text-slate-100 bg-white/5'
                      }`}>
                        {roll.total}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};
