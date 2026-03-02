import { init, activate, deactivate, toggle, isActive, setTarget, getTarget } from './core/engine.js';
import type { RuneGrabConfig, GrabResult, TargetApp } from './core/types.js';

const userConfig = (typeof window !== 'undefined' && (window as any).__RUNE_GRAB_CONFIG__) || {};
init(userConfig);

export { init, activate, deactivate, toggle, isActive, setTarget, getTarget };
export type { RuneGrabConfig, GrabResult, TargetApp };
