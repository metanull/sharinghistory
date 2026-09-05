import { describe, expect, it } from 'vitest'
import { createViewer, mergeMessages } from '@metanull/viewer-core'
import { checkOfferedLanguages } from '@metanull/viewer-core/testing'
import { catalogues as sharedTexts } from '@metanull/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'
import { OFFERED_LANGUAGES } from '../src/languages.js'
import { useInventoryData } from '../src/composables/useInventoryData.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this website's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

async function mountSite() {
  window.location.hash = '#/'
  const app = createViewer({ ...config, messages })
  const host = document.createElement('div')
  document.body.appendChild(host)
  app.mount(host)
  await app.config.globalProperties.$router.isReady()
  return { app, host }
}

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mountSite()

    expect(host.textContent).toContain(config.siteName)
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
  }, 20000)

  it('declares every route by name, and leaves the catch-all to the router', () => {
    const names = config.extraViews.map((r) => r.name)
    for (const name of [
      'home', 'permanent-collection', 'permanent-collection-results', 'database',
      'database-results', 'timeline', 'timeline-results', 'partners', 'partners-results',
      'partner', 'exhibitions', 'exhibition', 'exhibition-introduction',
      'exhibition-further-reading', 'exhibition-theme', 'exhibition-chapter',
      'historical-background', 'historical-profiles', 'historical-profile', 'item',
    ]) {
      expect(names).toContain(name)
    }
    expect(config.extraViews.every((r) => r.name)).toBe(true)
    expect(config.extraViews.some((r) => r.path.includes('pathMatch'))).toBe(false)
  })

  it('declares the entities every route reads', () => {
    // A view that renders records against `null` is the failure this prevents:
    // the router loads what a route names before the view is created.
    for (const route of config.extraViews) {
      expect(Array.isArray(route.meta?.entities), route.name).toBe(true)
    }
    expect(config.extraViews.find((r) => r.name === 'item').meta.entities).toContain('items')
  })

  it('keeps the old country-profile addresses working', () => {
    // Those links were handed out before the section was renamed. A legacy
    // route resolves one onto the canonical route rather than 404ing; testing
    // `resolve` directly avoids driving a second router over the same hash.
    const legacy = config.legacyRoutes.find(
      (r) => r.path === '/historical-background/:recordId',
    )
    expect(legacy).toBeDefined()
    expect(legacy.resolve({ recordId: 'abc' })).toEqual({
      name: 'historical-profile',
      params: { recordId: 'abc' },
    })
  })

  // The record lookups are viewer-core's shared indexes now, and a Map is not
  // an object: `byId(...)[id]` reads as undefined rather than failing, so a
  // page would simply render nothing. This is where that shows.
  it('resolves a record through the shared index', async () => {
    const { loadEntities } = await import('@metanull/viewer-core')
    const { itemById } = useInventoryData()
    const [items] = await loadEntities(['items'])
    expect(itemById.value).toBeInstanceOf(Map)
    expect(itemById.value.get(items[0].id)).toBe(items[0])
  }, 20000)

  it('offers only what the site declares and the package can serve', () => {
    expect(checkOfferedLanguages(config)).toEqual([])
    // This site narrows the package's declared set to its own list, which is
    // the point of languages.js: a language whose item sheets would all read
    // English is worse than no switcher at all.
    for (const code of config.languages) {
      expect(OFFERED_LANGUAGES).toContain(code)
    }
    expect(config.languages).toContain('en')
    const switcher = config.navigation.languages
    expect(switcher.map((l) => l.code)).toEqual(config.languages)
    expect(switcher.every((l) => Boolean(l.label))).toBe(true)
  })

  it('publishes no generic entity pages', () => {
    // Every page is a hand-built view. Leaving `entities` at the package
    // default would additionally publish one list and one detail page per
    // exported entity — routes the legacy site never had, exposing the data
    // package's shape (collections, timelines) rather than the site's.
    expect(config.features.entities).toEqual([])
  })

  // The chrome is now two layers, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. These assert the
  // rendered page, not the files, so a bundle that installs but never reaches
  // the components fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite()

    const text = host.textContent
    // From viewer-i18n: the layout's skip link and the menu's first entry.
    expect(text).toContain('Skip to content')
    expect(text).toContain('Home')
    // From locales/en.json: the header lockup, a menu entry, the footer.
    expect(text).toContain('Museum With No Frontiers')
    expect(text).toContain('Permanent Collection')
    expect(text).toContain('Welcome to Sharing History')
    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one.
    expect(text).not.toMatch(/\b(sharinghistory|core|layout)\.[a-z]/i)

    app.unmount()
  }, 20000)
})
