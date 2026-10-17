import React, { useState } from 'react';
import { DiceService, type RollResult } from '../services/dice';
import { Dices, X, RotateCcw } from 'lucide-react';

export const DiceRoller: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [customDiceCount, setCustomDiceCount] = useState(1);
  const [customModifier, setCustomModifier] = useState(0);

  const handleRoll = (sides: number) => {
    const res = DiceService.rollDice(customDiceCount, sides, customModifier);
    setHistory(prev => [res, ...prev.slice(0, 19)]);
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
          className="fixed bottom-14 right-3 z-50 w-72 rounded-2xl bg-[#121824]/95 border border-white/15 shadow-2xl backdrop-blur-md p-4 text-xs animate-in fade-in zoom-in-95 flex flex-col gap-3 font-sans select-none"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <Dices size={15} className="text-amber-400" />
              <span>Dice Tray</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setHistory([])}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Clear roll history"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Close tray"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Dice Multipliers & Modifiers */}
          <div className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Dice:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setCustomDiceCount(n)}
                    className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] transition-colors ${
                      customDiceCount === n ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">Mod:</span>
              <input
                type="number"
                value={customModifier}
                onChange={(e) => setCustomModifier(parseInt(e.target.value) || 0)}
                className="w-10 bg-black/60 border border-white/10 rounded px-1 text-center font-mono text-amber-300 outline-none"
              />
            </div>
          </div>

          {/* Quick Dice Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[4, 6, 8, 10, 12, 20, 100].map(sides => (
              <button
                key={sides}
                onClick={() => handleRoll(sides)}
                className="py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/5 hover:border-amber-400/40 text-slate-200 hover:text-amber-300 font-bold font-mono transition-colors text-center"
              >
                d{sides}
              </button>
            ))}
          </div>

          {/* Roll Log */}
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-0.5">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/30 border border-white/5 text-[11px]"
              >
                <span className="text-slate-400 font-mono truncate max-w-[120px]">{h.notation}</span>
                <span className="font-bold font-mono text-amber-400 text-sm">{h.total}</span>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center text-[10px] text-slate-500 py-3 italic">
                Click a die above to roll
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
