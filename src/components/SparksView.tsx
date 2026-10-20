import React, { useState, useEffect } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { GeneratorService } from '../services/generators';
import type { TableKey } from '../services/generators';
import { 
  Sparkles, 
  Dice5, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Copy, 
  Check, 
  FileText, 
  Flame, 
  Table as TableIcon,
  User,
  Coffee,
  Gem,
  HelpCircle
} from 'lucide-react';

const TABLE_LABELS: Record<TableKey, string> = {
  firstNames: 'First Names',
  surnames: 'Surnames & Epithets',
  ancestries: 'Ancestries & Lineages',
  occupations: 'Occupations & Trades',
  quirks: 'Character Quirks & Mannerisms',
  motives: 'Hidden Motives & Agendas',
  tavernAdjectives: 'Tavern Name - Adjectives',
  tavernNouns: 'Tavern Name - Nouns',
  tavernAtmospheres: 'Tavern Atmospheres',
  tavernDrinks: 'House Specialty Drinks',
  trinkets: 'Trinkets & Curiosities',
  complications: 'Encounter Complications'
};

export const SparksView: React.FC = () => {
  const { createCard, folders } = useGrimoireStore();
  const [activeTab, setActiveTab] = useState<'generators' | 'tables'>('generators');

  // Generator Roll Results
  const [oracleResult, setOracleResult] = useState<{ verdict: string; complication: string } | null>(null);
  const [npcResult, setNpcResult] = useState<any | null>(null);
  const [tavernResult, setTavernResult] = useState<any | null>(null);
  const [lootResult, setLootResult] = useState<any | null>(null);
  const [lootTier, setLootTier] = useState<'low' | 'mid' | 'high'>('mid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Table Manager State
  const [selectedTable, setSelectedTable] = useState<TableKey>('quirks');
  const [tableEntries, setTableEntries] = useState<string[]>([]);
  const [newEntryText, setNewEntryText] = useState('');

  const loadCurrentTable = async (key: TableKey) => {
    const list = await GeneratorService.getTable(key);
    setTableEntries(list);
  };

  useEffect(() => {
    loadCurrentTable(selectedTable);
  }, [selectedTable]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryText.trim()) return;
    const updated = await GeneratorService.addEntry(selectedTable, newEntryText.trim());
    setTableEntries(updated);
    setNewEntryText('');
  };

  const handleRemoveEntry = async (entry: string) => {
    const updated = await GeneratorService.removeEntry(selectedTable, entry);
    setTableEntries(updated);
  };

  const handleResetTable = async () => {
    if (confirm(`Reset "${TABLE_LABELS[selectedTable]}" to default entries?`)) {
      const reset = await GeneratorService.resetTable(selectedTable);
      setTableEntries(reset);
    }
  };

  // One-click Generator Triggers
  const rollOracle = async () => {
    const res = await GeneratorService.rollOracle();
    setOracleResult(res);
  };

  const rollNpc = async () => {
    const res = await GeneratorService.rollNpc();
    setNpcResult(res);
  };

  const rollTavern = async () => {
    const res = await GeneratorService.rollTavern();
    setTavernResult(res);
  };

  const rollLoot = async () => {
    const res = await GeneratorService.rollLoot(lootTier);
    setLootResult(res);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const saveToCard = async (title: string, content: string, type: string) => {
    const targetFolder = folders.find(f => f.name.toLowerCase().includes('scratch') || f.name.toLowerCase().includes('lore')) || folders[0];
    await createCard(title, targetFolder?.id);
    setCopiedId(title);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden theme-bg-dark text-slate-100 font-sans select-none">
      
      {/* Top Header */}
      <div className="h-12 px-5 flex items-center justify-between border-b border-white/10 theme-bg-sidebar shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">Sparks & Random Tables</h1>
            <p className="text-[10px] text-slate-400">DM improvisational generator deck & customizable oracle tables</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-black/30 p-0.5 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('generators')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'generators' ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={12} /> Generators Deck
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'tables' ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon size={12} /> Table Manager
          </button>
        </div>
      </div>

      {/* Main Workstation Canvas */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'generators' ? (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Solo Oracle / Fate Die */}
            <div className="p-4 rounded-2xl border border-white/10 theme-bg-surface flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={15} className="text-amber-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Fate Oracle</h2>
                  </div>
                  <button
                    onClick={rollOracle}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-md shadow-amber-500/10"
                  >
                    <Dice5 size={13} /> Roll Fate
                  </button>
                </div>

                <div className="mt-3 min-h-[90px] flex flex-col justify-center">
                  {oracleResult ? (
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-sm font-bold text-amber-300">{oracleResult.verdict}</span>
                      <span className="text-xs text-slate-300 italic">Complication: {oracleResult.complication}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-4">
                      Ask the Oracle a yes/no tabletop question and cast the dice.
                    </p>
                  )}
                </div>
              </div>

              {oracleResult && (
                <div className="flex justify-end gap-1.5 pt-2 border-t border-white/5">
                  <button
                    onClick={() => copyToClipboard(`${oracleResult.verdict} — ${oracleResult.complication}`, 'oracle')}
                    className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                  >
                    {copiedId === 'oracle' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span className="text-[10px]">Copy</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. NPC Generator */}
            <div className="p-4 rounded-2xl border border-white/10 theme-bg-surface flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-amber-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">NPC Spark</h2>
                  </div>
                  <button
                    onClick={rollNpc}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-md shadow-amber-500/10"
                  >
                    <Dice5 size={13} /> Roll NPC
                  </button>
                </div>

                <div className="mt-3 min-h-[90px] flex flex-col justify-center">
                  {npcResult ? (
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-slate-100">{npcResult.fullName}</span>
                        <span className="text-[10px] text-amber-400 font-medium">({npcResult.ancestry} • {npcResult.occupation})</span>
                      </div>
                      <div className="text-slate-300"><span className="text-slate-500">Quirk:</span> {npcResult.quirk}</div>
                      <div className="text-slate-300"><span className="text-slate-500">Motive:</span> {npcResult.motive}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-4">Generate instantaneous names, ancestry, quirks, and hidden agendas.</p>
                  )}
                </div>
              </div>

              {npcResult && (
                <div className="flex justify-end gap-1.5 pt-2 border-t border-white/5">
                  <button
                    onClick={() => saveToCard(npcResult.fullName, `**Ancestry:** ${npcResult.ancestry}\n**Occupation:** ${npcResult.occupation}\n**Quirk:** ${npcResult.quirk}\n**Motive:** ${npcResult.motive}`, 'character')}
                    className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                  >
                    <FileText size={12} />
                    <span className="text-[10px]">Create Card</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Tavern & Atmosphere */}
            <div className="p-4 rounded-2xl border border-white/10 theme-bg-surface flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Coffee size={15} className="text-amber-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Tavern & Rumor</h2>
                  </div>
                  <button
                    onClick={rollTavern}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-md shadow-amber-500/10"
                  >
                    <Dice5 size={13} /> Roll Tavern
                  </button>
                </div>

                <div className="mt-3 min-h-[90px] flex flex-col justify-center">
                  {tavernResult ? (
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <span className="text-sm font-bold text-amber-300">{tavernResult.name}</span>
                      <div className="text-slate-300"><span className="text-slate-500">Atmosphere:</span> {tavernResult.atmosphere}</div>
                      <div className="text-slate-300"><span className="text-slate-500">Specialty Drink:</span> {tavernResult.drink}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-4">Generate authentic inns, roadside alehouses, and sensory tavern flavor.</p>
                  )}
                </div>
              </div>

              {tavernResult && (
                <div className="flex justify-end gap-1.5 pt-2 border-t border-white/5">
                  <button
                    onClick={() => saveToCard(tavernResult.name, `**Atmosphere:** ${tavernResult.atmosphere}\n**Specialty Drink:** ${tavernResult.drink}`, 'location')}
                    className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                  >
                    <FileText size={12} />
                    <span className="text-[10px]">Create Card</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Loot & Trinket Cache */}
            <div className="p-4 rounded-2xl border border-white/10 theme-bg-surface flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Gem size={15} className="text-amber-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Loot Cache</h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={lootTier}
                      onChange={(e) => setLootTier(e.target.value as any)}
                      className="bg-black/30 border border-white/10 rounded px-2 py-0.5 text-[11px] text-slate-200"
                    >
                      <option value="low">Low Tier</option>
                      <option value="mid">Mid Tier</option>
                      <option value="high">High Tier</option>
                    </select>
                    <button
                      onClick={rollLoot}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-md shadow-amber-500/10"
                    >
                      <Dice5 size={13} /> Roll Loot
                    </button>
                  </div>
                </div>

                <div className="mt-3 min-h-[90px] flex flex-col justify-center">
                  {lootResult ? (
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-amber-300 font-mono text-sm">{lootResult.coins}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">{lootResult.tier} Tier</span>
                      </div>
                      <div className="text-slate-300"><span className="text-slate-500">Curiosity / Item:</span> {lootResult.item}</div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-4">Generate quick pocket change, treasure hoards, and unique curiosities.</p>
                  )}
                </div>
              </div>

              {lootResult && (
                <div className="flex justify-end gap-1.5 pt-2 border-t border-white/5">
                  <button
                    onClick={() => copyToClipboard(`${lootResult.coins} - ${lootResult.item}`, 'loot')}
                    className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                  >
                    {copiedId === 'loot' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span className="text-[10px]">Copy</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Table Manager Tab */
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            
            <div className="p-4 rounded-2xl border border-white/10 theme-bg-surface flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Table:</span>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value as TableKey)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-400/50 flex-1 md:w-64"
                >
                  {Object.entries(TABLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key} className="bg-[#121824]">{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <span className="text-xs text-slate-500">{tableEntries.length} entries</span>
                <button
                  onClick={handleResetTable}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs border border-white/5"
                  title="Reset this table to defaults"
                >
                  <RotateCcw size={12} />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>

            {/* Add New Entry Form */}
            <form onSubmit={handleAddEntry} className="flex gap-2">
              <input
                type="text"
                value={newEntryText}
                onChange={(e) => setNewEntryText(e.target.value)}
                placeholder={`Add custom entry to ${TABLE_LABELS[selectedTable]}...`}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
              />
              <button
                type="submit"
                disabled={!newEntryText.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} /> Add Entry
              </button>
            </form>

            {/* Entry List Grid */}
            <div className="p-4 rounded-2xl border border-white/10 theme-bg-surface flex flex-col gap-1.5 shadow-xl">
              {tableEntries.map((entry, idx) => (
                <div
                  key={`${entry}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs text-slate-200 transition-colors group"
                >
                  <span className="flex-1 mr-3">{entry}</span>
                  <button
                    onClick={() => handleRemoveEntry(entry)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
