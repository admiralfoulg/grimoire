import React from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { findEntityMentions } from '../services/autolink';
import { 
  BookOpen, 
  ArrowLeft, 
  Link2, 
  ExternalLink, 
  MapPin, 
  Compass, 
  Users, 
  Shield, 
  Calendar,
  Sparkles
} from 'lucide-react';

export const ReaderView: React.FC = () => {
  const { cards, activeCardId, currentWorld, setActiveCard, setActiveView } = useGrimoireStore();
  const currentCard = cards.find(c => c.id === activeCardId) || cards[0];

  if (!currentCard) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        No documents available to display in Reader Mode.
      </div>
    );
  }

  const renderLinkedText = (rawText: string) => {
    if (!rawText) return null;
    const autoMatches = findEntityMentions(rawText, cards.filter(c => c.id !== currentCard.id));
    const explicitRegex = /\[\[(.*?)\]\]/g;
    let match;
    const tokens: { start: number; end: number; cardId?: string; name: string }[] = [];

    for (const m of autoMatches) {
      tokens.push({ start: m.start, end: m.end, cardId: m.cardId, name: m.text });
    }

    while ((match = explicitRegex.exec(rawText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const targetName = match[1].trim();
      const targetCard = cards.find(c => c.name.toLowerCase() === targetName.toLowerCase());
      tokens.push({ start, end, cardId: targetCard?.id, name: targetName });
    }

    tokens.sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    tokens.forEach((token, idx) => {
      if (token.start > lastIndex) {
        elements.push(rawText.slice(lastIndex, token.start));
      }
      const targetCard = cards.find(c => c.id === token.cardId || c.name.toLowerCase() === token.name.toLowerCase());
      elements.push(
        <span
          key={`link-${idx}`}
          className="wiki-link inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer font-medium transition-all"
          onClick={() => targetCard && setActiveCard(targetCard.id)}
        >
          <Link2 size={11} className="opacity-70" />
          <span>{token.name}</span>
        </span>
      );
      lastIndex = token.end;
    });

    if (lastIndex < rawText.length) {
      elements.push(rawText.slice(lastIndex));
    }
    return elements;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d13] text-slate-100 overflow-y-auto select-none">
      {/* Top Wiki Reader Navbar */}
      <nav className="h-14 px-8 border-b border-white/5 bg-[#0e121a]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('editor')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <ArrowLeft size={13} /> Exit Presentation
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
              {currentWorld?.name.charAt(0) || 'V'}
            </span>
            <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">
              {currentWorld?.name} Codex
            </span>
          </div>
        </div>

        {/* Quick Document Navigator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Jump to:</span>
          <select
            value={currentCard.id}
            onChange={(e) => setActiveCard(e.target.value)}
            className="bg-[#141a24] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none"
          >
            {cards.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
            ))}
          </select>
        </div>
      </nav>

      {/* Main Published Article Canvas */}
      <article className="max-w-4xl mx-auto w-full px-8 py-12 flex flex-col gap-10">
        
        {/* Article Banner & Header Info */}
        <header className="flex items-start justify-between gap-8 pb-8 border-b border-white/10">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {currentCard.type}
              </span>
              {currentCard.aliases && currentCard.aliases.length > 0 && (
                <span className="text-xs text-slate-500">
                  Also known as: {currentCard.aliases.join(', ')}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-serif font-bold text-slate-100 tracking-tight">
              {currentCard.name}
            </h1>

            {/* Rendered Properties Table */}
            {currentCard.properties && Object.keys(currentCard.properties).filter(k => k !== 'portraitUrl').length > 0 && (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 pt-2 text-xs">
                {Object.entries(currentCard.properties)
                  .filter(([k]) => k !== 'portraitUrl')
                  .map(([key, val]) => (
                    <div key={key} className="flex items-baseline gap-2 py-1 border-b border-white/5">
                      <dt className="text-slate-400 capitalize font-medium">{key}:</dt>
                      <dd className="text-slate-200">{String(val) || '—'}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>

          {/* Portrait Container */}
          {currentCard.properties?.portraitUrl && (
            <div className="w-60 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0 bg-[#121620]">
              <img
                src={currentCard.properties.portraitUrl}
                alt={currentCard.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </header>

        {/* Content Sections */}
        <section className="flex flex-wrap gap-x-12 gap-y-8">
          {(currentCard.blocks && currentCard.blocks.length > 0) ? (
            currentCard.blocks.map(block => (
              <div 
                key={block.id} 
                className={`flex flex-col gap-2 ${
                  block.width === 'half' ? 'w-[calc(50%-24px)]' : 'w-full'
                }`}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 pb-1 border-b border-white/10">
                  {block.title}
                </h3>
                <div className="text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-wrap pt-1">
                  {renderLinkedText(block.content || block.placeholder || '')}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-sm text-slate-300 leading-relaxed font-sans">
              {renderLinkedText(currentCard.content || 'No lore written yet for this entry.')}
            </div>
          )}
        </section>

      </article>
    </div>
  );
};
