import { computed } from 'vue'
import { useCollectionTree } from '@metanull/viewer-core'

// The exhibition tree — exhibitions → themes → chapters — replaces the
// hand-written parent_id walk this file used to be part of
// (useInventoryData.js keeps its own walk for the historical-background and
// profiles subtrees, which the next story, #39, moves here in turn).
//
// `childType` is depth-indexed against THIS tree's own root, the
// exhibitions-root marker — not against "an exhibition" as viewer-core's own
// doc comment's two-element example (`['theme', 'subtheme']`) illustrates.
// The marker's children are a level this site's other trees don't have: the
// exhibitions themselves. Verified against the package directly (see the
// pull request description) — a two-element array leaves every node
// unfiltered from depth 2 on, which reads as "every type", but
// `useCollectionTree`'s `children(id)` indexes by the DEPTH OF THE PARENT
// being listed, not of the children returned, so depth 0 (the marker)
// governs the exhibitions themselves: a two-element array filters the
// exhibitions to type `theme` and finds none, and the tree comes back
// empty. Three elements — one per level below the marker — is what this
// tree's own shape needs; it also doubles as the National Context filter:
// the country-specific "National Context" collections sit next to the real
// themes under an exhibition but carry type `collection`, not `theme`, so
// filtering an exhibition's children to `theme` keeps them out.
const rawTree = useCollectionTree({
  purpose: 'exhibitions-root',
  childType: ['exhibition', 'theme', 'subtheme'],
})

// `rawTree.parents`/`.breadcrumb` walk a record's true ancestry past the
// tree's own root by design (a breadcrumb elsewhere wants that). Here the
// marker this tree hangs from is itself nested a level under the package's
// project collection (the importer's sh-exhibition-root-keying step, #1505),
// so the true ancestry of every exhibition, theme and chapter carries two
// extra, unrelated crumbs — the project collection and the marker itself —
// ahead of "exhibition › theme". Bounded here to the marker, once, so every
// consumer (the specs' `route`, EssayView's own breadcrumb) sees only
// exhibition-relative ancestry.
//
// Returns `null` for a node that is not under the marker at all — the
// cross-link scans below need to tell that apart from "this node IS the
// exhibition" (an empty, but real, ancestry).
function ancestryWithin(id) {
  const rootId = rawTree.root.value?.id
  if (!rootId || id === rootId) return null
  const all = rawTree.parents(id)
  const index = all.findIndex((node) => node.id === rootId)
  return index === -1 ? null : all.slice(index + 1)
}

/**
 * The tree the six exhibition pages read: `children`, `itemsUnder`,
 * `containing`, `walk`, `previous`/`next` unchanged from `useCollectionTree`;
 * `parents`/`breadcrumb` bounded to this tree's own root (see above), which
 * is what makes them safe to hand to `EssayView` as a pre-built `tree`.
 */
export const exhibitionTree = {
  ...rawTree,
  parents: (id) => ancestryWithin(id) ?? [],
  breadcrumb: (id) => {
    const node = rawTree.byId.value.get(id)
    const ancestry = ancestryWithin(id)
    if (!node) return []
    return ancestry ? [...ancestry, node] : [node]
  },
}

/** The exhibitions themselves: the tree root's own children. */
export const exhibitionList = computed(() => {
  const root = exhibitionTree.root.value
  return root ? exhibitionTree.children(root.id) : []
})

/**
 * A node's own page address, from its position in the exhibition tree
 * rather than from route params a caller would otherwise have to thread
 * through: an exhibition (no ancestors within this tree) goes to its
 * splash, a theme (one ancestor) to its theme page, a chapter (two
 * ancestors) to its chapter page. `null` for a node this tree does not
 * carry at all.
 */
export function exhibitionNodeRoute(node) {
  const ancestry = ancestryWithin(node.id)
  if (!ancestry) return null
  if (ancestry.length === 0) return { name: 'exhibition', params: { exhibitionId: node.id } }
  if (ancestry.length === 1) {
    return { name: 'exhibition-theme', params: { exhibitionId: ancestry[0].id, themeId: node.id } }
  }
  return {
    name: 'exhibition-chapter',
    params: { exhibitionId: ancestry[0].id, themeId: ancestry[1].id, chapterId: node.id },
  }
}

/**
 * The ancestry of `node` within the exhibition tree, or `null` when it is
 * not under the exhibitions-root marker at all (the reverse-lookup helpers
 * below scan every collection an item is attached to, exhibition-related or
 * not, and need to tell the two apart).
 */
export function exhibitionAncestry(node) {
  return ancestryWithin(node.id)
}

/**
 * True when `id` is a real node of this tree — the root itself, or reachable
 * through `children()`'s own type filtering (exhibition → theme → chapter).
 * `byId`/`parents` walk the raw `parent_id` chain regardless of type, so a
 * National Context collection (#54, purpose "national-context") — sitting
 * next to a theme under its exhibition but never a `children()` result —
 * resolves through those two just as a real theme or chapter would; this is
 * the check that tells the two apart. Used by the theme and chapter routes
 * so such an id renders not-found instead of an essay page headed by the
 * collection's internal name.
 */
export function inExhibitionTree(id) {
  const root = rawTree.root.value
  if (!root) return false
  return id === root.id || rawTree.walk().some((node) => node.id === id)
}
