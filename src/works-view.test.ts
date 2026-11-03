import { describe, expect, it } from 'vitest'
import { works } from './content/works'
import { matches } from './works-view'

const fc = works.find((w) => w.id === 'fontcreate-yui')!

describe('matches', () => {
  it('filters by category', () => {
    expect(matches(fc, { category: 'site', query: '' })).toBe(true)
    expect(matches(fc, { category: 'game', query: '' })).toBe(false)
  })

  it('searches in both languages, ignoring case and width', () => {
    expect(matches(fc, { category: 'all', query: 'フォント' })).toBe(true)
    expect(matches(fc, { category: 'all', query: 'FONT' })).toBe(true)
    expect(matches(fc, { category: 'all', query: 'ｆｏｎｔ web' })).toBe(true)
    expect(matches(fc, { category: 'all', query: 'unity' })).toBe(false)
  })

  it('has unique ids', () => {
    expect(new Set(works.map((w) => w.id)).size).toBe(works.length)
  })
})
