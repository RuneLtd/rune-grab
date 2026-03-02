export interface GrabResult {
  type: 'reference' | 'screenshot';
  label: string;
  text: string;
  prompt: string;
  image?: string;
  meta: ElementMeta;
}

export interface ElementMeta {
  tag: string;
  visibleText: string;
  html: string;
  attrs: {
    role?: string;
    ariaLabel?: string;
    alt?: string;
    placeholder?: string;
    type?: string;
    href?: string;
    id?: string;
    testId?: string;
  };
  component?: ComponentInfo;
  componentStack?: ComponentFrame[];
  styles?: string;
  isLocal: boolean;
}

export interface ComponentInfo {
  name: string;
  filePath: string | null;
  line: number | null;
  column: number | null;
}

export interface ComponentFrame {
  name: string;
  filePath: string | null;
  line: number | null;
}

export type TargetApp = 'claude' | 'cursor' | 'codex' | 'claude-code' | 'clipboard';

export interface RuneGrabConfig {
  shortcut?: string;
  target?: TargetApp;
  accentColor?: string;
  maxStackDepth?: number;
  onGrab?: (result: GrabResult) => void;
  onToggle?: (active: boolean) => void;
  showTargetPicker?: boolean;
  skipComponents?: string[];
}
