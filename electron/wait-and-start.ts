import { spawn } from 'child_process';
import http from 'http';

function checkViteReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173', (res) => {
      if (res.statusCode && res.statusCode < 400) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startElectron() {
  console.log('Waiting for Vite client dev server at http://localhost:5173...');
  let ready = false;
  for (let i = 0; i < 40; i++) {
    ready = await checkViteReady();
    if (ready) break;
    await new Promise((res) => setTimeout(res, 500));
  }

  if (!ready) {
    console.warn('Vite dev server did not respond in 20s, starting Electron anyway...');
  } else {
    console.log('Vite dev server is ready! Launching Electron desktop window...');
  }

  const electronProcess = spawn('npx', ['electron', '.'], {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  });

  electronProcess.on('close', (code) => {
    process.exit(code || 0);
  });
}

startElectron();
