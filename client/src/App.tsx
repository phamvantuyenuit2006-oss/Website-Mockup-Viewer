import React, { useState, useRef, useEffect } from 'react';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import { Header } from './components/Header';
import { UrlBar } from './components/UrlBar';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ShowcasePoster } from './components/ShowcasePoster';
import { ExportToolbar } from './components/ExportToolbar';
import { ErrorCard } from './components/ErrorCard';
import { ViewMode, CaptureType, ProgressUpdate, CaptureResult, ExportFormat, BannerContent } from './types';
import { Sparkles, LayoutTemplate, Palette, RefreshCw } from 'lucide-react';

const DEFAULT_BANNER_CONTENT: BannerContent = {
  code: '0926',
  tag: 'MẪU WEBSITE',
  title: 'WEBSITE THỜI TRANG',
  subtitle: 'Thiết kế hiện đại – Tinh tế – Chuẩn trải nghiệm mua sắm',
  platform: 'wordpress',
  platformSub: 'FLATSOME THEME FOR WORDPRESS',
  features: [
    { icon: 'desktop', title: 'Giao diện hiện đại', subtitle: 'Tinh tế – Thời thượng' },
    { icon: 'bag', title: 'Tối ưu trải nghiệm', subtitle: 'Mua sắm & xem dễ dàng' },
    { icon: 'responsive', title: 'Chuẩn responsive', subtitle: 'Hiển thị hoàn hảo trên mọi thiết bị' },
    { icon: 'speed', title: 'Tối ưu tốc độ', subtitle: 'Website nhanh – Chuẩn SEO' },
  ],
  bottomBadges: [
    'WordPress + Flatsome',
    'Dễ dàng tùy biến',
    'Chuẩn SEO – Tốc độ cao',
    'Hỗ trợ tận tâm',
  ],
  themeMode: 'warm-editorial',
};

export const App: React.FC = () => {
  const [url, setUrl] = useState<string>('https://halomedia.com.vn');
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [captureType, setCaptureType] = useState<CaptureType>('viewport');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  
  const [themeStyle, setThemeStyle] = useState<'warm-editorial' | 'dark-tech' | 'clean-studio' | 'auto'>('warm-editorial');
  const [bannerContent, setBannerContent] = useState<BannerContent>(DEFAULT_BANNER_CONTENT);

  const [progress, setProgress] = useState<ProgressUpdate>({
    stage: 'idle',
    message: 'Ready',
    percent: 0,
  });

  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Toggle Dark / Light class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleGenerate = (targetUrl?: string) => {
    const activeUrl = targetUrl || url;
    if (!activeUrl.trim()) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setProgress({
      stage: 'connecting',
      message: 'Connecting to browser engine...',
      percent: 10,
    });
    setCaptureResult(null);

    const queryParams = new URLSearchParams({
      url: activeUrl,
      viewMode,
      captureType,
    });

    const es = new EventSource(`/api/capture/stream?${queryParams.toString()}`);
    eventSourceRef.current = es;

    es.addEventListener('progress', (e) => {
      try {
        const update: ProgressUpdate = JSON.parse(e.data);
        setProgress(update);
      } catch (err) {
        console.error('Failed to parse progress update', err);
      }
    });

    es.addEventListener('complete', (e) => {
      try {
        const result: CaptureResult = JSON.parse(e.data);
        setCaptureResult(result);
        
        // Automatically adapt banner typography, title, subtitle and decor matching website!
        if (result.suggestedContent) {
          setBannerContent((prev) => ({
            ...prev,
            ...result.suggestedContent,
          }));
        }

        setProgress({
          stage: 'completed',
          message: 'Ready',
          percent: 100,
        });
      } catch (err) {
        console.error('Failed to parse complete result', err);
      } finally {
        es.close();
      }
    });

    es.addEventListener('error', (e: any) => {
      try {
        if (e.data) {
          const errResult: CaptureResult = JSON.parse(e.data);
          setCaptureResult(errResult);
        } else {
          setCaptureResult({
            success: false,
            url: activeUrl,
            normalizedUrl: activeUrl,
            error: 'Không thể tải website này. Vui lòng kiểm tra lại URL hoặc kết nối mạng.',
            errorCategory: 'generic',
          });
        }
      } catch {
        setCaptureResult({
          success: false,
          url: activeUrl,
          normalizedUrl: activeUrl,
          error: 'Mất kết nối với dịch vụ capture local.',
          errorCategory: 'generic',
        });
      } finally {
        setProgress({
          stage: 'error',
          message: 'Error occurred',
          percent: 0,
        });
        es.close();
      }
    });
  };

  const handleOpenWebsite = () => {
    const target = captureResult?.normalizedUrl || url;
    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  const handleExport = async (format: ExportFormat) => {
    const posterNode = document.getElementById('mockup-poster-stage');
    if (!posterNode) return;

    const hostname = captureResult?.normalizedUrl
      ? new URL(captureResult.normalizedUrl).hostname.replace(/[^a-z0-9]/gi, '_')
      : 'mockup';
    const filename = `${hostname}_poster_${Date.now()}.${format === 'jpg' ? 'jpeg' : format}`;

    const options = {
      quality: 0.95,
      pixelRatio: 2, // Ultra crisp Retina 2x export
      cacheBust: true,
    };

    let dataUrl = '';
    if (format === 'png') {
      dataUrl = await toPng(posterNode, options);
    } else if (format === 'jpg') {
      dataUrl = await toJpeg(posterNode, options);
    } else if (format === 'webp') {
      const blob = await toBlob(posterNode, options);
      if (blob) {
        dataUrl = URL.createObjectURL(blob);
      }
    }

    if (dataUrl) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      if (format === 'webp') {
        setTimeout(() => URL.revokeObjectURL(dataUrl), 5000);
      }
    }
  };

  const isProcessing =
    progress.stage !== 'idle' &&
    progress.stage !== 'completed' &&
    progress.stage !== 'error';

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-300 pb-12">
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        stage={progress.stage}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start w-full max-w-7xl mx-auto px-2 sm:px-4">
        {/* URL Input Bar */}
        <UrlBar
          url={url}
          setUrl={setUrl}
          viewMode={viewMode}
          setViewMode={setViewMode}
          captureType={captureType}
          setCaptureType={setCaptureType}
          onGenerate={handleGenerate}
          stage={progress.stage}
        />

        {/* Real-time Progress Animation */}
        <ProgressIndicator progress={progress} />

        {/* Theme & Decor Selector Bar */}
        <div className="w-full max-w-4xl mx-auto px-4 my-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <LayoutTemplate className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">THEME & POSTER DECOR:</span>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setThemeStyle('warm-editorial')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                themeStyle === 'warm-editorial'
                  ? 'bg-amber-700/80 text-white border border-amber-500/50 shadow-md ring-1 ring-amber-400'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              🍂 Warm Editorial (100% Ảnh mẫu)
            </button>

            <button
              type="button"
              onClick={() => setThemeStyle('auto')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1 ${
                themeStyle === 'auto'
                  ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md ring-1 ring-pink-400'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto Theo Website</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeStyle('dark-tech')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                themeStyle === 'dark-tech'
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              🌌 Dark Tech
            </button>

            <button
              type="button"
              onClick={() => setThemeStyle('clean-studio')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                themeStyle === 'clean-studio'
                  ? 'bg-slate-200 text-slate-900 shadow-md ring-1 ring-slate-400 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚪ Clean Studio
            </button>
          </div>
        </div>

        {/* Error Notification Card */}
        {captureResult && !captureResult.success && (
          <ErrorCard errorResult={captureResult} onRetry={() => handleGenerate()} />
        )}

        {/* 100% MATCHED SHOWCASE POSTER STAGE */}
        <div className="w-full mt-2 flex-1 flex flex-col justify-center items-center">
          <ShowcasePoster
            captureResult={captureResult}
            bannerContent={bannerContent}
            onUpdateContent={(updated) => setBannerContent((prev) => ({ ...prev, ...updated }))}
            themeStyle={themeStyle}
            isFullPage={captureType === 'fullpage'}
          />
        </div>

        {/* Export & Action Toolbar */}
        <ExportToolbar
          onExport={handleExport}
          onRefresh={() => handleGenerate()}
          onOpenWebsite={handleOpenWebsite}
          hasResult={Boolean(captureResult?.success)}
          isProcessing={isProcessing}
        />
      </main>
    </div>
  );
};

export default App;
