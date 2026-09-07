import { historicalProfileNodeRoute, historicalProfilesTree } from './history.js'

// The country page as an `EssayView` spec: what it declares is only what
// makes it different from the plain default. What is the record's own, not
// this page's — the record's intro, the bibliography, the maps — is not a
// field of this node's translation at all, so it cannot be a spec key; it
// is HistoricalBackgroundCountry.vue's own `before-body`/`after` slot
// content, reading the record directly (see the pull request description).

const itemRoute = (item) => ({ name: 'item', params: { id: item.id } })

// `navigation: 'siblings'` over a record's own pages (children of the same
// parent) replaces the old `?page=N` query pagination; `numbering:
// 'decimal'` replaces the "Page N / M" counter with the essay's own bare
// numeral next to the title. `panel: false`: a page's illustrating items
// carry no per-item detail worth a picture selector — a plain grid, the
// same trade-off the exhibition introduction spec makes. `quote: false`: no
// page ever carried a pull-quote field.
export const historicalBackgroundCountrySpec = {
  tree: historicalProfilesTree,
  entity: 'items',
  route: historicalProfileNodeRoute,
  breadcrumb: true,
  quote: false,
  body: 'description',
  panel: false,
  items: { route: itemRoute },
  navigation: 'siblings',
  numbering: 'decimal',
}
