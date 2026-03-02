import { s } from '../core/state.js';

export function parseShortcut(shortcut: string) {
  const parts = shortcut.split('+');
  return {
    key: parts[parts.length - 1].toLowerCase(),
    meta: parts.some((p) => /^(meta|cmd)$/i.test(p)),
    ctrl: parts.some((p) => /^(ctrl|control)$/i.test(p)),
    shift: parts.some((p) => /^shift$/i.test(p)),
    alt: parts.some((p) => /^(alt|option)$/i.test(p)),
  };
}

type ToggleFn = () => void;
type RenderFn = () => void;

let _toggle: ToggleFn;
let _renderMiniMenu: RenderFn;

export function setKeyboardCallbacks(toggle: ToggleFn, renderMiniMenu: RenderFn): void {
  _toggle = toggle;
  _renderMiniMenu = renderMiniMenu;
}

export function onShortcut(e: KeyboardEvent): void {
  const sc = parseShortcut(s.config.shortcut);
  if (e.key.toLowerCase() === sc.key && e.metaKey === sc.meta && e.ctrlKey === sc.ctrl && e.shiftKey === sc.shift && e.altKey === sc.alt) {
    e.preventDefault();
    _toggle();
    _renderMiniMenu();
  }
}
