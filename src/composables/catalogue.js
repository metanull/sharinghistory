import { computed } from 'vue'
import { useI18n } from '@metanull/viewer-core'
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

export const SEARCH_FIELDS = {
  keyword: (item, text) => [text.name ?? item.internal_name, text.alternate_name, text.description, ...(item.tags ?? [])],
  name: (item, text) => text.name ?? item.internal_name,
  location: (item, text) => text.location,
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
 * The field options of the search form, in legacy's order. `value` is the
 * query parameter and never a text; each label is written out, because the
 * check that every name resolves can only see the ones it can read.
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

export function collectionTitle(collection) {
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

/** Every item id attached to `collectionId` or any descendant, national context excluded. */
export function itemIdsUnder(collectionId) {
  const all = collections.value ?? []
  const byId = new Map(all.map((c) => [c.id, c]))
  const children = new Map()
  for (const c of all) {
    if (!c.parent_id) continue
    if (!children.has(c.parent_id)) children.set(c.parent_id, [])
    children.get(c.parent_id).push(c)
  }
  const ids = new Set()
  const stack = [collectionId]
  while (stack.length) {
    const id = stack.pop()
    const c = byId.get(id)
    if (!c) continue
    for (const entry of c.items ?? []) ids.add(entry.id)
    for (const child of children.get(id) ?? []) {
      if (child.purpose === 'national-context') continue
      stack.push(child.id)
    }
  }
  return ids
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

  // "[N objects, M monuments]", legacy's phrasing of the count.
  summary: ({ matching, t }) => {
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
  },
}
