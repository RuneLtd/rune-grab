import { STYLE_PROPS, STYLE_DEFAULTS, KEEP_ATTRS } from './constants.js';
import { detectComponent, detectComponentStack, resolveComponentInfo, resolveComponentFrame } from './frameworks.js';
import type { ElementMeta, ComponentFrame } from './types.js';

export function isLocalhost(): boolean {
  const h = location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h.endsWith('.local');
}

function getVisibleText(el: Element): string {
  let text = '';
  function walk(node: Node) {
    if (node.nodeType === 3) {
      const t = (node.textContent || '').trim();
      if (t) text += (text ? ' ' : '') + t;
    } else if (node.nodeType === 1) {
      for (let i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i]);
    }
  }
  walk(el);
  if (!text) {
    text = (el as HTMLElement).getAttribute('value')
      || el.getAttribute('alt')
      || el.getAttribute('aria-label')
      || (el as HTMLInputElement).placeholder
      || '';
  }
  if (text.length > 80) text = text.slice(0, 80) + '...';
  return text;
}

function getTagDisplay(el: Element): string {
  let tag = el.tagName.toLowerCase();
  if (el.id) tag += '#' + el.id;
  const cls = Array.from(el.classList)
    .filter((c) => !c.startsWith('__rune-grab'))
    .slice(0, 3);
  if (cls.length) tag += '.' + cls.join('.');
  return tag;
}

function getKeyStyles(el: Element): string {
  const cs = window.getComputedStyle(el);
  const out: string[] = [];

  for (const prop of STYLE_PROPS) {
    const cssProp = prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
    const v = cs.getPropertyValue(cssProp);
    if (!v || STYLE_DEFAULTS.has(v)) continue;
    if (prop === 'fontSize' && v === '16px') continue;
    if (prop === 'fontWeight' && (v === '400' || v === 'normal')) continue;
    if (prop === 'color' && v === 'rgb(0, 0, 0)') continue;
    if (prop === 'lineHeight' && v === 'normal') continue;
    if (prop === 'letterSpacing' && v === 'normal') continue;
    if (prop === 'textAlign' && v === 'start') continue;
    if (prop === 'opacity' && v === '1') continue;
    if (prop === 'borderWidth' && v === '0px') continue;
    if ((prop === 'padding' || prop === 'margin') && (v === '0px' || /^0px(\s+0px)*$/.test(v))) continue;
    if (prop === 'fontFamily') {
      const first = v.split(',')[0].trim().replace(/^["']+|["']+$/g, '');
      if (!first || ['system-ui', 'sans-serif', 'serif', 'monospace', '-apple-system'].includes(first)) continue;
      out.push('fontFamily: ' + first);
      continue;
    }
    out.push(prop + ': ' + v);
  }
  return out.join('; ');
}

function cleanHTML(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const attrs: string[] = [];

  for (const attr of KEEP_ATTRS) {
    const v = el.getAttribute(attr);
    if (v) attrs.push(`${attr}="${v}"`);
  }

  const cls = Array.from(el.classList).filter((c) => !/^(css-|chakra-|__rune)/.test(c));
  if (cls.length) attrs.push(`class="${cls.join(' ')}"`);

  const open = `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
  const close = `</${tag}>`;

  let text = '';
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) text += (n.textContent || '').trim();
  });

  const childCount = el.children.length;
  let inner = text;
  if (childCount > 0) {
    inner = (text ? text + ' ' : '') + `[${childCount} child element${childCount > 1 ? 's' : ''}]`;
  }
  if (inner.length > 200) inner = inner.slice(0, 200) + '...';

  return open + inner + close;
}

export function extractElementMeta(el: Element, customSkip?: Set<string>): ElementMeta {
  const local = isLocalhost();
  const component = detectComponent(el, customSkip);
  const tag = getTagDisplay(el);
  const visibleText = getVisibleText(el);
  const html = cleanHTML(el);

  const meta: ElementMeta = {
    tag,
    visibleText,
    html,
    attrs: {
      role: el.getAttribute('role') || undefined,
      ariaLabel: el.getAttribute('aria-label') || undefined,
      alt: el.getAttribute('alt') || undefined,
      placeholder: (el as HTMLInputElement).placeholder || undefined,
      type: el.getAttribute('type') || undefined,
      href: el.getAttribute('href') || undefined,
      id: el.id || undefined,
      testId: el.getAttribute('data-testid') || undefined,
    },
    component: component || undefined,
    isLocal: local,
  };

  if (local) {
    meta.componentStack = detectComponentStack(el, 3, customSkip);
  } else {
    meta.styles = getKeyStyles(el);
  }

  return meta;
}

export function buildLabel(meta: ElementMeta): string {
  const textPart = meta.visibleText ? `"${meta.visibleText.slice(0, 30)}"` : '';
  const tagPart = meta.tag.split('.')[0].split('#')[0];

  let elType: string;
  if (tagPart === 'button' || meta.attrs.role === 'button') elType = 'button';
  else if (tagPart === 'a') elType = 'link';
  else if (tagPart === 'input') elType = `${meta.attrs.type || 'text'} input`;
  else if (tagPart === 'img') elType = 'image';
  else if (tagPart === 'textarea') elType = 'textarea';
  else if (/^h[1-6]$/.test(tagPart)) elType = 'heading';
  else if (['nav', 'section', 'article', 'main', 'aside', 'footer', 'header'].includes(tagPart)) elType = tagPart;
  else elType = `<${tagPart}>`;

  let label = textPart ? `${textPart} ${elType}` : elType;

  if (meta.component?.name || meta.component?.filePath || meta.isLocal) {
    label += ' in:';
  }

  if (label.length > 80) label = label.slice(0, 77) + '...';
  return label;
}

export function buildContextText(meta: ElementMeta, prompt?: string): string {
  const parts: string[] = [];

  if (prompt) parts.push(prompt);
  parts.push(buildLabel(meta));
  if (meta.isLocal && meta.componentStack?.length) {
    const frame = meta.componentStack[0];
    let line = `  ${frame.name}`;
    if (frame.filePath) {
      line += ` at ${frame.filePath}`;
      if (frame.line) line += `:${frame.line}`;
    }
    parts.push(line);
  } else if (meta.component) {
    let line = `  ${meta.component.name}`;
    if (meta.component.filePath) {
      line += ` at ${meta.component.filePath}`;
      if (meta.component.line) line += `:${meta.component.line}`;
    }
    parts.push(line);
  } else if (meta.isLocal) {
    const pagePath = location.pathname.replace(/^\//, '') || 'index.html';
    parts.push(`  ${pagePath}`);
  }

  return parts.join('\n');
}

export async function resolveElementMeta(meta: ElementMeta): Promise<void> {
  const promises: Promise<void>[] = [];
  if (meta.component) {
    promises.push(resolveComponentInfo(meta.component));
  }
  if (meta.componentStack) {
    for (const frame of meta.componentStack) {
      promises.push(resolveComponentFrame(frame));
    }
  }
  await Promise.all(promises);
}
