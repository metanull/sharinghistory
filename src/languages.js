/**
 * The content languages this website offers, in the order the switcher shows
 * them. English first — vue-i18n boots at the first entry.
 *
 * This is the site's own decision and deliberately narrower than what the data
 * package carries. The package ships item translations in French as well, but
 * they cover a small minority of the catalogue: a visitor choosing French would
 * get French on a handful of item sheets and English on all the rest, which is
 * exactly the experience the items-driven rule (#7) exists to prevent. The
 * legacy site's own chrome was English-only, so nothing is lost by matching it.
 *
 * A single entry is not a defect: `@metanull/viewer-layout` renders the
 * language switcher only when there is more than one language, so the site
 * simply has no switcher until this list grows.
 *
 * To offer another language, add its code here. Both readers below intersect
 * this list with the translation files the installed package actually has, so a
 * code added before the data exists is ignored rather than breaking the site.
 */
export const OFFERED_LANGUAGES = ['en']
