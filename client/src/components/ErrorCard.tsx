import React from 'react';
import { AlertTriangle, RefreshCw, Globe, ShieldAlert, WifiOff, Clock } from 'lucide-react';
import { CaptureResult } from '../types';

interface ErrorCardProps {
  errorResult: CaptureResult;
  onRetry: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ errorResult, onRetry }) => {
  const getErrorIcon = () => {
    switch (errorResult.errorCategory) {
      case 'timeout':
        return <Clock className="w-8 h-8 text-amber-400" />;
      case 'dns':
        return <Globe className="w-8 h-8 text-rose-400" />;
      case 'ssl':
        return <ShieldAlert className="w-8 h-8 text-amber-400" />;
      case 'captcha':
        return <ShieldAlert className="w-8 h-8 text-indigo-400" />;
      default:
        return <WifiOff className="w-8 h-8 text-rose-400" />;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto my-12 px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-rose-500/20 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 shadow-inner">
          {getErrorIcon()}
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2">
          Không thể tải website này.
        </h3>

        <p className="text-xs sm:text-sm text-slate-400 font-mono mb-6 max-w-md bg-black/40 p-3 rounded-xl border border-white/5">
          {errorResult.error || 'Website unavailable or connection timed out.'}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold tracking-wide uppercase transition-all shadow-lg shadow-rose-600/20 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>TRY AGAIN</span>
        </button>
      </div>
    </div>
  );
};
