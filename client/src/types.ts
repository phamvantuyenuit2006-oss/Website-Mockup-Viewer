export type ViewMode = 'both' | 'desktop' | 'mobile';
export type CaptureType = 'viewport' | 'fullpage';

export type ProgressStage =
  | 'idle'
  | 'connecting'
  | 'loading'
  | 'capturing_desktop'
  | 'capturing_mobile'
  | 'rendering'
  | 'completed'
  | 'error';

export interface ProgressUpdate {
  stage: ProgressStage;
  message: string;
  percent: number;
}

export interface ThemePalette {
  primary: string;
  secondary: string;
  accent: string;
  backgroundColor: string;
  isLight: boolean;
  gradient: string;
}

export interface ShowcaseFeature {
  icon: 'desktop' | 'bag' | 'responsive' | 'speed' | 'shield' | 'star';
  title: string;
  subtitle: string;
}

export interface BannerContent {
  code: string;
  tag: string;
  title: string;
  subtitle: string;
  platform: 'wordpress' | 'shopify' | 'react' | 'woocommerce' | 'custom';
  platformSub: string;
  features: ShowcaseFeature[];
  bottomBadges: string[];
  themeMode: 'warm-editorial' | 'dark-tech' | 'clean-studio' | 'auto';
}

export interface CaptureResult {
  success: boolean;
  url: string;
  normalizedUrl: string;
  title?: string;
  favicon?: string;
  desktopScreenshot?: string;
  mobileScreenshot?: string;
  desktopDimensions?: { width: number; height: number };
  mobileDimensions?: { width: number; height: number };
  captureTimeMs?: number;
  palette?: ThemePalette;
  suggestedContent?: Partial<BannerContent>;
  error?: string;
  errorCategory?: 'timeout' | 'dns' | 'ssl' | 'captcha' | 'auth' | 'generic';
}

export type ExportFormat = 'png' | 'jpg' | 'webp';

export interface BackgroundOption {
  id: string;
  name: string;
  type: 'auto' | 'gradient' | 'solid' | 'transparent' | 'mesh';
  className?: string;
  style?: React.CSSProperties;
  previewColor: string;
  textColor?: 'dark' | 'light';
}
