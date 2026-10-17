import React, { useState } from 'react';
import { DiceService, type DiceRollResult } from '../services/dice';
import { Dices, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const STANDARD_DICE = [4, 6, 8, 10, 12, 20, 100];

export const DiceRoller: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customFormula, setCustomFormula] = useState('');
  const [history, setHistory] = useState<DiceRollResult[]>([]);

  const handleRoll = (formula: string, label?: string) => {
    const result = DiceService.roll(formula, label);
    setHistory(prev => [result, ...prev].slice(0, 20));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFormula.trim()) return;
    handleRoll(customFormula.trim(), 'Custom Roll');
    setCustomFormula('');
  };

  return (
    <div className="fixed bottom-4 right-16 z-40 select-none">
      {/* Floating Toggle Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18212e]/90 hover:bg-[#202c3d] border border-white/10 text-amber-400 hover:text-amber-300 text-xs font-semibold shadow-2xl backdrop-blur-md transition-all hover:scale-105"
        >
          <Dices size={15} />
          <span>Dice Roller</span>
          {history.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">
              {history[0].total}
            </span>
          )}
        </button>
      )}

      {/* Expanded Dice Tray Modal/Drawer */}
      {isOpen && (
        <div className="w-72 bg-[#121620]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Dices size={14} className="text-amber-400" /> Dice Tray
            </span>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-slate-500 hover:text-red-400 p-1"
                  title="Clear Log"
                >
                  <Trash2 size={12} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Quick Dice Palette */}
          <div className="grid grid-cols-4 gap-1.5">
            {STANDARD_DICE.map(d => (
              <button
                key={d}
                onClick={() => handleRoll(`1d${d}`, `d${d}`)}
                className="py-1.5 rounded-lg bg-black/40 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-xs font-semibold text-slate-300 hover:text-amber-300 transition-colors"
              >
                d{d}
              </button>
            ))}
            <button
              onClick={() => handleRoll(`2d20kh1`, `Advantage`)}
              className="py-1.5 rounded-lg bg-black/40 hover:bg-blue-500/15 border border-white/5 hover:border-blue-500/30 text-[11px] font-semibold text-slate-300 hover:text-blue-300 transition-colors"
            >
              ADV
            </button>
          </div>

          {/* Custom Formula Input */}
          <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
            <input
              type="text"
              placeholder="e.g. 2d6+4, 1d20+7..."
              value={customFormula}
              onChange={e => setCustomFormula(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-amber-500/50"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors"
            >
              Roll
            </button>
          </form>

          {/* Roll History Stream */}
          <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
            {history.length === 0 ? (
              <div className="text-[11px] text-slate-600 text-center py-4 italic">
                Click a die above to roll.
              </div>
            ) : (
              history.map(roll => (
                <div
                  key={roll.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-300">{roll.formula}</span>
                    <span className="text-[10px] text-slate-500">
                      [{roll.dice.map(d => d.result).join(', ')}]
                      {roll.modifier !== 0 && ` ${roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier}`}
                    </span>
                  </div>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    {roll.total}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
