import React from 'react';
import { LaptopMockup } from './LaptopMockup';
import { MobileMockup } from './MobileMockup';
import { BannerContent, CaptureResult, ShowcaseFeature } from '../types';
import { Monitor, ShoppingBag, Smartphone, Zap, CheckCircle2, Star, ShieldCheck } from 'lucide-react';

interface ShowcasePosterProps {
  captureResult: CaptureResult | null;
  bannerContent: BannerContent;
  onUpdateContent: (updated: Partial<BannerContent>) => void;
  themeStyle: 'warm-editorial' | 'dark-tech' | 'clean-studio' | 'auto';
  isFullPage: boolean;
}

export const ShowcasePoster: React.FC<ShowcasePosterProps> = ({
  captureResult,
  bannerContent,
  onUpdateContent,
  themeStyle,
  isFullPage,
}) => {
  const desktopSrc = captureResult?.desktopScreenshot;
  const mobileSrc = captureResult?.mobileScreenshot;
  const palette = captureResult?.palette;

  // Background and color schemes
  let containerBg = 'linear-gradient(135deg, #f5f2ee 0%, #ece6de 50%, #e2dacd 100%)';
  let accentColor = '#b29580';
  let titleColor = '#111827';
  let subtitleColor = '#4b5563';
  let badgeBorder = 'rgba(75, 85, 99, 0.4)';
  let featureTitleColor = '#1f2937';
  let featureSubColor = '#6b7280';
  let bottomBarBg = 'rgba(45, 41, 38, 0.9)';
  let bottomBarText = '#ffffff';

  if (themeStyle === 'dark-tech') {
    containerBg = 'radial-gradient(circle at 70% 30%, #1e1b4b 0%, #0f172a 60%, #030712 100%)';
    accentColor = palette?.primary || '#6366f1';
    titleColor = '#ffffff';
    subtitleColor = '#94a3b8';
    badgeBorder = 'rgba(255, 255, 255, 0.2)';
    featureTitleColor = '#f1f5f9';
    featureSubColor = '#94a3b8';
    bottomBarBg = 'rgba(15, 23, 42, 0.9)';
  } else if (themeStyle === 'clean-studio') {
    containerBg = 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%)';
    accentColor = palette?.primary || '#3b82f6';
    titleColor = '#0f172a';
    subtitleColor = '#475569';
    badgeBorder = 'rgba(15, 23, 42, 0.2)';
    bottomBarBg = 'rgba(15, 23, 42, 0.92)';
  } else if (themeStyle === 'auto' && palette) {
    containerBg = palette.gradient;
    accentColor = palette.primary;
    if (palette.isLight) {
      titleColor = '#090a0f';
      subtitleColor = '#334155';
      featureTitleColor = '#1e293b';
      featureSubColor = '#64748b';
    } else {
      titleColor = '#ffffff';
      subtitleColor = '#cbd5e1';
      featureTitleColor = '#f8fafc';
      featureSubColor = '#94a3b8';
      bottomBarBg = 'rgba(9, 10, 15, 0.92)';
    }
  }

  const renderIcon = (iconName: ShowcaseFeature['icon']) => {
    switch (iconName) {
      case 'bag':
        return <ShoppingBag className="w-4 h-4" style={{ color: titleColor }} />;
      case 'responsive':
        return <Smartphone className="w-4 h-4" style={{ color: titleColor }} />;
      case 'speed':
        return <Zap className="w-4 h-4" style={{ color: titleColor }} />;
      case 'star':
        return <Star className="w-4 h-4" style={{ color: titleColor }} />;
      case 'shield':
        return <ShieldCheck className="w-4 h-4" style={{ color: titleColor }} />;
      default:
        return <Monitor className="w-4 h-4" style={{ color: titleColor }} />;
    }
  };

  const handleBlur = (key: keyof BannerContent, e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText.trim();
    if (text) {
      onUpdateContent({ [key]: text });
    }
  };

  const handleFeatureBlur = (
    index: number,
    key: 'title' | 'subtitle',
    e: React.FocusEvent<HTMLElement>
  ) => {
    const text = e.currentTarget.innerText.trim();
    const updated = [...bannerContent.features];
    if (updated[index]) {
      updated[index] = { ...updated[index], [key]: text };
      onUpdateContent({ features: updated });
    }
  };

  const handleBadgeBlur = (index: number, e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText.trim();
    const updated = [...bannerContent.bottomBadges];
    updated[index] = text;
    onUpdateContent({ bottomBadges: updated });
  };

  return (
    <div
      id="mockup-poster-stage"
      style={{ background: containerBg }}
      className="relative w-full max-w-[1360px] mx-auto rounded-3xl overflow-hidden p-6 sm:p-10 md:p-14 shadow-2xl border border-black/10 select-none transition-all duration-700 font-sans"
    >
      {/* Botanical Organic Foliage Shadows in background corners (exact reference image atmosphere) */}
      <svg
        className="absolute -top-10 -right-10 w-96 h-96 opacity-25 pointer-events-none -z-10 blur-[1px]"
        viewBox="0 0 200 200"
        fill={accentColor}
      >
        <path d="M40,100 C60,40 140,20 180,60 C160,120 120,180 60,170 C20,160 20,120 40,100 Z" opacity="0.3" />
        <path d="M80,40 C120,20 170,50 160,100 C140,160 80,180 40,130 C20,90 40,50 80,40 Z" opacity="0.4" />
      </svg>
      <svg
        className="absolute -bottom-16 -left-16 w-96 h-96 opacity-20 pointer-events-none -z-10 blur-[1px]"
        viewBox="0 0 200 200"
        fill={accentColor}
      >
        <path d="M50,80 C90,30 160,50 170,110 C150,170 90,190 40,150 C10,110 30,90 50,80 Z" opacity="0.3" />
      </svg>

      {/* TOP HEADER: Tag & Big Headline on Left + Code Badge on Right */}
      <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6 z-20 relative">
        {/* Left Typography Block */}
        <div className="flex flex-col items-start max-w-2xl">
          {/* Outlined Pill Tag */}
          <div
            style={{ borderColor: badgeBorder }}
            className="mb-2.5 px-4 py-1 rounded-full border text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase transition-all"
          >
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('tag', e)}
              style={{ color: titleColor }}
              className="focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
            >
              {bannerContent.tag}
            </span>
          </div>

          {/* Huge Serif Headline (Playfair Display) */}
          <h2
            style={{ color: titleColor }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-serif font-black uppercase tracking-tight leading-[1.05] mb-2"
          >
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('title', e)}
              className="focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded px-1 inline-block"
            >
              {bannerContent.title}
            </span>
          </h2>

          {/* Subtitle Tagline */}
          <p
            style={{ color: subtitleColor }}
            className="text-xs sm:text-sm md:text-base font-normal tracking-wide"
          >
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlur('subtitle', e)}
              className="focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1 inline-block"
            >
              {bannerContent.subtitle}
            </span>
          </p>
        </div>

        {/* Top-Right Code Badge (like "0926" in reference image) */}
        <div
          style={{ background: accentColor }}
          className="px-5 sm:px-7 py-2 sm:py-3 rounded-2xl sm:rounded-3xl shadow-lg text-white font-extrabold text-lg sm:text-2xl tracking-wider font-mono flex items-center justify-center ring-2 ring-white/30"
        >
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlur('code', e)}
            className="focus:outline-none px-1 text-center"
          >
            {bannerContent.code}
          </span>
        </div>
      </div>

      {/* MAIN BODY: Left Features List + Center Laptop + Right Overlapping Phone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-3 sm:mt-6 z-20 relative">
        {/* Left Column: Feature Highlights & Platform Badges (4 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            {bannerContent.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  style={{ borderColor: badgeBorder }}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
                >
                  {renderIcon(feat.icon)}
                </div>
                <div className="flex-1">
                  <h4
                    style={{ color: featureTitleColor }}
                    className="font-bold tracking-tight text-xs sm:text-sm"
                  >
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleFeatureBlur(idx, 'title', e)}
                      className="focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-0.5 inline-block"
                    >
                      {feat.title}
                    </span>
                  </h4>
                  <p
                    style={{ color: featureSubColor }}
                    className="text-[11px] sm:text-xs"
                  >
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleFeatureBlur(idx, 'subtitle', e)}
                      className="focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-0.5 inline-block"
                    >
                      {feat.subtitle}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Platform Badge (WordPress / Flatsome, etc.) */}
          <div className="pt-3 sm:pt-4 border-t border-black/10 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-serif shadow-sm">
                {bannerContent.platform === 'shopify'
                  ? 'S'
                  : bannerContent.platform === 'react'
                  ? '⚛'
                  : 'W'}
              </div>
              <span style={{ color: titleColor }} className="text-sm font-black tracking-widest uppercase font-serif">
                {bannerContent.platform === 'shopify'
                  ? 'SHOPIFY'
                  : bannerContent.platform === 'react'
                  ? 'REACT / NEXT.JS'
                  : 'WORDPRESS'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 pl-1">
              <span style={{ color: titleColor }} className="text-xs font-bold tracking-wider uppercase font-mono">
                {bannerContent.platform === 'shopify' ? 'ECOMMERCE' : 'FLATSOME'}
              </span>
              <span style={{ color: featureSubColor }} className="text-[10px] uppercase font-sans">
                {bannerContent.platformSub}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Center Laptop Mockup + Right Standing Phone (9 cols) */}
        <div className="lg:col-span-9 relative flex items-center justify-center pt-2 sm:pt-4">
          {/* Laptop Mockup */}
          <div className="w-full max-w-[690px] sm:max-w-[760px] transform transition-transform duration-500 hover:scale-[1.01]">
            <LaptopMockup
              screenshotUrl={desktopSrc}
              websiteTitle={bannerContent.title}
              isFullPage={isFullPage}
            />
          </div>

          {/* Smartphone Mockup on the Right (Overlapping position exactly matching reference image) */}
          <div className="absolute right-[-10px] sm:right-0 md:right-3 bottom-[-15px] sm:bottom-[-25px] w-[170px] sm:w-[210px] md:w-[245px] z-30 transform transition-transform duration-500 hover:scale-[1.03] hover:-translate-y-2">
            <MobileMockup
              screenshotUrl={mobileSrc}
              websiteTitle={bannerContent.title}
              isFullPage={isFullPage}
            />
          </div>
        </div>
      </div>

      {/* BOTTOM FLOATING FEATURE BAR (Exact Match to Reference Image) */}
      <div className="mt-8 sm:mt-12 flex justify-center z-30 relative">
        <div
          style={{ background: bottomBarBg, color: bottomBarText }}
          className="w-full max-w-4xl py-3 px-4 sm:px-8 rounded-full shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-around gap-3 sm:gap-6 text-xs sm:text-sm font-medium border border-white/10"
        >
          {bannerContent.bottomBadges.map((badge, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBadgeBlur(idx, e)}
                className="tracking-wide focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded px-1"
              >
                {badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
