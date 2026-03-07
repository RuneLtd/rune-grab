import { init } from './core/engine.js';
export { init, activate, deactivate, toggle, isActive, setTarget, getTarget } from './core/engine.js';
export { extractElementMeta, buildLabel, buildContextText, resolveElementMeta } from './core/extract.js';
export { detectComponent, detectComponentStack, resolveComponentInfo, resolveComponentFrame } from './core/frameworks.js';
export { resolveOriginalPosition } from './core/sourcemap.js';
export { captureRect, releaseStream, setCaptureProvider } from './core/screenshot.js';
export { copyToClipboard } from './targets/clipboard.js';
export { sendToApp, APP_NAMES } from './targets/app.js';

export type {
  RuneGrabConfig,
  GrabResult,
  TargetApp,
  ElementMeta,
  ComponentInfo,
  ComponentFrame,
} from './core/types.js';

init();
