import { languageLabels, offeredLanguages, useDataPackage } from '@metanull/viewer-core'
import SiteShell from './SiteShell.vue'
import { OFFERED_LANGUAGES } from './languages.js'

// The whole declaration of this website. Before it mounts, the website reads
// nothing from its package but the manifest: the languages it offers, their
// labels and its name come from `manifest.site`, and every record is loaded
// by the route that reads it.

const { manifest } = useDataPackage()

// What this site chooses to offer (languages.js), kept where the package
// declares the language for the site AND the item translations actually carry
// it. A record may carry more than the site offers — the item sheet's own
// switcher reads those, without touching the site language.
const languages = offeredLanguages({ declared: OFFERED_LANGUAGES })

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/sharinghistory-data',

  siteName: manifest.site?.names?.en ?? 'Sharing History',

  // Every page is a website-specific view (below) reimplementing the legacy
  // site's own pages. The generic entity list/detail pages viewer-core can
  // auto-generate are switched off: they publish the data package's shape
  // rather than the site's, and the two disagree — an exhibition is a
  // Collection here, and the legacy site never had a "collections" index.
  features: {
    entities: [],
  },

  languages,

  shell: SiteShell,

  // Only what is not a text. The menu labels and the footer line are texts, so
  // they are built in SiteShell.vue where the catalogue is installed; the
  // language names below come from the data package, not from a translator.
  navigation: {
    languages: languageLabels(languages),
  },

  // The route map: every route named, kebab-case sections, and the page and
  // every filter in the query. Each route declares the entities its view
  // reads, so the router loads them before the view is created and no page
  // renders against records that are not there yet.
  //
  // The 'home' name replaces viewer-core's generic home route. Exhibitions are
  // three levels deep here — exhibition → theme → chapter — which is what
  // separates this site from Islamic Art and Baroque Art, and each level is
  // its own page in legacy.
  extraViews: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/Home.vue'),
      meta: { entities: ['items'] },
    },
    {
      path: '/permanent-collection',
      name: 'permanent-collection',
      component: () => import('./views/PcEntrance.vue'),
      meta: { entities: ['items', 'countries', 'partners', 'collections'] },
    },
    {
      path: '/permanent-collection/results',
      name: 'permanent-collection-results',
      component: () => import('./views/PcList.vue'),
      meta: { entities: ['items', 'countries', 'partners', 'collections'] },
    },
    {
      path: '/database',
      name: 'database',
      component: () => import('./views/Database.vue'),
      meta: { entities: [] },
    },
    {
      path: '/database/results',
      name: 'database-results',
      component: () => import('./views/DatabaseResults.vue'),
      meta: { entities: ['items', 'countries'] },
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('./views/TimelineEntrance.vue'),
      meta: { entities: ['timelines', 'timeline_events', 'countries', 'collections'] },
    },
    {
      path: '/timeline/results',
      name: 'timeline-results',
      component: () => import('./views/TimelineResults.vue'),
      meta: { entities: ['timelines', 'timeline_events', 'countries', 'collections', 'items'] },
    },
    {
      path: '/partners',
      name: 'partners',
      component: () => import('./views/PartnersEntrance.vue'),
      meta: { entities: [] },
    },
    {
      path: '/partners/results',
      name: 'partners-results',
      component: () => import('./views/PartnersResults.vue'),
      meta: { entities: ['partners', 'countries'] },
    },
    {
      path: '/partner/:id',
      name: 'partner',
      component: () => import('./views/PartnerDetail.vue'),
      meta: { entities: ['partners', 'items', 'countries'] },
    },
    {
      path: '/exhibitions',
      name: 'exhibitions',
      component: () => import('./views/ExhibitionsEntrance.vue'),
      meta: { entities: ['collections'] },
    },
    {
      path: '/exhibitions/:exhibitionId',
      name: 'exhibition',
      component: () => import('./views/ExhibitionSplash.vue'),
      meta: { entities: ['collections', 'timelines'] },
    },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      name: 'exhibition-introduction',
      component: () => import('./views/ExhibitionIntroduction.vue'),
      meta: { entities: ['collections', 'items', 'partners', 'timelines'] },
    },
    {
      path: '/exhibitions/:exhibitionId/further-reading',
      name: 'exhibition-further-reading',
      component: () => import('./views/ExhibitionFurtherReading.vue'),
      meta: { entities: ['collections'] },
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      name: 'exhibition-theme',
      component: () => import('./views/ExhibitionTheme.vue'),
      meta: { entities: ['collections', 'items', 'partners'] },
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId/chapter/:chapterId',
      name: 'exhibition-chapter',
      component: () => import('./views/ExhibitionChapter.vue'),
      meta: { entities: ['collections', 'items', 'partners'] },
    },
    {
      path: '/historical-background',
      name: 'historical-background',
      component: () => import('./views/HistoricalBackground.vue'),
      meta: { entities: ['collections', 'countries'] },
    },
    {
      path: '/historical-profiles',
      name: 'historical-profiles',
      component: () => import('./views/HistoricalProfiles.vue'),
      meta: { entities: ['collections', 'countries'] },
    },
    {
      path: '/historical-profiles/:recordId',
      name: 'historical-profile',
      component: () => import('./views/HistoricalBackgroundCountry.vue'),
      meta: { entities: ['collections', 'items', 'countries'] },
    },
    {
      path: '/item/:id',
      name: 'item',
      component: () => import('./views/ItemDetail.vue'),
      meta: { entities: ['items', 'partners', 'countries', 'collections'] },
    },
  ],

  // Country profiles were published under /historical-background/:id before
  // the profiles got a section of their own. Those addresses are already
  // handed out, so each one still resolves — onto the canonical route.
  legacyRoutes: [
    {
      path: '/historical-background/:recordId',
      resolve: (params) => ({
        name: 'historical-profile',
        params: { recordId: params.recordId },
      }),
    },
  ],
}
