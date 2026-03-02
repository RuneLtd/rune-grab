import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TargetApp } from '../core/types.js';
import { APP_NAMES, APP_BUNDLE_IDS } from './app.js';

const DEFAULT_PORT = 19274;
let cachedIIFE: string | null = null;

interface PasteRequest {
  target: TargetApp;
  text: string;
  image: string | null;
  label: string;
}

function copyText(text: string): void {
  execSync('pbcopy', { input: text, encoding: 'utf-8' });
}

function copyImage(base64DataUrl: string): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'rune-grab-'));
  const imgPath = join(tmpDir, 'grab.png');

  const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
  writeFileSync(imgPath, Buffer.from(base64, 'base64'));

  return imgPath;
}

function activateAndPaste(target: TargetApp): void {
  if (target === 'claude-code') {
    const script = `
      set iTermRunning to false
      tell application "System Events"
        if exists (process "iTerm2") then set iTermRunning to true
      end tell
      if iTermRunning then
        tell application "iTerm2" to activate
      else
        tell application "Terminal" to activate
      end if
      delay 0.3
      tell application "System Events"
        keystroke "v" using command down
      end tell
    `;
    execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
    return;
  }

  const bundleId = APP_BUNDLE_IDS[target];
  if (!bundleId) return;

  const script = `
    tell application id "${bundleId}"
      activate
    end tell
    delay 0.3
    tell application "System Events"
      keystroke "v" using command down
    end tell
  `;
  execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
}

function parseBody(req: IncomingMessage): Promise<PasteRequest> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function loadIIFE(iifePath?: string): string | null {
  if (cachedIIFE) return cachedIIFE;
  if (iifePath && existsSync(iifePath)) {
    cachedIIFE = readFileSync(iifePath, 'utf-8');
    return cachedIIFE;
  }
  return null;
}

export function startHelperServer(port = DEFAULT_PORT, iifePath?: string): void {
  loadIIFE(iifePath);

  const server = createServer(async (req, res) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, version: '0.1.0' }));
      return;
    }
    if (req.method === 'GET' && req.url === '/rune-grab.js') {
      const script = cachedIIFE;
      if (script) {
        res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' });
        res.end(script);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'IIFE bundle not found' }));
      }
      return;
    }
    if (req.method === 'POST' && req.url === '/paste') {
      let tmpImgPath: string | null = null;
      try {
        const data = await parseBody(req);
        const { target, text, image } = data;

        if (image) {
          tmpImgPath = copyImage(image);
          execSync(`osascript -e 'set the clipboard to (read (POSIX file "${tmpImgPath}") as «class PNGf»)'`);
        } else {
          copyText(text);
        }

        activateAndPaste(target);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, target, app: APP_NAMES[target] }));
      } catch (e: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      } finally {
        if (tmpImgPath) {
          try { rmSync(tmpImgPath, { recursive: true }); } catch { }
        }
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`\n  rune-grab running on http://127.0.0.1:${port}`);
    if (cachedIIFE) {
      console.log(`  Add this to your HTML:`);
      console.log(`  <script src="http://localhost:${port}/rune-grab.js"><\/script>`);
    }
    console.log(`  Auto-paste targets: ${Object.values(APP_NAMES).filter(Boolean).join(', ')}\n`);
  });

  process.on('SIGINT', () => {
    server.close();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    server.close();
    process.exit(0);
  });
}

export { DEFAULT_PORT };
