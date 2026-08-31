# Sharing History

The **Museum With No Frontiers — Sharing History** website (*Arab World –
Europe | 1815–1918*): permanent collection, full-text database, exhibitions,
historical background, country timelines and partners, built from the
published dataset.

A website is a light, static Vue 3 front-end for one published dataset. It
combines three `@metanull` packages from GitHub Packages:

| Package | Role |
| --- | --- |
| `@metanull/sharinghistory-data` | the dataset (JSON + `manifest.json`, **private**) |
| `@metanull/viewer-core` | application engine (routing, data access, i18n) |
| `@metanull/viewer-layout` | page structure (`PageShell` + sections), themed via `theme/tokens.css` |

Because the data package is private, every `npm install` needs authenticated
access to GitHub Packages. In CI there is nothing to configure: the package
grants this repository Read under *Manage Actions access*, so the workflow's
built-in `github.token` can install it — no secret, no PAT. Locally, each
developer authenticates for themselves, with `npm login --registry=https://npm.pkg.github.com`
or a personal `~/.npmrc`; the Docker preview mounts that `~/.npmrc` read-only.

## Dataset specifics

The dataset is the Sharing History project (legacy project key `AWE`). It
comes from its own legacy database — `mwnf3_sharing_history`, a schema
*inspired by* the one behind Islamic Art and Baroque Art but materially
different — and that shows in the shape of the data:

- **Single project.** Everything belongs to one project (`awe`), so there is
  no project filter anywhere in the interface.
- **Three-level exhibitions.** Unlike the other datasets'
  exhibition → theme → page, here it is exhibition → theme → **subtheme**
  (the interface word is *chapter*): 10 exhibitions, 42 themes, 140 subthemes
  in the collection tree.
- **Sharing-History-only sections.** *Historical Background* (per-country
  illustrated essays, with maps) and *Historical Profiles* have their own
  collection roots — `historical-background-root`, `historical-profiles-root`,
  `topics-root` — next to the usual `exhibitions-root` and the 48
  `national-context` collections.
- **Timelines are per country × exhibition**, not per country: 161 timelines
  over 1,509 events, so the timeline view needs a country *and* an exhibition
  filter.
- **No dynasties, no artistic introduction.** The dataset has neither, so the
  site has no pages for them. The glossary (184 entries) is present and links
  from item texts, but the legacy site had no glossary browse page.
- **Items carry `display_status`.** `A` is a normal record, `N` marks a record
  that exists only to illustrate a Historical Background or timeline page —
  the legacy site excludes those from search and browse.
- **Two content languages in practice.** `manifest.languages` declares 18, but
  only `en` and `fr` have item translations (English complete, French partial,
  ~16% of item texts); side entities are translated into wider but different
  subsets — collections into 7, partners into 8, glossary into 10, countries
  into 14. Which languages the site offers, and how it falls back when the
  chosen one has no file for an entity, is a design decision rather than a
  lookup.

## Implementation status

The site currently renders the generic entity pages that `viewer-core`
generates by default — a walking skeleton. Replacing them with the real
Sharing History pages (rebrand and oxblood palette, exhibitions, historical
background, timeline, database search, partners) is tracked by the Sharing
History epic, filed alongside this scaffolding.

---

## Translator — editing the website's texts

You only need a GitHub account and a browser. The files under `locales/` hold
the interface texts (menu labels, buttons, messages), one file per language —
`en.json` is English, `fr.json` French, and so on. The museum content itself
arrives already translated and is not edited here.

1. **Open the folder.** Bookmark this link on the website's GitHub page:
   `locales/`. Click the language file you want to change.
2. **Click the pencil** (✏️, top right of the file view). The file opens in an
   editable text box. Change only the text between the second pair of
   quotation marks on a line — the part before the colon is the identifier
   and must stay exactly as it is. Pieces in curly braces like `{page}` are
   filled automatically — keep them, but you may move them within the
   sentence.
3. **To start a new language**, open `en.json`, copy all of its content, then
   create the new file (Add file → Create new file) named with the two-letter
   language code, e.g. `fr.json`, paste, and translate the texts.
4. **Click "Commit changes…" then "Propose changes".** GitHub asks nothing
   else — it saves your edit as a proposal.
5. **Wait for the automatic check.** After a minute or two, the proposal page
   shows a green tick and your change goes live on the website by itself a few
   minutes later. If something is off (a missing quote, a forgotten `{page}`),
   a comment appears explaining in plain language what to fix — edit again on
   the same page and the check reruns.

---

## Webdesigner — theming the website

The website's whole visual identity lives in the `theme/` folder:
`tokens.css` (colors, fonts, spacing — the normal surface), `overrides.css`
(escape hatch) and `assets/` (logo, banner, sponsor images). Small changes can
be made straight in the browser with the pencil button, like the translator
flow above — styling changes are reviewed, they do not merge automatically.
For real design work, use the live preview:

1. **One-time setup:**
   - Install **Docker Desktop** (docker.com) and **GitHub Desktop**
     (desktop.github.com), each with default settings.
   - In GitHub Desktop: File → Clone repository → pick this repository.
   - Sign in to GitHub Packages once, in a terminal:
     `npm login --registry=https://npm.pkg.github.com --scope=@metanull`.
     That login stays on your own computer, and the preview reads it. Nothing
     in this repository holds a token.
2. **Start the preview:** open a terminal in the folder (GitHub Desktop:
   Repository → Open in Command Prompt) and run:

   ```bash
   docker compose up
   ```

   The first start downloads everything and takes a few minutes; wait until a
   line shows `Local: http://localhost:5173/`, then open
   **http://localhost:5173** in your browser.
3. **Edit `theme/`, watch it live.** Every save refreshes the browser
   automatically. `tokens.css` lists every knob with a comment; put images
   into `theme/assets/` and reference them from `src/dataset.config.js`
   (banner, sponsor logos). Anything a token cannot express goes into
   `overrides.css`. A change to a layout component itself is a request for the
   `viewer-layout` package — open an issue there and a developer pairs on it.
4. **Propose your changes:** in GitHub Desktop, write a short summary bottom
   left → **Commit** → **Push origin** → **Create Pull Request** (opens in the
   browser → green **Create pull request** button). After a colleague approves
   it, the change merges and deploys by itself. Stop the preview with
   `Ctrl+C` in the terminal when done.

---

## Developer notes

- `src/dataset.config.js` is the website's whole declaration: dataset package,
  entities with generated list/detail routes, page shell + navigation, and
  `extraViews` for the site's own pages. `src/main.js` should not need edits.
- Site-specific pages live in `src/views/` and are declared as `extraViews`.
  A route named `home` replaces the engine's generic home page.
- Tests: `npm run test` runs `tests/smoke.test.js`, which mounts the app
  against the real data package. Add website-specific tests next to it.
- CI (`.github/workflows/`) is a set of thin callers of
  [`metanull/viewer-workflows`](https://github.com/metanull/viewer-workflows);
  build + test block, ESLint + `npm audit` report, locale PRs validate and
  auto-merge, Dependabot minor/patch bumps of the platform packages
  auto-merge, a weekly audit opens issues on findings. No workflow takes a
  secret.
- The deployed base path comes from `BASE_PATH` at build time; the deploy
  workflow sets it to `/sharinghistory/` for GitHub Pages.
