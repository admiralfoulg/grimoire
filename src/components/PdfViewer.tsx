import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles,
  Clipboard,
  Split,
  Check,
  ChevronRight,
  ChevronDown,
  Shield,
  Heart,
  Zap,
  Swords,
  X,
  FileText, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ExternalLink, 
  BookOpen, 
  Link as LinkIcon,
  Plus,
  Trash2,
  Library,
  ArrowLeft,
  Calendar,
  HardDrive
} from 'lucide-react';
import { useGrimoireStore } from '../store/useGrimoireStore';
import { parseRawStatblockText, DEFAULT_PRESETS } from './StatblockView';
import type { CardBlock, StatblockData } from '../services/storage';

export const PdfViewer: React.FC<{ pdfId?: string }> = ({ pdfId }) => {
    const { pdfs, activePdfId, setActivePdf, addPdf, deletePdf, openTab, createCard, updateCard, openToSide } = useGrimoireStore();
  const [isExtractorOpen, setIsExtractorOpen] = useState(false);
  const [extractorText, setExtractorText] = useState('');
  const [creatureName, setCreatureName] = useState('');
  const [extractedData, setExtractedData] = useState<Partial<StatblockData> | null>(null);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [zoom, setZoom] = useState<number>(100);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});

  const effectivePdfId = pdfId || activePdfId;
  const activeDoc = pdfs.find(p => p.id === effectivePdfId);

  
  const handleRunParser = (text: string) => {
    setExtractorText(text);
    if (!text.trim()) {
      setExtractedData(null);
      return;
    }
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && !creatureName) {
      setCreatureName(lines[0].replace(/^[#*_s]+/, '').replace(/[*_]+$/, ''));
    }
    const parsed = parseRawStatblockText(text);
    setExtractedData(parsed);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) handleRunParser(text);
    } catch {
      // Fallback if browser permission is blocked
    }
  };

  const handleCreateExtractedCard = async (openBeside: boolean = true) => {
    if (!extractedData) return;
    const name = creatureName.trim() || 'Extracted Creature';
    const baseStatblock = JSON.parse(JSON.stringify(DEFAULT_PRESETS.custom.data)) as StatblockData;
    
    const finalStatblock: StatblockData = {
      ...baseStatblock,
      ...extractedData,
      abilities: {
        ...baseStatblock.abilities,
        ...(extractedData.abilities || {})
      },
      traits: extractedData.traits && extractedData.traits.length > 0 ? extractedData.traits : baseStatblock.traits,
      actions: extractedData.actions && extractedData.actions.length > 0 ? extractedData.actions : baseStatblock.actions
    };

    const newCard = await createCard(name, 'monster');
    const statblockBlock: CardBlock = {
      id: crypto.randomUUID(),
      title: name + ' Statblock',
      content: '',
      width: 'full',
      blockType: 'statblock',
      collapsed: false,
      statblock: finalStatblock
    };

    await updateCard({
      ...newCard,
      blocks: [statblockBlock]
    });

    setExtractSuccess(true);
    setTimeout(() => setExtractSuccess(false), 2000);

    if (openBeside && openToSide) {
      openToSide({ id: newCard.id, title: newCard.name, type: 'card' });
    } else {
      openTab({ id: newCard.id, title: newCard.name, type: 'card' });
    }
  };

  // Generate / manage safe object URLs for Blob PDFs
  useEffect(() => {
    const urls: Record<string, string> = {};
    pdfs.forEach(pdf => {
      if (pdf.sourceType === 'file' && pdf.fileData instanceof Blob) {
        urls[pdf.id] = URL.createObjectURL(pdf.fileData);
      } else if (pdf.sourceType === 'url' && typeof pdf.fileData === 'string') {
        urls[pdf.id] = pdf.fileData;
      }
    });
    setObjectUrls(urls);

    return () => {
      Object.values(urls).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [pdfs]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const title = titleInput.trim() || file.name.replace(/\.[^/.]+$/, '');
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      await addPdf(title, file, 'file', file.name, sizeMb);
      setShowAddModal(false);
      setTitleInput('');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsUploading(true);
    try {
      const title = titleInput.trim() || 'Rulebook Reference';
      await addPdf(title, urlInput.trim(), 'url', urlInput.trim(), 'Remote URL');
      setShowAddModal(false);
      setUrlInput('');
      setTitleInput('');
    } finally {
      setIsUploading(false);
    }
  };

  const currentPdfUrl = activeDoc ? objectUrls[activeDoc.id] : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-slate-200 select-none overflow-hidden relative">
      {/* Top Header / Action Bar */}
      <div className="h-10 px-4 border-b border-white/5 bg-[#121824] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {activeDoc ? (
            <>
              <button
                onClick={() => setActivePdf('rulebook-shelf')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-amber-300 text-xs transition-colors"
                title="Back to Rulebook Library Shelf"
              >
                <ArrowLeft size={13} />
                <span>Library</span>
              </button>
              <div className="h-3 w-px bg-white/10" />
              <FileText size={15} className="text-red-400 shrink-0" />
              <span className="text-xs font-semibold tracking-wide text-slate-200 truncate max-w-sm">
                {activeDoc.title}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({zoom}%)</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Library size={15} className="text-red-400" />
              <span className="text-xs font-semibold tracking-wide text-slate-200">
                Campaign Rulebook Library
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full font-mono">
                {pdfs.length} {pdfs.length === 1 ? 'doc' : 'docs'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeDoc && currentPdfUrl && (
            <>
              <button
                onClick={() => setZoom(prev => Math.max(50, prev - 15))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="px-2 py-0.5 rounded hover:bg-white/10 text-[11px] text-slate-400 hover:text-white transition-colors font-mono"
                title="Reset Zoom"
              >
                100%
              </button>
              <button
                onClick={() => setZoom(prev => Math.min(200, prev + 15))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>

              <div className="h-4 w-px bg-white/10 mx-1" />

              <a
                href={currentPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Open in Pop-out Browser Window"
              >
                <ExternalLink size={14} />
                </a>

                {/* Extract Statblock Toolbar Button */}
                <button
                  onClick={() => setIsExtractorOpen(!isExtractorOpen)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-all shrink-0 ${
                    isExtractorOpen
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                  title="Extract Statblock from Rulebook"
                >
                  <Sparkles size={13} className="text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Extract</span>
                </button>

                <div className="h-4 w-px bg-white/10 mx-1" />
            </>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-red-200 transition-colors text-xs font-medium"
          >
            <Plus size={13} />
            <span>Add Rulebook</span>
          </button>
        </div>
      </div>

      {/* Main Content: Viewer or Shelf */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#090d14]">
        {activeDoc && currentPdfUrl ? (
          <iframe
            key={activeDoc.id}
            src={`${currentPdfUrl}#zoom=${zoom}`}
            title={activeDoc.title}
            className="w-full h-full border-none"
          />
        ) : (
          /* Rulebook Shelf / Library View */
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <BookOpen size={20} className="text-red-400" />
                    <span>Rulebooks & Document Shelf</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Store and organize game master guides, monster manuals, rulebooks, and player handouts for quick reference.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-medium text-xs shadow-md transition-all"
                >
                  <Plus size={14} />
                  <span>Add to Campaign Shelf</span>
                </button>
              </div>

              {pdfs.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-xl">
                    <Library size={32} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200 mb-1">Your Rulebook Shelf is Empty</h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                    Add your campaign's core rulebook PDFs, monster compendiums, or handout sheets to keep them accessible in tabs while DMing.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-medium text-xs shadow-md transition-all"
                  >
                    <Plus size={14} />
                    <span>Add First Rulebook</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pdfs.map(pdf => (
                    <div
                      key={pdf.id}
                      onClick={() => {
                        setActivePdf(pdf.id);
                        openTab({ id: pdf.id, title: pdf.title, type: 'pdf' });
                      }}
                      className="group p-4 rounded-xl bg-[#121824] hover:bg-[#161f30] border border-white/5 hover:border-red-500/30 transition-all cursor-pointer flex flex-col justify-between shadow-lg relative"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 group-hover:scale-105 transition-transform">
                            <FileText size={20} />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove "${pdf.title}" from this campaign?`)) {
                                deletePdf(pdf.id);
                              }
                            }}
                            className="p-1.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Rulebook"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-red-300 transition-colors line-clamp-1 mb-1">
                          {pdf.title}
                        </h3>
                        {pdf.fileName && (
                          <p className="text-[11px] text-slate-500 font-mono truncate mb-3">
                            {pdf.fileName}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <HardDrive size={11} />
                          {pdf.fileSize || (pdf.sourceType === 'url' ? 'Web Link' : 'Stored')}
                        </span>
                        <span className="text-red-400 font-sans group-hover:translate-x-0.5 transition-transform">
                          Open →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>


        {/* TEXT-TO-STATBLOCK EXTRACTION DRAWER */}
        {isExtractorOpen && (
          <div className="w-80 sm:w-96 border-l border-white/10 bg-[#111622] flex flex-col h-full shadow-2xl z-30 shrink-0 font-sans animate-in slide-in-from-right duration-200 absolute right-0 top-0 bottom-0">
            {/* Drawer Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Statblock Extractor</span>
              </div>
              <button
                onClick={() => setIsExtractorOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Name & Quick Paste Actions */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Creature Name</label>
                  <button
                    onClick={handlePasteClipboard}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                    title="Paste text from clipboard"
                  >
                    <Clipboard size={11} /> Paste Clipboard
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Invisible Stalker"
                  value={creatureName}
                  onChange={e => setCreatureName(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Text Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Raw Statblock Text</label>
                <textarea
                  rows={8}
                  placeholder="Paste monster statblock from rulebook (AC, HP, Speed, Stats, Actions)..."
                  value={extractorText}
                  onChange={e => handleRunParser(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[11px] text-slate-300 font-mono outline-none resize-none focus:border-amber-400/50 leading-relaxed placeholder:text-slate-600"
                />
              </div>

              {/* Real-time Parser Preview */}
              {extractedData && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Parsed Preview</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">AC</div>
                      <div className="font-bold text-amber-400 font-mono">{extractedData.armorClass ?? 10}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">HP</div>
                      <div className="font-bold text-red-400 font-mono">{extractedData.hitPoints ?? 10}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">Speed</div>
                      <div className="font-bold text-blue-400 font-mono truncate">{extractedData.speed ?? '30 ft'}</div>
                    </div>
                  </div>

                  {extractedData.abilities && (
                    <div className="grid grid-cols-6 gap-1 text-center text-[10px] font-mono pt-1">
                      {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                        <div key={stat} className="bg-white/5 p-1 rounded">
                          <div className="text-[8px] text-slate-500 uppercase">{stat}</div>
                          <div className="text-slate-200">{extractedData.abilities?.[stat as keyof StatblockData['abilities']] ?? 10}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <span>Traits: <b className="text-slate-200">{extractedData.traits?.length ?? 0}</b></span>
                    <span>Actions: <b className="text-slate-200">{extractedData.actions?.length ?? 0}</b></span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-white/10 flex flex-col gap-2 bg-black/40">
              <button
                disabled={!extractedData}
                onClick={handleCreateExtractedCard}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {extractSuccess ? <Check size={14} className="text-emerald-400" /> : <Split size={14} />}
                <span>{extractSuccess ? 'Creature Card Created!' : 'Create Card (Split View)'}</span>
              </button>
            </div>
          </div>
        )}

      
        {/* Floating Action Button for Narrow Split Screens */}
        {activeDoc && !isExtractorOpen && (
          <button
            onClick={() => setIsExtractorOpen(true)}
            className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-2xl transition-all shadow-amber-500/30 hover:scale-105"
            title="Open Statblock Extractor"
          >
            <Sparkles size={14} className="text-black" />
            <span>Extract Statblock</span>
          </button>
        )}

        {/* Slide-out Extraction Drawer */}
        {isExtractorOpen && (
          <div className="w-80 sm:w-96 border-l border-white/10 bg-[#111622] flex flex-col h-full shadow-2xl z-30 shrink-0 font-sans animate-in slide-in-from-right duration-200 absolute right-0 top-0 bottom-0">
            {/* Drawer Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Statblock Extractor</span>
              </div>
              <button
                onClick={() => setIsExtractorOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Name & Quick Paste Actions */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Creature Name</label>
                  <button
                    onClick={handlePasteClipboard}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                    title="Paste text from clipboard"
                  >
                    <Clipboard size={11} /> Paste Clipboard
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Githyanki Warrior"
                  value={creatureName}
                  onChange={e => setCreatureName(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Text Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Raw Statblock Text</label>
                <textarea
                  rows={8}
                  placeholder="Paste creature text here (Armor Class, Hit Points, Speed, STR/DEX/CON, Actions)..."
                  value={extractorText}
                  onChange={e => handleRunParser(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[11px] text-slate-300 font-mono outline-none resize-none focus:border-amber-400/50 leading-relaxed placeholder:text-slate-600"
                />
              </div>

              {/* Real-time Parser Preview */}
              {extractedData && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Parsed Preview</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">AC</div>
                      <div className="font-bold text-amber-400 font-mono">{extractedData.armorClass ?? 10}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">HP</div>
                      <div className="font-bold text-red-400 font-mono">{extractedData.hitPoints ?? 10}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <div className="text-[9px] text-slate-500 uppercase">Speed</div>
                      <div className="font-bold text-blue-400 font-mono truncate">{extractedData.speed ?? '30 ft'}</div>
                    </div>
                  </div>

                  {extractedData.abilities && (
                    <div className="grid grid-cols-6 gap-1 text-center text-[10px] font-mono pt-1">
                      {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                        <div key={stat} className="bg-white/5 p-1 rounded">
                          <div className="text-[8px] text-slate-500 uppercase">{stat}</div>
                          <div className="text-slate-200">{extractedData.abilities?.[stat as keyof StatblockData['abilities']] ?? 10}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <span>Traits: <b className="text-slate-200">{extractedData.traits?.length ?? 0}</b></span>
                    <span>Actions: <b className="text-slate-200">{extractedData.actions?.length ?? 0}</b></span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-white/10 flex flex-col gap-2 bg-black/40">
              <button
                disabled={!extractedData}
                onClick={handleCreateExtractedCard}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {extractSuccess ? <Check size={14} className="text-emerald-400" /> : <Split size={14} />}
                <span>{extractSuccess ? 'Creature Card Created!' : 'Create Card (Split View)'}</span>
              </button>
            </div>
          </div>
        )}

      {/* Add Rulebook Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#121824] border border-white/10 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} />
                <span>Add Rulebook or Handout</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white text-sm">✕</button>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-lg bg-black/40 p-1 border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setAddMode('upload')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${addMode === 'upload' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setAddMode('url')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${addMode === 'url' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                Web URL
              </button>
            </div>

            {/* Title Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-400">Rulebook Title</label>
              <input
                type="text"
                placeholder="e.g. Core Rules, Monster Manual, House Rules"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-red-400"
              />
            </div>

            {addMode === 'upload' ? (
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-white/15 hover:border-red-400/50 rounded-xl bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <Upload size={24} className="text-red-400" />
                  <span className="text-xs font-medium">Click to select PDF document</span>
                  <span className="text-[10px] text-slate-500">Supports standard tabletop rulebook PDFs</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddUrl} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400">PDF Web Link</label>
                  <input
                    type="url"
                    placeholder="https://example.com/rules.pdf"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    required
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-red-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold transition-all mt-2"
                >
                  Save to Shelf
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
