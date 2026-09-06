import { computed } from 'vue'
import { useI18n } from '@metanull/viewer-core'
import { useInventoryData } from './useInventoryData.js'

// The catalogue spec: what this website's lists filter and search on. The
// engine — query state, options, dates, pages, the keyword grammar — is
// viewer-core's; what is declared here is only what is this website's: the
// scope rule, the date rule, the eight fields of the legacy search form (no
// period / dynasty on this site), the two record facets of the Permanent
// Collection, and the exhibition scope legacy's pclist_all.php offered as
// "Theme / Subtheme / Chapter". Two entrances and two results pages read
// this one declaration.

const {
  collections, countries, countryLabel, exhibitions, exhibitionThemes, mdStrip, partnerLabel, partners, tr,
} = useInventoryData()

/** Twenty rows a page, as the legacy pages showed. */
export const PAGE_SIZE = 20

/** Decision D5: the standalone sites test overlap, tolerating a single date. */
export const DATE_MODE = 'overlap'

/**
 * Items legacy kept only to illustrate Historical Background / timeline
 * pages (display_status 'N') are excluded from database search and Permanent
 * Collection browsing, exactly like the legacy site
 * (modules/database_results.php AND o.display_status='A').
 */
export function inScope(item) {
  return item.display_status !== 'N'
}

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
    { value: 'keyword', label: t('sharinghistory.field.keywords') },
    { value: 'name', label: t('sheet.field.name') },
    { value: 'location', label: t('sheet.field.location') },
    { value: 'provenance', label: t('sheet.field.provenance') },
    { value: 'patron', label: t('sharinghistory.field.patron') },
    { value: 'artist', label: t('sharinghistory.field.artist') },
    { value: 'material', label: t('sharinghistory.field.material') },
    { value: 'other', label: t('sharinghistory.field.other') },
  ])
}

// ── The facets of the Permanent Collection ─────────────────────────────────
//
// Countries and institutions by name. A value the reference entity does not
// carry is not offered: the label would be an id.

export const FACETS = {
  country: {
    field: 'country_id',
    label: countryLabel,
    include: (id) => (countries.value ?? []).some((c) => c.id === id),
  },
  partner: {
    field: 'partner_id',
    label: partnerLabel,
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
