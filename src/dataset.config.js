import { languageLabels, offeredLanguages, sectionMeta, useDataPackage } from '@metanull/viewer-core'
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

// Every route says which section it belongs to, and the shell reads that
// (viewer-core's `useSection`) for the active menu entry rather than
// deriving it from the path. No entity is common to every route here (the
// entrance pages before a results page load none at all), so there is no
// `chrome` to declare.
const meta = sectionMeta()

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@metanull/sharinghistory-data',

  siteName: manifest.site?.names?.en ?? 'Sharing History',

  // The absolute origin this build is deployed at (base path included, no
  // trailing slash) — the GitHub Pages address until the domain is decided,
  // matching the base path vite.config.js's BASE_PATH sets. Read by
  // sourceUrl() for the sheet's citation permalink; changes with the domain.
  site: { origin: 'https://metanull.github.io/sharinghistory' },

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

  // The menu SiteShell (@metanull/viewer-layout/components) reads directly:
  // legacy's own top-level sections, in its own order — this site leads with
  // the exhibitions and adds the two historical sections. Each `section`
  // matches the route meta below, so the active entry follows `useSection()`
  // rather than the path; `label` is an entry name, resolved by the shell
  // itself (only there is the installed catalogue available). The language
  // names come from the data package, not from a translator.
  navigation: {
    languages: languageLabels(languages),
    links: [
      { section: 'home', label: 'core.nav.home', to: { name: 'home' } },
      { section: 'exhibitions', label: 'sharinghistory.nav.exhibitions', to: { name: 'exhibitions' } },
      { section: 'permanent-collection', label: 'sharinghistory.nav.permanentCollection', to: { name: 'permanent-collection' } },
      { section: 'database', label: 'sharinghistory.nav.database', to: { name: 'database' } },
      { section: 'timeline', label: 'sharinghistory.nav.timeline', to: { name: 'timeline' } },
      { section: 'historical-background', label: 'sharinghistory.nav.historicalBackground', to: { name: 'historical-background' } },
      { section: 'historical-profiles', label: 'sharinghistory.nav.historicalProfiles', to: { name: 'historical-profiles' } },
      { section: 'partners', label: 'sharinghistory.nav.partners', to: { name: 'partners' } },
    ],
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
      meta: meta('home', 'items'),
    },
    {
      path: '/permanent-collection',
      name: 'permanent-collection',
      component: () => import('./views/PcEntrance.vue'),
      meta: meta('permanent-collection', 'items', 'countries', 'partners', 'collections'),
    },
    {
      path: '/permanent-collection/results',
      name: 'permanent-collection-results',
      component: () => import('./views/PcList.vue'),
      meta: meta('permanent-collection', 'items', 'countries', 'partners', 'collections'),
    },
    {
      path: '/database',
      name: 'database',
      component: () => import('./views/Database.vue'),
      meta: meta('database'),
    },
    {
      path: '/database/results',
      name: 'database-results',
      component: () => import('./views/DatabaseResults.vue'),
      meta: meta('database', 'items', 'countries'),
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('./views/TimelineEntrance.vue'),
      meta: meta('timeline', 'timelines', 'timeline_events', 'countries', 'collections'),
    },
    {
      path: '/timeline/results',
      name: 'timeline-results',
      component: () => import('./views/TimelineResults.vue'),
      meta: meta('timeline', 'timelines', 'timeline_events', 'countries', 'collections', 'items'),
    },
    {
      // Decision D1: the legacy hcr_gallery.php gallery of Permanent
      // Collection objects for one country and period, reached from the
      // timeline results' "See gallery" cross-link.
      path: '/timeline/gallery',
      name: 'timeline-gallery',
      component: () => import('./views/TimelineGallery.vue'),
      meta: meta('timeline', 'items', 'countries'),
    },
    {
      path: '/partners',
      name: 'partners',
      component: () => import('./views/PartnersEntrance.vue'),
      meta: meta('partners'),
    },
    {
      path: '/partners/results',
      name: 'partners-results',
      component: () => import('./views/PartnersResults.vue'),
      meta: meta('partners', 'partners', 'countries'),
    },
    {
      path: '/partner/:id',
      name: 'partner',
      component: () => import('./views/PartnerDetail.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id) }),
      meta: meta('partners', 'partners', 'items', 'countries'),
    },
    {
      path: '/exhibitions',
      name: 'exhibitions',
      component: () => import('./views/ExhibitionsEntrance.vue'),
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId',
      name: 'exhibition',
      component: () => import('./views/ExhibitionSplash.vue'),
      meta: meta('exhibitions', 'collections', 'timelines'),
    },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      name: 'exhibition-introduction',
      component: () => import('./views/ExhibitionIntroduction.vue'),
      meta: meta('exhibitions', 'collections', 'items', 'partners', 'timelines'),
    },
    {
      path: '/exhibitions/:exhibitionId/further-reading',
      name: 'exhibition-further-reading',
      component: () => import('./views/ExhibitionFurtherReading.vue'),
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      name: 'exhibition-theme',
      component: () => import('./views/ExhibitionTheme.vue'),
      meta: meta('exhibitions', 'collections', 'items', 'partners'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId/chapter/:chapterId',
      name: 'exhibition-chapter',
      component: () => import('./views/ExhibitionChapter.vue'),
      meta: meta('exhibitions', 'collections', 'items', 'partners'),
    },
    {
      path: '/historical-background',
      name: 'historical-background',
      component: () => import('./views/HistoricalBackground.vue'),
      meta: meta('historical-background', 'collections', 'countries'),
    },
    {
      path: '/historical-profiles',
      name: 'historical-profiles',
      component: () => import('./views/HistoricalProfiles.vue'),
      meta: meta('historical-profiles', 'collections', 'countries'),
    },
    {
      // `:pageId` optional: a bare record address (and a bookmarked
      // `?page=N` one, legacy's own query pagination) resolves onto the
      // record's first page's own explicit address —
      // HistoricalBackgroundCountry.vue does that canonicalisation, once,
      // rather than the route itself, which cannot read the collection tree
      // to know which page is first.
      path: '/historical-profiles/:recordId/:pageId?',
      name: 'historical-profile',
      component: () => import('./views/HistoricalBackgroundCountry.vue'),
      props: (route) => ({
        recordId: decodeURIComponent(route.params.recordId),
        pageId: route.params.pageId ? decodeURIComponent(route.params.pageId) : null,
      }),
      meta: meta('historical-profiles', 'collections', 'items', 'countries'),
    },
    {
      path: '/item/:id',
      name: 'item',
      component: () => import('./views/ItemDetail.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id) }),
      // Reached from the permanent collection, the timeline and exhibitions as
      // well as the database, but the nav's own generic search over items is
      // Database, so a record opened from any of those still highlights it.
      meta: meta('database', 'items', 'partners', 'countries', 'collections'),
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
