import languagesData from '@inventory-data/languages.json'
import SiteShell from './SiteShell.vue'
import { OFFERED_LANGUAGES } from './languages.js'

// Content languages: what the site chooses to offer (languages.js), narrowed
// to what the installed data package can actually serve — the languages with
// an items.<lang>.json file. Never derive this from manifest.languages, which
// declares eighteen languages, most without a translation file of any kind;
// offering one of those would put a language in the switcher whose item sheets
// are all English, the legacy viewer's bug.
//
// Entities not covered in the active language fall back per entity to English,
// so a page is never blank. The interface chrome falls back the same way, from
// whatever the dictionary has for the language down to English.
//
// The order is `languages.js`'s own and is only the order of the switcher: the
// site used to open at `languages[0]`, and viewer-core negotiates the opening
// language now — an explicit `?lang=`, then the visitor's remembered choice,
// then their browser, then English.
const itemTranslationFiles = import.meta.glob('@inventory-data/translations/items.*.json')
const itemLangs = new Set(
  Object.keys(itemTranslationFiles)
    .map((path) => path.match(/items\.([a-z]{2})\.json$/)?.[1])
    .filter(Boolean),
)
const languages = OFFERED_LANGUAGES.filter((code) => itemLangs.has(code))

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

  // The site language, which doubles as the content language; 'en' first so it
  // is the initial one.
  languages,

  shell: SiteShell,

  // Only what is not a text. The menu labels and the footer line are texts, so
  // they are built in SiteShell.vue where the catalogue is installed; the
  // language names below come from the data package, not from a translator.
  navigation: {
    languages: languages.map((code) => ({ code, label: languageLabel(code) })),
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
