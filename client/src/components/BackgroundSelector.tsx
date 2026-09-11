import React from 'react';
import { Palette, Sparkles, Check, Wand2 } from 'lucide-react';
import { BackgroundOption, ThemePalette } from '../types';

export const BACKGROUND_PRESETS: BackgroundOption[] = [
  {
    id: 'auto-match',
    name: 'Auto Match Website (Smart)',
    type: 'auto',
    previewColor: 'linear-gradient(135deg, #f43f5e, #8b5cf6, #06b6d4)',
    textColor: 'light',
  },
  {
    id: 'studio-dark',
    name: 'Studio Dark',
    type: 'gradient',
    previewColor: 'linear-gradient(135deg, #1e293b, #0f172a)',
    style: {
      background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 60%, #020617 100%)',
    },
    textColor: 'light',
  },
  {
    id: 'aurora-glow',
    name: 'Aurora Indigo',
    type: 'gradient',
    previewColor: 'linear-gradient(135deg, #4338ca, #1e1b4b)',
    style: {
      background: 'radial-gradient(circle at 60% 40%, rgba(99, 102, 241, 0.35) 0%, rgba(30, 27, 75, 0.8) 50%, #090a0f 100%), #090a0f',
    },
    textColor: 'light',
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    type: 'gradient',
    previewColor: 'linear-gradient(135deg, #7c3aed, #2e1065)',
    style: {
      background: 'radial-gradient(circle at 40% 30%, rgba(139, 92, 246, 0.3) 0%, rgba(46, 16, 101, 0.9) 60%, #030712 100%), #030712',
    },
    textColor: 'light',
  },
  {
    id: 'ocean-teal',
    name: 'Deep Ocean',
    type: 'gradient',
    previewColor: 'linear-gradient(135deg, #0d9488, #042f2e)',
    style: {
      background: 'radial-gradient(circle at 50% 30%, rgba(20, 184, 166, 0.3) 0%, rgba(4, 47, 46, 0.9) 60%, #020617 100%), #020617',
    },
    textColor: 'light',
  },
  {
    id: 'sunset-warm',
    name: 'Warm Sunset',
    type: 'gradient',
    previewColor: 'linear-gradient(135deg, #ea580c, #7c2d12)',
    style: {
      background: 'radial-gradient(circle at 50% 30%, rgba(249, 115, 22, 0.25) 0%, rgba(124, 45, 18, 0.8) 60%, #090a0f 100%), #090a0f',
    },
    textColor: 'light',
  },
  {
    id: 'studio-light',
    name: 'Clean Light',
    type: 'gradient',
    previewColor: 'linear-gradient(135deg, #f8fafc, #cbd5e1)',
    style: {
      background: 'radial-gradient(circle at 50% 30%, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)',
    },
    textColor: 'dark',
  },
  {
    id: 'pastel-mesh',
    name: 'Soft Pastel',
    type: 'gradient',
    previewColor: 'linear-gradient(135deg, #ddd6fe, #bae6fd)',
    style: {
      background: 'linear-gradient(135deg, #ede9fe 0%, #e0f2fe 50%, #fbcfe8 100%)',
    },
    textColor: 'dark',
  },
  {
    id: 'solid-black',
    name: 'Pure Black',
    type: 'solid',
    previewColor: '#000000',
    style: { background: '#000000' },
    textColor: 'light',
  },
  {
    id: 'solid-white',
    name: 'Pure White',
    type: 'solid',
    previewColor: '#ffffff',
    style: { background: '#ffffff' },
    textColor: 'dark',
  },
  {
    id: 'transparent',
    name: 'Transparent',
    type: 'transparent',
    previewColor: 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 12px 12px',
    style: { background: 'transparent' },
    textColor: 'light',
  },
];

interface BackgroundSelectorProps {
  selectedBg: string;
  onSelectBg: (bgId: string) => void;
  customColor: string;
  onCustomColorChange: (color: string) => void;
  palette?: ThemePalette;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBg,
  onSelectBg,
  customColor,
  onCustomColorChange,
  palette,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 my-3 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
        <Palette className="w-4 h-4 text-indigo-400" />
        <span className="font-semibold text-slate-200">BACKGROUND & DECOR:</span>
      </div>

      {/* Background Color Swatches */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Auto Match Button */}
        <button
          type="button"
          onClick={() => onSelectBg('auto-match')}
          title={palette ? `Auto Match: ${palette.primary}` : 'Auto Match Website Colors'}
          className={`relative group px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer shadow-sm ${
            selectedBg === 'auto-match'
              ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900 scale-105'
              : 'bg-slate-800/90 text-slate-300 hover:text-white border border-white/10 hover:border-purple-500/40'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
          <span>Auto Match</span>
          {palette && (
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/30 ml-0.5"
              style={{ background: palette.primary }}
            />
          )}
        </button>

        {BACKGROUND_PRESETS.filter((b) => b.id !== 'auto-match').map((bg) => {
          const isSelected = selectedBg === bg.id;

          return (
            <button
              key={bg.id}
              type="button"
              onClick={() => onSelectBg(bg.id)}
              title={bg.name}
              className={`relative group w-7 h-7 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                isSelected
                  ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-110'
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={{ background: bg.previewColor }}
            >
              {isSelected && (
                <Check
                  className={`w-3.5 h-3.5 ${
                    bg.textColor === 'dark' ? 'text-slate-900' : 'text-white'
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* Custom Color Input */}
        <div className="relative flex items-center gap-1.5 pl-2 border-l border-white/10">
          <label
            title="Choose custom background color"
            className={`relative w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm ${
              selectedBg === 'custom'
                ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-110'
                : 'hover:scale-105 opacity-80 hover:opacity-100'
            }`}
            style={{ background: customColor }}
          >
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                onCustomColorChange(e.target.value);
                onSelectBg('custom');
              }}
              className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
            />
            {selectedBg === 'custom' && <Check className="w-3.5 h-3.5 text-white invert" />}
          </label>
        </div>
      </div>
    </div>
  );
};
