import { works } from './content/works'
import { GLYPH_READY, lang, onLangChange, setLang, t, tr, type Lang } from './i18n'
import { escapeHtml } from './util'

/** ヘッダーのハンバーガーメニュー */
export class Menu {
  constructor(
    private btn: HTMLButtonElement,
    private panel: HTMLElement,
    onWork: (id: string) => void,
  ) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggle()
    })
    panel.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const work = target.closest<HTMLElement>('[data-work]')
      const langBtn = target.closest<HTMLButtonElement>('[data-lang]')
      if (work) {
        e.preventDefault()
        this.toggle(false)
        onWork(work.dataset.work!)
      } else if (langBtn) {
        setLang(langBtn.dataset.lang as Lang)
      } else if (target.closest('a')) {
        this.toggle(false)
      }
    })
    document.addEventListener('click', (e) => {
      // 言語ボタンは押した直後に作り直されるので、contains ではなく通り道で判定する
      if (!panel.hidden && !e.composedPath().includes(panel)) this.toggle(false)
    })
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) this.toggle(false)
    })
    onLangChange(() => this.render())
    this.render()
  }

  toggle(open = this.panel.hidden !== false) {
    this.panel.hidden = !open
    this.btn.setAttribute('aria-expanded', String(open))
    this.btn.classList.toggle('open', open)
  }

  private render() {
    const langBtn = (id: Lang, label: string, enabled = true) =>
      `<button type="button" class="lang-btn${lang() === id ? ' on' : ''}" data-lang="${id}" ${enabled ? '' : 'disabled'}
        aria-pressed="${lang() === id}">${escapeHtml(label)}${enabled ? '' : `<small>${tr('comingSoon')}</small>`}</button>`
    this.panel.innerHTML = `
      <a class="menu-link" href="#/about">${tr('about')}</a>
      <p class="menu-head">${tr('works')}</p>
      <ul class="menu-works">
        ${works.map((w) => `<li><a href="#/works/${encodeURIComponent(w.id)}" data-work="${escapeHtml(w.id)}">${escapeHtml(t(w.title))}</a></li>`).join('')}
      </ul>
      <p class="menu-head">${tr('language')}</p>
      <div class="langs">
        ${langBtn('ja', tr('langJa'))}${langBtn('en', tr('langEn'))}${langBtn('glyph', tr('langGlyph'), GLYPH_READY)}
      </div>`
  }
}
