import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { startHelperServer, DEFAULT_PORT } from './targets/helper-server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iifePath = join(__dirname, 'rune-grab.iife.global.js');

const args = process.argv.slice(2);
const command = args[0];

const SNIPPET_VITE = `\n<!-- rune-grab: dev-only element grabber -->\n<script type="module">if(import.meta.env.DEV)import('rune-grab')</script>`;

const SNIPPET_NEXT_APP = `\n{/* rune-grab: dev-only element grabber */}\n{process.env.NODE_ENV === 'development' && <script src="https://unpkg.com/rune-grab/dist/rune-grab.iife.global.js" />}`;

const SNIPPET_NEXT_PAGES = `\n        {/* rune-grab: dev-only element grabber */}\n        {process.env.NODE_ENV === 'development' && <script src="https://unpkg.com/rune-grab/dist/rune-grab.iife.global.js" />}`;

const SNIPPET_WEBPACK = `\n// rune-grab: dev-only element grabber\nif (process.env.NODE_ENV === 'development') import('rune-grab');`;

type Framework = 'vite' | 'next-app' | 'next-pages' | 'webpack' | 'unknown';

function detect(cwd: string): { framework: Framework; file: string | null } {
  if (existsSync(join(cwd, 'vite.config.ts')) || existsSync(join(cwd, 'vite.config.js')) || existsSync(join(cwd, 'vite.config.mts'))) {
    const indexHtml = join(cwd, 'index.html');
    if (existsSync(indexHtml)) return { framework: 'vite', file: indexHtml };
  }

  if (existsSync(join(cwd, 'next.config.js')) || existsSync(join(cwd, 'next.config.mjs')) || existsSync(join(cwd, 'next.config.ts'))) {
    const appLayouts = [
      join(cwd, 'app', 'layout.tsx'),
      join(cwd, 'app', 'layout.jsx'),
      join(cwd, 'src', 'app', 'layout.tsx'),
      join(cwd, 'src', 'app', 'layout.jsx'),
    ];
    for (const f of appLayouts) {
      if (existsSync(f)) return { framework: 'next-app', file: f };
    }

    const pagesDocuments = [
      join(cwd, 'pages', '_document.tsx'),
      join(cwd, 'pages', '_document.jsx'),
      join(cwd, 'src', 'pages', '_document.tsx'),
      join(cwd, 'src', 'pages', '_document.jsx'),
    ];
    for (const f of pagesDocuments) {
      if (existsSync(f)) return { framework: 'next-pages', file: f };
    }

    return { framework: 'next-app', file: null };
  }

  if (existsSync(join(cwd, 'webpack.config.js')) || existsSync(join(cwd, 'webpack.config.ts'))) {
    const entries = [
      join(cwd, 'src', 'index.tsx'),
      join(cwd, 'src', 'index.ts'),
      join(cwd, 'src', 'index.jsx'),
      join(cwd, 'src', 'index.js'),
      join(cwd, 'src', 'main.tsx'),
      join(cwd, 'src', 'main.ts'),
    ];
    for (const f of entries) {
      if (existsSync(f)) return { framework: 'webpack', file: f };
    }
  }

  const indexHtml = join(cwd, 'index.html');
  if (existsSync(indexHtml)) {
    const content = readFileSync(indexHtml, 'utf-8');
    if (content.includes('import.meta')) return { framework: 'vite', file: indexHtml };
  }

  return { framework: 'unknown', file: null };
}

function alreadyInstalled(content: string): boolean {
  return content.includes('rune-grab');
}

function detectPackageManager(cwd: string): 'pnpm' | 'yarn' | 'bun' | 'npm' {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';
  return 'npm';
}

function installPackage(cwd: string): void {
  if (existsSync(join(cwd, 'node_modules', 'rune-grab'))) return;

  const pm = detectPackageManager(cwd);
  const cmd = pm === 'yarn' ? 'yarn add -D rune-grab' : `${pm} install -D rune-grab`;

  console.log(`\n  Installing rune-grab with ${pm}...`);
  try {
    execSync(cmd, { cwd, stdio: 'pipe' });
  } catch {
    console.log(`  Could not install automatically. Run: ${cmd}\n`);
  }
}

function initCommand(): void {
  const cwd = process.cwd();

  installPackage(cwd);

  const { framework, file } = detect(cwd);

  if (framework === 'unknown' || !file) {
    console.log('\n  Could not detect your framework.\n');
    console.log('  Add this to your HTML before </body>:\n');
    console.log('    <script type="module">');
    console.log('      if (import.meta.env.DEV) import(\'rune-grab\')');
    console.log('    </script>\n');
    return;
  }

  const content = readFileSync(file, 'utf-8');

  if (alreadyInstalled(content)) {
    console.log(`\n  rune-grab is already set up in ${relative(cwd, file)}\n`);
    return;
  }

  let updated: string;

  switch (framework) {
    case 'vite': {
      updated = content.replace('</body>', `${SNIPPET_VITE}\n</body>`);
      break;
    }
    case 'next-app': {
      updated = content.replace('</body>', `${SNIPPET_NEXT_APP}\n      </body>`);
      break;
    }
    case 'next-pages': {
      if (content.includes('<Main')) {
        updated = content.replace(/<Main\s*\/?>/, `$&${SNIPPET_NEXT_PAGES}`);
      } else {
        updated = content.replace('</Head>', `</Head>${SNIPPET_NEXT_PAGES}`);
      }
      break;
    }
    case 'webpack': {
      updated = SNIPPET_WEBPACK + '\n' + content;
      break;
    }
    default:
      return;
  }

  writeFileSync(file, updated, 'utf-8');

  const label = framework === 'vite' ? 'Vite'
    : framework === 'next-app' ? 'Next.js (App Router)'
    : framework === 'next-pages' ? 'Next.js (Pages Router)'
    : 'Webpack';

  console.log(`\n  rune-grab installed for ${label}`);
  console.log(`  Modified: ${relative(cwd, file)}`);
  console.log(`\n  Run your dev server and press Cmd+Shift+G to start grabbing.\n`);
}

function relative(from: string, to: string): string {
  if (to.startsWith(from)) {
    const rel = to.slice(from.length);
    return rel.startsWith('/') ? rel.slice(1) : rel;
  }
  return to;
}

function uninstallPackage(cwd: string): void {
  const pm = detectPackageManager(cwd);
  const cmd = pm === 'yarn' ? 'yarn remove rune-grab' : `${pm} uninstall rune-grab`;

  console.log(`\n  Uninstalling rune-grab with ${pm}...`);
  try {
    execSync(cmd, { cwd, stdio: 'pipe' });
  } catch {
    console.log(`  Could not uninstall automatically. Run: ${cmd}\n`);
  }
}

function removeSnippet(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.includes('rune-grab') && (line.includes('<!--') || line.includes('{/*') || line.includes('//'))) {
      i++;
      while (i < lines.length) {
        const next = lines[i];
        if (next.includes('rune-grab') || next.includes('import(') || next.includes('unpkg.com/rune-grab') || next.includes("import('rune-grab')")) {
          i++;
          continue;
        }
        if (next.trim() === '' && i > 0 && (lines[i - 1].includes('rune-grab') || lines[i - 1].includes('import(') || lines[i - 1].includes('unpkg.com'))) {
          i++;
          continue;
        }
        break;
      }
      continue;
    }

    if (line.includes('rune-grab') && (line.includes('import(') || line.includes('import '))) {
      i++;
      continue;
    }

    if (line.includes('rune-grab') && line.includes('unpkg.com')) {
      i++;
      continue;
    }

    result.push(line);
    i++;
  }

  return result.join('\n');
}

function uninitCommand(): void {
  const cwd = process.cwd();
  const { framework, file } = detect(cwd);

  if (!file) {
    console.log('\n  Could not detect your framework setup.');
    console.log('  Remove any rune-grab snippets from your code manually.');
    console.log('  (Search for "rune-grab" in your HTML or layout files.)\n');
    uninstallPackage(cwd);
    return;
  }

  const content = readFileSync(file, 'utf-8');

  if (!alreadyInstalled(content)) {
    console.log(`\n  No rune-grab snippet found in ${relative(cwd, file)}`);
    uninstallPackage(cwd);
    console.log('  Done.\n');
    return;
  }

  const updated = removeSnippet(content);
  writeFileSync(file, updated, 'utf-8');

  console.log(`\n  Removed rune-grab snippet from ${relative(cwd, file)}`);
  uninstallPackage(cwd);
  console.log('  Done.\n');
}

function printUsage(): void {
  console.log(`
  rune-grab

  Usage:
    npx rune-grab init                  Set up rune-grab in your project
    npx rune-grab remove                Remove rune-grab from your project
    npx rune-grab serve [--port PORT]   Start the dev server (for auto-paste)
`);
}

switch (command) {
  case 'init':
    initCommand();
    break;
  case 'remove':
  case 'uninit':
  case 'uninstall':
    uninitCommand();
    break;
  case 'serve': {
    const portIdx = args.indexOf('--port');
    const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : DEFAULT_PORT;
    startHelperServer(port, iifePath);
    break;
  }
  default:
    printUsage();
    break;
}
