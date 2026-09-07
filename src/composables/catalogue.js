import { computed } from 'vue'
import { centuryPresets, useI18n } from '@metanull/viewer-core'
import { exhibitionTree } from './exhibitions.js'
import { useInventoryData } from './useInventoryData.js'

// The catalogue spec: what this website's lists filter and search on. The
// engine — query state, options, dates, pages, the keyword grammar — is
// viewer-core's; what is declared here is only what is this website's: the
// scope rule, the date rule, the eight fields of the legacy search form (no
// period / dynasty on this site), the two record facets of the Permanent
// Collection, and the exhibition scope legacy's pclist_all.php offered as
// "Theme / Subtheme / Chapter", folded into the `permanentCollection` spec
// below that viewer-layout's `CatalogueResultsView` renders directly. Two
// entrances and one results page read this one declaration.

const {
  collections, countries, exhibitions, exhibitionThemes, itemVisible, labelOf, mdInline, mdStrip,
  partners, tr,
} = useInventoryData()

/** Twenty rows a page, as the legacy pages showed. */
export const PAGE_SIZE = 20

/** Decision D5: the standalone sites test overlap, tolerating a single date. */
export const DATE_MODE = 'overlap'

// The predicate declared once, as `visible.items`, in useInventoryData.js —
// re-exported under this name because viewer-core's own generic entity
// access (the keyword index below, `useFeaturedRecord` on Home.vue, this
// spec's own `scope`) reads the raw entity by name and applies no site rule
// of its own, so each of those needs the rule directly rather than through
// the composable's already-filtered `items`.
export const inScope = itemVisible

// ── The eight fields of database.php ───────────────────────────────────────
//
// What each searches is the legacy form's, field for field. `text` is the
// record's translation in the search language, with English behind it.

// `keyword` and `location` also carry `item.country_id`: legacy's own rule
// for these two fields (`database_results.php`'s keyword/location country
// match) — Decision D3's `countryExpansion` turns a typed country name into
// its id, and a field only benefits from that when its own haystack has the
// id to match against.
export const SEARCH_FIELDS = {
  keyword: (item, text) => [text.name ?? item.internal_name, text.alternate_name, text.description, item.country_id, ...(item.tags ?? [])],
  name: (item, text) => text.name ?? item.internal_name,
  location: (item, text) => [text.location, item.country_id],
  provenance: (item, text) => text.provenance,
  patron: (item, text) => text.patrons ?? text.initial_owner,
  artist: (item, text) => [...(item.artist_names ?? []), text.architects],
  material: (item, text) => text.type,
  // The catch-all across the descriptive fields the other seven leave out.
  other: (item, text) => [
    text.description, text.method_for_datation, text.method_for_provenance, text.obtention,
    text.bibliography, text.workshop, text.scriber, text.binding_desc, text.history,
  ],
}

/**
 * The field options of the search form, in legacy's order — `key`/`label`,
 * `SearchFormView`'s own shape: a label here is an entry name, resolved by
 * the view itself, so every one is written out as a literal (the check that
 * a name is spelled out where it is used reads an array literal the same
 * way it reads a template, but not a value built from one).
 */
export const SEARCH_FIELD_OPTIONS = [
  { key: 'keyword', label: 'catalogue.field.keywords' },
  { key: 'name', label: 'sheet.field.name' },
  { key: 'location', label: 'sheet.field.location' },
  { key: 'provenance', label: 'sheet.field.provenance' },
  { key: 'patron', label: 'catalogue.field.patron' },
  { key: 'artist', label: 'catalogue.field.artist' },
  { key: 'material', label: 'catalogue.field.material' },
  { key: 'other', label: 'catalogue.field.other' },
]

/**
 * The field options, resolved — `value`/`label` (as opposed to
 * `SEARCH_FIELD_OPTIONS`'s `key`/entry-name), for a caller that renders the
 * text itself rather than handing an entry name to a view (the results
 * page's own refine row). Every `t(...)` call is a literal for the same
 * reason `SEARCH_FIELD_OPTIONS` is spelled out rather than built from it.
 */
export function useSearchFields() {
  const { t } = useI18n()
  return computed(() => [
    { value: 'keyword', label: t('catalogue.field.keywords') },
    { value: 'name', label: t('sheet.field.name') },
    { value: 'location', label: t('sheet.field.location') },
    { value: 'provenance', label: t('sheet.field.provenance') },
    { value: 'patron', label: t('catalogue.field.patron') },
    { value: 'artist', label: t('catalogue.field.artist') },
    { value: 'material', label: t('catalogue.field.material') },
    { value: 'other', label: t('catalogue.field.other') },
  ])
}

// ── The facets of the Permanent Collection ─────────────────────────────────
//
// Countries and institutions by name. A value the reference entity does not
// carry is not offered: the label would be an id.

export const FACETS = {
  country: {
    field: 'country_id',
    label: (id) => labelOf('countries', id),
    include: (id) => (countries.value ?? []).some((c) => c.id === id),
  },
  partner: {
    field: 'partner_id',
    label: (id) => labelOf('partners', id),
    include: (id) => (partners.value ?? []).some((p) => p.id === id),
  },
}

// ── The exhibition scope ───────────────────────────────────────────────────
//
// Legacy pclist_all.php filters the Permanent Collection by exhibition
// ("Theme"), exhibition theme ("Subtheme") and subtheme ("Chapter").
// Membership is the collections' items[] lists; an exhibition-level filter
// covers the exhibition and every theme/chapter below it. Country-specific
// National Context variants (purpose "national-context", #1505) hang under
// exhibitions but are not part of the theme tree, so their items stay out.

// National Context collections (purpose "national-context", #1505) carry no
// title in any language — the importer writes only the internal name and the
// country (sh-national-context-importer.ts) — because legacy never named
// them on their own either: every list joined the country name instead
// (class.nationalcontext.inc.php). Read through `labelOf`, not `tr(...).title`,
// so a missing English translation still resolves.
export function collectionTitle(collection) {
  if (collection.purpose === 'national-context') return labelOf('countries', collection.country_id)
  return mdStrip(tr('collections', collection.id)?.title ?? collection.internal_name)
}

/** `[{ value, label }]` of the exhibitions, by title. */
export function exhibitionOptions() {
  return (exhibitions.value ?? [])
    .map((e) => ({ value: e.id, label: collectionTitle(e) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** The themes of one exhibition, in their order. */
export function themeOptions(exhibitionId) {
  if (!exhibitionId) return []
  return exhibitionThemes(exhibitionId).map((theme) => ({ value: theme.id, label: collectionTitle(theme) }))
}

/** The chapters of one theme of one exhibition, in their order. */
export function chapterOptions(exhibitionId, themeId) {
  if (!exhibitionId || !themeId) return []
  const theme = exhibitionThemes(exhibitionId).find((candidate) => candidate.id === themeId)
  return (theme?.chapters ?? []).map((chapter) => ({ value: chapter.id, label: collectionTitle(chapter) }))
}

/**
 * Every item id attached to `collectionId` or any descendant, national
 * context excluded — `exhibitionTree.itemsUnder` (exhibitions.js), which
 * already stops at the same National Context boundary (`childType` keeps
 * only `theme`/`subtheme` children, so a National Context sibling, type
 * `collection`, is never walked into). Wrapped in a `Set` here only because
 * the filter cascade below tests membership by id, not because the tree
 * itself needs one.
 */
export function itemIdsUnder(collectionId) {
  return new Set(exhibitionTree.itemsUnder(collectionId))
}

export function collectionById(id) {
  return (collections.value ?? []).find((c) => c.id === id) ?? null
}

// ── The Permanent Collection, as a spec ─────────────────────────────────────
//
// What viewer-layout's `CatalogueResultsView` renders on
// `/permanent-collection/results`: the two facets above over every record,
// as legacy offered them, the two years, the date rule above, chronological
// order, twenty rows a page, and legacy's count phrased as "[N objects, M
// monuments]". The exhibition scope is `scope`, not a facet, because it
// narrows the record set by an id tree rather than by a value the record
// itself carries; the cascade's own options (exhibitionOptions /
// themeOptions / chapterOptions, above) stay out of the spec for the same
// reason and render in the view's `filters` slot instead. Every text is an
// entry name; the check that every name resolves reads them here.

// `scope` runs once per record, and the exhibition subtree it filters
// against does not change between those calls within one pass — only
// `scopedItemIds` is memoised, so a full page of records costs one walk of
// the collection tree rather than one per record.
let scopeCache = { collections: null, id: null, ids: null }
function scopedItemIds(id) {
  const current = collections.value
  if (scopeCache.collections !== current || scopeCache.id !== id) {
    scopeCache = { collections: current, id, ids: itemIdsUnder(id) }
  }
  return scopeCache.ids
}

// The shared record shape (`RecordList`/`RecordGrid`/`RelatedRecords`'
// contract) for one item, name/country/date only — no holder, unlike the
// Permanent Collection's own row, since a caller that already knows the
// holder (a partner's own held items) has no reason to repeat it. Shared by
// the timeline gallery and the partner sheet's held-items grid.
export function itemSummary(item) {
  const text = tr('items', item.id)
  return {
    id: item.id,
    image: item.images?.[0]?.url ?? '',
    imageAlt: labelOf('items', item.id),
    name: mdInline(text.name ?? item.internal_name ?? item.id),
    meta: [labelOf('countries', item.country_id), text.dates].filter(Boolean),
    badge: item.type,
    to: { name: 'item', params: { id: item.id } },
  }
}

// "[N objects, M monuments]", legacy's phrasing of the count — shared by
// every results page over `items` (the Permanent Collection, the timeline
// gallery), since the type split is the entity's own, not one page's.
export function objectsAndMonumentsSummary({ matching, t }) {
  let objects = 0
  let monuments = 0
  for (const item of matching) {
    if (item.type === 'monument') monuments++
    else objects++
  }
  return [
    { label: t('catalogue.results.objectsFound'), count: objects },
    { label: t('catalogue.results.monumentsFound'), count: monuments },
  ]
}

export const permanentCollection = {
  entity: 'items',
  keys: ['country', 'exhibition', 'theme', 'chapter', 'partner', 'begin', 'end'],
  facets: FACETS,
  facetScope: 'all',
  scope: (item, filters) => {
    if (!inScope(item)) return false
    const scopeId = filters.chapter || filters.theme || filters.exhibition
    return !scopeId || scopedItemIds(scopeId).has(item.id)
  },
  controls: [
    { key: 'country', label: 'catalogue.facet.country', anyLabel: 'catalogue.facet.any' },
    { key: 'partner', label: 'catalogue.facet.holdingInstitution', anyLabel: 'catalogue.facet.any' },
    { key: 'begin', type: 'year', label: 'catalogue.facet.fromYear', placeholder: 'timeline.form.fromYearHint' },
    { key: 'end', type: 'year', label: 'catalogue.facet.toYear', placeholder: 'timeline.form.toYearHint' },
  ],
  filterMode: 'apply',
  filterTitle: 'catalogue.filter.heading',
  dates: { mode: DATE_MODE },
  sort: 'chronological',
  pageSize: PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  empty: 'catalogue.results.noResultsFilter',
  pagination: { window: 7 },

  // The row: the thumbnail, the name, the country, the date and the holder,
  // the holder only when the package carries the partner, so a label is
  // never an id.
  record: (item) => {
    const text = tr('items', item.id)
    return {
      id: item.id,
      image: item.images?.[0]?.url ?? '',
      imageAlt: labelOf('items', item.id),
      name: mdInline(text.name ?? item.internal_name ?? item.id),
      meta: [
        labelOf('countries', item.country_id),
        text.dates,
        (partners.value ?? []).some((p) => p.id === item.partner_id) ? labelOf('partners', item.partner_id) : '',
      ].filter(Boolean),
      badge: item.type,
      to: { name: 'item', params: { id: item.id } },
    }
  },

  summary: objectsAndMonumentsSummary,
}

// ── The search entrance and the keyword results ────────────────────────────
//
// `Database.vue`'s `SearchFormView` spec (legacy database.php's shape,
// decision D2: three keyword rows, the century date boundaries, the search
// language) and `DatabaseResults.vue`'s `CatalogueResultsView` spec. The
// keyword search itself — `useKeywordIndex`, tied to the results page's own
// route-read search language — stays in the view: a keyword index is a
// live composable, not a plain declaration, so only the pieces that are
// (the field grammar in `SEARCH_FIELDS` above, the row-building `searchRows`
// and `searchSummary` below, shared so the summary line and the index read
// the very same rows) live here.

/** `SearchFormView`'s `fields`/`rows` writes `q`/`field`, `q2`/`field2`/`op2`, … */
export const databaseSearch = {
  mode: 'rows',
  entity: 'items',
  fields: SEARCH_FIELD_OPTIONS,
  dates: { presets: centuryPresets },
  language: 'items',
  target: 'database-results',
}

/**
 * One keyword row per active `qN`/`fieldN`/`opN` key — `SearchFormView`'s own
 * numbering (row 1 is `q`/`field`, unnumbered) plus the results page's own
 * fourth, refine-only row (`q4`/`field4`/`op4`), read the same way.
 */
export function searchRows(filters) {
  return [1, 2, 3, 4].map((n) => ({
    keyword: n === 1 ? filters.q : filters[`q${n}`],
    field: (n === 1 ? filters.field : filters[`field${n}`]) || 'keyword',
    cond: n === 1 ? 'AND' : filters[`op${n}`] || 'AND',
  }))
}

// A literal `t(...)` per key, not a lookup into `SEARCH_FIELD_OPTIONS` — the
// field a summary line names is read off the URL, so a name built from it
// is the one thing the text-name check cannot see is safe.
function fieldLabel(value, t) {
  switch (value) {
    case 'keyword': return t('catalogue.field.keywords')
    case 'name': return t('sheet.field.name')
    case 'location': return t('sheet.field.location')
    case 'provenance': return t('sheet.field.provenance')
    case 'patron': return t('catalogue.field.patron')
    case 'artist': return t('catalogue.field.artist')
    case 'material': return t('catalogue.field.material')
    case 'other': return t('catalogue.field.other')
    default: return value
  }
}

/** The "Keyword: 'x' AND Location: 'y' · From 900 · Language: FR" line. */
export function searchSummary({ filters, t, pageInfo }) {
  const parts = searchRows(filters)
    .filter((row) => row.keyword)
    .map((row, i) => `${i > 0 ? `${row.cond} ` : ''}${fieldLabel(row.field, t)}: "${row.keyword}"`)
  if (filters.from) parts.push(`${t('catalogue.filter.from')} ${filters.from}`)
  if (filters.to) parts.push(`${t('catalogue.filter.to')} ${filters.to}`)
  if (filters.lang) parts.push(`${t('catalogue.search.language')}: ${filters.lang.toUpperCase()}`)
  return [
    { label: t('catalogue.search.summary'), value: parts.length ? parts.join(' · ') : t('catalogue.results.allItems') },
    { label: t('catalogue.results.itemsFound'), count: pageInfo.total },
  ]
}

/** The row: the thumbnail, the name, the country, the date and the location. */
export function searchRecord(item) {
  const text = tr('items', item.id)
  return {
    id: item.id,
    image: item.images?.[0]?.url ?? '',
    imageAlt: labelOf('items', item.id),
    name: mdInline(text.name ?? item.internal_name ?? item.id),
    meta: [labelOf('countries', item.country_id), text.dates, text.location].filter(Boolean),
    badge: item.type,
    to: { name: 'item', params: { id: item.id } },
  }
}

// `narrow` (the keyword index) is the results view's own, merged onto this
// at the call site (DatabaseResults.vue) — see the comment above.
export const databaseResults = {
  entity: 'items',
  keys: ['q', 'field', 'q2', 'field2', 'op2', 'q3', 'field3', 'op3', 'q4', 'field4', 'op4', 'from', 'to', 'lang'],
  scope: (item) => inScope(item),
  dates: { mode: DATE_MODE, begin: 'from', end: 'to' },
  // Decision D3's `rank: 'hits'` orders the matches itself; a second,
  // chronological sort here would undo it.
  sort: false,
  pageSize: PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  empty: 'catalogue.results.noResultsSearch',
  filterTitle: 'catalogue.search.refineHint',
  pagination: { window: 7 },
  record: searchRecord,
  summary: searchSummary,
}
