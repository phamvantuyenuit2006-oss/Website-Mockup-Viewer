import React, { forwardRef } from 'react';
import { LaptopMockup } from './LaptopMockup';
import { MobileMockup } from './MobileMockup';
import { ViewMode, CaptureResult, CaptureType } from '../types';
import { BACKGROUND_PRESETS } from './BackgroundSelector';
import { Globe, Sparkles } from 'lucide-react';

interface MockupShowcaseProps {
  captureResult: CaptureResult | null;
  viewMode: ViewMode;
  captureType: CaptureType;
  selectedBg: string;
  customColor: string;
}

export const MockupShowcase = forwardRef<HTMLDivElement, MockupShowcaseProps>(
  ({ captureResult, viewMode, captureType, selectedBg, customColor }, ref) => {
    const isFullPage = captureType === 'fullpage';
    const desktopSrc = captureResult?.desktopScreenshot;
    const mobileSrc = captureResult?.mobileScreenshot;
    const title = captureResult?.title || 'Website Mockup';
    const palette = captureResult?.palette;

    let bgStyle: React.CSSProperties = { background: 'transparent' };
    const isAutoMatch = selectedBg === 'auto-match';
    const isTransparent = selectedBg === 'transparent';

    if (isAutoMatch && palette) {
      bgStyle = { background: palette.gradient };
    } else if (isAutoMatch && !palette) {
      bgStyle = {
        background: 'radial-gradient(circle at 60% 40%, rgba(99, 102, 241, 0.35) 0%, rgba(30, 27, 75, 0.8) 50%, #090a0f 100%), #090a0f',
      };
    } else if (selectedBg === 'custom') {
      bgStyle = { background: customColor };
    } else {
      const currentPreset = BACKGROUND_PRESETS.find((b) => b.id === selectedBg);
      bgStyle = currentPreset?.style || { background: 'transparent' };
    }

    const brandColor = palette?.primary || '#6366f1';
    const brandAccent = palette?.accent || '#06b6d4';

    return (
      <div className="w-full max-w-6xl mx-auto p-2 sm:p-4">
        <div
          ref={ref}
          id="mockup-export-container"
          style={bgStyle}
          className={`w-full relative flex flex-col items-center justify-center p-6 sm:p-12 md:p-16 rounded-3xl overflow-hidden transition-all duration-700 min-h-[520px] sm:min-h-[660px] border border-white/5 ${
            isTransparent
              ? 'bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] bg-[length:20px_20px]'
              : ''
          }`}
        >
          {/* Dynamic Decor Elements: Background Mesh & Radial Glows */}
          {!isTransparent && (
            <>
              {/* Primary Brand Backlight */}
              <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] blur-[100px] rounded-full pointer-events-none -z-10 opacity-30 transition-all duration-700"
                style={{ background: brandColor }}
              />

              {/* Secondary Accent Light Spot */}
              <div
                className="absolute bottom-10 right-10 w-[400px] h-[300px] blur-[90px] rounded-full pointer-events-none -z-10 opacity-20 transition-all duration-700"
                style={{ background: brandAccent }}
              />

              {/* Subtle Ambient Grid overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
            </>
          )}

          {/* Website Branding Top Badge (Auto Decor) */}
          {captureResult?.success && !isTransparent && (
            <div className="mb-4 sm:mb-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/10 shadow-lg backdrop-blur-md text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-500">
              <span
                className="w-2 h-2 rounded-full ring-2 ring-white/20 animate-pulse"
                style={{ background: brandColor }}
              />
              <span className="text-slate-200 font-semibold max-w-[200px] sm:max-w-xs truncate">
                {title}
              </span>
              {palette?.primary && (
                <span className="text-[10px] text-slate-400 opacity-75 font-mono">
                  {palette.primary}
                </span>
              )}
            </div>
          )}

          {/* Both Mode: Laptop on Left/Center + Smartphone on Front Right */}
          {viewMode === 'both' && (
            <div className="relative w-full max-w-5xl flex flex-col items-center justify-center py-4 sm:py-6">
              {/* Laptop Component */}
              <div className="w-full max-w-[820px] transform transition-transform duration-500 hover:scale-[1.01]">
                <LaptopMockup
                  screenshotUrl={desktopSrc}
                  websiteTitle={title}
                  isFullPage={isFullPage}
                />
              </div>

              {/* Mobile Component positioned overlapping on the bottom right */}
              <div className="mt-[-110px] sm:mt-[-160px] md:mt-[-190px] self-end sm:mr-8 md:mr-14 z-20 w-[180px] sm:w-[240px] md:w-[260px] transform transition-transform duration-500 hover:scale-[1.03] hover:-translate-y-2">
                <MobileMockup
                  screenshotUrl={mobileSrc}
                  websiteTitle={title}
                  isFullPage={isFullPage}
                />
              </div>
            </div>
          )}

          {/* Desktop Only Mode */}
          {viewMode === 'desktop' && (
            <div className="w-full max-w-4xl py-6 transform transition-transform duration-500">
              <LaptopMockup
                screenshotUrl={desktopSrc}
                websiteTitle={title}
                isFullPage={isFullPage}
              />
            </div>
          )}

          {/* Mobile Only Mode */}
          {viewMode === 'mobile' && (
            <div className="w-full max-w-[320px] sm:max-w-[360px] py-6 transform transition-transform duration-500">
              <MobileMockup
                screenshotUrl={mobileSrc}
                websiteTitle={title}
                isFullPage={isFullPage}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

MockupShowcase.displayName = 'MockupShowcase';
