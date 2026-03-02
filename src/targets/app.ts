import type { GrabResult, TargetApp } from '../core/types.js';
import { copyToClipboard } from './clipboard.js';

const HELPER_PORT = 19274;

async function isHelperRunning(): Promise<boolean> {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 500);
    const res = await fetch(`http://127.0.0.1:${HELPER_PORT}/health`, {
      signal: ac.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function sendToHelper(target: TargetApp, result: GrabResult): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${HELPER_PORT}/paste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target,
        text: result.text,
        image: result.image ?? null,
        label: result.label,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const APP_BUNDLE_IDS: Record<TargetApp, string> = {
  claude: 'com.anthropic.claudefordesktop',
  cursor: 'com.todesktop.230313mzl4w4u92',
  codex: 'com.openai.codex',
  'claude-code': '',
  clipboard: '',
};

export const APP_NAMES: Record<TargetApp, string> = {
  claude: 'Claude',
  cursor: 'Cursor',
  codex: 'Codex',
  'claude-code': 'Claude Code',
  clipboard: 'Clipboard',
};

export async function sendToApp(target: TargetApp, result: GrabResult): Promise<{ success: boolean; method: 'auto' | 'clipboard' }> {
  await copyToClipboard(result);

  if (target === 'clipboard') {
    return { success: true, method: 'clipboard' };
  }

  const helperUp = await isHelperRunning();
  if (helperUp) {
    const ok = await sendToHelper(target, result);
    if (ok) return { success: true, method: 'auto' };
  }

  return { success: true, method: 'clipboard' };
}

