import { Z_OVERLAY, Z_TOOLBAR, OWN_IDS, FLASH_VISIBLE_MS, FLASH_REMOVE_MS } from '../core/constants.js';
import { extractElementMeta, resolveElementMeta } from '../core/extract.js';
import { isLocalhost } from '../core/extract.js';
import { s } from '../core/state.js';
import { FONT, MONO, M_BG, M_FG, M_FG_DIM, M_BORDER, M_ACTIVE_BG, M_ACTIVE_FG, ICON_SEND } from './styles.js';

export function isOwnElement(el: Element | null): boolean {
  if (!el) return false;
  let cur: Element | null = el;
  while (cur) {
    if (cur.id && OWN_IDS.includes(cur.id)) return true;
    cur = cur.parentElement;
  }
  return false;
}

function getToolbarBase(): string {
  return `position:fixed;z-index:${Z_TOOLBAR};background:${M_BG};border:1px solid ${M_BORDER};border-radius:9px;box-shadow:0 2px 8px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04);display:none;flex-direction:row;align-items:center;top:0;left:0;font-family:${FONT};`;
}

export function createGrabOverlay(): void {
  if (s.overlay) return;

  s.overlay = document.createElement('div');
  s.overlay.id = '__rune-grab-overlay__';
  s.overlay.style.cssText = `position:fixed;pointer-events:none;z-index:${Z_OVERLAY};border:1px dashed ${M_BG};background:transparent;border-radius:3px;transition:all 0.08s ease-out;display:none;top:0;left:0;width:0;height:0;`;

  s.label = document.createElement('div');
  s.label.id = '__rune-grab-label__';
  s.label.style.cssText = `position:fixed;pointer-events:none;z-index:${Z_TOOLBAR};background:${M_BG};border:1px solid ${M_BORDER};color:${M_FG};font-size:10px;font-family:${MONO};padding:2px 6px;border-radius:5px;white-space:nowrap;display:none;top:0;left:0;line-height:1.4;font-weight:500;letter-spacing:0.01em;box-shadow:0 2px 8px rgba(0,0,0,0.08);`;

  s.toolbar = document.createElement('div');
  s.toolbar.id = '__rune-grab-toolbar__';
  s.toolbar.style.cssText = getToolbarBase() + 'padding:4px;gap:2px;';

  s.cursorStyle = document.createElement('style');
  s.cursorStyle.id = '__rune-grab-cursor__';
  s.cursorStyle.textContent = '.__rune-grab-active__ *{cursor:crosshair !important;}.__rune-grab-active__{cursor:crosshair !important;}';

  document.head.appendChild(s.cursorStyle);
  document.body.appendChild(s.overlay);
  document.body.appendChild(s.label);
  document.body.appendChild(s.toolbar);
}

export function removeGrabOverlay(): void {
  s.overlay?.remove();
  s.label?.remove();
  s.toolbar?.remove();
  s.cursorStyle?.remove();
  s.overlay = null;
  s.label = null;
  s.toolbar = null;
  s.cursorStyle = null;
}

export function createSelectionBox(): void {
  if (s.selectionBox) return;
  s.selectionBox = document.createElement('div');
  s.selectionBox.id = '__rune-grab-selection__';
  s.selectionBox.style.cssText = `
    position:fixed;z-index:${Z_OVERLAY};
    border:1px dashed ${M_BG};
    background:transparent;
    border-radius:2px;display:none;
    pointer-events:none;
    top:0;left:0;width:0;height:0;
  `;
  document.body.appendChild(s.selectionBox);
}

export function removeSelectionBox(): void {
  s.selectionBox?.remove();
  s.selectionBox = null;
}

export function doHighlight(el: Element): void {
  if (!s.overlay || !s.label) return;
  const r = el.getBoundingClientRect();
  s.overlay.style.top = r.top + 'px';
  s.overlay.style.left = r.left + 'px';
  s.overlay.style.width = r.width + 'px';
  s.overlay.style.height = r.height + 'px';
  s.overlay.style.display = 'block';

  const meta = extractElementMeta(el, s.customSkipSet);

  function formatDisplayName(): string {
    if (isLocalhost() && meta.component) {
      let dn = meta.component.name;
      if (meta.component.filePath) {
        const parts = meta.component.filePath.split('/');
        dn += ` · ${parts[parts.length - 1]}`;
        if (meta.component.line) dn += `:${meta.component.line}`;
      }
      return dn;
    }
    return meta.component ? `<${meta.component.name}>` : `<${meta.tag}>`;
  }

  s.label.textContent = formatDisplayName();

  // Async: resolve source-mapped lines and update label when ready
  if (isLocalhost() && meta.component && !meta.component.line) {
    resolveElementMeta(meta).then(() => {
      if (s.label && s.selectedElement === el) {
        s.label.textContent = formatDisplayName();
      }
    });
  }
  s.label.style.display = 'block';
  let lt = r.top - 22;
  if (lt < 4) lt = r.bottom + 4;
  s.label.style.top = lt + 'px';
  s.label.style.left = r.left + 'px';
}

export function hideHighlight(): void {
  if (s.overlay) s.overlay.style.display = 'none';
  if (s.label) s.label.style.display = 'none';
}

export function hideToolbar(): void {
  if (s.toolbar) s.toolbar.style.display = 'none';
}

export function flash(msg: string): void {
  if (!document.body) return;
  const f = document.createElement('div');
  f.textContent = msg;

  let x = s.lastMouseX + 12;
  let y = s.lastMouseY - 30;

  if (x + 150 > window.innerWidth) x = s.lastMouseX - 150;
  if (y < 4) y = s.lastMouseY + 16;

  f.style.cssText = `position:fixed;z-index:${Z_TOOLBAR + 3};top:${y}px;left:${x}px;background:${M_BG};color:${M_FG};font-size:11px;font-family:${FONT};padding:5px 12px;border-radius:7px;font-weight:500;pointer-events:none;opacity:1;transition:opacity 0.3s ease-out;box-shadow:0 2px 8px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04);border:1px solid ${M_BORDER};`;
  document.body.appendChild(f);
  setTimeout(() => (f.style.opacity = '0'), FLASH_VISIBLE_MS);
  setTimeout(() => f.remove(), FLASH_REMOVE_MS);
}

export function showPromptInput(onSubmit: (prompt: string) => void): void {
  if (!s.toolbar) return;
  s.promptMode = true;
  const prevTop = s.toolbar.style.top;
  const prevLeft = s.toolbar.style.left;
  s.toolbar.innerHTML = '';
  s.toolbar.style.cssText = getToolbarBase() + 'padding:3px 4px 3px 10px;gap:6px;';
  s.toolbar.style.top = prevTop;
  s.toolbar.style.left = prevLeft;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Comment (Enter ↵ send, Esc cancel)';
  input.className = '__rune-grab-prompt__';
  input.style.cssText = `background:transparent;border:none;outline:none;color:${M_FG};font-size:12px;font-family:${FONT};width:230px;padding:2px 0;caret-color:${M_FG};`;

  // Inject placeholder style — can't set ::placeholder via inline styles
  if (!document.getElementById('__rune-grab-placeholder-style__')) {
    const style = document.createElement('style');
    style.id = '__rune-grab-placeholder-style__';
    style.textContent = `.__rune-grab-prompt__::placeholder{color:${M_FG_DIM} !important;opacity:1 !important;}`;
    document.head.appendChild(style);
  }

  const sendBtn = document.createElement('button');
  sendBtn.innerHTML = ICON_SEND;
  sendBtn.style.cssText = `width:22px;height:22px;border:1px solid ${M_BORDER};background:${M_ACTIVE_BG};color:${M_ACTIVE_FG};border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;`;

  function submit() {
    let prompt = input.value.trim();
    if (prompt && !prompt.endsWith(':')) prompt += ':';
    s.promptMode = false;
    onSubmit(prompt);
  }

  function cancel() {
    s.promptMode = false;
    s.locked = false;
    hideToolbar();
    hideHighlight();
    s.selectedElement = null;
  }

  sendBtn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); submit(); });
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('click', (e) => e.stopPropagation());

  s.toolbar.appendChild(input);
  s.toolbar.appendChild(sendBtn);

  const tw = 270;
  const curLeft = parseFloat(s.toolbar.style.left);
  if (curLeft + tw > window.innerWidth - 8) {
    s.toolbar.style.left = Math.max(8, window.innerWidth - tw - 8) + 'px';
  }
  s.toolbar.style.display = 'flex';
  setTimeout(() => input.focus(), 0);
}
