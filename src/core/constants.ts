export const SKIP_PREFIXES = ['_', '$', 'Styled(', 'motion(', 'chakra(', 'withRouter(', 'connect(', 'styled.', 'styled(', 'tw.', 'rc-', '__'];

export function isLibraryFile(filePath: string): boolean {
  return filePath.includes('node_modules');
}

export function isSourceFile(filePath: string): boolean {
  if (!filePath) return false;
  if (isLibraryFile(filePath)) return false;
  if (filePath.startsWith('webpack-internal:///node_modules/')) return false;
  // Filter webpack/Vite runtime files (NOT compiled user chunks — those have useful source maps)
  if (/(?:^|[\\/])webpack(?:[-.][\w]+)?\.js$/.test(filePath)) return false;
  if (/(?:^|[\\/])framework[-.][\w]+\.js$/.test(filePath)) return false;
  return true;
}

export const STYLE_PROPS = [
  'display', 'position', 'overflow',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignSelf', 'gap',
  'gridTemplateColumns', 'gridTemplateRows',
  'padding', 'margin',
  'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing',
  'textAlign', 'textTransform', 'color',
  'backgroundColor', 'backgroundImage',
  'borderRadius', 'boxShadow',
  'borderWidth', 'borderStyle', 'borderColor',
  'opacity', 'transform', 'filter', 'backdropFilter',
  'objectFit',
];

export const STYLE_DEFAULTS = new Set([
  'block', 'inline', 'none', 'normal', 'auto', '0px', 'transparent',
  'rgba(0, 0, 0, 0)', 'start', 'visible', 'static', 'row', 'stretch',
  '0px 0px 0px 0px', 'baseline',
]);

export const KEEP_ATTRS = ['type', 'href', 'src', 'alt', 'role', 'aria-label', 'placeholder', 'name', 'id', 'data-testid'];

export const Z_OVERLAY = 2147483640;
export const Z_TOOLBAR = 2147483641;

export const OWN_IDS = ['__rune-grab-overlay__', '__rune-grab-label__', '__rune-grab-toolbar__', '__rune-grab-menu__', '__rune-grab-selection__'];

export const DRAG_THRESHOLD_PX = 4;

export const HELPER_PORT = 19274;

export const HEALTH_CHECK_TIMEOUT_MS = 800;

export const FLASH_VISIBLE_MS = 1000;

export const FLASH_REMOVE_MS = 1200;

export const LS_KEY = '__rune-grab-autopaste__';
