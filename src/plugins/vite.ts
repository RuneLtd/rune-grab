import type { TargetApp } from '../core/types.js';

interface VitePlugin {
  name: string;
  apply?: 'serve' | 'build';
  transformIndexHtml?: (html: string, ctx: any) => string;
}

export interface VitePluginOptions {
  target?: TargetApp;
  shortcut?: string;
  showTargetPicker?: boolean;
  environments?: string[];
}

export default function runeGrabPlugin(options: VitePluginOptions = {}): VitePlugin {
  const {
    target = 'clipboard',
    shortcut = 'Meta+Shift+G',
    showTargetPicker = true,
    environments = ['development'],
  } = options;

  return {
    name: 'rune-grab',
    apply: 'serve',

    transformIndexHtml(html, ctx) {
      const mode = ctx.server?.config?.mode ?? 'development';
      if (!environments.includes(mode)) return html;
      const configJson = JSON.stringify({
        target,
        shortcut,
        showTargetPicker,
      });

      const script = `
<script type="module">
  import { init } from 'rune-grab';
  const cleanup = init(${configJson});
  if (import.meta.hot) {
    import.meta.hot.dispose(() => cleanup());
  }
</script>`;

      return html.replace('</body>', `${script}\n</body>`);
    },
  };
}
