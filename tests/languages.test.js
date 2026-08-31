import { describe, expect, it } from 'vitest'
import manifest from '@inventory-data/manifest.json'
import config from '../src/dataset.config.js'

describe('language strategy (items-driven, #7)', () => {
  it('offers exactly the languages items are translated into, en first', () => {
    const itemFiles = import.meta.glob('@inventory-data/translations/items.*.json')
    const expected = Object.keys(itemFiles)
      .map((path) => path.match(/items\.([a-z]{2})\.json$/)?.[1])
      .filter(Boolean)
    expect(expected.length).toBeGreaterThan(0)
    expect(config.languages[0]).toBe('en')
    expect([...config.languages].sort()).toEqual([...expected].sort())
  })

  it('does not offer manifest languages that have no item content', () => {
    // The manifest declares every language the project has ever touched, most
    // of them without a single translation file. Offering one would put a
    // language in the switcher whose item sheets are all English.
    const phantoms = manifest.languages.filter((l) => !config.languages.includes(l))
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
