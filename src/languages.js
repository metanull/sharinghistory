/**
 * The site languages this website offers, in the order the switcher shows
 * them.
 *
 * This is the site's own decision and deliberately narrower than what the data
 * package declares. The package ships item translations in French as well, but
 * they cover a small minority of the catalogue: a visitor choosing French would
 * get French on a handful of item sheets and English on all the rest, which is
 * exactly the experience the offered-languages rule exists to prevent. The
 * legacy site's own chrome was English-only, so nothing is lost by matching it.
 *
 * This is the site language only. A record carrying more languages than this
 * still offers them on its own sheet, from a toggle that changes nothing else.
 *
 * A single entry is not a defect: `@metanull/viewer-layout` renders the
 * language switcher only when there is more than one language, so the site
 * simply has no switcher until this list grows.
 *
 * To offer another language, add its code here. `dataset.config.js` passes the
 * list to viewer-core's `offeredLanguages`, which keeps only the codes the
 * package declares for this site and the item translations actually carry, so
 * a code added before the data exists is dropped rather than shipped as a
 * switcher entry that renders English.
 */
export const OFFERED_LANGUAGES = ['en']
