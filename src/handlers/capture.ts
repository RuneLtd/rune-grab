import { captureRect } from '../core/screenshot.js';
import { isLocalhost } from '../core/extract.js';
import { s } from '../core/state.js';
import { isOwnElement, createSelectionBox, flash } from '../ui/overlay.js';
import type { GrabResult } from '../core/types.js';

type DispatchFn = (result: GrabResult) => Promise<void>;
type DeactivateFn = () => void;
type RenderFn = () => void;

let _dispatch: DispatchFn;
let _deactivate: DeactivateFn;
let _renderMiniMenu: RenderFn;

export function setScreenshotCallbacks(dispatch: DispatchFn, deactivate: DeactivateFn, renderMiniMenu: RenderFn): void {
  _dispatch = dispatch;
  _deactivate = deactivate;
  _renderMiniMenu = renderMiniMenu;
}

export function onSSMouseDown(e: MouseEvent): void {
  if (e.button !== 0) return;
  if (isOwnElement(e.target as Element)) return;
  e.preventDefault();
  e.stopPropagation();
  s.ssDrawing = true;
  s.ssStartX = e.clientX;
  s.ssStartY = e.clientY;
  if (s.selectionBox) {
    s.selectionBox.style.left = s.ssStartX + 'px';
    s.selectionBox.style.top = s.ssStartY + 'px';
    s.selectionBox.style.width = '0px';
    s.selectionBox.style.height = '0px';
    s.selectionBox.style.display = 'block';
  }
}

export function onSSMouseMove(e: MouseEvent): void {
  if (!s.ssDrawing || !s.selectionBox) return;
  e.preventDefault();
  const x = Math.min(e.clientX, s.ssStartX);
  const y = Math.min(e.clientY, s.ssStartY);
  const w = Math.abs(e.clientX - s.ssStartX);
  const h = Math.abs(e.clientY - s.ssStartY);
  s.selectionBox.style.left = x + 'px';
  s.selectionBox.style.top = y + 'px';
  s.selectionBox.style.width = w + 'px';
  s.selectionBox.style.height = h + 'px';
}

export async function onSSMouseUp(e: MouseEvent): Promise<void> {
  if (!s.ssDrawing) return;
  s.ssDrawing = false;
  e.preventDefault();
  e.stopPropagation();

  const x = Math.min(e.clientX, s.ssStartX);
  const y = Math.min(e.clientY, s.ssStartY);
  const w = Math.abs(e.clientX - s.ssStartX);
  const h = Math.abs(e.clientY - s.ssStartY);
  const selBox = s.selectionBox;
  if (selBox) selBox.remove();
  s.selectionBox = null;
  if (s.miniMenu) s.miniMenu.style.display = 'none';
  if (s.cursorStyle) s.cursorStyle.disabled = true;

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  if (w >= 10 && h >= 10) {
    const image = await captureRect({ x, y, width: w, height: h });

    if (s.miniMenu) s.miniMenu.style.display = '';
    if (s.cursorStyle) s.cursorStyle.disabled = false;
    createSelectionBox();

    if (image) {
      const result: GrabResult = {
        type: 'screenshot',
        label: `Region ${w}×${h}`,
        text: `Screenshot region: ${w}×${h} at (${Math.round(x)}, ${Math.round(y)})`,
        prompt: '',
        image,
        meta: { tag: 'region', visibleText: '', html: '', attrs: {}, isLocal: isLocalhost() },
      };
      await _dispatch(result);
      flash('Screenshot captured');
    }
  } else {
    if (s.miniMenu) s.miniMenu.style.display = '';
    if (s.cursorStyle) s.cursorStyle.disabled = false;
    createSelectionBox();
  }
}

export function onSSKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    if (s.ssDrawing) {
      s.ssDrawing = false;
      if (s.selectionBox) s.selectionBox.style.display = 'none';
    } else {
      _deactivate();
      _renderMiniMenu();
    }
  }
}
