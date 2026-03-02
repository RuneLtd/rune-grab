import type { TargetApp } from '../core/types.js';

export const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`;
export const MONO = `ui-monospace,SFMono-Regular,Menlo,monospace`;

export const M_BG = '#f5f5f5';
export const M_FG = '#171717';
export const M_FG_DIM = '#737373';
export const M_BORDER = '#e5e5e5';
export const M_HOVER = '#ebebeb';
export const M_ACTIVE_BG = '#171717';
export const M_ACTIVE_FG = '#f5f5f5';

export const ICON_SS = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
export const ICON_REF = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
export const ICON_X = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
export const ICON_CHEVRON_RIGHT = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
export const ICON_CHEVRON_LEFT = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
export const ICON_SEND = '<svg width="10" height="10" viewBox="0 0 448 512" fill="currentColor"><path d="M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264.5 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L70.2 289.1c-9.3 9.8-24.8 10-34.3.4z"/></svg>';
export const ICON_GRIP = `<svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor"><circle cx="1" cy="1" r="1"/><circle cx="5" cy="1" r="1"/><circle cx="1" cy="5" r="1"/><circle cx="5" cy="5" r="1"/><circle cx="1" cy="9" r="1"/><circle cx="5" cy="9" r="1"/></svg>`;

export const TARGET_LABELS: Record<TargetApp, string> = {
  clipboard: 'Clipboard',
  claude: 'Claude',
  cursor: 'Cursor',
  codex: 'Codex',
  'claude-code': 'CLI',
};

export const TARGETS_CLIPBOARD: TargetApp[] = ['clipboard'];
export const TARGETS_APPS: TargetApp[] = ['claude', 'cursor', 'codex', 'claude-code'];
