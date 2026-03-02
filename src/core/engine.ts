import { releaseStream } from './screenshot.js';
import { sendToApp } from '../targets/app.js';
import { copyToClipboard } from '../targets/clipboard.js';
import type { RuneGrabConfig, GrabResult, TargetApp } from './types.js';
import { s, DEFAULTS } from './state.js';
import { createMiniMenu, renderMiniMenu, loadAutoPastePref, checkHelper, setMenuCallbacks } from '../ui/menu.js';
import { createGrabOverlay, removeGrabOverlay, createSelectionBox, removeSelectionBox } from '../ui/overlay.js';
import { onShortcut, setKeyboardCallbacks } from '../handlers/keyboard.js';
import { onRefMouseMove, onRefClick, onRefKeyDown, onRefScroll, setReferenceCallbacks } from '../handlers/inspect.js';
import { onSSMouseDown, onSSMouseMove, onSSMouseUp, onSSKeyDown, setScreenshotCallbacks } from '../handlers/capture.js';

async function dispatchResult(result: GrabResult): Promise<void> {
  s.config.onGrab(result);
  window.dispatchEvent(new CustomEvent('rune:grab', { detail: result }));

  if (s.config.target === 'clipboard') {
    await copyToClipboard(result);
  } else {
    await sendToApp(s.config.target, result);
  }
}

export function activate(): void {
  if (s.active) return;
  if (!document.body || !document.head) return;
  s.active = true;

  document.documentElement.classList.add('__rune-grab-active__');

  if (s.grabType === 'screenshot') {
    createGrabOverlay();
    createSelectionBox();
    document.addEventListener('mousedown', onSSMouseDown, true);
    document.addEventListener('mousemove', onSSMouseMove, true);
    document.addEventListener('mouseup', onSSMouseUp, true);
    document.addEventListener('keydown', onSSKeyDown, true);
  } else {
    createGrabOverlay();
    document.addEventListener('mousemove', onRefMouseMove, true);
    document.addEventListener('click', onRefClick, true);
    document.addEventListener('keydown', onRefKeyDown, true);
    document.addEventListener('scroll', onRefScroll, true);
  }

  s.config.onToggle(true);
}

export function deactivate(): void {
  if (!s.active) return;
  s.active = false;
  s.locked = false;
  s.promptMode = false;
  s.ssDrawing = false;
  s.selectedElement = null;

  if (s.mmRAF) { cancelAnimationFrame(s.mmRAF); s.mmRAF = 0; }

  document.removeEventListener('mousedown', onSSMouseDown, true);
  document.removeEventListener('mousemove', onSSMouseMove, true);
  document.removeEventListener('mouseup', onSSMouseUp, true);
  document.removeEventListener('keydown', onSSKeyDown, true);

  document.removeEventListener('mousemove', onRefMouseMove, true);
  document.removeEventListener('click', onRefClick, true);
  document.removeEventListener('keydown', onRefKeyDown, true);
  document.removeEventListener('scroll', onRefScroll, true);

  removeGrabOverlay();
  removeSelectionBox();
  document.documentElement.classList.remove('__rune-grab-active__');

  s.config.onToggle(false);
}

export function toggle(): void {
  if (s.active) deactivate(); else activate();
}

export function isActive(): boolean { return s.active; }

export function setTarget(target: TargetApp): void {
  s.config.target = target;
  if (s.menuExpanded) renderMiniMenu();
}

export function getTarget(): TargetApp { return s.config.target; }

export function init(userConfig: RuneGrabConfig = {}): () => void {
  if (s.initialized) return () => { };

  s.config = { ...DEFAULTS, ...userConfig };
  s.initialized = true;

  if (userConfig.skipComponents?.length) {
    s.customSkipSet = new Set(userConfig.skipComponents);
  }

  setMenuCallbacks(activate, deactivate);
  setKeyboardCallbacks(toggle, renderMiniMenu);
  setReferenceCallbacks(dispatchResult, deactivate, renderMiniMenu);
  setScreenshotCallbacks(dispatchResult, deactivate, renderMiniMenu);

  const savedAutoPaste = loadAutoPastePref();
  if (savedAutoPaste) {
    s.autoPasteEnabled = true;
    checkHelper().then((ok) => {
      s.helperAvailable = ok;
      if (!ok) s.config.target = 'clipboard';
      if (s.menuExpanded) renderMiniMenu();
    });
  }

  const setup = () => {
    createMiniMenu();
    document.addEventListener('keydown', onShortcut, true);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }

  return () => {
    deactivate();
    releaseStream();
    s.miniMenu?.remove();
    document.removeEventListener('keydown', onShortcut, true);
    s.initialized = false;
    s.hasDragged = false;
  };
}
