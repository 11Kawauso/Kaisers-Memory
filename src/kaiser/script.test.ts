import { describe, expect, it } from 'vitest'
import { parseScript, splitGlyph } from './script'
import kaiser from '../content/kaiser.txt?raw'
import room from '../content/room.txt?raw'

describe('parseScript', () => {
  it('reads lines, faces, choices and english', () => {
    const s = parseScript(`
# start
[困り] 私…ですか
en: Me?
続き
? はい -> yes
en: Yes
? いいえ → start
# yes
@end
`)
    const start = s.get('start')!
    expect(start[0]).toEqual({ kind: 'say', face: '困り', text: { ja: '私…ですか', en: 'Me?' } })
    // 表情は次のセリフにも引き継ぐ
    expect(start[1]).toEqual({ kind: 'say', face: '困り', text: '続き' })
    expect(start[2]).toEqual({
      kind: 'choice',
      options: [
        { label: { ja: 'はい', en: 'Yes' }, to: 'yes' },
        { label: 'いいえ', to: 'start' },
      ],
    })
    expect(s.get('yes')).toEqual([{ kind: 'command', name: 'end' }])
  })

  it('resets the face at each scene', () => {
    const s = parseScript('# start\n[困り] a\n-> b\n# b\nb')
    expect(s.get('b')![0]).toMatchObject({ face: '通常' })
  })

  it('reports missing scenes with the line number', () => {
    expect(() => parseScript('# start\n? a -> nowhere')).toThrow('2行目')
    expect(() => parseScript('# other\nhi')).toThrow('start')
  })

  it('accepts the real scripts', () => {
    expect(() => parseScript(kaiser)).not.toThrow()
    expect(() => parseScript(room)).not.toThrow()
  })
})

describe('splitGlyph', () => {
  it('separates glyph parts', () => {
    expect(splitGlyph('あ《いう》え')).toEqual([
      { text: 'あ', glyph: false },
      { text: 'いう', glyph: true },
      { text: 'え', glyph: false },
    ])
  })
})
