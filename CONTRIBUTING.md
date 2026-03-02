# Contributing to rune-grab

## Setup

```bash
git clone https://github.com/rune-labs/rune-grab.git
cd rune-grab
npm install
```

## Development

```bash
npm run dev       # start the dev app at localhost:5173
npm run build     # production build
npm run typecheck # run tsc --noEmit
```

`npm run dev` starts a Vite dev server with a React demo page that loads rune-grab from source. Changes to any file in `src/` hot-reload instantly.

## Project structure

```
dev/
  App.tsx              # demo page with sample components
  main.tsx             # entry point — initializes rune-grab
  index.html           # HTML shell
  vite.config.ts       # Vite config for dev server
src/
  cli.ts               # CLI entry — init and serve commands
  iife.ts              # script tag entry — auto-initializes
  index.ts             # public API exports
  core/
    engine.ts          # orchestrator — init, activate, deactivate, toggle
    state.ts           # shared mutable state
    types.ts           # TypeScript interfaces
    constants.ts       # z-index, ports, timing, skip lists
    extract.ts         # element metadata extraction
    frameworks.ts      # React/Vue/Svelte component detection
    screenshot.ts      # screen capture via getDisplayMedia
  handlers/
    inspect.ts         # inspect mode (hover + click elements)
    capture.ts         # screenshot mode (drag to select)
    keyboard.ts        # shortcut parsing and global keydown
  ui/
    menu.ts            # floating menu, drag, auto-paste toggle
    overlay.ts         # highlight, selection box, toolbar, prompt
    styles.ts          # colors, fonts, icons, labels
  targets/
    clipboard.ts       # ClipboardItem API with execCommand fallback
    app.ts             # dispatch to Claude/Cursor/Codex via helper
    helper-server.ts   # local HTTP server for macOS auto-paste
  plugins/
    vite.ts            # Vite dev server plugin
  hooks/
    react.ts           # useRuneGrab React hook
```

## Architecture

rune-grab avoids circular dependencies with two patterns:

**Shared state** — all mutable state lives in `core/state.ts` as a single exported object `s`. Every module imports `s` instead of passing state around.

**Callback injection** — handler and UI modules export `setXCallbacks()` functions. `engine.ts` calls these during `init()` to wire up cross-module references like `activate`, `deactivate`, and `dispatchResult`.

## Adding a new target app

1. Add the app name to the `TargetApp` union in `core/types.ts`
2. Add the bundle ID and display name in `targets/app.ts`
3. Add the label in `ui/styles.ts` (`TARGET_LABELS`) and to the appropriate targets array (`TARGETS_APPS`)

## Adding framework detection

Add a detection function in `core/frameworks.ts` and call it from `detectComponent()` and `detectComponentStack()`. Each framework stores debug metadata differently on DOM elements — check for framework-specific properties on the element or its keys.

