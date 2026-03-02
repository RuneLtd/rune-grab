import { useEffect, useState, useCallback, useRef } from 'react';
import type { RuneGrabConfig, GrabResult, TargetApp } from '../core/types.js';

export type { RuneGrabConfig, GrabResult, TargetApp };

export interface UseRuneGrabReturn {
  active: boolean;
  toggle: () => void;
  activate: () => void;
  deactivate: () => void;
  setTarget: (target: TargetApp) => void;
  target: TargetApp;
  lastGrab: GrabResult | null;
}

export function useRuneGrab(config: RuneGrabConfig = {}): UseRuneGrabReturn {
  const [active, setActive] = useState(false);
  const [target, setTargetState] = useState<TargetApp>(config.target ?? 'clipboard');
  const [lastGrab, setLastGrab] = useState<GrabResult | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const engineRef = useRef<typeof import('../core/engine.js') | null>(null);

  useEffect(() => {
    let mounted = true;
    import('../core/engine.js').then((engine) => {
      if (!mounted) return;
      engineRef.current = engine;
      cleanupRef.current = engine.init({
        ...config,
        onGrab: (result) => {
          setLastGrab(result);
          config.onGrab?.(result);
        },
        onToggle: (isActive) => {
          setActive(isActive);
          config.onToggle?.(isActive);
        },
      });
    });

    return () => {
      mounted = false;
      cleanupRef.current?.();
    };
  }, []);

  const toggle = useCallback(() => {
    engineRef.current?.toggle();
  }, []);

  const activate = useCallback(() => {
    engineRef.current?.activate();
  }, []);

  const deactivate = useCallback(() => {
    engineRef.current?.deactivate();
  }, []);

  const setTarget = useCallback((t: TargetApp) => {
    setTargetState(t);
    engineRef.current?.setTarget(t);
  }, []);

  return { active, toggle, activate, deactivate, setTarget, target, lastGrab };
}
