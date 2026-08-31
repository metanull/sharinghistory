import languagesData from '@inventory-data/languages.json'
import SiteShell from './SiteShell.vue'

// Content languages — the items-driven rule (#7): the site offers exactly the
// languages the item records are translated into, derived from the
// items.<lang>.json files present in the installed data package. Never derive
// this from manifest.languages: it declares eighteen languages, most of which
// have no translation file of any kind. Offering one of those would put a
// language in the switcher whose item sheets are all English — the legacy
// viewer's bug.
//
// The cost is real and worth naming: some entities are translated into
// languages the items are not, so that text is not reachable from the
// switcher. The alternative is worse — a switcher full of languages that
// change almost nothing on the page a visitor is most often looking at.
// Entities not covered in the active language fall back per entity to English.
// English first, the rest sorted.
const itemTranslationFiles = import.meta.glob('@inventory-data/translations/items.*.json')
const itemLangs = new Set(
  Object.keys(itemTranslationFiles)
    .map((path) => path.match(/items\.([a-z]{2})\.json$/)?.[1])
    .filter(Boolean),
)
const languages = [
  ...(itemLangs.has('en') ? ['en'] : []),
  ...[...itemLangs].filter((l) => l !== 'en').sort(),
]

// Native display name for the language switcher, from the data package's
// language table (falls back to the English name, then the raw code).
function languageLabel(code) {
  const row = languagesData.find((l) => l.code === code)
  return row?.names?.[code] ?? row?.names?.en ?? code.toUpperCase()
}

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/sharinghistory-data',

  siteName: 'Sharing History',

  // Every page is a website-specific view (below) reimplementing the legacy
  // site's own pages. The generic entity list/detail pages viewer-core can
  // auto-generate are switched off: they publish the data package's shape
  // rather than the site's, and the two disagree — an exhibition is a
  // Collection here, and the legacy site never had a "collections" index.
  features: {
    entities: [],
  },

  // vue-i18n locale doubles as the content language; 'en' first so it is the
  // initial locale.
  languages,

  shell: SiteShell,
  navigation: {
    // The legacy site's own top-level sections, in its own order.
    navLinks: [
      { label: 'Home', href: '#/' },
      { label: 'Exhibitions', href: '#/exhibitions' },
      { label: 'Permanent Collection', href: '#/permanent-collection' },
      { label: 'Database', href: '#/database' },
      { label: 'Timeline', href: '#/timeline' },
      { label: 'Historical Background', href: '#/historical-background' },
      { label: 'Historical Profiles', href: '#/historical-profiles' },
      { label: 'Partners', href: '#/partners' },
    ],
    languages: languages.map((code) => ({ code, label: languageLabel(code) })),
    footerText: '© Museum With No Frontiers (MWNF) 2004 – 2026',
  },

  // The full legacy route map, one view per page. The 'home' name replaces
  // viewer-core's generic home route. Exhibitions are three levels deep here
  // — exhibition → theme → chapter — which is what separates this site from
  // Islamic Art and Baroque Art, and each level is its own page in legacy.
  extraViews: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue') },
    { path: '/permanent-collection', component: () => import('./views/PcEntrance.vue') },
    { path: '/permanent-collection/results', component: () => import('./views/PcList.vue') },
    { path: '/database', component: () => import('./views/Database.vue') },
    { path: '/database/results', component: () => import('./views/DatabaseResults.vue') },
    { path: '/timeline', component: () => import('./views/TimelineEntrance.vue') },
    { path: '/timeline/results', component: () => import('./views/TimelineResults.vue') },
    { path: '/partners', component: () => import('./views/PartnersEntrance.vue') },
    { path: '/partners/results', component: () => import('./views/PartnersResults.vue') },
    { path: '/partner/:id', component: () => import('./views/PartnerDetail.vue') },
    { path: '/exhibitions', component: () => import('./views/ExhibitionsEntrance.vue') },
    { path: '/exhibitions/:exhibitionId', component: () => import('./views/ExhibitionSplash.vue') },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      component: () => import('./views/ExhibitionIntroduction.vue'),
    },
    {
      path: '/exhibitions/:exhibitionId/further-reading',
      component: () => import('./views/ExhibitionFurtherReading.vue'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      component: () => import('./views/ExhibitionTheme.vue'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId/chapter/:chapterId',
      component: () => import('./views/ExhibitionChapter.vue'),
    },
    { path: '/historical-background', component: () => import('./views/HistoricalBackground.vue') },
    { path: '/historical-profiles', component: () => import('./views/HistoricalProfiles.vue') },
    {
      path: '/historical-profiles/:recordId',
      component: () => import('./views/HistoricalBackgroundCountry.vue'),
    },
    // Country profiles used to live under /historical-background/:id; keep
    // those URLs working rather than breaking links already handed out.
    {
      path: '/historical-background/:recordId',
      redirect: (to) => `/historical-profiles/${to.params.recordId}`,
    },
    { path: '/item/:id', component: () => import('./views/ItemDetail.vue') },
  ],
}
