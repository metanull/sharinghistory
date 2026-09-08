import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// `@metanull/viewer-core/vite`'s `defineViewerConfig()` (1.13.1) fixes the
// old ERR_UNKNOWN_FILE_EXTENSION defect this file used to work around, but
// its own `@inventory-data` alias is computed from `import.meta.url` inside
// the *helper's own* file (viewer-core's `src/testing/viteConfig.js`), not
// the caller's — it resolves to a `.../viewer-core/src/testing/node_modules/
// <package>` path, which does not exist. `import.meta.glob('@inventory-data
// /*.json', ...)` in `useDataPackage.js` then matches nothing, so every
// `loadEntity()` call throws "Unknown entity" at runtime; a plain `vite
// build` does not catch it because an empty glob match is not a build
// error. Confirmed against the installed 1.13.1: `npm test` fails every
// smoke assertion with exactly that error, and the alias' target directory
// is absent from disk. Until the package fixes the helper, this file keeps
// writing the config out by hand.
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
