import React from 'react';
import { Laptop, Sun, Moon, Sparkles } from 'lucide-react';
import { ProgressStage } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  stage: ProgressStage;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, onToggleDarkMode, stage }) => {
  const isProcessing = stage !== 'idle' && stage !== 'completed' && stage !== 'error';

  return (
    <header className="w-full border-b border-white/5 dark:border-white/5 py-4 px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
          <Laptop className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-wider text-slate-100 dark:text-white uppercase font-mono">
              Website Mockup Viewer
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-2.5 h-2.5" /> Local v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400">
            Paste a website URL to preview it on multiple devices.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status Indicator Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 dark:bg-slate-900/80 border border-white/10 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isProcessing
                ? 'bg-amber-400 animate-ping'
                : stage === 'error'
                ? 'bg-rose-500'
                : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
            }`}
          />
          <span className="text-slate-300">
            {stage === 'idle' && 'Ready'}
            {stage === 'connecting' && 'Connecting...'}
            {stage === 'loading' && 'Loading website...'}
            {stage === 'capturing_desktop' && 'Capturing desktop...'}
            {stage === 'capturing_mobile' && 'Capturing mobile...'}
            {stage === 'rendering' && 'Rendering mockup...'}
            {stage === 'completed' && 'Ready'}
            {stage === 'error' && 'Error'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
          className="p-2 rounded-xl bg-slate-800/80 dark:bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
};
