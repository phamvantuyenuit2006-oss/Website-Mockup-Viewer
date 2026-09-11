import React from 'react';
import { ProgressStage, ProgressUpdate } from '../types';
import { Radio, Globe, Monitor, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: ProgressUpdate;
}

const STAGES: { stage: ProgressStage; label: string; icon: React.FC<{ className?: string }> }[] = [
  { stage: 'connecting', label: 'Connecting...', icon: Radio },
  { stage: 'loading', label: 'Loading website...', icon: Globe },
  { stage: 'capturing_desktop', label: 'Capturing desktop...', icon: Monitor },
  { stage: 'capturing_mobile', label: 'Capturing mobile...', icon: Smartphone },
  { stage: 'rendering', label: 'Rendering mockup...', icon: Sparkles },
];

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress }) => {
  if (progress.stage === 'idle' || progress.stage === 'completed' || progress.stage === 'error') {
    return null;
  }

  const currentIdx = STAGES.findIndex((s) => s.stage === progress.stage);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/20 shadow-2xl backdrop-blur-xl">
        {/* Top title and current step status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span className="text-sm font-semibold text-slate-200 font-mono">
              {progress.message || 'Processing capture...'}
            </span>
          </div>
          <span className="text-xs font-mono text-indigo-400 font-bold">
            {progress.percent}%
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden mb-5">
          <div
            className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-400 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {/* Realtime step sequence */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-white/5">
          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            const isDone = currentIdx > idx;
            const isCurrent = currentIdx === idx;

            return (
              <div
                key={s.stage}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                    : isDone
                    ? 'text-emerald-400/80'
                    : 'text-slate-600 opacity-60'
                }`}
              >
                <div className="mb-1">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isCurrent ? 'animate-bounce text-indigo-400' : ''}`} />
                  )}
                </div>
                <span className="text-[11px] font-mono leading-tight truncate w-full">
                  {s.label.replace('...', '')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
