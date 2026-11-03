import { onLangChange, t, type Text } from '../i18n'
import { escapeHtml } from '../util'
import { DEFAULT_FACE, splitGlyph, type Script, type Step } from './script'

type Mode = 'closed' | 'typing' | 'next' | 'choice'
type ChoiceStep = Extract<Step, { kind: 'choice' }>

export type DialogueHooks = {
  setFace(face: string): void
  /** @room など。@end は会話を閉じるだけなのでここには来ない */
  command(name: string): void
}

const TYPE_MS = 28

/** カイザーの会話ウィンドウ */
export class Dialogue {
  readonly el: HTMLElement
  private textEl: HTMLElement
  private choicesEl: HTMLElement
  private mode: Mode = 'closed'
  private scene = ''
  private index = 0
  private text: Text = ''
  private choice: ChoiceStep | null = null
  private chars: HTMLElement[] = []
  private shown = 0
  private timer = 0

  constructor(
    root: HTMLElement,
    private script: Script,
    private hooks: DialogueHooks,
  ) {
    this.el = document.createElement('div')
    this.el.className = 'dialogue holo-panel'
    this.el.hidden = true
    this.el.setAttribute('role', 'dialog')
    this.el.innerHTML = `
      <div class="dlg-name">KAISER</div>
      <p class="dlg-text" aria-live="polite"></p>
      <div class="dlg-choices"></div>
      <span class="dlg-next" aria-hidden="true"></span>`
    this.textEl = this.el.querySelector('.dlg-text')!
    this.choicesEl = this.el.querySelector('.dlg-choices')!
    root.append(this.el)

    this.el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.dlg-choices')) return
      this.advance()
    })
    this.choicesEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-to]')
      if (btn && this.mode === 'choice') this.go(btn.dataset.to!)
    })
    addEventListener('keydown', (e) => {
      if (this.mode === 'closed') return
      if (e.key === 'Escape') this.close()
      else if ((e.key === 'Enter' || e.key === ' ') && this.mode !== 'choice') {
        const target = e.target as HTMLElement
        if (target.closest('input, textarea')) return
        e.preventDefault()
        this.advance()
      }
    })
    onLangChange(() => this.refresh())
  }

  get isOpen() {
    return this.mode !== 'closed'
  }

  open(scene = 'start') {
    this.el.hidden = false
    this.go(scene)
  }

  close() {
    if (this.mode === 'closed') return
    clearInterval(this.timer)
    this.mode = 'closed'
    this.el.hidden = true
    this.hooks.setFace(DEFAULT_FACE)
  }

  /** クリック1回分：文字を出し切る／次のセリフへ */
  advance() {
    if (this.mode === 'typing') this.finishTyping()
    else if (this.mode === 'next') this.go(this.scene, this.index + 1)
  }

  private go(scene: string, index = 0) {
    const steps = this.script.get(scene)
    const step = steps?.[index]
    if (!steps || !step) return this.close()
    this.scene = scene
    this.index = index
    switch (step.kind) {
      case 'say': {
        this.hooks.setFace(step.face)
        this.choice = this.peekChoice(scene, index + 1)
        this.type(step.text)
        break
      }
      case 'choice':
        this.choice = step
        this.showChoices()
        break
      case 'jump':
        this.go(step.to)
        break
      case 'command':
        this.close()
        if (step.name !== 'end') this.hooks.command(step.name)
        break
    }
  }

  /** 次が選択肢なら（-> で飛んだ先でも）、セリフと一緒に出すために先に見ておく */
  private peekChoice(scene: string, index: number): ChoiceStep | null {
    for (let hops = 0; hops < 10; hops++) {
      const step = this.script.get(scene)?.[index]
      if (step?.kind === 'choice') return step
      if (step?.kind !== 'jump') return null
      scene = step.to
      index = 0
    }
    return null
  }

  private renderText(text: Text) {
    this.textEl.innerHTML = splitGlyph(t(text))
      .map((seg) => {
        const chars = [...seg.text].map((c) => `<span class="ch">${escapeHtml(c)}</span>`).join('')
        return seg.glyph ? `<span class="glyph">${chars}</span>` : chars
      })
      .join('')
    this.chars = [...this.textEl.querySelectorAll<HTMLElement>('.ch')]
  }

  private type(text: Text) {
    clearInterval(this.timer)
    this.text = text
    this.choicesEl.innerHTML = ''
    this.renderText(text)
    this.shown = 0
    this.mode = 'typing'
    this.el.dataset.mode = 'typing'
    this.timer = window.setInterval(() => {
      this.chars[this.shown++]?.classList.add('on')
      if (this.shown >= this.chars.length) this.finishTyping()
    }, TYPE_MS)
  }

  private finishTyping() {
    clearInterval(this.timer)
    this.chars.forEach((c) => c.classList.add('on'))
    if (this.choice) this.showChoices()
    else this.setMode('next')
  }

  private showChoices() {
    const choice = this.choice
    if (!choice) return
    this.choicesEl.innerHTML = choice.options
      .map((o) => `<button type="button" class="dlg-choice" data-to="${escapeHtml(o.to)}">${escapeHtml(t(o.label))}</button>`)
      .join('')
    this.setMode('choice')
    this.choicesEl.querySelector('button')?.focus({ preventScroll: true })
  }

  private setMode(mode: Mode) {
    this.mode = mode
    this.el.dataset.mode = mode
  }

  /** 言語を切り替えたとき、今のセリフを出し直す */
  private refresh() {
    if (this.mode === 'closed') return
    this.renderText(this.text)
    if (this.mode === 'typing') this.finishTyping()
    else this.chars.forEach((c) => c.classList.add('on'))
    if (this.mode === 'choice') this.showChoices()
  }
}
