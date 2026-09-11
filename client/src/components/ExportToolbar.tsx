import React, { useState } from 'react';
import { Download, ExternalLink, RefreshCw, Check, Image as ImageIcon } from 'lucide-react';
import { ExportFormat } from '../types';

interface ExportToolbarProps {
  onExport: (format: ExportFormat) => Promise<void>;
  onRefresh: () => void;
  onOpenWebsite: () => void;
  hasResult: boolean;
  isProcessing: boolean;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  onExport,
  onRefresh,
  onOpenWebsite,
  hasResult,
  isProcessing,
}) => {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null);

  const handleExportClick = async (format: ExportFormat) => {
    if (exportingFormat || isProcessing || !hasResult) return;
    setExportingFormat(format);
    try {
      await onExport(format);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } finally {
      setExportingFormat(null);
    }
  };

  if (!hasResult) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Secondary Actions: Open Website & Capture Again / Refresh */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
        <button
          type="button"
          onClick={onOpenWebsite}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
          <span>OPEN WEBSITE</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>CAPTURE AGAIN</span>
        </button>
      </div>

      {/* Export Buttons: PNG, JPG, WEBP */}
      <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-lg">
        <span className="text-[11px] font-mono text-slate-400 px-2 hidden sm:inline flex items-center gap-1">
          <Download className="w-3.5 h-3.5 text-indigo-400" /> EXPORT:
        </span>

        {(['png', 'jpg', 'webp'] as ExportFormat[]).map((fmt) => {
          const isCurrent = exportingFormat === fmt;
          const isCopied = copiedFormat === fmt;

          return (
            <button
              key={fmt}
              type="button"
              disabled={isProcessing || Boolean(exportingFormat)}
              onClick={() => handleExportClick(fmt)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono uppercase transition-all shadow-sm active:scale-95 cursor-pointer ${
                fmt === 'png'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/5'
              }`}
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : isCurrent ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ImageIcon className="w-3 h-3 opacity-70" />
              )}
              <span>{fmt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
