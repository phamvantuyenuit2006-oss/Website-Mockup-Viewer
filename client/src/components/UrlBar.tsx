import React, { useState } from 'react';
import { Globe, ArrowRight, Loader2, Monitor, Smartphone, Layers, Maximize2, Minimize2, X } from 'lucide-react';
import { ViewMode, CaptureType, ProgressStage } from '../types';

interface UrlBarProps {
  url: string;
  setUrl: (url: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  captureType: CaptureType;
  setCaptureType: (type: CaptureType) => void;
  onGenerate: (targetUrl?: string) => void;
  stage: ProgressStage;
}

const PRESETS = [
  { name: 'Apple', url: 'https://apple.com' },
  { name: 'Nike', url: 'https://nike.com' },
  { name: 'Stripe', url: 'https://stripe.com' },
  { name: 'Linear', url: 'https://linear.app' },
];

export const UrlBar: React.FC<UrlBarProps> = ({
  url,
  setUrl,
  viewMode,
  setViewMode,
  captureType,
  setCaptureType,
  onGenerate,
  stage,
}) => {
  const isProcessing = stage !== 'idle' && stage !== 'completed' && stage !== 'error';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isProcessing) return;
    onGenerate();
  };

  const handlePresetClick = (presetUrl: string) => {
    setUrl(presetUrl);
    onGenerate(presetUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-6 sm:mt-8">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-slate-900/90 dark:bg-slate-900/90 border border-slate-700/60 dark:border-white/10 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
          {/* Globe Icon */}
          <div className="hidden sm:flex items-center pl-3 text-slate-400">
            <Globe className="w-5 h-5 text-indigo-400" />
          </div>

          {/* Input field */}
          <div className="relative w-full flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com or nike.com..."
              disabled={isProcessing}
              className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 font-mono focus:outline-none disabled:opacity-60"
            />
            {url && !isProcessing && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: View Mode & Capture Type in compact form */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
            {/* View Mode Selector */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('both')}
                title="View Laptop & Mobile"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === 'both'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Both</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                title="Desktop only"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === 'desktop'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                title="Mobile only"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === 'mobile'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mobile</span>
              </button>
            </div>

            {/* Full page vs Viewport toggle */}
            <button
              type="button"
              onClick={() => setCaptureType(captureType === 'viewport' ? 'fullpage' : 'viewport')}
              title={captureType === 'viewport' ? 'Switch to Full Page capture' : 'Switch to Viewport capture'}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1 font-mono ${
                captureType === 'fullpage'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-white/5 hover:text-slate-200'
              }`}
            >
              {captureType === 'fullpage' ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px]">Full</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Viewport</span>
                </>
              )}
            </button>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isProcessing || !url.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:via-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold tracking-wide uppercase transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading</span>
                </>
              ) : (
                <>
                  <span>Generate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preset Quick Links */}
      <div className="flex items-center flex-wrap gap-2 mt-3 px-2 text-xs text-slate-400">
        <span className="text-slate-500 font-medium">Try popular websites:</span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            disabled={isProcessing}
            onClick={() => handlePresetClick(p.url)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 hover:text-indigo-300 hover:border-indigo-500/40 border border-white/5 text-slate-300 transition-all font-mono text-[11px] cursor-pointer"
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
};
