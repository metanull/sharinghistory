import { describe, expect, it } from 'vitest'
import manifest from '@inventory-data/manifest.json'
import config from '../src/dataset.config.js'
import { OFFERED_LANGUAGES } from '../src/languages.js'

const packageItemLangs = Object.keys(
  import.meta.glob('@inventory-data/translations/items.*.json'),
)
  .map((path) => path.match(/items\.([a-z]{2})\.json$/)?.[1])
  .filter(Boolean)

describe('language strategy', () => {
  it('offers what the site declares, English first', () => {
    expect(config.languages).toEqual(OFFERED_LANGUAGES)
    expect(config.languages[0]).toBe('en')
  })

  it('never offers a language the package cannot serve', () => {
    // The config intersects the site's list with the items.<lang>.json files
    // that exist, so a code added to languages.js ahead of the data is dropped
    // rather than shipped as a switcher entry that renders English.
    for (const code of config.languages) {
      expect(packageItemLangs).toContain(code)
    }
    expect(config.languages.length).toBeGreaterThan(0)
  })

  it('does not offer manifest languages that have no item content', () => {
    // The manifest declares every language the project has ever touched, most
    // without a single translation file.
    const phantoms = manifest.languages.filter((l) => !packageItemLangs.includes(l))
    expect(phantoms.length).toBeGreaterThan(0)
    for (const phantom of phantoms) {
      expect(config.languages).not.toContain(phantom)
    }
  })

  it('labels every offered language for the switcher', () => {
    const codes = config.navigation.languages.map((l) => l.code)
    expect(codes).toEqual(config.languages)
    for (const { code, label } of config.navigation.languages) {
      // A real display name from languages.json, not the bare code.
      expect(label).toBeTruthy()
      expect(label).not.toBe(code)
    }
  })
})
