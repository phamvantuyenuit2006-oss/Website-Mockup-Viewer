import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { BrowserManager } from './browserManager';
import { ViewMode, CaptureType, ProgressUpdate } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Static file hosting for captured screenshots
const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'public_screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}
app.use('/screenshots', express.static(SCREENSHOTS_DIR));

const browserManager = BrowserManager.getInstance();

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SSE Streaming Capture API for real-time progress updates
app.get('/api/capture/stream', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  const viewMode = (req.query.viewMode as ViewMode) || 'both';
  const captureType = (req.query.captureType as CaptureType) || 'viewport';

  if (!url) {
    res.status(400).json({ error: 'URL parameter is required' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onProgress = (progress: ProgressUpdate) => {
    sendEvent('progress', progress);
  };

  try {
    sendEvent('progress', {
      stage: 'connecting',
      message: 'Initializing turbo capture engine...',
      percent: 5,
    });

    const result = await browserManager.capture(url, viewMode, captureType, onProgress);

    if (result.success) {
      sendEvent('complete', result);
    } else {
      sendEvent('error', result);
    }
  } catch (err: any) {
    sendEvent('error', {
      success: false,
      url,
      error: err.message || 'Lỗi không xác định khi chụp trang web.',
      errorCategory: 'generic',
    });
  } finally {
    res.end();
  }
});

// Standard REST fallback capture endpoint
app.post('/api/capture', async (req: Request, res: Response) => {
  const { url, viewMode = 'both', captureType = 'viewport' } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    const result = await browserManager.capture(url, viewMode, captureType);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Lỗi máy chủ',
    });
  }
});

// Serve production built frontend if dist folder exists
const DIST_DIR = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 WEBSITE MOCKUP VIEWER DA SAN SANG!`);
  console.log(`👉 Truy cap ngay tai: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

// Graceful cleanup
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await browserManager.close();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  await browserManager.close();
  server.close(() => {
    process.exit(0);
  });
});
