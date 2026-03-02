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

// Auto-initialize when imported as a side effect (e.g. `import 'rune-grab'`)
// Users can still call init() with custom config if needed — it's a no-op if already initialized.
init();
