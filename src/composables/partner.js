import { inScope, itemSummary } from './catalogue.js'
import { useInventoryData } from './useInventoryData.js'

// The partner pages, as specs: what viewer-layout's `PartnerListView` renders
// on `/partners/results` and `RecordView` on `/partner/:id`. The engine —
// the country grouping, the tiers, the field sheet, the media gallery, the
// content language — is the platform's; what is declared here is only what
// is this website's: which partners are listed at all (legacy's INNER JOINs
// on a name translation and a country), the associated-under-parent nesting
// legacy's own list carried, and the profile's own content — description,
// contact, logo — plus the held items a partner's own record does not
// declare as a relation (the package models it the other way, an item
// pointing at its partner, so it is read the same way the original page
// scanned for it).

const { items, labelOf, tr } = useInventoryData()

// Legacy pm_partner_list.php's INNER JOINs on sh_partner_names +
// mwnf3.countrynames: only a partner with a name translation AND a country
// is listed. Reproduces the live site's 114-partner list (27 main + 87
// associated) out of the 120 the package carries — the rest are placeholder
// rows ("Not know yet", "Public Domain", or nameless).
function listed(partner) {
  return !!tr('partners', partner.id)?.name && !!partner.country_id
}

export const partnersList = {
  scope: (partner) => listed(partner),
  group: { tier: 'level' },
  // Legacy nested an associated partner under the main partner it belongs
  // to; the package's `parent_id` (post G.1) is that relationship. The
  // "Partners found" count is the view's own (`PartnersResults.vue`'s
  // `#before`): the view's built-in count does not add a nested child back
  // in, so it would undercount here.
  nested: true,
  label: (countryId) => labelOf('countries', countryId),
  route: 'partner',
  empty: 'sharinghistory.partner.noPartners',
}

// ── The partner sheet ───────────────────────────────────────────────────────

function contactPersons(partner) {
  return [partner?.contact_person_1, partner?.contact_person_2].filter((cp) => cp && (cp.name || cp.title))
}

function hasContactInfo(ctx) {
  const text = ctx.text
  return !!(
    text.address || text.phone || text.email || text.website ||
    ctx.record.additional_urls?.length || contactPersons(ctx.record).length
  )
}

// A partner's own images, captioned from its own fields — unlike the
// default (an item's `captions` map, which a partner record does not
// carry).
function partnerMedia(partner) {
  return (partner.images ?? []).map((img) => ({
    url: img.url,
    alt: img.alt_text ?? '',
    caption: img.alt_text ?? '',
    photographer: img.photographer ?? '',
    copyright: img.copyright ?? '',
  }))
}

// The items a partner holds — `item.partner_id`, the package's own relation,
// read in reverse; `related` (a record's own declared references) does not
// apply here, so this feeds the `#related` slot directly rather than the
// spec's `related` option. Shared row shape with the timeline gallery
// (`itemSummary`, composables/catalogue.js).
export function heldItems(partner) {
  return (items.value ?? []).filter((item) => inScope(item) && item.partner_id === partner.id)
}
export function heldItemRows(partner) {
  return heldItems(partner).map(itemSummary)
}

export const partnerSheet = {
  entity: 'partners',
  layout: 'list',
  fields: [
    { key: 'description', label: 'partner.info.about', value: 'description', render: 'block' },
    // `value` only has to be present for the row to survive `sheetRows`'
    // own filter — the slot renders the block itself, not `row.html`.
    { key: 'contact', label: 'partner.info.contact', value: () => true, render: 'custom', when: hasContactInfo },
    { key: 'logo', label: 'partner.info.logo', value: () => true, render: 'custom', when: (ctx) => (ctx.record.logos ?? []).length > 0 },
  ],
  media: (partner) => partnerMedia(partner),
  citation: false,
  related: false,
}
