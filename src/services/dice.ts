export interface DiceRollDetail {
  sides: number;
  result: number;
}

export interface RollResult {
  id: string;
  formula: string;
  label?: string;
  total: number;
  dice: DiceRollDetail[];
  modifier: number;
  timestamp: string;
}

type RollListener = (result: RollResult) => void;

class DiceServiceManager {
  private history: RollResult[] = [];
  private listeners: Set<RollListener> = new Set();

  public subscribe(fn: RollListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getHistory(): RollResult[] {
    return this.history;
  }

  public clearHistory(): void {
    this.history = [];
  }

  public roll(formula: string, label?: string): RollResult {
    const cleanFormula = formula.replace(/\s+/g, '');
    const regex = /([+-]?\d*d\d+|[+-]?\d+)/gi;
    const tokens = cleanFormula.match(regex) || [];

    let total = 0;
    let netModifier = 0;
    const dice: DiceRollDetail[] = [];

    tokens.forEach(tok => {
      if (tok.toLowerCase().includes('d')) {
        let sign = 1;
        let part = tok;
        if (tok.startsWith('-')) {
          sign = -1;
          part = tok.slice(1);
        } else if (tok.startsWith('+')) {
          part = tok.slice(1);
        }

        const [cntStr, sidesStr] = part.toLowerCase().split('d');
        const count = cntStr === '' ? 1 : parseInt(cntStr, 10);
        const sides = parseInt(sidesStr, 10);

        for (let i = 0; i < count; i++) {
          const res = Math.floor(Math.random() * sides) + 1;
          dice.push({ sides, result: res });
          total += sign * res;
        }
      } else {
        const val = parseInt(tok, 10);
        netModifier += val;
        total += val;
      }
    });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const result: RollResult = {
      id: crypto.randomUUID(),
      formula,
      label,
      total,
      dice,
      modifier: netModifier,
      timestamp: timeStr
    };

    this.history.unshift(result);
    if (this.history.length > 50) this.history.pop();

    this.listeners.forEach(fn => fn(result));
    return result;
  }
}

export const DiceService = new DiceServiceManager();
