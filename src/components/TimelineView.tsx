import React, { useState } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import type { TimelineEvent } from '../services/storage';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit3,
  ExternalLink, 
  Sun
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  battle: '#ef4444',
  treaty: '#3b82f6',
  discovery: '#10b981',
  cataclysm: '#a855f7',
  general: '#f59e0b'
};

const MOON_PHASES = [
  '🌑 New Moon',
  '🌒 Waxing Crescent',
  '🌓 First Quarter',
  '🌔 Waxing Gibbous',
  '🌕 Full Moon',
  '🌖 Waning Gibbous',
  '🌗 Last Quarter',
  '🌘 Waning Crescent'
];

export const TimelineView: React.FC = () => {
  const { 
    events, 
    currentWorld, 
    cards, 
    createEvent, 
    updateEvent,
    deleteEvent, 
    setActiveCard,
    advanceDay
  } = useGrimoireStore();

  const [activeEra, setActiveEra] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [era, setEra] = useState('First Age');
  const [year, setYear] = useState<number>(300);
  const [month, setMonth] = useState('Solaris');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'battle' | 'treaty' | 'discovery' | 'cataclysm' | 'general'>('general');
  const [linkedCardId, setLinkedCardId] = useState('');

  const cal = currentWorld?.calendar;
  const currentMonth = cal ? cal.months[cal.currentMonthIndex] : null;

  const getMoonPhase = (cycleDays: number) => {
    if (!cal) return MOON_PHASES[4];
    const totalDays = (cal.currentYear * 300) + (cal.currentMonthIndex * 30) + cal.currentDay;
    const progress = (totalDays % cycleDays) / cycleDays;
    const phaseIdx = Math.floor(progress * 8) % 8;
    return MOON_PHASES[phaseIdx];
  };

  const eras = Array.from(new Set(events.map(e => e.era)));
  const filteredEvents = activeEra === 'all' 
    ? events 
    : events.filter(e => e.era.toLowerCase() === activeEra.toLowerCase());

  const resetForm = () => {
    setTitle('');
    setEra('First Age');
    setYear(300);
    setMonth('Solaris');
    setDescription('');
    setCategory('general');
    setLinkedCardId('');
    setEditingEventId(null);
    setIsFormOpen(false);
  };

  const handleOpenAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleAddEventForCurrentDate = () => {
    resetForm();
    if (cal && currentMonth) {
      setYear(cal.currentYear);
      setMonth(`${currentMonth.name} ${cal.currentDay}`);
    }
    setIsFormOpen(true);
  };

  const handleStartEdit = (evt: TimelineEvent) => {
    setEditingEventId(evt.id);
    setTitle(evt.title);
    setEra(evt.era);
    setYear(evt.year);
    setMonth(evt.month || '');
    setDescription(evt.description);
    setCategory(evt.category);
    setLinkedCardId(evt.linkedCardIds?.[0] || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingEventId) {
      const existing = events.find(ev => ev.id === editingEventId);
      if (existing) {
        updateEvent({
          ...existing,
          title: title.trim(),
          era: era.trim(),
          year: Number(year),
          month: month.trim() || undefined,
          description: description.trim(),
          category,
          linkedCardIds: linkedCardId ? [linkedCardId] : []
        });
      }
    } else {
      createEvent({
        title: title.trim(),
        era: era.trim(),
        year: Number(year),
        month: month.trim() || undefined,
        description: description.trim(),
        category,
        linkedCardIds: linkedCardId ? [linkedCardId] : []
      });
    }

    resetForm();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d13] text-slate-200 overflow-hidden select-none font-sans">
      
      {/* Top Chronicles & Calendar Header */}
      <div className="h-16 px-8 border-b border-white/5 bg-[#121620]/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <CalendarIcon size={14} /> World Chronicles
          </span>

          {/* Active Planetary Date Badge with inline + Button */}
          {cal && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <Sun size={13} className="text-amber-400" />
              <span className="font-semibold text-slate-100">
                Year {cal.currentYear}, {currentMonth?.name} {cal.currentDay}
              </span>
              
              <button
                onClick={handleAddEventForCurrentDate}
                className="w-5 h-5 rounded-md bg-amber-500/20 hover:bg-amber-500/35 text-amber-400 flex items-center justify-center font-bold text-xs transition-colors border border-amber-500/30 ml-0.5"
                title="Add event for this specific date"
              >
                <Plus size={11} />
              </button>

              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10">
                <button
                  onClick={() => advanceDay(1)}
                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 font-mono transition-colors"
                  title="Advance 1 Day"
                >
                  +1 Day
                </button>
                <button
                  onClick={() => advanceDay(7)}
                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-amber-400 font-mono transition-colors"
                  title="Advance 1 Week"
                >
                  +1 Week
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Celestial Moons Orbit Display */}
        {cal?.moons && (
          <div className="flex items-center gap-3">
            {cal.moons.map(moon => (
              <div 
                key={moon.id} 
                className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/40 border border-white/5 text-xs"
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: moon.color, boxShadow: `0 0 8px ${moon.color}80` }} 
                />
                <span className="font-semibold text-slate-300 text-[11px]">{moon.name}:</span>
                <span className="text-[11px] font-mono text-amber-300">{getMoonPhase(moon.cycleDays)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <select
            value={activeEra}
            onChange={e => setActiveEra(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Eras ({events.length})</option>
            {eras.map(er => (
              <option key={er} value={er}>{er}</option>
            ))}
          </select>

          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors"
          >
            <Plus size={13} /> Add Event
          </button>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 overflow-y-auto px-12 py-8 relative">
        <div className="max-w-3xl mx-auto flex flex-col relative before:absolute before:left-[108px] before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">

          {/* Add / Edit Event Form Modal */}
          {isFormOpen && (
            <div className="mb-8 p-5 bg-[#161c26]/95 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  {editingEventId ? <Edit3 size={12} /> : <Plus size={12} />}
                  {editingEventId ? 'Edit Chronological Event' : 'Plot New Chronological Event'}
                </span>
                <button onClick={resetForm} className="text-xs text-slate-500 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleFormSubmit} className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. The Siege of the Sunken Citadel..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Era Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. First Age, Age of Rebirth..."
                    value={era}
                    onChange={e => setEra(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded px-2.5 py-1.5 text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Year</label>
                    <input
                      type="number"
                      required
                      value={year}
                      onChange={e => setYear(Number(e.target.value))}
                      className="w-full bg-black/50 border border-white/10 rounded px-2.5 py-1.5 text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Month / Day</label>
                    <input
                      type="text"
                      placeholder="e.g. Highsun 14"
                      value={month}
                      onChange={e => setMonth(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/10 rounded px-2 py-1.5 text-slate-300 outline-none"
                  >
                    <option value="battle">⚔️ Battle / Conflict</option>
                    <option value="treaty">📜 Treaty / Pact</option>
                    <option value="discovery">✨ Discovery / Magic</option>
                    <option value="cataclysm">🌋 Cataclysm</option>
                    <option value="general">🏛️ General Historic</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Linked Lore Card</label>
                  <select
                    value={linkedCardId}
                    onChange={e => setLinkedCardId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded px-2 py-1.5 text-slate-300 outline-none"
                  >
                    <option value="">-- No Linked Card --</option>
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Historical Account</label>
                  <textarea
                    rows={3}
                    placeholder="Describe what occurred during this event..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-white outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded"
                  >
                    {editingEventId ? 'Save Changes' : 'Plot Event'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Event Stream */}
          {filteredEvents.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-16 italic">
              No historical events recorded for this era. Click "+ Add Event" above to begin charting history.
            </div>
          ) : (
            filteredEvents.map(evt => {
              const catColor = CATEGORY_COLORS[evt.category] || '#f59e0b';
              const linkedCard = cards.find(c => evt.linkedCardIds?.includes(c.id));

              return (
                <div key={evt.id} className="flex items-start gap-6 mb-8 group relative">
                  <div className="w-24 text-right shrink-0 pt-0.5">
                    <span className="text-sm font-bold text-amber-400 font-mono block">
                      Year {evt.year}
                    </span>
                    {evt.month && (
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {evt.month}
                      </span>
                    )}
                  </div>

                  <div 
                    className="w-4 h-4 rounded-full border-2 border-[#0a0d13] shrink-0 mt-1 relative z-10"
                    style={{ backgroundColor: catColor, boxShadow: `0 0 10px ${catColor}80` }}
                  />

                  <div className="flex-1 p-4 rounded-2xl bg-[#141b25] border border-white/10 hover:border-white/20 transition-all shadow-lg flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{evt.title}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                          {evt.era}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(evt)}
                          className="text-slate-400 hover:text-amber-400 p-1 rounded hover:bg-white/5 transition-colors"
                          title="Edit Event"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => deleteEvent(evt.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {evt.description || 'No detailed record written for this event.'}
                    </p>

                    {linkedCard && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Related lore:</span>
                        <button
                          onClick={() => setActiveCard(linkedCard.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                        >
                          <span>{linkedCard.name}</span>
                          <ExternalLink size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

        </div>
      </div>

    </div>
  );
};
