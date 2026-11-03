import type { Text } from '../i18n'

/*
 * カイザーの台本（src/content/*.txt）を読み取る。
 * 書き方は src/content/kaiser.txt の先頭に書いてある。
 */

export type Choice = { label: Text; to: string }
export type Step =
  | { kind: 'say'; face: string; text: Text }
  | { kind: 'choice'; options: Choice[] }
  | { kind: 'jump'; to: string }
  | { kind: 'command'; name: string }
export type Script = Map<string, Step[]>

export const DEFAULT_FACE = '通常'

const ARROW = /\s*(?:->|→)\s*/

export function parseScript(src: string): Script {
  const scenes: Script = new Map()
  const refs: { to: string; line: number }[] = []
  let steps: Step[] | null = null
  let face = DEFAULT_FACE
  // en: を付ける相手（直前のセリフか選択肢）
  let lastText: { get(): Text; set(t: Text): void } | null = null

  src.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    const no = i + 1
    if (!line || line.startsWith('//')) return

    if (line.startsWith('#')) {
      const name = line.slice(1).trim()
      if (!name) throw new Error(`${no}行目: 「#」のあとに場面の名前を書いてください`)
      if (scenes.has(name)) throw new Error(`${no}行目: 場面「${name}」が2回出てきます`)
      steps = []
      scenes.set(name, steps)
      face = DEFAULT_FACE
      lastText = null
      return
    }
    if (!steps) throw new Error(`${no}行目: 最初に「# start」のような場面の名前を書いてください`)

    const en = line.match(/^en\s*[:：]\s*(.*)$/i)
    if (en) {
      if (!lastText) throw new Error(`${no}行目: en: の前にセリフか選択肢が必要です`)
      const cur = lastText.get()
      lastText.set({ ja: typeof cur === 'string' ? cur : cur.ja, en: en[1] })
      return
    }

    if (line.startsWith('?') || line.startsWith('？')) {
      const [label, to] = line.slice(1).split(ARROW)
      if (!label?.trim() || !to?.trim()) throw new Error(`${no}行目: 選択肢は「? 選択肢 -> 場面」と書いてください`)
      const choice: Choice = { label: label.trim(), to: to.trim() }
      refs.push({ to: choice.to, line: no })
      const last = steps[steps.length - 1]
      if (last?.kind === 'choice') last.options.push(choice)
      else steps.push({ kind: 'choice', options: [choice] })
      lastText = { get: () => choice.label, set: (t) => (choice.label = t) }
      return
    }

    const jump = line.match(/^(?:->|→)\s*(.+)$/)
    if (jump) {
      steps.push({ kind: 'jump', to: jump[1].trim() })
      refs.push({ to: jump[1].trim(), line: no })
      lastText = null
      return
    }

    if (line.startsWith('@')) {
      steps.push({ kind: 'command', name: line.slice(1).trim() })
      lastText = null
      return
    }

    const faced = line.match(/^[[［【]([^\]］】]+)[\]］】]\s*(.*)$/)
    if (faced) face = faced[1].trim()
    const text = faced ? faced[2] : line
    if (!text) throw new Error(`${no}行目: セリフが空です`)
    const say: Extract<Step, { kind: 'say' }> = { kind: 'say', face, text }
    steps.push(say)
    lastText = { get: () => say.text, set: (t) => (say.text = t) }
  })

  if (!scenes.has('start')) throw new Error('「# start」の場面がありません')
  for (const r of refs) {
    if (!scenes.has(r.to)) throw new Error(`${r.line}行目: 場面「${r.to}」が見つかりません`)
  }
  return scenes
}

export type Segment = { text: string; glyph: boolean }

/** 《》で囲まれた部分（独自文字で出す部分）を分ける */
export function splitGlyph(text: string): Segment[] {
  const out: Segment[] = []
  const re = /《([^》]*)》/g
  let at = 0
  for (const m of text.matchAll(re)) {
    if (m.index > at) out.push({ text: text.slice(at, m.index), glyph: false })
    if (m[1]) out.push({ text: m[1], glyph: true })
    at = m.index + m[0].length
  }
  if (at < text.length) out.push({ text: text.slice(at), glyph: false })
  return out
}
