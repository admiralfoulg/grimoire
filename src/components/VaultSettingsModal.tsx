import React, { useState, useRef, useEffect } from 'react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { VaultService } from '../services/vault';
import { ObsidianService } from '../services/obsidian';
import { 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  FolderArchive,
  FolderTree
} from 'lucide-react';

interface VaultSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultSettingsModal: React.FC<VaultSettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentWorld, worlds, cards, maps, combats, sessions, loadWorldData } = useGrimoireStore();
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  const snapshotInputRef = useRef<HTMLInputElement | null>(null);
  const obsidianFolderRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (obsidianFolderRef.current) {
      obsidianFolderRef.current.setAttribute('webkitdirectory', '');
      obsidianFolderRef.current.setAttribute('directory', '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await VaultService.exportCampaignSnapshot();
      setStatusMessage({ text: 'Backup downloaded successfully!', isError: false });
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Export failed.', isError: true });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSnapshotImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage({ text: 'Restoring snapshot...', isError: false });
    const res = await VaultService.importCampaignSnapshot(file);

    if (res.success) {
      setStatusMessage({ text: `${res.message} Reloading workstation...`, isError: false });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setStatusMessage({ text: res.message, isError: true });
    }
    e.target.value = '';
  };

  const handleObsidianFolderImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const targetWorldId = currentWorld?.id || worlds[0]?.id || 'default-world';

    setStatusMessage({ text: `Scanning folder and parsing nested directory tree...`, isError: false });
    const res = await ObsidianService.importObsidianFiles(files, targetWorldId);

    if (res.importedCards > 0) {
      setStatusMessage({ 
        text: `Imported ${res.importedCards} notes across ${res.importedFolders} nested folders with [[WikiLinks]] preserved!`, 
        isError: false 
      });
      if (loadWorldData && targetWorldId) {
        await loadWorldData(targetWorldId);
      }
      setTimeout(() => {
        window.location.reload();
      }, 1600);
    } else {
      setStatusMessage({ 
        text: res.errors[0] || 'No markdown files were found in that folder.', 
        isError: true 
      });
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <input
        ref={snapshotInputRef}
        type="file"
        accept=".grimoire,.json"
        className="hidden"
        onChange={handleSnapshotImport}
      />
      <input
        ref={obsidianFolderRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleObsidianFolderImport}
      />

      <div className="w-full max-w-md bg-[#121620] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/5 flex items-center justify-between bg-[#151b27]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <FolderArchive size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Campaign Vault & Backup</h3>
              <p className="text-[10px] text-slate-500">Local-first IndexedDB snapshot manager</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 text-slate-300">
          
          <div className="grid grid-cols-4 gap-2 bg-[#0c1017] p-3 rounded-xl border border-white/5 text-center">
            <div>
              <div className="text-base font-bold font-mono text-amber-400">{cards.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Cards</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-blue-400">{maps.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Maps</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-red-400">{combats?.length || 0}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Combats</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-emerald-400">{sessions?.length || 0}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Logs</div>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              statusMessage.isError 
                ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              {statusMessage.isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
              <span className="flex-1 leading-snug">{statusMessage.text}</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {/* Obsidian Nested Folder Import */}
            <button
              onClick={() => obsidianFolderRef.current?.click()}
              className="flex items-center justify-between p-3.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/30 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 group-hover:scale-110 transition-transform">
                  <FolderTree size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-200">Import Obsidian Vault Folder</div>
                  <div className="text-[10px] text-purple-300/70">Preserves nested subfolders, categories & [[WikiLinks]]</div>
                </div>
              </div>
            </button>

            {/* Grimoire Snapshot Export */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#171e2c] hover:bg-[#1c2536] border border-white/10 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                  <Download size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Export Snapshot (.grimoire)</div>
                  <div className="text-[10px] text-slate-400">Save complete database to a single portable file</div>
                </div>
              </div>
            </button>

            {/* Grimoire Restore */}
            <button
              onClick={() => snapshotInputRef.current?.click()}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#171e2c] hover:bg-[#1c2536] border border-white/10 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                  <Upload size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">Restore from File</div>
                  <div className="text-[10px] text-slate-400">Import a previously saved .grimoire backup archive</div>
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-white/5">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>100% offline. Zero server sync or external uploads.</span>
          </div>

        </div>
      </div>
    </div>
  );
};
