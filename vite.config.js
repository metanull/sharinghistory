import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// `@metanull/viewer-core/testing`'s `defineViewerConfig()` would replace most
// of this file, but its barrel (`src/testing/index.js`) re-exports
// `mountSite` from `smoke.js`, which imports `createViewer.js` and, through
// it, `AppRoot.vue` — a Vue SFC. Vite's own config loader (rolldown's
// `externalize-deps`) marks every bare package import as external and loads
// it through plain Node ESM, which cannot parse `.vue`: importing
// `@metanull/viewer-core/testing` (or even bare `@metanull/viewer-core`)
// here throws `ERR_UNKNOWN_FILE_EXTENSION` on `AppRoot.vue`, confirmed
// against the installed 1.12.3, both under `vitest run` and plain
// `node --input-type=module -e "import('@metanull/viewer-core')"`. The
// package's `exports` map has no subpath around the barrel either. Until the
// package splits a Vue-free entry point for this helper, this file keeps the
// shape `defineViewerConfig()` would produce, written out by hand.
export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue()],
  resolve: {
    alias: {
      // viewer-core reads every JSON of the data package through this alias.
      '@inventory-data': fileURLToPath(
        new URL('./node_modules/@metanull/sharinghistory-data', import.meta.url),
      ),
    },
  },
  optimizeDeps: {
    // viewer-core ships .vue source that esbuild pre-bundling cannot parse;
    // viewer-layout must not be pre-bundled either or its chunk gets a second
    // copy of the Vue runtime in dev (both packages share the app's vue).
    // The /i18n subpath is listed as well as the package: Vite pre-bundles a
    // subpath as its own entry, and a second copy of the text module would be
    // a second, empty set of texts for whatever imported it.
    exclude: ['@metanull/viewer-core', '@metanull/viewer-core/i18n', '@metanull/viewer-layout'],
    // The runtime deps reach the browser through those excluded packages, so
    // the dev-server dependency scan cannot discover them until the website's
    // own views import them directly. Without this list a late discovery
    // pre-bundles a second copy of Vue next to the raw one already loaded,
    // and the dev server crashes on boot ("Cannot read properties of null"
    // in runtime-core). Listing them pre-bundles each exactly once, and the
    // excluded packages get the same copy.
    include: ['vue', 'vue-router'],
  },
  test: {
    environment: 'jsdom',
    // The smoke test mounts the app, which lazily loads the home view and
    // through it the whole data package. On a cold cache that is Vite's first
    // transform of the entire view graph plus several megabytes of JSON, and
    // it does not fit in vitest's 5 s default. The budget is for the machine,
    // not the assertion.
    testTimeout: 60000,
    server: {
      deps: {
        // viewer-core ships .vue source; Node cannot load it unless Vitest
        // processes the package instead of externalizing it. viewer-layout's
        // composed views import viewer-core, so the layout is processed too.
        inline: ['@metanull/viewer-core', '@metanull/viewer-layout'],
      },
    },
  },
})
