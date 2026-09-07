import { renderInline } from '@metanull/viewer-core'
import { exhibitionNodeRoute, exhibitionTree } from './exhibitions.js'
import { useInventoryData } from './useInventoryData.js'

// The introduction, theme and chapter pages as `EssayView` specs, over the
// exhibition tree (exhibitions.js): what each declares is only what makes
// it different from the plain default — quote/body fields, the item panel,
// previous/next. The pieces this site has that the default panel does not
// carry (justifications, see-also, further reading, the theme's own
// chapter list) are the six views' own slot templates, not this file: a
// spec function only ever returns data, never markup.

const { labelOf } = useInventoryData()

// SH's item grid is a node's `items[]` entries themselves, each pairing a
// bare item id with a per-language caption/justification pair and, on a
// chapter, extra "detail" images — read once per selected item, by id,
// rather than re-filtered on every call.
function entryFor(node, itemId) {
  return node?.items?.find((entry) => entry.id === itemId) ?? null
}

function localizedCaption(entry, language) {
  return entry?.caption?.[language] ?? entry?.caption?.en ?? {}
}

/** `items.caption`: the entry's own name overrides the item's translation. */
function itemCaption(item, node, { language }) {
  const caption = localizedCaption(entryFor(node, item.id), language)
  return caption.name ? { name: renderInline(String(caption.name)) } : {}
}

/** `panel.fields`: date, location and holder, unlabelled — legacy's plain lines. */
function itemFields(item, node, { language, tr }) {
  const caption = localizedCaption(entryFor(node, item.id), language)
  const text = tr('items', item.id) ?? {}
  const fields = []
  const date = caption.date ?? text.dates
  const location = caption.location ?? text.location
  const museum = caption.museum ?? (item.partner_id ? labelOf('partners', item.partner_id) : '')
  if (date) fields.push({ value: date })
  if (location) fields.push({ value: renderInline(String(location)) })
  if (museum) fields.push({ value: museum })
  return fields
}

/**
 * `panel.variants` (chapter only): a monument's extra "detail" photographs,
 * beside the item's own primary image. `EssayView`'s gallery browses these
 * as more images of the same panel, not as their own name/date/location —
 * legacy's per-detail caption switch has no equivalent spec key or slot; see
 * the pull request description.
 */
function itemVariants(item, node) {
  const entry = entryFor(node, item.id)
  return (entry?.details ?? [])
    .filter((variant) => variant.image_url)
    .map((variant) => ({ url: variant.image_url, alt: '' }))
}

/** The `justifications` slot content (chapter only): curator's, then partner's. */
export function curatorJustification(item, node, language) {
  if (!item) return ''
  const entry = entryFor(node, item.id)
  const caption = localizedCaption(entry, language)
  const just = entry?.justifications?.[language] ?? entry?.justifications?.en ?? null
  return just?.curator ?? caption.justification ?? ''
}
export function partnerJustification(item, node, language) {
  if (!item) return ''
  const entry = entryFor(node, item.id)
  const just = entry?.justifications?.[language] ?? entry?.justifications?.en ?? null
  return just?.partner ?? ''
}

const itemRoute = (item) => ({ name: 'item', params: { id: item.id } })

// "About the Exhibition" — items attached directly to the exhibition
// collection, not to any theme/chapter (legacy exh_introduction.php). No
// `panel`: `EssayView` falls back to the plain item grid the same way the
// original page's own item cards did, and no `navigation`: legacy never
// moved between exhibitions from here.
export const exhibitionIntroductionSpec = {
  tree: exhibitionTree,
  entity: 'items',
  route: exhibitionNodeRoute,
  heading: ({ text, t }) => (text.extra?.intro_header ? renderInline(String(text.extra.intro_header)) : t('exhibition.nav.introduction')),
  quote: false,
  body: 'description',
  panel: false,
  items: { caption: itemCaption, route: itemRoute },
  navigation: false,
}

// The theme page: quote + prose, the theme's own item panel (a plain
// selector, no `panel.variants` — only a chapter's items carry detail
// photographs), the chapter list (`after-body`, in the six views' own
// template: `EssayView`'s `tabs` renders the CURRENT node's siblings — the
// exhibition's other themes — not its children, so it cannot express "this
// theme's chapters"; see the pull request description).
export const exhibitionThemeSpec = {
  tree: exhibitionTree,
  entity: 'items',
  route: exhibitionNodeRoute,
  quote: 'quote',
  body: 'description',
  panel: { fields: itemFields },
  items: { caption: itemCaption, route: itemRoute },
  navigation: false,
}

// The chapter page: the quotation and narrative, the item panel with its
// detail photographs, the curator/partner justifications (`justifications`
// slot) and the see-also / further-reading blocks (`after-body`), both read
// straight off the slot context's `text.extra` in the six views' own
// template. `navigation: 'tree'` (decision D2) walks the tree's own
// depth-first sequence, which is what crosses from a theme's last chapter
// into its next sibling theme for free — legacy's own behaviour
// (theme_items.php, subtheme_items.php).
export const exhibitionChapterSpec = {
  tree: exhibitionTree,
  entity: 'items',
  route: exhibitionNodeRoute,
  quote: 'quote',
  body: 'description',
  panel: { variants: itemVariants, fields: itemFields },
  items: { caption: itemCaption, route: itemRoute },
  navigation: 'tree',
}

/**
 * The "Related Content" box legacy's exhibition homepage, introduction and
 * theme pages all carry (exh_items.php / exh_introduction.php): the
 * Political Context timeline always, this exhibition's own thematic
 * timeline and Further Reading only when the package has them. Not a
 * composed view's own concept — rendered through `AppHyperlinks` in each
 * page's template, from this plain link list.
 */
export function relatedContentLinks({ exhibitionId, hasThematicTimeline, hasFurtherReading, t }) {
  const links = [
    { label: t('sharinghistory.related.politicalContextTimeline'), href: '#/timeline/results?exhibition=pc' },
  ]
  if (hasThematicTimeline) {
    links.push({
      label: t('sharinghistory.related.thematicTimeline'),
      href: `#/timeline/results?exhibition=${encodeURIComponent(exhibitionId)}`,
    })
  }
  links.push({
    label: t('sharinghistory.related.seeGalleryForTheme'),
    href: `#/permanent-collection/results?exhibition=${encodeURIComponent(exhibitionId)}`,
  })
  if (hasFurtherReading) {
    links.push({
      label: t('exhibition.relatedCategory.furtherReading'),
      href: `#/exhibitions/${encodeURIComponent(exhibitionId)}/further-reading`,
    })
  }
  return links
}

/** Further reading (`LinkListView`): one group, the exhibition's own bibliography. */
export function furtherReadingSpec(exhibition) {
  return {
    title: 'exhibition.relatedCategory.furtherReading',
    empty: 'exhibition.related.notAvailable',
    back: exhibition ? { label: 'sharinghistory.exhibition.backTo', to: { name: 'exhibition', params: { exhibitionId: exhibition.id } } } : false,
    groups: () => [{ links: bibliographyLinks(exhibition) }],
  }
}

// Legacy bibliography.php lists entries alphabetically, ignoring the link
// table's own sort_order. The importer injects the same language-keyed map
// into every translation's extra.bibliography, so the English record
// already carries every language. `LinkListView` interpolates a link's
// `label` as plain text — it has no way to render the Markdown emphasis a
// citation carries (an italicised title) the way the page's own renderer
// did, so the label is the stripped text, not the rendered HTML; and an
// entry is not a navigational link at all, so it carries neither `href`
// nor `to` (`SmartLink` renders a plain, inert anchor for either omitted —
// see the pull request description).
function bibliographyLinks(exhibition) {
  if (!exhibition) return []
  const { mdStrip, tr } = useInventoryData()
  const text = tr('collections', exhibition.id) ?? {}
  const bibliography = text.extra?.bibliography ?? {}
  const langs = Object.keys(bibliography).filter((lang) => bibliography[lang]?.length)
  if (!langs.length) return []
  const lang = langs.includes('en') ? 'en' : langs[0]
  return [...(bibliography[lang] ?? [])]
    .map((entry) => mdStrip(entry))
    .sort((a, b) => a.localeCompare(b))
    .map((label) => ({ label }))
}
