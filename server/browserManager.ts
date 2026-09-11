import { chromium, Browser, BrowserContext, Page, Route } from 'playwright';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { CaptureResult, ViewMode, CaptureType, ProgressUpdate, ThemePalette, BannerContent, ShowcaseFeature } from './types';

// Ensure screenshots storage directory exists
const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'public_screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// In-memory cache for ultra-fast instant updates (expires in 10 minutes)
interface CacheEntry {
  result: CaptureResult;
  timestamp: number;
}
const MEMORY_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

// Domains of heavy ad trackers, telemetry, and analytic pixels to block for maximum speed
const BLOCKED_TRACKER_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'connect.facebook.net',
  'analytics.tiktok.com',
  'hotjar.com',
  'clarity.ms',
  'doubleclick.net',
  'adroll.com',
  'criteo.net',
  'mc.yandex.ru',
  'scorecardresearch.com',
  'taboola.com',
  'outbrain.com',
];

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function adjustBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex.length === 3 ? cleanHex.split('').map((c) => c + c).join('') : cleanHex, 16);
  if (isNaN(num)) return '#6366f1';
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return '#' + [R, G, B].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private isLaunching = false;

  private constructor() {
    this.getBrowser().catch(() => {});
  }

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isLaunching) {
      while (this.isLaunching) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (this.browser && this.browser.isConnected()) {
        return this.browser;
      }
    }

    this.isLaunching = true;
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--ignore-certificate-errors',
          '--dns-result-order=ipv4first',
          '--allow-running-insecure-content',
          '--disable-web-security',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-extensions',
        ],
      });
      return this.browser;
    } finally {
      this.isLaunching = false;
    }
  }

  public normalizeUrl(rawUrl: string): string {
    let url = rawUrl.trim();
    if (!url) return '';
    url = url.replace(/^["']|["']$/g, '');
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }

  private async setupTurboRouting(page: Page): Promise<void> {
    await page.route('**/*', (route: Route) => {
      const reqUrl = route.request().url().toLowerCase();
      const resType = route.request().resourceType();

      // Abort non-essential heavy requests
      if (
        resType === 'media' ||
        resType === 'other' ||
        BLOCKED_TRACKER_DOMAINS.some((d) => reqUrl.includes(d))
      ) {
        return route.abort();
      }
      return route.continue();
    });
  }

  private async extractThemeFromPage(page: Page, screenshotPath: string): Promise<ThemePalette> {
    try {
      const domColors = await page.evaluate(() => {
        const themeMeta = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
        const getBg = (el: Element | null) => (el ? window.getComputedStyle(el).backgroundColor : '');
        const bodyBg = getBg(document.body);
        const header = document.querySelector('header, nav, .header, #header');
        const headerBg = getBg(header);
        const button = document.querySelector('button, .btn, .button, a[class*="btn"], a[class*="button"]');
        const buttonBg = getBg(button);
        return { themeMeta, bodyBg, headerBg, buttonBg };
      }).catch(() => null);

      const imageStats = await sharp(screenshotPath).stats().catch(() => null);
      let primaryHex = '#b79b88';
      let isLight = false;

      if (imageStats && imageStats.dominant) {
        const { r, g, b } = imageStats.dominant;
        primaryHex = rgbToHex(r, g, b);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        isLight = luminance > 0.6;
      }

      if (domColors?.themeMeta && /^#[0-9a-f]{6}$/i.test(domColors.themeMeta)) {
        primaryHex = domColors.themeMeta;
      }

      const darker = adjustBrightness(primaryHex, -40);
      const lighter = adjustBrightness(primaryHex, 25);
      const deepBase = '#090a0f';

      const gradient = `radial-gradient(circle at 75% 30%, ${primaryHex}33 0%, ${darker}66 50%, ${deepBase} 100%), ${deepBase}`;

      return {
        primary: primaryHex,
        secondary: darker,
        accent: lighter,
        backgroundColor: deepBase,
        isLight,
        gradient,
      };
    } catch {
      return {
        primary: '#b79b88',
        secondary: '#8a6e5b',
        accent: '#d8c2b2',
        backgroundColor: '#090a0f',
        isLight: false,
        gradient: 'radial-gradient(circle at 60% 40%, rgba(183, 155, 136, 0.3) 0%, #090a0f 100%), #090a0f',
      };
    }
  }

  private async extractBannerContent(page: Page, url: string, pageTitle: string): Promise<Partial<BannerContent>> {
    try {
      const pageData = await page.evaluate(() => {
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
        const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
        const h1 = Array.from(document.querySelectorAll('h1')).map((e) => e.textContent?.trim()).filter(Boolean).join(' ');
        const h2 = Array.from(document.querySelectorAll('h2')).slice(0, 5).map((e) => e.textContent?.trim()).filter(Boolean).join(' ');
        const bodySnippet = document.body.innerText ? document.body.innerText.slice(0, 1500).toLowerCase() : '';
        const html = document.documentElement.outerHTML.toLowerCase();

        const isWordPress = html.includes('wp-content') || html.includes('wordpress');
        const isShopify = html.includes('cdn.shopify.com') || html.includes('shopify');
        const isWooCommerce = html.includes('woocommerce');

        return { metaDesc, metaKeywords, ogTitle, ogDesc, h1, h2, bodySnippet, isWordPress, isShopify, isWooCommerce };
      }).catch(() => null);

      const allText = `${pageTitle} ${pageData?.ogTitle || ''} ${pageData?.h1 || ''} ${pageData?.h2 || ''} ${pageData?.metaDesc || ''} ${pageData?.metaKeywords || ''} ${pageData?.bodySnippet || ''}`.toLowerCase();

      let tag = 'MẪU WEBSITE';
      let title = 'WEBSITE DOANH NGHIỆP';
      let subtitle = 'Thiết kế hiện đại – Tinh tế – Chuẩn trải nghiệm người dùng';
      let features: ShowcaseFeature[] = [
        { icon: 'desktop', title: 'Giao diện hiện đại', subtitle: 'Tinh tế – Thời thượng' },
        { icon: 'bag', title: 'Tối ưu trải nghiệm', subtitle: 'Thân thiện – Dễ dàng sử dụng' },
        { icon: 'responsive', title: 'Chuẩn responsive', subtitle: 'Hiển thị hoàn hảo trên mọi thiết bị' },
        { icon: 'speed', title: 'Tối ưu tốc độ', subtitle: 'Website nhanh – Chuẩn SEO Google' },
      ];
      let bottomBadges = [
        'WordPress + Flatsome',
        'Dễ dàng tùy biến',
        'Chuẩn SEO – Tốc độ cao',
        'Hỗ trợ tận tâm',
      ];

      // 1. Fashion / Cosmetics / Beauty
      if (
        allText.includes('thời trang') ||
        allText.includes('fashion') ||
        allText.includes('quần áo') ||
        allText.includes('váy') ||
        allText.includes('mỹ phẩm') ||
        allText.includes('cosmetic') ||
        allText.includes('beauty') ||
        allText.includes('giày') ||
        allText.includes('shoes') ||
        allText.includes('nike') ||
        allText.includes('adidas') ||
        allText.includes('zara') ||
        allText.includes('h&m')
      ) {
        tag = 'MẪU WEBSITE';
        title = allText.includes('mỹ phẩm') || allText.includes('cosmetic') ? 'WEBSITE MỸ PHẨM' : 'WEBSITE THỜI TRANG';
        subtitle = 'Thiết kế hiện đại – Tinh tế – Chuẩn trải nghiệm mua sắm';
        features = [
          { icon: 'desktop', title: 'Giao diện hiện đại', subtitle: 'Tinh tế – Thời thượng' },
          { icon: 'bag', title: 'Tối ưu trải nghiệm', subtitle: 'Mua sắm & chọn size dễ dàng' },
          { icon: 'responsive', title: 'Chuẩn responsive', subtitle: 'Hiển thị hoàn hảo trên mọi thiết bị' },
          { icon: 'speed', title: 'Tối ưu tốc độ', subtitle: 'Website nhanh – Chuẩn SEO' },
        ];
        bottomBadges = [
          pageData?.isShopify ? 'Shopify Platform' : 'WordPress + Flatsome',
          'Dễ dàng tùy biến',
          'Chuẩn SEO – Tốc độ cao',
          'Tích hợp giỏ hàng thông minh',
        ];
      }
      // 2. Real Estate / Architecture
      else if (
        allText.includes('bất động sản') ||
        allText.includes('real estate') ||
        allText.includes('nhà đất') ||
        allText.includes('căn hộ') ||
        allText.includes('chung cư') ||
        allText.includes('nội thất') ||
        allText.includes('kiến trúc') ||
        allText.includes('villa') ||
        allText.includes('homestay')
      ) {
        tag = 'MẪU WEBSITE DỰ ÁN';
        title = allText.includes('nội thất') ? 'WEBSITE NỘI THẤT' : 'WEBSITE BẤT ĐỘNG SẢN';
        subtitle = 'Đẳng cấp – Sang trọng – Tối ưu chuyển đổi khách hàng tiềm năng';
        features = [
          { icon: 'desktop', title: 'Hình ảnh sống động', subtitle: 'Trình bày dự án & mặt bằng 360°' },
          { icon: 'star', title: 'Form nhận báo giá', subtitle: 'Tối ưu tỷ lệ thu thập khách hàng' },
          { icon: 'responsive', title: 'Chuẩn responsive', subtitle: 'Mượt mà trên smartphone & tablet' },
          { icon: 'speed', title: 'Tốc độ vượt trội', subtitle: 'Tải nhanh – Chuẩn SEO Top Google' },
        ];
        bottomBadges = [
          'Bộ lọc dự án thông minh',
          'Tích hợp Google Maps',
          'Form đăng ký tự động',
          'Dễ dàng quản lý dữ liệu',
        ];
      }
      // 3. Digital Marketing / Media / Design Agency
      else if (
        allText.includes('thiết kế website') ||
        allText.includes('web design') ||
        allText.includes('marketing') ||
        allText.includes('media') ||
        allText.includes('agency') ||
        allText.includes('seo') ||
        allText.includes('quảng cáo') ||
        allText.includes('phần mềm') ||
        allText.includes('software') ||
        allText.includes('halo media')
      ) {
        tag = 'MẪU WEBSITE';
        title = 'DIGITAL AGENCY';
        subtitle = 'Đột phá nhận diện – Tối ưu chuyển đổi – Chuẩn trải nghiệm số';
        features = [
          { icon: 'desktop', title: 'Giao diện độc quyền', subtitle: 'Hiện đại – Đậm chất công nghệ' },
          { icon: 'star', title: 'Trưng bày Portfolio', subtitle: 'Case study ấn tượng – Chuyên nghiệp' },
          { icon: 'responsive', title: 'Tương thích đa màn hình', subtitle: 'Hoàn hảo trên mọi thiết bị' },
          { icon: 'speed', title: 'Tối ưu hiệu năng', subtitle: 'Tốc độ siêu tốc – Chuẩn SEO Onpage' },
        ];
        bottomBadges = [
          'Thiết kế chuẩn UI/UX',
          'Dễ dàng tùy biến layout',
          'Chuẩn SEO – Tốc độ cao',
          'Hỗ trợ kỹ thuật 24/7',
        ];
      }
      // 4. Restaurant / F&B
      else if (
        allText.includes('nhà hàng') ||
        allText.includes('restaurant') ||
        allText.includes('quán ăn') ||
        allText.includes('ẩm thực') ||
        allText.includes('cafe') ||
        allText.includes('coffee') ||
        allText.includes('bánh') ||
        allText.includes('food')
      ) {
        tag = 'MẪU WEBSITE F&B';
        title = 'NHÀ HÀNG & ẨM THỰC';
        subtitle = 'Menu trực quan – Đặt bàn tiện lợi – Khẳng định phong cách ẩm thực';
        features = [
          { icon: 'desktop', title: 'Thực đơn bắt mắt', subtitle: 'Hình ảnh sắc nét – Trực quan' },
          { icon: 'bag', title: 'Đặt bàn & Order', subtitle: 'Nhanh chóng – Tiện lợi 24/7' },
          { icon: 'responsive', title: 'Chuẩn di động', subtitle: 'Tra cứu menu dễ dàng trên điện thoại' },
          { icon: 'speed', title: 'Chuẩn SEO Local', subtitle: 'Dễ dàng tìm thấy trên Google Maps' },
        ];
        bottomBadges = [
          'Menu điện tử QR Code',
          'Form đặt bàn trực tuyến',
          'Tích hợp bản đồ vị trí',
          'Kết nối Hotline & Zalo',
        ];
      }
      // 5. E-Commerce
      else if (
        allText.includes('store') ||
        allText.includes('shop') ||
        allText.includes('giỏ hàng') ||
        allText.includes('thanh toán') ||
        allText.includes('giá:') ||
        allText.includes('sản phẩm') ||
        allText.includes('đặt mua')
      ) {
        tag = 'MẪU WEBSITE BÁN HÀNG';
        title = 'WEBSITE BÁN HÀNG';
        subtitle = 'Tối ưu giỏ hàng – Thanh toán đa kênh – Quản lý kho thông minh';
        features = [
          { icon: 'desktop', title: 'Trình bày sản phẩm', subtitle: 'Bộ lọc danh mục thông minh' },
          { icon: 'bag', title: 'Mua hàng 1-Click', subtitle: 'Quy trình thanh toán nhanh gọn' },
          { icon: 'responsive', title: 'Chuẩn responsive', subtitle: 'Mua sắm mượt mà trên mobile' },
          { icon: 'speed', title: 'Tối ưu chuyển đổi', subtitle: 'Tốc độ cao – Chuẩn SEO E-commerce' },
        ];
        bottomBadges = [
          pageData?.isShopify ? 'Shopify E-Commerce' : 'WordPress + WooCommerce',
          'Dễ dàng tùy biến',
          'Chuẩn SEO – Tốc độ cao',
          'Quản lý đơn hàng tự động',
        ];
      } else {
        let cleanName = pageTitle;
        if (cleanName.includes('|')) cleanName = cleanName.split('|')[0].trim();
        if (cleanName.includes('-')) cleanName = cleanName.split('-')[0].trim();
        if (cleanName.length > 25) cleanName = 'WEBSITE DOANH NGHIỆP';
        else cleanName = `WEBSITE ${cleanName.toUpperCase()}`;

        tag = 'MẪU WEBSITE';
        title = cleanName;
        subtitle = 'Thiết kế hiện đại – Tinh tế – Chuẩn nhận diện thương hiệu';
      }

      let platform: BannerContent['platform'] = 'wordpress';
      let platformSub = 'FLATSOME THEME FOR WORDPRESS';

      if (pageData?.isShopify) {
        platform = 'shopify';
        platformSub = 'ECOMMERCE PLATFORM';
      } else if (pageData?.isWooCommerce) {
        platform = 'woocommerce';
        platformSub = 'ECOMMERCE FOR WORDPRESS';
      } else if (pageData?.isWordPress) {
        platform = 'wordpress';
        platformSub = 'FLATSOME THEME FOR WORDPRESS';
      } else {
        platform = 'react';
        platformSub = 'MODERN WEB FRAMEWORK';
      }

      const randomCode = String(Math.floor(1000 + Math.random() * 9000));

      return {
        code: randomCode,
        tag,
        title,
        subtitle,
        platform,
        platformSub,
        features,
        bottomBadges,
        themeMode: 'warm-editorial',
      };
    } catch {
      return {
        code: '0926',
        tag: 'MẪU WEBSITE',
        title: 'WEBSITE THỜI TRANG',
        subtitle: 'Thiết kế hiện đại – Tinh tế – Chuẩn trải nghiệm mua sắm',
        platform: 'wordpress',
        platformSub: 'FLATSOME THEME FOR WORDPRESS',
        bottomBadges: [
          'WordPress + Flatsome',
          'Dễ dàng tùy biến',
          'Chuẩn SEO – Tốc độ cao',
          'Hỗ trợ tận tâm',
        ],
      };
    }
  }

  private async preparePage(page: Page, url: string, isMobile: boolean): Promise<string> {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      (window as any).chrome = { runtime: {} };
    });

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Ch-Ua': '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
      'Sec-Ch-Ua-Mobile': isMobile ? '?1' : '?0',
      'Sec-Ch-Ua-Platform': isMobile ? '"iOS"' : '"Windows"',
    });

    // Fast routing with tracker aborting
    await this.setupTurboRouting(page);

    try {
      await page.goto(url, {
        waitUntil: 'commit',
        timeout: 18000,
      });
    } catch {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 12000,
      });
    }

    // Soft DOM wait (max 3.5s)
    await page.waitForLoadState('domcontentloaded', { timeout: 3500 }).catch(() => {});

    // Dismiss cookie banners
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
        for (const b of buttons) {
          const text = (b.textContent || '').trim().toLowerCase();
          if (
            text === 'chấp nhận' ||
            text === 'đồng ý' ||
            text === 'accept' ||
            text === 'accept all' ||
            text === 'i agree' ||
            text === 'got it' ||
            text === 'ok'
          ) {
            (b as HTMLElement).click();
            break;
          }
        }
      });
    } catch {}

    // Fast trigger lazy loading
    try {
      await page.evaluate(() => {
        const scrollDistance = Math.min(window.innerHeight * 1.2, document.body.scrollHeight);
        window.scrollTo(0, scrollDistance);
        window.scrollTo(0, 0);
      });
    } catch {}

    await page.waitForTimeout(250);

    const title = await page.title().catch(() => '');
    return title;
  }

  public async capture(
    rawUrl: string,
    viewMode: ViewMode = 'both',
    captureType: CaptureType = 'viewport',
    onProgress?: (progress: ProgressUpdate) => void
  ): Promise<CaptureResult> {
    const startTime = Date.now();
    const url = this.normalizeUrl(rawUrl);

    if (!url) {
      return {
        success: false,
        url: rawUrl,
        normalizedUrl: '',
        error: 'Vui lòng nhập một URL hợp lệ.',
        errorCategory: 'generic',
      };
    }

    // Check fast in-memory cache
    const cacheKey = `${url}_${viewMode}_${captureType}`;
    const cached = MEMORY_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      onProgress?.({
        stage: 'completed',
        message: 'Loaded from instant cache (0.1s)',
        percent: 100,
      });
      return { ...cached.result, captureTimeMs: Date.now() - startTime };
    }

    onProgress?.({
      stage: 'connecting',
      message: 'Connecting to turbo engine...',
      percent: 15,
    });

    let browser: Browser;
    try {
      browser = await this.getBrowser();
    } catch (err: any) {
      return {
        success: false,
        url: rawUrl,
        normalizedUrl: url,
        error: `Không thể khởi động Chromium: ${err.message}`,
        errorCategory: 'generic',
      };
    }

    const timestamp = Date.now();
    let cleanHost = 'website';
    try {
      cleanHost = new URL(url).hostname.replace(/[^a-z0-9]/gi, '_');
    } catch {
      cleanHost = 'website';
    }
    const filenamePrefix = `${cleanHost}_${timestamp}`;

    let desktopScreenshotPath: string | undefined;
    let mobileScreenshotPath: string | undefined;
    let pageTitle = '';
    let palette: ThemePalette | undefined;
    let suggestedContent: Partial<BannerContent> | undefined;

    const needsDesktop = viewMode === 'both' || viewMode === 'desktop';
    const needsMobile = viewMode === 'both' || viewMode === 'mobile';

    try {
      onProgress?.({
        stage: 'loading',
        message: `Loading ${url}...`,
        percent: 30,
      });

      const captureTasks: Promise<void>[] = [];

      // Desktop task
      if (needsDesktop) {
        const desktopTask = (async () => {
          let context: BrowserContext | null = null;
          let page: Page | null = null;
          try {
            context = await browser.newContext({
              viewport: { width: 1440, height: 900 },
              deviceScaleFactor: 2,
              userAgent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              ignoreHTTPSErrors: true,
              bypassCSP: true,
              colorScheme: 'dark',
              locale: 'en-US',
            });

            page = await context.newPage();
            onProgress?.({
              stage: 'capturing_desktop',
              message: 'Capturing desktop (1440×900)...',
              percent: 55,
            });

            const title = await this.preparePage(page, url, false);
            if (title && !pageTitle) pageTitle = title;

            const desktopFilename = `desktop_${filenamePrefix}.webp`;
            const absolutePath = path.join(SCREENSHOTS_DIR, desktopFilename);

            await page.screenshot({
              path: absolutePath,
              type: 'webp',
              quality: 88,
              fullPage: captureType === 'fullpage',
            });

            desktopScreenshotPath = `/screenshots/${desktopFilename}`;

            palette = await this.extractThemeFromPage(page, absolutePath);
            suggestedContent = await this.extractBannerContent(page, url, title);
          } finally {
            if (page) await page.close().catch(() => {});
            if (context) await context.close().catch(() => {});
          }
        })();
        captureTasks.push(desktopTask);
      }

      // Mobile task
      if (needsMobile) {
        const mobileTask = (async () => {
          let context: BrowserContext | null = null;
          let page: Page | null = null;
          try {
            context = await browser.newContext({
              viewport: { width: 390, height: 844 },
              deviceScaleFactor: 2,
              isMobile: true,
              hasTouch: true,
              userAgent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
              ignoreHTTPSErrors: true,
              bypassCSP: true,
              colorScheme: 'dark',
              locale: 'en-US',
            });

            page = await context.newPage();
            onProgress?.({
              stage: 'capturing_mobile',
              message: 'Capturing mobile (390×844)...',
              percent: 75,
            });

            const title = await this.preparePage(page, url, true);
            if (title && !pageTitle) pageTitle = title;

            const mobileFilename = `mobile_${filenamePrefix}.webp`;
            const absolutePath = path.join(SCREENSHOTS_DIR, mobileFilename);

            await page.screenshot({
              path: absolutePath,
              type: 'webp',
              quality: 88,
              fullPage: captureType === 'fullpage',
            });

            mobileScreenshotPath = `/screenshots/${mobileFilename}`;

            if (!palette) {
              palette = await this.extractThemeFromPage(page, absolutePath);
            }
            if (!suggestedContent) {
              suggestedContent = await this.extractBannerContent(page, url, title);
            }
          } finally {
            if (page) await page.close().catch(() => {});
            if (context) await context.close().catch(() => {});
          }
        })();
        captureTasks.push(mobileTask);
      }

      await Promise.all(captureTasks);

      onProgress?.({
        stage: 'rendering',
        message: 'Rendering showcase poster...',
        percent: 95,
      });

      const totalTimeMs = Date.now() - startTime;

      const result: CaptureResult = {
        success: true,
        url: rawUrl,
        normalizedUrl: url,
        title: pageTitle || cleanHost,
        desktopScreenshot: desktopScreenshotPath,
        mobileScreenshot: mobileScreenshotPath,
        desktopDimensions: { width: 1440, height: 900 },
        mobileDimensions: { width: 390, height: 844 },
        palette,
        suggestedContent,
        captureTimeMs: totalTimeMs,
      };

      // Store in memory cache for instant reuse
      MEMORY_CACHE.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      onProgress?.({
        stage: 'completed',
        message: 'Ready',
        percent: 100,
      });

      return result;
    } catch (err: any) {
      console.error('Capture error:', err);
      const errorMessage = err.message || String(err);
      let errorCategory: CaptureResult['errorCategory'] = 'generic';
      let userFriendlyMessage = 'Không thể tải website này.';

      if (errorMessage.includes('Timeout') || errorMessage.includes('timeout')) {
        errorCategory = 'timeout';
        userFriendlyMessage = 'Hết thời gian chờ (Timeout): Website không phản hồi trong vòng 30 giây.';
      } else if (
        errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('DNS')
      ) {
        errorCategory = 'dns';
        userFriendlyMessage = 'Lỗi DNS: Không tìm thấy tên miền hoặc website không tồn tại.';
      } else if (
        errorMessage.includes('SSL') ||
        errorMessage.includes('CERT') ||
        errorMessage.includes('ERR_CERT')
      ) {
        errorCategory = 'ssl';
        userFriendlyMessage = 'Lỗi chứng chỉ bảo mật (SSL): Website có cấu hình chứng chỉ không an toàn.';
      } else if (
        errorMessage.includes('403') ||
        errorMessage.includes('Cloudflare') ||
        errorMessage.includes('Challenge')
      ) {
        errorCategory = 'captcha';
        userFriendlyMessage = 'Website được bảo vệ bởi Cloudflare / CAPTCHA hoặc chặn truy cập tự động.';
      } else if (
        errorMessage.includes('ERR_CONNECTION_REFUSED') ||
        errorMessage.includes('ECONNREFUSED')
      ) {
        errorCategory = 'generic';
        userFriendlyMessage = 'Kết nối bị từ chối: Máy chủ đích từ chối kết nối.';
      }

      onProgress?.({
        stage: 'error',
        message: userFriendlyMessage,
        percent: 0,
      });

      return {
        success: false,
        url: rawUrl,
        normalizedUrl: url,
        error: userFriendlyMessage,
        errorCategory,
      };
    }
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}
