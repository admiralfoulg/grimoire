import React, { useState } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { VaultService } from '../services/vault';
import { 
  X, 
  Download, 
  Upload, 
  Globe, 
  Plus, 
  HardDrive,
  Database,
  CheckCircle2
} from 'lucide-react';

export const VaultSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { worlds, currentWorld, selectWorld, createWorld, init, cards, maps, relationships } = useGrimoireStore();
  const [newWorldName, setNewWorldName] = useState('');
  const [newWorldGenre, setNewWorldGenre] = useState('Fantasy');
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await VaultService.exportFullVault();
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Restoring vault data...');
      await VaultService.importVaultFile(file);
      await init();
      setImportStatus('Vault restored successfully!');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      setImportStatus(`Import failed: ${err.message}`);
    }
  };

  const handleCreateWorldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorldName.trim()) return;
    await createWorld(newWorldName.trim(), newWorldGenre);
    setNewWorldName('');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div 
        className="w-[620px] bg-[#12151c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#151922]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Database size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Grimoire Vault & Worlds</h2>
              <p className="text-[10px] text-slate-500">Offline database management and backups</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-6 max-h-[520px] overflow-y-auto">
          
          {/* Section 1: Backup & Restore */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HardDrive size={13} className="text-amber-400" /> Vault Backup (.grimoire)
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 p-3.5 bg-black/30 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-xl text-xs font-semibold text-slate-200 hover:text-amber-300 transition-all"
              >
                <Download size={15} className="text-amber-400" />
                <span>{isExporting ? 'Exporting...' : 'Export Complete Vault'}</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-3.5 bg-black/30 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-xl text-xs font-semibold text-slate-200 hover:text-blue-300 transition-all cursor-pointer">
                <Upload size={15} className="text-blue-400" />
                <span>Import Backup File</span>
                <input
                  type="file"
                  accept=".grimoire,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="text-[11px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-2">
                <CheckCircle2 size={13} className="text-amber-400" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-white/5" />

          {/* Section 2: Manage Worlds */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe size={13} className="text-amber-400" /> Realm Switcher ({worlds.length})
            </h3>

            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {worlds.map(w => (
                <div
                  key={w.id}
                  onClick={() => selectWorld(w.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    currentWorld?.id === w.id
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-black/20 border-white/5 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold truncate">{w.name}</span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-slate-500">
                      {w.genre}
                    </span>
                  </div>
                  {currentWorld?.id === w.id && (
                    <span className="text-[10px] font-bold text-amber-400">ACTIVE</span>
                  )}
                </div>
              ))}
            </div>

            {/* Create World Form */}
            <form onSubmit={handleCreateWorldSubmit} className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="New Realm Name..."
                value={newWorldName}
                onChange={e => setNewWorldName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
              />
              <select
                value={newWorldGenre}
                onChange={e => setNewWorldGenre(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
              >
                <option value="Fantasy">Fantasy</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Cyberpunk">Cyberpunk</option>
                <option value="Steampunk">Steampunk</option>
                <option value="Horror">Horror</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus size={13} /> Add
              </button>
            </form>
          </div>

          <div className="w-full h-px bg-white/5" />

          {/* Section 3: Live Storage Stats */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
            <span>{cards.length} Cards</span>
            <span>•</span>
            <span>{maps.length} Atlas Maps</span>
            <span>•</span>
            <span>{relationships.length} Nexus Links</span>
            <span>•</span>
            <span>IndexedDB 100% Local</span>
          </div>

        </div>
      </div>
    </div>
  );
};
