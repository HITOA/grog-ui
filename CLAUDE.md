# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

grog-ui is a **Svelte 5 + TypeScript node-graph editor UI embedded in a native C++ host** (the "grog" app, source at `/mnt/SSD1TO/Project/grog`). It is not a standalone web app — it has no HTTP backend. All data lives on the native side; the UI is primarily a renderer.

## Commands

- `npm run dev` — Vite dev server with HMR (runs in a browser, but native calls won't resolve without the host).
- `npm run check` — typecheck (`svelte-check` + `tsc`).
- `npm run lint` — ESLint + Prettier check. `npm run format` — auto-format with Prettier.
- `npm run build` — production build to `dist/`.
- **There are no tests configured.** Verify changes with `npm run check` and `npm run lint`.
- The real build is driven by **CMake** as part of the native app (`npm ci` + `npm run build` via `CMakeLists.txt`), not run directly.

## Architecture: the native bridge

All communication with the host goes through `src/lib/bridge.ts`:

- `callNative(type, payload, timeout)` sends a JSON message via `window.postMessage`, tracked by numeric request id, default **5000ms timeout**.
- The host pushes responses/events back in; incoming events (`update_graph`, `update_graphs`, `update_feedback_list`) are handled in `src/lib/actions.ts`.

Do not add REST/fetch calls. **Always go through `src/lib/api.ts`** (the `API.*` namespace) for native operations — never call `callNative` directly from components. Graph/node mutations happen native-side; after a mutation the UI reconciles from the events the host pushes back, so don't optimistically mutate `state` and expect it to persist.

## Conventions

- **Svelte 5 runes** throughout (`$state`, `$state.raw`, `$derived`, `$props()`). Reactive app state is a singleton in `src/lib/state.svelte.ts` (`GrogState` → `flowContexts[]`).
- Graph rendering uses `@xyflow/svelte` (`SvelteFlow`); UI primitives use `bits-ui`.
- TypeScript is strict with **noUnusedLocals / noUnusedParameters** and `checkJs` on — unused imports/vars break `npm run check`. Use type-only imports (`import type`).
- All shared types live in `src/lib/types.ts`.
- **No `<style>` blocks in components.** Themes are full drop-in stylesheet replacements (`public/themes/*.css`, applied by `theme.svelte.ts`), so all styling must live in `public/themes/default-theme.css`, not scoped in `.svelte` files. Add markup with plain class hooks (`class="my-thing"`), then add the rules to the theme file — referencing the `:root` design tokens, and adding new tokens there when a color/size doesn't exist yet. Scoped component CSS silently disappears the moment a user switches themes.

## Note

`README.md` is the default Vite+Svelte template boilerplate — ignore it as a source of project info.
