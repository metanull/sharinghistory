import { describe, expect, it, vi } from 'vitest'
import { createViewer, loadEntities, mergeMessages, useDataPackage } from '@metanull/viewer-core'
import { checkOfferedLanguages } from '@metanull/viewer-core/testing'
import { catalogues as sharedTexts } from '@metanull/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import collectionTexts from '@metanull/sharinghistory-data/translations/collections.en.json'
import countryTexts from '@metanull/sharinghistory-data/translations/countries.en.json'
import { collectionTitle, itemIdsUnder } from '../src/composables/catalogue.js'
import config from '../src/dataset.config.js'
import { exhibitionTree } from '../src/composables/exhibitions.js'
import { historicalProfilesTree } from '../src/composables/history.js'
import { OFFERED_LANGUAGES } from '../src/languages.js'
import { useInventoryData } from '../src/composables/useInventoryData.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this website's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

async function mountSite(hash = '#/') {
  window.location.hash = hash
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

    // The site name comes from the package alone, which is the rule. This
    // package's English name is the project's full title with its subtitle,
    // while the lockup renders the short title over a strapline — so the two
    // are not one string, and asserting the page shows `siteName` would only
    // pass once a name was written back into the config. The config carries
    // the manifest; the page carries the lockup.
    const { manifest } = useDataPackage()
    expect(config.siteName).toBe(manifest.site.names.en)
    expect(host.textContent).toContain(ownTexts['sharinghistory.identity.title'])
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
  }, 20000)

  // The Permanent Collection list runs on the platform's composed results
  // view (metanull/viewer-core#50): the rows and the filter panel come from
  // the catalogue spec in composables/catalogue.js, the exhibition cascade
  // and the heading from PcList.vue's slots.
  it('renders the Permanent Collection on the composed results view', async () => {
    const { app, host } = await mountSite('#/permanent-collection/results')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-catalogue')).not.toBeNull()
    expect(host.querySelector('.mwnf-filter')).not.toBeNull()
    expect(host.querySelector('.section-heading').textContent).toContain('Permanent Collection')
    // Legacy's count, in its two halves ("N objects", "M monuments").
    expect(host.querySelectorAll('.mwnf-summary__count').length).toBe(2)
    app.unmount()
  }, 60000)

  // The exhibition cascade in PcList.vue's `filters` slot narrows the list
  // the way the pre-adoption view did: an `exhibition` query narrows to that
  // exhibition's subtree, which is `scope` in the spec rather than a facet
  // (itemIdsUnder, composables/catalogue.js).
  it('narrows the Permanent Collection to one exhibition', async () => {
    const [collections] = await loadEntities(['collections'])
    const marker = collections.find((c) => c.purpose === 'exhibitions-root')
    const exhibition = collections.find((c) => c.parent_id === marker.id)
    const scopedIds = itemIdsUnder(exhibition.id)

    const { app, host } = await mountSite(
      `#/permanent-collection/results?exhibition=${encodeURIComponent(exhibition.id)}`,
    )
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })

    const rowIds = Array.from(host.querySelectorAll('.mwnf-list__row .mwnf-list__link')).map((a) =>
      decodeURIComponent(a.getAttribute('href').split('/').pop()),
    )
    expect(rowIds.length).toBeGreaterThan(0)
    for (const id of rowIds) expect(scopedIds.has(id)).toBe(true)

    app.unmount()
  }, 60000)

  // The theme and chapter pages run on `EssayView`, over the exhibition tree
  // in composables/exhibitions.js (metanull/viewer-layout#34-36,
  // sharinghistory#37/#38). Fixtures are found in the package itself rather
  // than hardcoded: a theme with its own item panel, and a multi-chapter
  // theme with a following sibling theme, to prove the crossing navigation.
  // A theme whose own item grid (not a chapter's) carries at least one item.
  function findThemeWithItems() {
    const root = exhibitionTree.root.value
    for (const exhibition of exhibitionTree.children(root.id)) {
      const theme = exhibitionTree.children(exhibition.id).find((candidate) => candidate.items?.length)
      if (theme) return { exhibition, theme }
    }
    return null
  }

  it('renders the theme page on EssayView, with its own item panel', async () => {
    await loadEntities(['collections'])
    const fixture = findThemeWithItems()
    expect(fixture, 'fixture: a theme with its own items').not.toBeNull()
    const { exhibition, theme } = fixture

    const { app, host } = await mountSite(
      `#/exhibitions/${encodeURIComponent(exhibition.id)}/theme/${encodeURIComponent(theme.id)}`,
    )
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay__panel')).not.toBeNull()
    expect(host.querySelector('.theme-chapters')).not.toBeNull()

    // The view reads the collection's title through the tree's own entity,
    // not through a fallback to the spec's entity. A wrong entity renders
    // the internal_name instead of the translated title.
    const titleEl = host.querySelector('.mwnf-essay__title')
    expect(titleEl).not.toBeNull()
    const expectedTitle = collectionTexts[theme.id]?.title
    expect(titleEl.textContent.trim()).toContain(expectedTitle)
    expect(titleEl.textContent).not.toContain(theme.internal_name)

    // When the collection carries a description, the body must render it.
    if (collectionTexts[theme.id]?.description) {
      const bodyEl = host.querySelector('.mwnf-essay__body, .mwnf-essay__prose')
      expect(bodyEl).not.toBeNull()
      expect(bodyEl.textContent).toBeTruthy()
    }

    app.unmount()
  }, 60000)

  // A chapter whose item grid carries a curator/partner justification pair.
  function findJustifiedChapter() {
    const root = exhibitionTree.root.value
    for (const exhibition of exhibitionTree.children(root.id)) {
      for (const theme of exhibitionTree.children(exhibition.id)) {
        for (const chapter of exhibitionTree.children(theme.id)) {
          const justified = (chapter.items ?? []).some(
            (entry) => entry.justifications && Object.keys(entry.justifications).length,
          )
          if (justified) return { exhibition, theme, chapter }
        }
      }
    }
    return null
  }

  it('renders the chapter page on EssayView, with the justification block where the data has one', async () => {
    await loadEntities(['collections'])
    const fixture = findJustifiedChapter()
    expect(fixture, 'fixture: a chapter with a curator/partner justification').not.toBeNull()

    const { app, host } = await mountSite(
      `#/exhibitions/${encodeURIComponent(fixture.exhibition.id)}/theme/${encodeURIComponent(fixture.theme.id)}/chapter/${encodeURIComponent(fixture.chapter.id)}`,
    )
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay__panel')).not.toBeNull()
    expect(host.querySelector('.chapter-justification')).not.toBeNull()

    // The view reads the collection's title through the tree's own entity,
    // not through a fallback to the spec's entity. A wrong entity renders
    // the internal_name instead of the translated title.
    const titleEl = host.querySelector('.mwnf-essay__title')
    expect(titleEl).not.toBeNull()
    const expectedTitle = collectionTexts[fixture.chapter.id]?.title
    expect(titleEl.textContent.trim()).toContain(expectedTitle)
    expect(titleEl.textContent).not.toContain(fixture.chapter.internal_name)

    // When the collection carries a description, the body must render it.
    if (collectionTexts[fixture.chapter.id]?.description) {
      const bodyEl = host.querySelector('.mwnf-essay__body, .mwnf-essay__prose')
      expect(bodyEl).not.toBeNull()
      expect(bodyEl.textContent).toBeTruthy()
    }

    app.unmount()
  }, 60000)

  it('crosses from a theme\'s last chapter into the next theme', async () => {
    await loadEntities(['collections'])
    const root = exhibitionTree.root.value
    let fixture = null
    for (const exhibition of exhibitionTree.children(root.id)) {
      const themes = exhibitionTree.children(exhibition.id)
      for (let i = 0; i < themes.length - 1; i++) {
        const chapters = exhibitionTree.children(themes[i].id)
        if (chapters.length > 1) {
          fixture = { exhibition, theme: themes[i], nextTheme: themes[i + 1], lastChapter: chapters[chapters.length - 1] }
          break
        }
      }
      if (fixture) break
    }
    expect(fixture, 'fixture: a multi-chapter theme with a following sibling theme').not.toBeNull()

    const { app, host } = await mountSite(
      `#/exhibitions/${encodeURIComponent(fixture.exhibition.id)}/theme/${encodeURIComponent(fixture.theme.id)}/chapter/${encodeURIComponent(fixture.lastChapter.id)}`,
    )
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })
    const nextLink = host.querySelector('.mwnf-essay__nav-link--next')
    expect(nextLink).not.toBeNull()
    expect(decodeURIComponent(nextLink.getAttribute('href'))).toContain(fixture.nextTheme.id)

    app.unmount()
  }, 60000)

  // National Context collections (purpose "national-context", #54) carry no
  // title of their own and sit next to a theme under an exhibition, so a
  // theme address built from one must not fall through to `EssayView`'s
  // own not-found (a missing id) or to an essay headed by the internal name
  // — it is caught earlier, by exhibitionTree membership (exhibitions.js).
  it('renders not-found for a National Context id on the theme route, not an essay page', async () => {
    const [collections] = await loadEntities(['collections'])
    const nc = collections.find((c) => c.purpose === 'national-context')
    expect(nc, 'fixture: a National Context collection').toBeDefined()
    const exhibition = collections.find((c) => c.id === nc.parent_id)
    expect(exhibition, 'fixture: the National Context collection\'s own exhibition').toBeDefined()

    const { app, host } = await mountSite(
      `#/exhibitions/${encodeURIComponent(exhibition.id)}/theme/${encodeURIComponent(nc.id)}`,
    )
    await vi.waitFor(() => expect(host.querySelector('.vc-not-found')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-essay')).toBeNull()
    expect(host.textContent).not.toContain(nc.internal_name)

    app.unmount()
  }, 60000)

  // Legacy always named a National Context collection by its country
  // (class.nationalcontext.inc.php joins mwnf3.countrynames for every list);
  // the importer writes it no title of its own, so `collectionTitle` reads
  // the country instead (composables/catalogue.js).
  it('labels a National Context collection by its country, not its internal name', async () => {
    const [collections] = await loadEntities(['collections'])
    const nc = collections.find((c) => c.purpose === 'national-context')
    expect(nc, 'fixture: a National Context collection').toBeDefined()

    const { loadTranslations } = useDataPackage()
    await loadTranslations('countries', 'en')

    const expectedName = countryTexts[nc.country_id]?.name
    expect(expectedName, 'fixture: the collection\'s country has an English name').toBeTruthy()
    expect(collectionTitle(nc)).toBe(expectedName)
    expect(collectionTitle(nc)).not.toContain(nc.internal_name)
  })

  // The Historical Background/Profiles pages, and the country page, run on
  // `useCollectionTree` (composables/history.js) and `EssayView`
  // (composables/historySpecs.js) — #39, following the exhibition tree's own
  // move in #37/#38.
  it('renders the Historical Background page as its own wrapper, over both subtrees', async () => {
    const { app, host } = await mountSite('#/historical-background')
    await vi.waitFor(() => expect(host.querySelector('.perspective-tabs')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.topic-list')).not.toBeNull()
    expect(host.querySelector('.insight-table')).not.toBeNull()
    app.unmount()
  }, 60000)

  it('renders the Historical Profiles list on SectionCards', async () => {
    const { app, host } = await mountSite('#/historical-profiles')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-cards__card')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-cards--covers')).not.toBeNull()
    app.unmount()
  }, 60000)

  // A country whose record carries more than one page, to prove the
  // `navigation: 'siblings'` crossing that replaces the old `?page=N` query.
  function findProfileWithPages() {
    const root = historicalProfilesTree.root.value
    if (!root) return null
    for (const record of historicalProfilesTree.children(root.id)) {
      if (!record.country_id) continue
      const pages = historicalProfilesTree.children(record.id)
      if (pages.length > 1) return { record, pages }
    }
    return null
  }

  it('renders the country page on EssayView, canonicalising the bare record address onto its first page', async () => {
    await loadEntities(['collections'])
    const fixture = findProfileWithPages()
    expect(fixture, 'fixture: a country record with more than one page').not.toBeNull()

    const { app, host } = await mountSite(`#/historical-profiles/${encodeURIComponent(fixture.record.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })

    // The redirect (`router.replace`) lands on the record's own first page,
    // not a bare address — asserted once it settles, separately from the
    // essay itself, which renders off the same fallback immediately.
    await vi.waitFor(
      () => expect(decodeURIComponent(window.location.hash)).toContain(fixture.pages[0].id),
      { timeout: 20000 },
    )
    expect(decodeURIComponent(window.location.hash)).toContain(fixture.record.id)
    expect(host.querySelector('.mwnf-essay__breadcrumb-link')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay__breadcrumb-link').textContent).not.toBe('')
    expect(host.querySelector('.mwnf-essay__nav-link--next')).not.toBeNull()

    // The view reads the collection's title through the tree's own entity,
    // not through a fallback to the spec's entity. A wrong entity renders
    // the internal_name instead of the translated title.
    const titleEl = host.querySelector('.mwnf-essay__title')
    expect(titleEl).not.toBeNull()
    const expectedTitle = collectionTexts[fixture.pages[0].id]?.title
    expect(titleEl.textContent.trim()).toContain(expectedTitle)
    expect(titleEl.textContent).not.toContain(fixture.pages[0].internal_name)

    // When the collection carries a description, the body must render it.
    if (collectionTexts[fixture.pages[0].id]?.description) {
      const bodyEl = host.querySelector('.mwnf-essay__body, .mwnf-essay__prose')
      expect(bodyEl).not.toBeNull()
      expect(bodyEl.textContent).toBeTruthy()
    }

    app.unmount()
  }, 60000)

  it('renders the exhibition further-reading page on LinkListView', async () => {
    await loadEntities(['collections'])
    const root = exhibitionTree.root.value
    const exhibition = exhibitionTree.children(root.id)[0]
    expect(exhibition, 'fixture: an exhibition').toBeDefined()

    const { app, host } = await mountSite(`#/exhibitions/${encodeURIComponent(exhibition.id)}/further-reading`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-link-list')).not.toBeNull(), { timeout: 20000 })
    // Either real entries or the view's own empty state — both are the
    // link-list shape, and the page never falls back to a hard not-found.
    expect(host.querySelector('.mwnf-link-list__groups, .mwnf-link-list__empty')).not.toBeNull()

    app.unmount()
  }, 60000)

  // The item sheet runs on the platform's composed record view
  // (metanull/viewer-core#50): the rows and their labels come from the sheet
  // spec in composables/sheet.js, and what only this website has — the
  // header, the holder's partner link, the special features — fills the
  // view's slots.
  it('renders the item sheet on the composed record view', async () => {
    const [items, partners] = await loadEntities(['items', 'partners'])
    const partnerIds = new Set(partners.map((p) => p.id))
    const object = items.find((i) => i.type === 'object' && i.partner_id && partnerIds.has(i.partner_id)) ?? items[0]
    const { app, host } = await mountSite(`#/item/${encodeURIComponent(object.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-record')).not.toBeNull()
    expect(host.querySelector('.detail-type-badge').textContent.trim()).toBe(object.type)
    expect(host.querySelector('.detail-title').textContent.trim()).not.toBe('')
    expect(host.querySelector('.fact-link a')).not.toBeNull()
    app.unmount()
  }, 60000)

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

  it('declares the section every route belongs to', () => {
    // The shell highlights the current menu entry off `meta.section`
    // (viewer-core's `useSection`) rather than deriving it from the path, so
    // a route without one would silently light up no entry at all.
    for (const route of config.extraViews) {
      expect(typeof route.meta?.section, route.name).toBe('string')
      expect(route.meta.section.length > 0, route.name).toBe(true)
    }
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
    // This site narrows the package's declared set to its own list, which is
    // the point of languages.js: a language whose item sheets would all read
    // English is worse than no switcher at all. The check is given the same
    // list the config gives offeredLanguages(), so it holds the site to the
    // rule it applies rather than to the package's wider declaration.
    expect(checkOfferedLanguages(config, { declared: OFFERED_LANGUAGES })).toEqual([])
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
