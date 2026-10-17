import type { Card } from './storage';

export interface LinkMatch {
  start: number;
  end: number;
  text: string;
  cardId: string;
  cardName: string;
}

export function findEntityMentions(text: string, cards: Card[]): LinkMatch[] {
  if (!text || !cards || cards.length === 0) return [];

  const sortedCards = [...cards].sort((a, b) => b.name.length - a.name.length);
  const matches: LinkMatch[] = [];

  for (const card of sortedCards) {
    const terms = [card.name, ...(card.aliases || [])].filter(t => t && t.trim().length > 1);

    for (const term of terms) {
      const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        const overlaps = matches.some(m => (start >= m.start && start < m.end) || (end > m.start && end <= m.end));
        
        if (!overlaps) {
          matches.push({
            start,
            end,
            text: match[0],
            cardId: card.id,
            cardName: card.name
          });
        }
      }
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}
