import { SKIP_PREFIXES, isSourceFile } from './constants.js';
import { resolveOriginalPosition, prewarmSourceMap } from './sourcemap.js';
import type { ComponentInfo, ComponentFrame } from './types.js';

interface SourceLoc {
  fileName: string;
  lineNumber: number | null;
  columnNumber: number | null;
  _bundledUrl?: string;
  _bundledLine?: number;
  _bundledCol?: number;
}

const pendingResolution = new WeakMap<
  ComponentInfo | ComponentFrame,
  { url: string; line: number; col: number }
>();

function isUsefulName(name: string, filePath: string | null, customSkip?: Set<string>): boolean {
  if (!name || name.length <= 1) return false;
  if (customSkip?.has(name)) return false;
  if (name[0] !== name[0].toUpperCase()) return false;
  for (const pfx of SKIP_PREFIXES) {
    if (name.startsWith(pfx)) return false;
  }
  if (/^[A-Z][a-zA-Z]+\d+$/.test(name)) return false;
  if (filePath && !isSourceFile(filePath)) return false;
  return true;
}

/** Check name quality only — ignores file path. Used for fallback detection. */
function isCleanComponentName(name: string, customSkip?: Set<string>): boolean {
  if (!name || name.length <= 1) return false;
  if (customSkip?.has(name)) return false;
  if (name[0] !== name[0].toUpperCase()) return false;
  for (const pfx of SKIP_PREFIXES) {
    if (name.startsWith(pfx)) return false;
  }
  if (/^[A-Z][a-zA-Z]+\d+$/.test(name)) return false;
  return true;
}

/** Detect infrastructure components (providers, wrappers, boundaries) that are
 *  poor candidates for describing a UI element. */
function isInfraName(name: string): boolean {
  return /(?:Provider|Context|Consumer|Boundary|Wrapper|Root|Layout|Suspense)$/i.test(name);
}

function cleanFilePath(raw: string): string {
  return raw
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^rsc:\/\/[^/]+\/[^/]+\//, '')
    .replace(/^webpack-internal:\/\/\//, '')
    .replace(/^\([\w-]+\)\//, '')
    .replace(/\?.*$/, '')
    .replace(/^\/app\//, '')
    .replace(/^\.\//, '');
}

function parseStackForSource(stack: string | undefined): SourceLoc | null {
  if (!stack) return null;
  const lines = stack.split('\n');
  for (const line of lines) {
    const match = line.match(/\((.+):(\d+):(\d+)\)/) || line.match(/at\s+(.+):(\d+):(\d+)/);
    if (match) {
      const rawUrl = match[1].trim();
      const cleaned = cleanFilePath(rawUrl);
      if (isSourceFile(cleaned)) {
        const bundledLine = parseInt(match[2], 10);
        const bundledCol = parseInt(match[3], 10);
        return {
          fileName: cleaned,
          lineNumber: bundledLine,
          columnNumber: bundledCol,
          _bundledUrl: rawUrl,
          _bundledLine: bundledLine,
          _bundledCol: bundledCol,
        };
      }
    }
  }
  return null;
}

function getSourceFromFiber(fiber: any): SourceLoc | null {
  if (fiber._debugSource) {
    return {
      fileName: fiber._debugSource.fileName,
      lineNumber: fiber._debugSource.lineNumber ?? null,
      columnNumber: fiber._debugSource.columnNumber ?? null,
    };
  }

  const debugStack = fiber._debugStack;
  if (debugStack) {
    const raw = typeof debugStack === 'string' ? debugStack : debugStack?.stack;
    const loc = parseStackForSource(raw);
    if (loc) {
      const canFetchMap = loc._bundledUrl?.startsWith('http');
      if (canFetchMap) {
        prewarmSourceMap(loc._bundledUrl!);
        return {
          fileName: loc.fileName,
          lineNumber: null,
          columnNumber: null,
          _bundledUrl: loc._bundledUrl,
          _bundledLine: loc._bundledLine,
          _bundledCol: loc._bundledCol,
        };
      }
      return {
        fileName: loc.fileName,
        lineNumber: loc._bundledLine ?? null,
        columnNumber: loc._bundledCol ?? null,
      };
    }
  }

  return null;
}

function getReactFiber(el: Element): any | null {
  const keys = Object.keys(el);
  for (const key of keys) {
    if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
      return (el as any)[key];
    }
  }
  return null;
}

function storePendingResolution(target: ComponentInfo | ComponentFrame, src: SourceLoc): void {
  if (src._bundledUrl && src._bundledLine != null) {
    pendingResolution.set(target, {
      url: src._bundledUrl,
      line: src._bundledLine,
      col: src._bundledCol ?? 0,
    });
  }
}

function getReactComponentInfo(el: Element, customSkip?: Set<string>): ComponentInfo | null {
  const fiber = getReactFiber(el);
  if (!fiber) return null;

  const elementSrc = getSourceFromFiber(fiber);
  let isFirst = true;

  // Fallback: first component with a clean name but no user-source filePath.
  // Prefer this over infrastructure components like providers/wrappers.
  let fallback: ComponentInfo | null = null;

  let cur = fiber;
  while (cur) {
    let name: string | null = null;
    let src: SourceLoc | null = null;

    if (cur.type && typeof cur.type === 'function') {
      name = cur.type.displayName || cur.type.name;
      src = isFirst && elementSrc ? elementSrc : getSourceFromFiber(cur);
    } else if (cur.type?.$$typeof) {
      // forwardRef/memo: displayName lives on the wrapper, not the inner fn
      const inner = cur.type.render || cur.type.type;
      name = cur.type.displayName
        || (inner && typeof inner === 'function' ? (inner.displayName || inner.name) : null)
        || null;
      if (name) {
        src = isFirst && elementSrc ? elementSrc : getSourceFromFiber(cur);
      }
    }

    if (name) {
      const filePath = src?.fileName ? cleanFilePath(src.fileName) : null;

      // Best case: user component with source in project files
      if (filePath && isUsefulName(name, filePath, customSkip)) {
        const info: ComponentInfo = {
          name,
          filePath,
          line: src?.lineNumber ?? null,
          column: src?.columnNumber ?? null,
        };
        if (src) storePendingResolution(info, src);
        return info;
      }

      // Track first non-infra component as fallback (e.g. Heading, Text, Box
      // from Chakra that lack _debugSource when rendered from server components).
      // No source/line for fallbacks — the fiber debug info points to library
      // internals, not the user's JSX call site.
      if (!fallback && isCleanComponentName(name, customSkip) && !isInfraName(name)) {
        fallback = {
          name,
          filePath: null,
          line: null,
          column: null,
        };
      }

      isFirst = false;
    }

    cur = cur.return;
  }

  // No user component found — return the closest meaningful library component.
  // storePendingResolution was already called when the fallback was created,
  // so source map resolution will update the path if possible.
  if (fallback) {
    return fallback;
  }

  return null;
}

function getReactComponentStack(el: Element, maxDepth = 6, customSkip?: Set<string>): ComponentFrame[] {
  const fiber = getReactFiber(el);
  if (!fiber) return [];

  const elementSrc = getSourceFromFiber(fiber);

  const stack: ComponentFrame[] = [];
  const fallbackStack: ComponentFrame[] = [];
  const seen = new Set<string>();
  const fallbackSeen = new Set<string>();
  let cur = fiber;
  let isFirst = true;

  while (cur && stack.length < maxDepth) {
    let name: string | null = null;
    let src: SourceLoc | null = null;

    if (cur.type && typeof cur.type === 'function') {
      name = cur.type.displayName || cur.type.name;
      src = isFirst && elementSrc ? elementSrc : getSourceFromFiber(cur);
    } else if (cur.type?.$$typeof) {
      // forwardRef/memo: displayName lives on the wrapper, not the inner fn
      const inner = cur.type.render || cur.type.type;
      name = cur.type.displayName
        || (inner && typeof inner === 'function' ? (inner.displayName || inner.name) : null)
        || null;
      if (name) {
        src = isFirst && elementSrc ? elementSrc : getSourceFromFiber(cur);
      }
    }

    if (name) {
      let filePath = src?.fileName ? cleanFilePath(src.fileName) : null;

      // Best case: user component with source in project files
      if (filePath && isUsefulName(name, filePath, customSkip) && !seen.has(name)) {
        seen.add(name);
        const frame: ComponentFrame = { name, filePath, line: src?.lineNumber ?? null };
        if (src) storePendingResolution(frame, src);
        stack.push(frame);
        isFirst = false;
      }
      // Track non-infra library components as fallback candidates.
      // No source/line — fiber debug info is unreliable for library components.
      else if (
        fallbackStack.length < maxDepth &&
        isCleanComponentName(name, customSkip) &&
        !isInfraName(name) &&
        !fallbackSeen.has(name)
      ) {
        fallbackSeen.add(name);
        fallbackStack.push({ name, filePath: null, line: null });
      }
    }

    cur = cur.return;
  }

  // Prefer fallback (e.g. Heading, Text) over a stack that only contains
  // infrastructure components (e.g. ChakraProvider).
  if (fallbackStack.length > 0 && stack.every(f => isInfraName(f.name))) {
    return fallbackStack;
  }
  return stack.length > 0 ? stack : fallbackStack;
}

function getVueComponentInfo(el: Element): ComponentInfo | null {
  let cur: Element | null = el;
  while (cur) {
    const vueInstance = (cur as any).__vueParentComponent;
    if (vueInstance) {
      const name = vueInstance.type?.name || vueInstance.type?.__name;
      if (name) {
        const file = vueInstance.type?.__file ?? null;
        return { name, filePath: file, line: null, column: null };
      }
    }
    const vue2 = (cur as any).__vue__;
    if (vue2) {
      const name = vue2.$options?.name || vue2.$options?._componentTag;
      if (name) {
        const file = vue2.$options?.__file ?? null;
        return { name, filePath: file, line: null, column: null };
      }
    }
    cur = cur.parentElement;
  }
  return null;
}

function getSvelteComponentInfo(el: Element): ComponentInfo | null {
  const meta = (el as any).__svelte_meta;
  if (meta?.loc) {
    const file = meta.loc.file;
    const name = file ? file.split('/').pop()?.replace(/\.svelte$/, '') : null;
    if (name) {
      return { name, filePath: file, line: meta.loc.line ?? null, column: meta.loc.column ?? null };
    }
  }
  const keys = Object.keys(el);
  for (const key of keys) {
    if (key.startsWith('__svelte')) {
      return { name: 'SvelteComponent', filePath: null, line: null, column: null };
    }
  }
  return null;
}

export function detectComponent(el: Element, customSkip?: Set<string>): ComponentInfo | null {
  return getReactComponentInfo(el, customSkip)
    || getVueComponentInfo(el)
    || getSvelteComponentInfo(el)
    || null;
}

export function detectComponentStack(el: Element, maxDepth = 6, customSkip?: Set<string>): ComponentFrame[] {
  const reactStack = getReactComponentStack(el, maxDepth, customSkip);
  if (reactStack.length > 0) return reactStack;

  const info = getVueComponentInfo(el) || getSvelteComponentInfo(el);
  if (info) {
    return [{ name: info.name, filePath: info.filePath, line: info.line }];
  }
  return [];
}

export async function resolveComponentInfo(info: ComponentInfo): Promise<void> {
  if (info.line != null) return;
  const pending = pendingResolution.get(info);
  if (!pending) return;

  const resolved = await resolveOriginalPosition(pending.url, pending.line, pending.col);
  if (resolved) {
    const resolvedPath = resolved.source ? cleanFilePath(resolved.source) : null;
    // Discard resolution if it landed in library code (e.g. Chakra source)
    if (resolvedPath && isSourceFile(resolvedPath)) {
      info.line = resolved.line;
      info.column = resolved.column;
      info.filePath = resolvedPath;
    }
  }
  pendingResolution.delete(info);
}

export async function resolveComponentFrame(frame: ComponentFrame): Promise<void> {
  if (frame.line != null) return;
  const pending = pendingResolution.get(frame);
  if (!pending) return;

  const resolved = await resolveOriginalPosition(pending.url, pending.line, pending.col);
  if (resolved) {
    const resolvedPath = resolved.source ? cleanFilePath(resolved.source) : null;
    // Discard resolution if it landed in library code (e.g. Chakra source)
    if (resolvedPath && isSourceFile(resolvedPath)) {
      frame.line = resolved.line;
      frame.filePath = resolvedPath;
    }
  }
  pendingResolution.delete(frame);
}
