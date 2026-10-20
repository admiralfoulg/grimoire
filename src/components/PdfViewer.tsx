import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ExternalLink, 
  Maximize2, 
  BookOpen, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

export const PdfViewer: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>('Rulebook Reference');
  const [zoom, setZoom] = useState<number>(100);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setPdfTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleLoadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setPdfUrl(urlInput.trim());
      setPdfTitle('Rulebook (Remote)');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-slate-200 select-none overflow-hidden">
      {/* PDF Action Bar */}
      <div className="h-10 px-4 border-b border-white/5 bg-[#121824] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-red-400" />
          <span className="text-xs font-semibold tracking-wide text-slate-200 truncate max-w-xs">
            {pdfTitle}
          </span>
          {pdfUrl && (
            <span className="text-[10px] text-slate-500 font-mono ml-1">
              ({zoom}%)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {pdfUrl && (
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
                className="px-2 py-1 rounded-lg hover:bg-white/10 text-[11px] text-slate-400 hover:text-white transition-colors font-mono"
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
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Open in Pop-out Browser Window"
              >
                <ExternalLink size={14} />
              </a>
            </>
          )}

          <button
            onClick={() => setShowUrlInput(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10 text-xs"
            title="Load PDF via URL"
          >
            <LinkIcon size={12} />
            <span>Load URL</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-red-200 transition-colors text-xs font-medium"
          >
            <Upload size={12} />
            <span>Open PDF</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* URL Input Strip */}
      {showUrlInput && (
        <form onSubmit={handleLoadUrl} className="px-4 py-2 bg-[#161d2a] border-b border-white/10 flex items-center gap-2">
          <input
            type="url"
            placeholder="Paste PDF link (e.g. https://.../rules.pdf)"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            className="flex-1 bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-red-400/50"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium border border-red-500/30 transition-colors"
          >
            Load
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-2 py-1.5 rounded-lg hover:bg-white/10 text-slate-400 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* PDF Content Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#090d14]">
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#zoom=${zoom}`}
            title={pdfTitle}
            className="w-full h-full border-none"
            style={{ filter: 'contrast(102%)' }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-xl">
              <BookOpen size={30} />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">No Rulebook Loaded</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
              Open a local tabletop RPG rulebook, campaign module, or monster manual PDF to view side-by-side with your campaign notes.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-medium text-xs shadow-md transition-all"
              >
                <Upload size={14} />
                <span>Upload Rulebook File</span>
              </button>
              <button
                onClick={() => setShowUrlInput(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-medium text-xs transition-all"
              >
                <LinkIcon size={14} />
                <span>Enter PDF Web URL</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
