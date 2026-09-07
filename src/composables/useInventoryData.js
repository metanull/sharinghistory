import { computed } from 'vue'
import { byId, useCatalogueData, useDataPackage } from '@metanull/viewer-core'

// The website's records, read the one way every website reads them: through
// viewer-core, lazily. Each entity is a shared ref that stays `null` until a
// route declaring it in `meta.entities` brings its chunk in, so importing
// this module loads nothing, and a page pays only for what it reads.
// Translations are viewer-core's cache, not a second one kept here. The
// wrapper half — `tr`, `md`/`mdInline`/`mdStrip`, `loadEnglish`, `labelOf`,
// the visible form of an entity — is `useCatalogueData`'s; what stays here is
// this site's own: the manifest project-key mapping, the exhibition/theme/
// chapter tree and the Historical Background subtrees (all move to
// `useCollectionTree` in wave H), and the raw item lookup a page reads when
// it deliberately shows an item the visible rule below hides.

const dataPackage = useDataPackage()
const manifestData = dataPackage.manifest

// Items legacy kept only to illustrate Historical Background / timeline
// pages (display_status 'N') are excluded from database search and Permanent
// Collection browsing, exactly like the legacy site
// (modules/database_results.php AND o.display_status='A'). Declared once,
// as `visible.items`, so `items`/`catalogue.entity('items')` read it
// automatically. Exported too (as `itemVisible`, from `useInventoryData()`):
// viewer-core's own generic entity access — the keyword index,
// `useFeaturedRecord`, this site's own catalogue spec's `scope` — reads the
// raw entity by name and applies no site rule of its own, so each of those
// needs the rule directly, the way `catalogue.js`'s `inScope` re-exports it.
function itemVisible(item) {
  return item.display_status !== 'N'
}

const catalogue = useCatalogueData({
  eager: ['items', 'countries', 'partners', 'timeline_events', 'collections'],
  visible: {
    items: itemVisible,
  },
})
catalogue.loadEnglish()

const {
  tr, md, mdInline, mdStrip, labelOf, availableLanguages, loadTranslations, translations,
} = catalogue

const items = catalogue.entity('items')
const countries = catalogue.entity('countries')
const partners = catalogue.entity('partners')
const timelines = catalogue.entity('timelines')
const timelineEvents = catalogue.entity('timeline_events')
const collections = catalogue.entity('collections')

// English is the base language of every catalogue in the platform: every
// list, label and fallback reads it. A record the visitor reads in another
// language is resolved on the sheet itself, by viewer-core's
// `useRecordLanguage`; which languages the site offers is decided once, in
// dataset.config.js, by viewer-core's `offeredLanguages` over this site's
// own declared list.
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

// ── Raw item lookup ──────────────────────────────────────────────────────
//
// Every item, regardless of display_status — unlike `items` above, which
// `visible.items` narrows. A page reads this one when the item it shows is
// exactly what display_status 'N' exists for: a timeline event's
// illustration, an exhibition's or a Historical Background page's own
// attached items, a monument's special-feature sub-items on its own detail
// page.
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

export function useInventoryData() {
  return {
    items,
    countries,
    partners,
    timelines,
    timelineEvents,
    collections,
    defaultLang,
    availableLanguages,
    loadTranslations,
    translations,
    tr,
    labelOf,
    itemVisible,
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
