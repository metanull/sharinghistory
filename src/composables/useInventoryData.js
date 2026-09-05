import { computed } from 'vue'
import {
  byId, entityRef, renderBlock, renderInline, renderPlain, useDataPackage,
} from '@metanull/viewer-core'

// The website's records, read the one way every website reads them: through
// viewer-core, lazily. Each entity is a shared ref that stays `null` until a
// route declaring it in `meta.entities` brings its chunk in, so importing
// this module loads nothing, and a page pays only for what it reads.
// Translations are viewer-core's cache, not a second one kept here.

const dataPackage = useDataPackage()
const manifestData = dataPackage.manifest

const items = entityRef('items')
const countries = entityRef('countries')
const partners = entityRef('partners')
const timelines = entityRef('timelines')
const timelineEvents = entityRef('timeline_events')
const collections = entityRef('collections')
// English is the base language of every catalogue in the platform: every list,
// label and fallback reads it. A record the visitor reads in another language
// is resolved on the sheet itself, by viewer-core's `useRecordLanguage`; which
// languages the site offers is decided once, in dataset.config.js, by
// viewer-core's `offeredLanguages` over this site's own declared list.
const defaultLang = 'en'

// Legacy project key (e.g. 'ISL', 'EPM') by project UUID — manifest.json's
// projectIds/projectKeys are parallel arrays, one exported project per index.
const projectKeyById = new Map(
  (manifestData.projectIds ?? []).map((id, i) => [id, manifestData.projectKeys?.[i]])
)

// The Sharing History package exports a single project ('awe'); this helper
// stays generic in case a companion project is ever exported alongside it.
function itemProjectKey(item) {
  return projectKeyById.get(item.project_id) ?? null
}

// Items legacy kept only to illustrate Historical Background / timeline
// pages (display_status 'N'): excluded from database search and Permanent
// Collection browsing, exactly like the legacy site
// (modules/database_results.php AND o.display_status='A').
const publicItems = computed(() => (items.value ?? []).filter(i => i.display_status !== 'N'))

// ── Translations ───────────────────────────────────────────────────────────
//
// One file per entity per language, resolved by name through viewer-core:
// never `import(`…${lang}…`)`, which a bundler cannot resolve statically and
// so bundles every language of an entity eagerly. That is what made
// islamicart's build (same pattern, larger dataset) unable to finish in CI.
// English drives every list and label and is loaded once; another language is
// loaded on demand by the page that reads it, and an entity not covered in
// that language falls back to English.

const { availableLanguages, loadTranslations, translations } = dataPackage

/** One record's translated fields, falling back to English then to nothing. */
function tr(entity, id, lang = defaultLang) {
  return dataPackage.tr(entity, id, lang, defaultLang)
}

const EN_ENTITIES = ['items', 'countries', 'partners', 'timeline_events', 'collections']

let englishReady = null
function loadEnglishTranslations() {
  if (!englishReady) {
    englishReady = Promise.all(EN_ENTITIES.map(e => loadTranslations(e, defaultLang)))
  }
  return englishReady
}
loadEnglishTranslations()

// ── Label helpers (always English) ─────────────────────────────────────────

function itemLabel(item) {
  if (!item) return ''
  return mdStrip(tr('items', item.id).name ?? item.internal_name ?? item.id)
}

function countryLabel(countryId) {
  if (!countryId) return ''
  const fallback = (countries.value ?? []).find(c => c.id === countryId)
  return mdStrip(tr('countries', countryId).name ?? fallback?.internal_name ?? countryId)
}

function partnerLabel(partnerId) {
  if (!partnerId) return ''
  const fallback = (partners.value ?? []).find(p => p.id === partnerId)
  return mdStrip(tr('partners', partnerId).name ?? fallback?.id ?? partnerId)
}

// ── Lookup maps ────────────────────────────────────────────────────────────

const itemById = byId('items')

// ── Exhibitions ────────────────────────────────────────────────────────────
//
// Imported as generic Collections, nested under a dedicated "Virtual
// Exhibitions" marker collection (purpose "exhibitions-root", a child of the
// Sharing History project collection, created by the importer's
// sh-exhibition-root-keying step, #1505). From that anchor: exhibitions are
// its children, themes are an exhibition's children, and — unlike the mwnf3
// datasets — a theme's children are SUBTHEMES ("Chapters" in the legacy UI),
// a full third narrative level with its own intro, quotation and item grid.
//
// Section anchors are resolved by `purpose` (#1505); backward_compatibility
// is informational only and never load-bearing here.

// The data package is single-context (one SH project), so each `*-root`
// purpose occurs at most once.
function findByPurpose(purpose) {
  return (collections.value ?? []).find(c => c.purpose === purpose) ?? null
}

const exhibitions = computed(() => {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  return (collections.value ?? [])
    .filter(c => c.parent_id === marker.id)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
})

function exhibitionById(id) {
  return exhibitions.value.find(e => e.id === id) ?? null
}

// Country-specific "National Context" variants of an exhibition
// (purpose "national-context", type "collection") are attached under the
// exhibition collection but are NOT themes — they carry no English
// translations and legacy renders them through a separate country
// selector. Filtering on type "theme" keeps them out of the theme tree
// naturally (and they stay positively identifiable by purpose if National
// Context is ever rendered).

function exhibitionThemes(exhibitionId) {
  return (collections.value ?? [])
    .filter(c => c.parent_id === exhibitionId && c.type === 'theme')
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
    .map(theme => ({
      ...theme,
      chapters: (collections.value ?? [])
        .filter(c => c.parent_id === theme.id)
        .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999)),
    }))
}

function exhibitionThemeById(exhibitionId, themeId) {
  return exhibitionThemes(exhibitionId).find(t => t.id === themeId) ?? null
}

function chapterById(exhibitionId, themeId, chapterId) {
  const theme = exhibitionThemeById(exhibitionId, themeId)
  return theme?.chapters.find(c => c.id === chapterId) ?? null
}

// ── Historical Background ──────────────────────────────────────────────────
//
// SH-only: per-country multi-page illustrated essays (+ historical maps),
// plus one "general text" record (country_id null). Imported as regular
// collections under a per-project "Historical Profiles" marker (purpose
// "historical-profiles-root", created by the importer's
// sh-historical-profiles-root step, #1505); each record's pages are its
// child collections.

const historicalBackgroundRecords = computed(() => {
  const marker = findByPurpose('historical-profiles-root')
  if (!marker) return []
  return (collections.value ?? [])
    .filter(c => c.parent_id === marker.id)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
})

// The project-level introduction (legacy gn='yes'), if present.
const historicalBackgroundGeneral = computed(
  () => historicalBackgroundRecords.value.find(r => !r.country_id) ?? null
)

// Country profiles, alphabetical by (English) country label — the view sorts.
const historicalBackgroundProfiles = computed(() =>
  historicalBackgroundRecords.value.filter(r => r.country_id)
)

function historicalBackgroundPages(recordId) {
  return (collections.value ?? [])
    .filter(c => c.parent_id === recordId)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
}

// ── General Historical Background (project-level) ──────────────────────────
//
// The legacy "Historical Background" nav section — distinct from the
// per-country Historical Profiles above. Imported by the sh-hb-general
// step (#1498) as a marker subtree (purpose "historical-background-root",
// with a nested purpose "topics-root" marker) under the project root:
// perspectives (Arab / Ottoman / European Perspective,
// historical_background_pages.php) and the "Read more" topics
// (historical_background_readmore.php — titles only; legacy never filled
// their texts in).

const hbGeneralPerspectives = computed(() => {
  const root = findByPurpose('historical-background-root')
  if (!root) return []
  return (collections.value ?? [])
    .filter(c => c.parent_id === root.id && c.purpose !== 'topics-root')
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
})

const hbGeneralTopics = computed(() => {
  const root = findByPurpose('topics-root')
  if (!root) return []
  return (collections.value ?? [])
    .filter(c => c.parent_id === root.id)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
})

// ── Timelines ──────────────────────────────────────────────────────────────
//
// SH timelines are per (country × exhibition), each bound to its exhibition
// collection. Timelines with collection_id null are the legacy "Permanent
// Collection timeline" (hidden sentinel exhibition 2 — remapped by the
// exporter). The legacy timeline page filters by period × country ×
// exhibition, with a thematic-vs-Permanent-Collection toggle.

const pcTimelines = computed(() => (timelines.value ?? []).filter(t => t.collection_id === null))
const thematicTimelines = computed(() => (timelines.value ?? []).filter(t => t.collection_id !== null))

// ── Item cross-links: Artistic Introduction pages / Exhibitions that
// feature a given item ───────────────────────────────────────────────────
//
// No separate export is needed for this: collections.json already lists
// each collection's items[] (used to render Artistic Introduction pages and
// Exhibition theme/page grids), so "which collections reference this item"
// is just a client-side reverse lookup over the same data. See Epic 12 in
// the islamicart parity backlog.

function collectionsContainingItem(itemId) {
  return (collections.value ?? []).filter(c => c.items?.some(it => it.id === itemId))
}

function exhibitionLinksForItem(itemId) {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  const links = []
  const seen = new Set()
  for (const c of collectionsContainingItem(itemId)) {
    // SH items can be attached at three depths: to the exhibition itself
    // (rel_*_exhibitions), to a theme (rel_*_themes), or to a chapter/
    // subtheme (rel_*_subthemes — handled with chapter granularity by
    // chapterLinksForItem; collapsed to its theme here).
    let exhibition = null
    let themeId = null
    if (c.parent_id === marker.id) {
      exhibition = c
    } else {
      const parent = (collections.value ?? []).find(t => t.id === c.parent_id)
      if (parent && parent.parent_id === marker.id) {
        // c is a theme directly under an exhibition
        exhibition = parent
        themeId = c.id
      } else {
        const grandparent = parent && (collections.value ?? []).find(e => e.id === parent.parent_id)
        if (grandparent && grandparent.parent_id === marker.id) {
          // c is a chapter under a theme under an exhibition
          exhibition = grandparent
          themeId = parent.id
        }
      }
    }
    if (!exhibition) continue
    const key = `${exhibition.id}:${themeId ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    links.push({
      exhibitionId: exhibition.id,
      themeId,
      label: tr('collections', exhibition.id).title ?? exhibition.internal_name,
    })
  }
  return links
}

// SH adds a third level: an item can also be attached to a chapter
// (subtheme). Walk one extra parent step: chapter → theme → exhibition.
function chapterLinksForItem(itemId) {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  const links = []
  for (const c of collectionsContainingItem(itemId)) {
    if (c.type !== 'subtheme') continue
    const theme = (collections.value ?? []).find(t => t.id === c.parent_id)
    const ex = theme && (collections.value ?? []).find(e => e.id === theme.parent_id)
    if (!ex || ex.parent_id !== marker.id) continue
    links.push({
      exhibitionId: ex.id,
      themeId: theme.id,
      chapterId: c.id,
      label: tr('collections', c.id).title ?? c.internal_name,
      exhibitionLabel: tr('collections', ex.id).title ?? ex.internal_name,
    })
  }
  return links
}

// ── Markdown helpers ───────────────────────────────────────────────────────

// Full block markdown → HTML (for prose sections)
// Rendered by viewer-core, which escapes raw HTML instead of rendering it.
// A data package holds Markdown — the importer converts the legacy HTML on
// the way in — so a tag arriving in a field means that conversion missed it,
// and it shows on the page as the characters it is. The fix belongs in the
// importer; rendering it here would hide the one thing worth seeing, and it
// would make a museum record the single input this site trusts with markup.
//
// The three renderers are viewer-core's, and there is no fourth: a website
// neither defines a rendering rule nor imports the Markdown library.
function md(text, glossary) {
  if (!text) return ''
  return renderBlock(text, { breaks: true, glossary })
}

// Inline markdown → HTML without block-level <p> wrapping (for titles, names)
function mdInline(text, glossary) {
  if (!text) return ''
  return renderInline(text, { glossary })
}

// Strip all markdown to plain text (for alt attributes, search matching, etc.)
function mdStrip(text) {
  if (!text) return ''
  return renderPlain(text)
}

export function useInventoryData() {
  return {
    items,
    publicItems,
    countries,
    partners,
    timelines,
    pcTimelines,
    thematicTimelines,
    timelineEvents,
    collections,
    defaultLang,
    availableLanguages,
    loadTranslations,
    translations,
    tr,
    loadEnglishTranslations,
    itemLabel,
    countryLabel,
    partnerLabel,
    itemProjectKey,
    itemById,
    exhibitions,
    exhibitionById,
    exhibitionThemes,
    exhibitionThemeById,
    chapterById,
    exhibitionLinksForItem,
    chapterLinksForItem,
    historicalBackgroundRecords,
    historicalBackgroundGeneral,
    historicalBackgroundProfiles,
    historicalBackgroundPages,
    hbGeneralPerspectives,
    hbGeneralTopics,
    md,
    mdInline,
    mdStrip,
  }
}
