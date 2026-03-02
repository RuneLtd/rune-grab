import { Z_TOOLBAR, DRAG_THRESHOLD_PX, HELPER_PORT, HEALTH_CHECK_TIMEOUT_MS, LS_KEY } from '../core/constants.js';
import { s } from '../core/state.js';
import {
  FONT, MONO, M_BG, M_FG, M_FG_DIM, M_BORDER, M_HOVER, M_ACTIVE_BG, M_ACTIVE_FG,
  ICON_SS, ICON_REF, ICON_X, ICON_CHEVRON_RIGHT, ICON_CHEVRON_LEFT, ICON_GRIP,
  TARGET_LABELS, TARGETS_CLIPBOARD, TARGETS_APPS,
} from './styles.js';

type ActivateFn = () => void;
type DeactivateFn = () => void;
type RenderFn = () => void;

let _activate: ActivateFn;
let _deactivate: DeactivateFn;
let _renderMiniMenu: RenderFn;

export function setMenuCallbacks(activate: ActivateFn, deactivate: DeactivateFn): void {
  _activate = activate;
  _deactivate = deactivate;
}

export function loadAutoPastePref(): boolean {
  try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
}

export function saveAutoPastePref(v: boolean): void {
  try { localStorage.setItem(LS_KEY, v ? '1' : '0'); } catch { }
}

export async function checkHelper(): Promise<boolean> {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), HEALTH_CHECK_TIMEOUT_MS);
    const res = await fetch(`http://127.0.0.1:${HELPER_PORT}/health`, {
      signal: ac.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch { return false; }
}

async function onAutoPasteToggle(enabled: boolean): Promise<void> {
  s.autoPasteEnabled = enabled;
  saveAutoPastePref(enabled);

  if (enabled) {
    s.helperChecking = true;
    renderMiniMenu();
    s.helperAvailable = await checkHelper();
    s.helperChecking = false;

    if (!s.helperAvailable) {
      s.config.target = 'clipboard';
    }
  } else {
    s.helperAvailable = false;
    s.config.target = 'clipboard';
  }

  renderMiniMenu();
}

function buildToggle(on: boolean, onChange: (v: boolean) => void): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = `display:inline-flex;align-items:center;flex-shrink:0;`;

  const track = document.createElement('div');
  track.style.cssText = `
    width:28px;height:16px;border-radius:8px;cursor:pointer;
    transition:background 0.15s;position:relative;
    background:${on ? M_ACTIVE_BG : '#d4d4d4'};
  `;

  const thumb = document.createElement('div');
  thumb.style.cssText = `
    width:12px;height:12px;border-radius:50%;
    background:${on ? M_ACTIVE_FG : '#fff'};
    position:absolute;top:2px;transition:left 0.15s;
    left:${on ? '14px' : '2px'};
    box-shadow:0 1px 2px rgba(0,0,0,0.15);
  `;
  track.appendChild(thumb);

  track.addEventListener('click', (e) => {
    e.stopPropagation();
    onChange(!on);
  });

  wrap.appendChild(track);
  return wrap;
}

function grabIconBtn(icon: string, isActive: boolean, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.innerHTML = icon;
  btn.style.cssText = `
    width:28px;height:28px;border:none;border-radius:6px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;padding:0;
    transition:all 0.15s;
    background:${isActive ? M_ACTIVE_BG : 'transparent'};
    color:${isActive ? M_ACTIVE_FG : M_FG_DIM};
  `;

  btn.addEventListener('mouseenter', () => {
    if (!isActive) { btn.style.background = M_HOVER; btn.style.color = M_FG; }
  });
  btn.addEventListener('mouseleave', () => {
    if (!isActive) { btn.style.background = 'transparent'; btn.style.color = M_FG_DIM; }
  });
  btn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); onClick(); });

  return btn;
}

function sep(): HTMLDivElement {
  const d = document.createElement('div');
  d.style.cssText = `width:1px;height:16px;background:${M_BORDER};margin:0 2px;flex-shrink:0;`;
  return d;
}

function onGripPointerDown(e: PointerEvent): void {
  if (e.button !== 0 || !s.menuExpanded || !s.miniMenu) return;
  e.preventDefault();

  const grip = e.currentTarget as HTMLElement;
  grip.setPointerCapture(e.pointerId);
  s.dragPointerId = e.pointerId;

  s.dragStartX = e.clientX;
  s.dragStartY = e.clientY;
  s.dragPending = true;
  s.dragging = false;

  const rect = s.miniMenu.getBoundingClientRect();
  s.dragW = rect.width;
  s.dragH = rect.height;

  if (!s.hasDragged) {
    s.miniMenu.style.top = rect.top + 'px';
    s.miniMenu.style.left = rect.left + 'px';
    s.miniMenu.style.bottom = 'auto';
    s.miniMenu.style.right = 'auto';
    s.hasDragged = true;
  }

  s.dragBaseX = parseFloat(s.miniMenu.style.left) || rect.left;
  s.dragBaseY = parseFloat(s.miniMenu.style.top) || rect.top;
  s.dragLastX = s.dragBaseX;
  s.dragLastY = s.dragBaseY;
}

function onGripPointerMove(e: PointerEvent): void {
  if (e.pointerId !== s.dragPointerId || !s.miniMenu) return;
  if (!s.dragPending && !s.dragging) return;

  const dx = e.clientX - s.dragStartX;
  const dy = e.clientY - s.dragStartY;

  if (s.dragPending && !s.dragging) {
    if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
    s.dragging = true;
    s.dragPending = false;
    s.miniMenu.style.transition = 'none';
    s.miniMenu.style.willChange = 'left, top';
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  if (s.dragging) {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    s.dragLastX = Math.max(0, Math.min(s.dragBaseX + dx, vw - s.dragW));
    s.dragLastY = Math.max(0, Math.min(s.dragBaseY + dy, vh - s.dragH));
    s.miniMenu.style.left = s.dragLastX + 'px';
    s.miniMenu.style.top = s.dragLastY + 'px';
  }
}

function onGripPointerUp(e: PointerEvent): void {
  if (e.pointerId !== s.dragPointerId || !s.miniMenu) return;
  s.dragPointerId = -1;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  if (s.dragging) {
    s.dragging = false;
    s.miniMenu.style.willChange = '';
    s.miniMenu.style.transition = 'left 0.15s ease, top 0.15s ease';

    s.miniMenu.style.pointerEvents = 'none';
    requestAnimationFrame(() => { if (s.miniMenu) s.miniMenu.style.pointerEvents = ''; });
  }
  s.dragPending = false;
}

function snapToNearestEdge(): void {
  if (!s.miniMenu) return;
  const rect = s.miniMenu.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const distTop = cy;
  const distBottom = vh - cy;
  const distLeft = cx;
  const distRight = vw - cx;
  const minDist = Math.min(distTop, distBottom, distLeft, distRight);

  if (minDist === distTop) s.dockedEdge = 'top';
  else if (minDist === distBottom) s.dockedEdge = 'bottom';
  else if (minDist === distLeft) s.dockedEdge = 'left';
  else s.dockedEdge = 'right';

  s.miniMenu.style.transition = 'none';

  renderMiniMenu();

  requestAnimationFrame(() => {
    if (!s.miniMenu) return;
    const tabRect = s.miniMenu.getBoundingClientRect();
    const tw = tabRect.width;
    const th = tabRect.height;
    let targetX = parseFloat(s.miniMenu.style.left) || 0;
    let targetY = parseFloat(s.miniMenu.style.top) || 0;

    if (s.dockedEdge === 'top') targetY = 0;
    else if (s.dockedEdge === 'bottom') targetY = vh - th;
    else if (s.dockedEdge === 'left') targetX = 0;
    else if (s.dockedEdge === 'right') targetX = vw - tw;

    targetX = Math.max(0, Math.min(targetX, vw - tw));
    targetY = Math.max(0, Math.min(targetY, vh - th));

    s.miniMenu.style.transition = 'left 0.25s ease, top 0.25s ease';
    s.miniMenu.style.left = targetX + 'px';
    s.miniMenu.style.top = targetY + 'px';
    setTimeout(() => { if (s.miniMenu) s.miniMenu.style.transition = 'left 0.15s ease, top 0.15s ease'; }, 270);
  });
}

function clampToViewport(): void {
  if (!s.miniMenu || !s.hasDragged) return;

  const rect = s.miniMenu.getBoundingClientRect();
  let x = rect.left;
  let y = rect.top;
  let clamped = false;

  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  if (x + rect.width > vw) { x = vw - rect.width; clamped = true; }
  if (x < 0) { x = 0; clamped = true; }
  if (y + rect.height > vh) { y = vh - rect.height; clamped = true; }
  if (y < 0) { y = 0; clamped = true; }

  if (clamped) {
    s.miniMenu.style.transition = 'left 0.2s ease, top 0.2s ease';
    s.miniMenu.style.left = x + 'px';
    s.miniMenu.style.top = y + 'px';
    setTimeout(() => { if (s.miniMenu) s.miniMenu.style.transition = 'left 0.15s ease, top 0.15s ease'; }, 220);
  }
}

export function createMiniMenu(): void {
  s.miniMenu = document.createElement('div');
  s.miniMenu.id = '__rune-grab-menu__';

  s.dockedEdge = 'bottom';
  s.menuExpanded = false;

  s.miniMenu.style.cssText = `
    position:fixed;z-index:${Z_TOOLBAR + 2};
    background:transparent;border:none;
    border-radius:9px;font-family:${FONT};
    box-shadow:none;
    transition:left 0.15s ease, top 0.15s ease;
    user-select:none;
    bottom:0px;right:16px;
  `;

  document.addEventListener('mousemove', (e) => { s.lastMouseX = e.clientX; s.lastMouseY = e.clientY; }, { passive: true });

  document.body.appendChild(s.miniMenu);
  renderMiniMenu();
}

export function renderMiniMenu(): void {
  if (!s.miniMenu) return;
  const frag = document.createDocumentFragment();

  if (!s.menuExpanded) {
    s.miniMenu.style.padding = '0';
    s.miniMenu.style.border = 'none';
    s.miniMenu.style.boxShadow = 'none';
    s.miniMenu.style.background = 'transparent';

    let chevronSvg: string;
    let tabW: number;
    let tabH: number;
    let borderRadius: string;
    const edge = s.dockedEdge || 'bottom';

    if (edge === 'bottom') {
      chevronSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${M_FG}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
      tabW = 40; tabH = 28;
      borderRadius = '10px 10px 0 0';
    } else if (edge === 'top') {
      chevronSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${M_FG}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
      tabW = 40; tabH = 28;
      borderRadius = '0 0 10px 10px';
    } else if (edge === 'left') {
      chevronSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${M_FG}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
      tabW = 28; tabH = 40;
      borderRadius = '0 10px 10px 0';
    } else {
      chevronSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${M_FG}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
      tabW = 28; tabH = 40;
      borderRadius = '10px 0 0 10px';
    }

    const tab = document.createElement('button');
    tab.title = 'Rune Grab';
    tab.innerHTML = chevronSvg;
    tab.style.cssText = `
      width:${tabW}px;height:${tabH}px;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      background:${M_BG};color:${M_FG};
      border-radius:${borderRadius};
      box-shadow:0 2px 8px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04);
      transition:background 0.12s;padding:0;
    `;
    tab.addEventListener('mouseenter', () => { tab.style.background = M_HOVER; });
    tab.addEventListener('mouseleave', () => { tab.style.background = M_BG; });
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!s.miniMenu) return;

      const rect = s.miniMenu.getBoundingClientRect();
      s.miniMenu.style.bottom = 'auto';
      s.miniMenu.style.right = 'auto';
      s.miniMenu.style.top = rect.top + 'px';
      s.miniMenu.style.left = rect.left + 'px';
      s.hasDragged = true;

      s.menuExpanded = true;
      s.dockedEdge = null;

      s.miniMenu.style.background = M_BG;
      s.miniMenu.style.border = `1px solid ${M_BORDER}`;
      s.miniMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04)';
      s.miniMenu.style.borderRadius = '9px';

      s.miniMenu.style.transition = 'none';
      renderMiniMenu();
      s.miniMenu.offsetWidth;
      clampToViewport();
    });
    frag.appendChild(tab);
    s.miniMenu.textContent = '';
    s.miniMenu.appendChild(frag);
    return;
  }

  s.miniMenu.style.padding = '3px';

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;align-items:center;gap:2px;';

  const grip = document.createElement('div');
  grip.style.cssText = `
    width:12px;height:28px;cursor:grab;display:flex;align-items:center;justify-content:center;
    flex-shrink:0;border-radius:4px;color:${M_FG_DIM};transition:color 0.12s;
  `;
  grip.innerHTML = ICON_GRIP;
  grip.addEventListener('mouseenter', () => { grip.style.color = M_FG; });
  grip.addEventListener('mouseleave', () => { if (!s.dragging) grip.style.color = M_FG_DIM; });
  grip.addEventListener('pointerdown', onGripPointerDown);
  grip.addEventListener('pointermove', onGripPointerMove);
  grip.addEventListener('pointerup', onGripPointerUp);
  grip.style.touchAction = 'none';
  bar.appendChild(grip);

  const ssActive = s.active && s.grabType === 'screenshot';
  bar.appendChild(grabIconBtn(ICON_SS, ssActive, () => {
    if (ssActive) { _deactivate(); }
    else { if (s.active) _deactivate(); s.grabType = 'screenshot'; _activate(); }
    renderMiniMenu();
  }));

  const refActive = s.active && s.grabType === 'reference';
  bar.appendChild(grabIconBtn(ICON_REF, refActive, () => {
    if (refActive) { _deactivate(); }
    else { if (s.active) _deactivate(); s.grabType = 'reference'; _activate(); }
    renderMiniMenu();
  }));

  bar.appendChild(sep());

  const visibleTargets = s.autoPasteEnabled && s.helperAvailable
    ? [...TARGETS_CLIPBOARD, ...TARGETS_APPS]
    : TARGETS_CLIPBOARD;

  const toggleBtn = document.createElement('button');
  toggleBtn.innerHTML = s.targetsExpanded ? ICON_CHEVRON_RIGHT : ICON_CHEVRON_LEFT;
  toggleBtn.title = s.targetsExpanded ? 'Collapse targets' : 'Send to…';
  toggleBtn.style.cssText = `
    width:24px;height:28px;border:none;background:transparent;cursor:pointer;
    display:flex;align-items:center;justify-content:center;border-radius:6px;
    color:${M_FG_DIM};transition:all 0.12s;padding:0;flex-shrink:0;
  `;
  toggleBtn.addEventListener('mouseenter', () => { toggleBtn.style.background = M_HOVER; toggleBtn.style.color = M_FG; });
  toggleBtn.addEventListener('mouseleave', () => { toggleBtn.style.background = 'transparent'; toggleBtn.style.color = M_FG_DIM; });
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    s.targetsExpanded = !s.targetsExpanded;

    if (targetsWrap) {
      if (s.targetsExpanded) {
        targetsWrap.style.width = 'auto';
        const naturalW = targetsWrap.scrollWidth;
        targetsWrap.style.width = '0px';
        targetsWrap.offsetWidth;
        targetsWrap.style.width = naturalW + 'px';
        targetsWrap.style.opacity = '1';
        setTimeout(() => { if (targetsWrap) targetsWrap.style.width = 'auto'; clampToViewport(); }, 200);
      } else {
        const currentW = targetsWrap.scrollWidth;
        targetsWrap.style.width = currentW + 'px';
        targetsWrap.offsetWidth;
        targetsWrap.style.width = '0px';
        targetsWrap.style.opacity = '0';
      }
    }

    toggleBtn.innerHTML = s.targetsExpanded ? ICON_CHEVRON_RIGHT : ICON_CHEVRON_LEFT;
    toggleBtn.title = s.targetsExpanded ? 'Collapse targets' : 'Send to…';
  });
  bar.appendChild(toggleBtn);

  const targetsWrap = document.createElement('div');
  targetsWrap.style.cssText = `
    display:flex;align-items:center;gap:2px;
    overflow:hidden;white-space:nowrap;
    transition:width 0.2s ease, opacity 0.15s ease;
    ${s.targetsExpanded ? 'opacity:1;' : 'width:0px;opacity:0;'}
  `;

  for (const t of visibleTargets) {
    const isCurrent = t === s.config.target;
    const btn = document.createElement('button');
    btn.textContent = TARGET_LABELS[t];
    btn.style.cssText = `
      height:28px;padding:0 8px;border:none;border-radius:6px;cursor:pointer;
      font-size:11px;font-weight:${isCurrent ? '600' : '500'};font-family:${FONT};
      transition:all 0.12s;flex-shrink:0;
      background:${isCurrent ? M_ACTIVE_BG : 'transparent'};
      color:${isCurrent ? M_ACTIVE_FG : M_FG_DIM};
    `;
    btn.addEventListener('mouseenter', () => {
      if (!isCurrent) btn.style.background = M_HOVER;
    });
    btn.addEventListener('mouseleave', () => {
      if (!isCurrent) btn.style.background = 'transparent';
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      s.config.target = t;
      renderMiniMenu();
    });
    targetsWrap.appendChild(btn);
  }

  bar.appendChild(targetsWrap);

  if (s.targetsExpanded) bar.appendChild(sep());

  bar.appendChild(buildToggle(s.autoPasteEnabled, onAutoPasteToggle));

  if (s.autoPasteEnabled && !s.helperAvailable && !s.helperChecking) {
    bar.appendChild(sep());
    const hint = document.createElement('div');
    hint.style.cssText = `
      font-size:8px;font-family:${MONO};color:${M_FG_DIM};
      padding:0 6px;white-space:nowrap;flex-shrink:0;line-height:1.3;
    `;
    hint.innerHTML = `To enable auto pasting: add <br><span style="color:${M_FG};font-weight:600;">rune-grab serve</span> to your dev script.`;
    bar.appendChild(hint);
  }

  if (s.helperChecking) {
    bar.appendChild(sep());
    const checking = document.createElement('span');
    checking.textContent = 'Connecting…';
    checking.style.cssText = `font-size:10px;font-family:${FONT};color:${M_FG_DIM};padding:0 4px;flex-shrink:0;`;
    bar.appendChild(checking);
  }

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = ICON_X;
  closeBtn.style.cssText = `
    width:28px;height:28px;border:none;background:transparent;cursor:pointer;
    display:flex;align-items:center;justify-content:center;border-radius:6px;
    color:${M_FG_DIM};transition:all 0.12s;padding:0;
  `;
  closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = M_HOVER; closeBtn.style.color = M_FG; });
  closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'transparent'; closeBtn.style.color = M_FG_DIM; });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    s.menuExpanded = false;

    if (!s.hasDragged && s.miniMenu) {
      const r = s.miniMenu.getBoundingClientRect();
      s.miniMenu.style.top = r.top + 'px';
      s.miniMenu.style.left = r.left + 'px';
      s.miniMenu.style.bottom = 'auto';
      s.miniMenu.style.right = 'auto';
      s.hasDragged = true;
    }

    snapToNearestEdge();
  });
  bar.appendChild(closeBtn);

  frag.appendChild(bar);
  s.miniMenu.textContent = '';
  s.miniMenu.appendChild(frag);
}
