import React, { useState } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { Sparkles, X, Plus, Dice5, User, Shield, MapPin, Compass } from 'lucide-react';
import type { EntityType } from '../services/storage';

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeneratorModal: React.FC<GeneratorModalProps> = ({ isOpen, onClose }) => {
  const store = useGrimoireStore();
  const cards = store?.cards || [];
  const folders = store?.folders || [];
  const currentWorld = store?.currentWorld || null;
  const createCard = store?.createCard;

  const [category, setCategory] = useState<EntityType>('character');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [generatedName, setGeneratedName] = useState('');
  const [generatedSnippet, setGeneratedSnippet] = useState('');
  const [generatedProperties, setGeneratedProperties] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Simple offline random tables
  const FIRST_NAMES = ['Kaelen', 'Theron', 'Vespera', 'Morrigan', 'Baelor', 'Lyra', 'Darian', 'Zephyr', 'Orion', 'Sariel'];
  const SURNAMES = ['Shadowmend', 'Ironthorn', 'Stormstrider', 'Duskbane', 'Silverwood', 'Ashford', 'Voidgazer', 'Blackstone'];
  const TITLES = ['The Exiled', 'The Sunken', 'The Whispering Blade', 'Of the Pale Dawn', 'The Relic Hunter'];

  const LOCATIONS = ['The Howling Canyons', 'Sunken Sanctum of Oros', 'Obsidian Spire', 'The Gilded Wharf', 'Whisperwood'];
  const FACTIONS = ['The Iron Concord', 'Order of the Veiled Sun', 'Sovereign Ashen Syndicate', 'Wardens of the Pale'];
  const ITEMS = ['Crest of the Forgotten King', 'Shard of the Void Star', 'Bloodforged Cleaver', 'Lantern of Souls'];

  const handleGenerate = () => {
    if (category === 'character') {
      const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const s = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
      const t = TITLES[Math.floor(Math.random() * TITLES.length)];
      setGeneratedName(`${f} ${s}`);
      setGeneratedSnippet(`Known widely as "${t}". A mysterious wanderer who harbors secrets from the old kingdom.`);
      setGeneratedProperties({
        Role: 'NPC / Adversary',
        Temperament: 'Cautious, Pragmatic',
        Status: 'Active'
      });
    } else if (category === 'location') {
      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      setGeneratedName(loc);
      setGeneratedSnippet('An atmospheric destination shrouded in ancient mystery and lingering elemental traces.');
      setGeneratedProperties({
        DangerLevel: 'Moderate',
        Climate: 'Subterranean / Arcane Mist'
      });
    } else if (category === 'faction') {
      const fac = FACTIONS[Math.floor(Math.random() * FACTIONS.length)];
      setGeneratedName(fac);
      setGeneratedSnippet('An influential organization orchestrating events from the shadows.');
      setGeneratedProperties({
        Influence: 'High',
        Disposition: 'Neutral'
      });
    } else {
      const itm = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      setGeneratedName(itm);
      setGeneratedSnippet('An artifact of immense power recovered from forgotten crypts.');
      setGeneratedProperties({
        Rarity: 'Rare',
        Attunement: 'Required'
      });
    }
  };

  const handleSaveToCard = async () => {
    if (!generatedName.trim() || !createCard) return;

    const newCard = await createCard(
      generatedName.trim(),
      category,
      selectedFolderId || undefined
    );

    if (newCard && store.updateCard) {
      await store.updateCard({
        ...newCard,
        content: generatedSnippet,
        properties: generatedProperties
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-[#141b25] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Quick Generator</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Category Selector */}
        <div className="grid grid-cols-4 gap-2">
          {(['character', 'location', 'faction', 'item'] as EntityType[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                setGeneratedName('');
                setGeneratedSnippet('');
              }}
              className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                category === cat
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
                  : 'bg-black/30 hover:bg-black/50 text-slate-400 border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleGenerate}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/5"
        >
          <Dice5 size={14} />
          <span>Roll New {category}</span>
        </button>

        {/* Output Preview */}
        {generatedName && (
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-100">{generatedName}</span>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {category}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">{generatedSnippet}</p>

            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
              {Object.entries(generatedProperties).map(([k, v]) => (
                <span key={k} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400 border border-white/5 font-mono">
                  <span className="text-slate-500">{k}:</span> {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Folder Select & Add Card */}
        {generatedName && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none max-w-[200px]"
            >
              <option value="">(No Folder / Root)</option>
              {folders
                ?.filter(f => f.category === 'cards')
                .map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
            </select>

            <button
              type="button"
              onClick={handleSaveToCard}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Plus size={13} />
              <span>Save as Card</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
