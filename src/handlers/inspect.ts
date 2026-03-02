import { extractElementMeta, buildLabel, buildContextText, resolveElementMeta } from '../core/extract.js';
import { s } from '../core/state.js';
import { isOwnElement, doHighlight, hideHighlight, hideToolbar, showPromptInput, flash } from '../ui/overlay.js';
import { TARGET_LABELS } from '../ui/styles.js';
import type { GrabResult } from '../core/types.js';

type DispatchFn = (result: GrabResult) => Promise<void>;
type DeactivateFn = () => void;
type RenderFn = () => void;

let _dispatch: DispatchFn;
let _deactivate: DeactivateFn;
let _renderMiniMenu: RenderFn;

export function setReferenceCallbacks(dispatch: DispatchFn, deactivate: DeactivateFn, renderMiniMenu: RenderFn): void {
  _dispatch = dispatch;
  _deactivate = deactivate;
  _renderMiniMenu = renderMiniMenu;
}

async function executeReferenceGrab(el: Element, prompt: string): Promise<void> {
  const meta = extractElementMeta(el, s.customSkipSet);
  await resolveElementMeta(meta);
  const labelText = buildLabel(meta);
  const contextText = buildContextText(meta, prompt);

  const result: GrabResult = {
    type: 'reference', label: labelText, text: contextText, prompt, meta,
  };
  await _dispatch(result);
  flash(`Sent to ${TARGET_LABELS[s.config.target]}`);

  s.locked = false;
  hideToolbar();
  hideHighlight();
  s.selectedElement = null;
}

function showPromptForGrab(el: Element): void {
  if (!s.toolbar) return;
  const r = el.getBoundingClientRect();
  const tw = 270;
  const th = 34;
  let top = r.bottom + 6;
  let left = r.left + (r.width / 2) - (tw / 2);
  if (top + th > window.innerHeight - 8) top = r.top - th - 6;
  if (left < 8) left = 8;
  if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
  s.toolbar.style.top = top + 'px';
  s.toolbar.style.left = left + 'px';

  showPromptInput(async (prompt) => {
    await executeReferenceGrab(el, prompt);
  });
}

export function onRefMouseMove(e: MouseEvent): void {
  if (s.locked || s.mmRAF) return;
  s.mmRAF = requestAnimationFrame(() => {
    s.mmRAF = 0;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isOwnElement(el) || el === document.body || el === document.documentElement) {
      hideHighlight(); s.selectedElement = null; return;
    }
    s.selectedElement = el;
    doHighlight(el);
  });
}

export function onRefClick(e: MouseEvent): void {
  if (isOwnElement(e.target as Element)) return;
  if (s.promptMode) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  if (s.locked) { s.locked = false; hideToolbar(); return; }
  if (s.selectedElement) {
    s.locked = true;
    doHighlight(s.selectedElement);
    showPromptForGrab(s.selectedElement);
  }
}

export function onRefKeyDown(e: KeyboardEvent): void {
  if (s.promptMode) return;
  if (e.key === 'Escape') {
    if (s.locked) { s.locked = false; hideToolbar(); s.selectedElement = null; hideHighlight(); }
    else { _deactivate(); _renderMiniMenu(); }
  }
}

export function onRefScroll(): void {
  if (s.promptMode) return;
  if (s.locked) { s.locked = false; hideToolbar(); s.selectedElement = null; hideHighlight(); }
}
