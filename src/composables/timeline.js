import { unref } from 'vue'
import { eventDateLabel, inDateRange } from '@metanull/viewer-core'
import { collectionTitle, DATE_MODE, inScope, objectsAndMonumentsSummary } from './catalogue.js'
import { useInventoryData } from './useInventoryData.js'

// The timeline, as `TimelineResultsView` specs: what viewer-core's
// `useTimelineEvents` engine (the merge, the overlap rule, the era label,
// the URL sync) reads is `scope`/`countryLabel`/`tr` below; what is this
// website's own is the second axis legacy's hcr_home.php toggled between —
// Permanent Collection vs. a thematic exhibition — the "Country | Theme" row
// caption, its image/item strip, and the Permanent Collection results
// gallery cross-link (`hcr_gallery.php`, Decision D1). One shared spec is
// read by both the entrance (`entrance: true`) and the results page.

const { timelines, exhibitions, itemById, items, labelOf, tr, mdInline, md } = useInventoryData()

function timelineOf(event) {
  return (timelines.value ?? []).find((row) => row.id === event.timeline_id) ?? null
}

// Exhibitions that actually have a timeline bound to them — the legacy
// toggle only ever offered a thematic choice for one that exists.
function boundExhibitions() {
  const boundIds = new Set((timelines.value ?? []).map((row) => row.collection_id).filter(Boolean))
  return (exhibitions.value ?? []).filter((e) => boundIds.has(e.id))
}

/** The `collection` control's own options: the Permanent Collection sentinel, then the bound exhibitions. */
export function timelineCollections(ctx) {
  return [
    { value: 'pc', label: ctx.t('sharinghistory.nav.permanentCollection') },
    ...boundExhibitions().map((e) => ({ value: e.id, label: collectionTitle(e) })),
  ]
}

// Legacy hcr_result.php's row caption: the country, then a pipe and the
// theme — a Permanent Collection event's "theme" is the political-context
// chronology itself (no bound exhibition), a thematic one is its
// exhibition's own title.
function eventCaption(event, ctx) {
  const country = mdInline(labelOf('countries', event.country_id))
  const timeline = timelineOf(event)
  if (!timeline) return country
  const theme = timeline.collection_id === null
    ? ctx.t('sharinghistory.timeline.politicalContext')
    : mdInline(tr('collections', timeline.collection_id)?.title ?? '')
  return theme ? `${country} | ${theme}` : country
}

// The illustrating images and the curated item links, as the `media` strip —
// an item's own caption carries the "See Database Entry" line the row used
// to render beside it.
function eventMedia(event, ctx) {
  const images = (event.images ?? []).map((img) => ({ image: img.url, alt: img.alt_text ?? '' }))
  const linkedItems = (event.item_ids ?? [])
    .map((id) => itemById.value.get(id))
    .filter(Boolean)
    .map((item) => ({
      image: item.images?.[0]?.url ?? '',
      alt: labelOf('items', item.id),
      to: { name: 'item', params: { id: item.id } },
      caption: `${mdInline(labelOf('items', item.id))}<br><span class="sh-timeline-see">${ctx.t('sharinghistory.action.seeDatabaseEntry')} →</span>`,
    }))
  return [...images, ...linkedItems]
}

// The Permanent Collection results a period's events already link to
// individually — kept as-is; only the row's own shape is new.
function itemsLink(event) {
  const yt = event.year_to && event.year_to !== 0 ? event.year_to : event.year_from
  return { name: 'permanent-collection-results', query: { country: event.country_id, begin: String(event.year_from), end: String(yt) } }
}

const timelineResultsBase = {
  scope: 'collection',
  countryLabel: (id) => labelOf('countries', id),
  tr: (id) => tr('timeline_events', id),
  route: 'timeline-results',
  collections: timelineCollections,
  controls: [
    { key: 'country', label: 'catalogue.facet.country', placeholder: 'timeline.form.selectCountry' },
    { key: 'collection', label: 'sharinghistory.nav.timeline', anyLabel: 'sharinghistory.filter.all' },
    { key: 'begin', label: 'timeline.form.startDate', placeholder: 'timeline.form.fromYearHint' },
    { key: 'end', label: 'timeline.form.endDate', placeholder: 'timeline.form.toYearHint' },
  ],
  filterTitle: 'catalogue.filter.heading',
  submitLabel: 'sharinghistory.action.go',
  errorSelect: 'timeline.form.errorSelect',
  errorPeriod: 'timeline.form.errorPeriod',
  empty: 'timeline.results.noEvents',
  pageSize: 15,
  pagination: { window: 7 },
  // `unref`: the view's own row mapper (`events`/`H`, viewer-layout#…) hands
  // this the raw `computed()` rather than its value — every other callback
  // of this spec receives the unwrapped context correctly, only this one
  // doesn't, so it is unwrapped defensively here rather than trusting it.
  event: (event, rawCtx) => {
    const ctx = unref(rawCtx)
    return {
      date: eventDateLabel(event, event.text, ctx.t),
      caption: eventCaption(event, ctx),
      description: event.text?.description ? md(event.text.description) : '',
      media: eventMedia(event, ctx),
      actions: [{ label: ctx.t('timeline.action.viewItemsFromPeriod'), to: itemsLink(event) }],
    }
  },
  gallery: {
    route: 'timeline-gallery',
    label: 'timeline.nav.seeGallery',
    items: (ctx) => galleryCandidates(ctx.filters).length,
  },
}

/** `/timeline` — the form alone, legacy's hcr_home.php. */
export const timelineEntrance = { ...timelineResultsBase, entrance: true }

/** `/timeline/results` — legacy's hcr_result.php. */
export const timelineResults = { ...timelineResultsBase, entrance: false }

// ── The timeline gallery (Decision D1: hcr_gallery.php regained) ───────────
//
// The Permanent Collection objects of one country and period, offered as a
// "See gallery" cross-link from the results page above whenever any exist —
// scoped to the country and the period alone, the collection/exhibition axis
// stays out of it (a period's objects, not one exhibition's).

function galleryCandidates(filters) {
  return (items.value ?? []).filter((item) => {
    if (!inScope(item)) return false
    if (filters.country && item.country_id !== filters.country) return false
    return inDateRange(item, { begin: filters.begin, end: filters.end, mode: DATE_MODE })
  })
}

export const timelineGallery = {
  entity: 'items',
  keys: ['country', 'begin', 'end'],
  scope: (item, filters) => inScope(item) && (!filters.country || item.country_id === filters.country),
  dates: { mode: DATE_MODE },
  sort: 'chronological',
  pageSize: 20,
  variant: 'list',
  recordRoute: 'item',
  empty: 'catalogue.results.noResultsFilter',
  pagination: { window: 7 },
  record: (item) => {
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
  },
  summary: objectsAndMonumentsSummary,
}
