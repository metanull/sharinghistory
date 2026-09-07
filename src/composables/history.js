import { computed } from 'vue'
import { useCollectionTree } from '@metanull/viewer-core'

// The Historical Profiles subtree — a country's own record and its ordered
// pages — and the Historical Background subtree — the general perspectives
// plus the "Read more" topics — replace the hand-written parent_id walks
// useInventoryData.js carried for them, the way exhibitions.js's own comment
// already flagged as this story's (#39) work.

// No `childType`: the "historical-profiles-root" marker parents nothing but
// the country (and one project-level "general") records, and each record
// parents nothing but its own ordered pages — no sibling noise to filter,
// unlike the exhibitions tree's National Context collections.
const rawProfilesTree = useCollectionTree({ purpose: 'historical-profiles-root' })

// Bounded the same way exhibitions.js bounds its own tree, and for the same
// reason: the marker sits a level under the project collection
// (sh-historical-profiles-root import step, #1505), so a page's true
// ancestry carries two extra, unrelated crumbs ahead of "record". See
// exhibitions.js's `ancestryWithin` for the full reasoning; returns `null`
// for a node not under this marker at all.
function ancestryWithin(id) {
  const rootId = rawProfilesTree.root.value?.id
  if (!rootId || id === rootId) return null
  const all = rawProfilesTree.parents(id)
  const index = all.findIndex((node) => node.id === rootId)
  return index === -1 ? null : all.slice(index + 1)
}

/**
 * The tree `historySpecs.js` and the profile pages read: `children`,
 * `itemsUnder`, `containing`, `walk`, `previous`/`next` unchanged from
 * `useCollectionTree`; `parents`/`breadcrumb` bounded to this tree's own
 * root, which is what makes them safe to hand `EssayView` as a pre-built
 * `tree`.
 */
export const historicalProfilesTree = {
  ...rawProfilesTree,
  parents: (id) => ancestryWithin(id) ?? [],
  breadcrumb: (id) => {
    const node = rawProfilesTree.byId.value.get(id)
    const ancestry = ancestryWithin(id)
    if (!node) return []
    return ancestry ? [...ancestry, node] : [node]
  },
}

/** The country/general records themselves: the tree root's own children. */
export const historicalProfileRecords = computed(() => {
  const root = historicalProfilesTree.root.value
  return root ? historicalProfilesTree.children(root.id) : []
})

/**
 * Country profiles only — the project-level "general" record (`country_id`
 * null) has never had a card of its own on the profiles grid; the filter
 * moves here unchanged.
 */
export const historicalProfileCountries = computed(() =>
  historicalProfileRecords.value.filter((record) => record.country_id),
)

/**
 * A node's own page address, from its position in this tree rather than
 * from route params a caller would otherwise have to thread through: a
 * record (no ancestor within the tree) goes to its bare address, which
 * HistoricalBackgroundCountry.vue resolves to the record's first page
 * itself — the same canonicalisation it gives a bookmarked `?page=N`
 * address (see the pull request description); a page (one ancestor, its
 * record) goes to its own explicit address. `null` for a node this tree
 * does not carry at all.
 */
export function historicalProfileNodeRoute(node) {
  const ancestry = ancestryWithin(node.id)
  if (!ancestry) return null
  if (ancestry.length === 0) return { name: 'historical-profile', params: { recordId: node.id } }
  return { name: 'historical-profile', params: { recordId: ancestry[0].id, pageId: node.id } }
}

// The Historical Background section: perspectives (Arab / Ottoman /
// European) directly under the marker, and the "Read more" topics under
// their own nested marker (sh-hb-general import step, #1498) — filtered out
// of the perspectives themselves by `purpose`, since both levels carry the
// same collection `type` and `childType` only filters by `type`. Neither
// subtree feeds an `EssayView`: the perspectives switch prose in place
// rather than navigating, and the topics have nowhere to link to (legacy
// never filled the "read more" text in) — both stay a small wrapper's own
// list, in HistoricalBackground.vue.
export const historicalPerspectivesTree = useCollectionTree({
  purpose: 'historical-background-root',
  childType: (node) => node.purpose !== 'topics-root',
})
export const historicalTopicsTree = useCollectionTree({ purpose: 'topics-root' })

export const historicalPerspectives = computed(() => {
  const root = historicalPerspectivesTree.root.value
  return root ? historicalPerspectivesTree.children(root.id) : []
})
export const historicalTopics = computed(() => {
  const root = historicalTopicsTree.root.value
  return root ? historicalTopicsTree.children(root.id) : []
})
