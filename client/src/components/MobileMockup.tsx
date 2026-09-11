import React from 'react';
import { Wifi, Battery } from 'lucide-react';

interface MobileMockupProps {
  screenshotUrl?: string;
  websiteTitle?: string;
  isFullPage?: boolean;
}

export const MobileMockup: React.FC<MobileMockupProps> = ({
  screenshotUrl,
  websiteTitle = 'Mobile Preview',
  isFullPage = false,
}) => {
  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[310px] mx-auto select-none">
      {/* Side Hardware Buttons Protrusions */}
      <div className="absolute -left-[3px] top-[80px] w-[3px] h-[20px] bg-[#3a3d4f] rounded-l-sm" />
      <div className="absolute -left-[3px] top-[115px] w-[3px] h-[34px] bg-[#3a3d4f] rounded-l-sm" />
      <div className="absolute -left-[3px] top-[160px] w-[3px] h-[34px] bg-[#3a3d4f] rounded-l-sm" />
      <div className="absolute -right-[3px] top-[110px] w-[3px] h-[48px] bg-[#3a3d4f] rounded-r-sm" />

      {/* Outer Phone Frame (Dark Titanium Matte Finish) */}
      <div className="relative w-full bg-gradient-to-b from-[#353849] via-[#1f212c] to-[#14151e] p-[8px] sm:p-[10px] rounded-[44px] shadow-2xl border border-slate-600/50 ring-1 ring-white/20">
        {/* Inner Screen Bezel */}
        <div className="relative bg-black rounded-[36px] overflow-hidden aspect-[390/844] flex flex-col border border-black shadow-inner">
          {/* iOS Top Status Bar */}
          <div className="absolute top-0 inset-x-0 h-10 z-40 flex items-center justify-between px-6 text-black dark:text-white pointer-events-none select-none">
            {/* Time 9:41 */}
            <span className="text-[12px] font-bold font-sans tracking-tight text-slate-800 dark:text-slate-200">
              9:41
            </span>

            {/* Dynamic Island in Center */}
            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[84px] h-[24px] bg-black rounded-full z-50 flex items-center justify-between px-2.5 border border-white/10 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-[#12131b] ring-1 ring-white/10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#052b42]" />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#1e2230]" />
            </div>

            {/* Cellular, WiFi, Battery icons */}
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              {/* Cellular 4 bars */}
              <div className="flex items-end gap-[1.5px] h-2.5">
                <div className="w-[2px] h-[3px] bg-current rounded-xs" />
                <div className="w-[2px] h-[5px] bg-current rounded-xs" />
                <div className="w-[2px] h-[7px] bg-current rounded-xs" />
                <div className="w-[2px] h-[9px] bg-current rounded-xs" />
              </div>
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Screen Content Window */}
          <div
            className={`relative w-full h-full bg-[#090a0f] pt-8 overflow-hidden ${
              isFullPage ? 'overflow-y-auto' : ''
            }`}
          >
            {screenshotUrl ? (
              <img
                src={screenshotUrl}
                alt={websiteTitle}
                className="w-full h-full object-cover object-top block"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-[#12131c] p-4">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-2">
                  <div className="w-4 h-4 border border-dashed border-slate-500 rounded" />
                </div>
                <p className="text-[10px] font-mono text-center">Loading mobile...</p>
              </div>
            )}

            {/* Bottom iOS Home Bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/40 rounded-full z-30 pointer-events-none" />

            {/* Glass shine overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-50" />
          </div>
        </div>
      </div>

      {/* Realistic Phone Drop Shadow on table */}
      <div className="w-3/4 h-8 bg-black/60 blur-xl rounded-full mx-auto -mt-4 -z-10" />
    </div>
  );
};
