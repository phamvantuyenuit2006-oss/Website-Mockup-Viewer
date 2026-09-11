import React from 'react';

interface LaptopMockupProps {
  screenshotUrl?: string;
  websiteTitle?: string;
  isFullPage?: boolean;
}

export const LaptopMockup: React.FC<LaptopMockupProps> = ({
  screenshotUrl,
  websiteTitle = 'Desktop Preview',
  isFullPage = false,
}) => {
  return (
    <div className="relative w-full max-w-[800px] mx-auto flex flex-col items-center select-none">
      {/* Laptop Screen Lid / Display Housing (Silver/Space Gray Anodized Aluminum) */}
      <div className="relative w-full bg-gradient-to-b from-[#2d303a] to-[#1e2029] rounded-t-[18px] p-[8px] sm:p-[12px] shadow-2xl border border-slate-600/40">
        {/* Inner Black Bezel */}
        <div className="relative bg-[#0a0b10] rounded-t-[12px] overflow-hidden border border-black/90 flex flex-col aspect-[16/10] shadow-inner">
          {/* Top Notch & Camera */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[13px] w-[100px] sm:w-[130px] bg-[#0a0b10] rounded-b-[8px] z-30 flex items-center justify-center gap-2 border-b border-x border-white/5">
            <div className="w-2 h-2 rounded-full bg-[#161822] ring-1 ring-white/10 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#052b42]" />
            </div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
          </div>

          {/* Screen Content */}
          <div
            className={`relative w-full h-full bg-[#0d0e14] overflow-hidden ${
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
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-[#12131c] p-6">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
                  <div className="w-6 h-6 border-2 border-dashed border-slate-500 rounded" />
                </div>
                <p className="text-xs font-mono">Loading desktop website...</p>
              </div>
            )}

            {/* Glass anti-glare reflection */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-60" />
          </div>
        </div>
      </div>

      {/* Laptop Base Deck (Realistic Aluminum Top Surface & Keyboard Well in 3D Perspective) */}
      <div className="relative w-[104%] bg-gradient-to-b from-[#b8bcc6] via-[#9da2af] to-[#737885] h-[28px] sm:h-[38px] rounded-b-[16px] shadow-2xl border-t border-white/40 flex flex-col items-center px-4 pt-1">
        {/* Hinge Line */}
        <div className="w-1/3 h-[3px] bg-[#1a1c24] rounded-full opacity-80" />

        {/* Keyboard Well Outline / Touchpad indentation */}
        <div className="w-full flex items-center justify-center gap-2 mt-1">
          {/* Subtle Trackpad Groove */}
          <div className="w-24 sm:w-36 h-[8px] sm:h-[12px] bg-gradient-to-b from-[#a6abb7] to-[#8d93a2] rounded-[4px] border-t border-white/20 border-b border-black/20" />
        </div>

        {/* Front Opening Thumb Notch */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 sm:w-24 h-[3px] bg-[#3a3e4a] rounded-t-sm" />
      </div>

      {/* Bottom Soft Contact Shadow on Surface */}
      <div className="w-[94%] h-8 sm:h-12 bg-black/50 blur-xl rounded-full -mt-4 -z-10" />
    </div>
  );
};
