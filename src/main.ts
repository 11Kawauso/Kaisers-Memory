import './styles/base.css'
import './styles/top.css'
import scriptSrc from './content/kaiser.txt?raw'
import { about } from './content/about'
import { Doors } from './doors'
import { applyDocLang, applyI18n, onLangChange, t, tr } from './i18n'
import { Dialogue } from './kaiser/dialogue'
import { parseScript } from './kaiser/script'
import { KaiserSprite } from './kaiser/sprite'
import { Menu } from './menu'
import { closeModal, openModal } from './modal'
import { Scrollbar } from './scrollbar'
import { clamp, clamp01, escapeHtml, qs } from './util'
import { bindDetail, detailHtml, findWork, WorksView } from './works-view'

/*
 * トップページ。
 * 画面（#stage）は固定しておき、ブラウザのスクロール量を読んで中身・背景・扉を動かす。
 *   0 〜 contentMax           … 作品が流れる
 *   contentMax 〜 +closeZone  … 扉が閉じていく
 */

/** 背景の動く速さ（作品を 1 としたとき） */
const FAR = 0.3
const MID = 0.6

const spacer = qs('#scroll-spacer')
const content = qs('#content')
const bgFar = qs('#bg-far')
const bgMid = qs('#bg-mid')

let h = innerHeight
let contentMax = 0
let closeZone = 0

history.scrollRestoration = 'manual'
applyDocLang()
applyI18n()

// ---- カイザー ----
const sprite = new KaiserSprite(qs<HTMLImageElement>('#kaiser img'))
const dialogue = new Dialogue(qs('#dialogue-root'), parseScript(scriptSrc), {
  setFace: (f) => sprite.setFace(f),
  command: (name) => {
    if (name === 'room') location.href = 'room.html'
    else if (name === 'about') navigate('#/about')
  },
})
qs('#kaiser').addEventListener('click', () => (dialogue.isOpen ? dialogue.advance() : dialogue.open()))

const menu = new Menu(qs<HTMLButtonElement>('#menu-btn'), qs('#menu'), (id) => revealWork(id))

// ---- 扉 ----
const doors = new Doors({
  top: qs('#door-top'),
  bottom: qs('#door-bottom'),
  reopen: qs<HTMLButtonElement>('#reopen'),
  returnToTop: () => window.scrollTo(0, 0),
  onClosedChange: (closed) => {
    document.documentElement.classList.toggle('doors-closed', closed)
    if (closed) {
      dialogue.close()
      menu.toggle(false)
    }
  },
})

// ---- スクロール ----
const scrollbar = new Scrollbar(
  qs('#scrollbar'),
  (y) => window.scrollTo(0, clamp(y, 0, contentMax)),
  (dy) => window.scrollBy({ top: dy, behavior: 'smooth' }),
)

function measure() {
  h = innerHeight
  contentMax = Math.max(0, content.offsetHeight - h)
  closeZone = Math.round(h * 0.6)
  spacer.style.height = `${h + contentMax + closeZone}px`
  bgFar.style.height = `${Math.ceil(h + contentMax * FAR) + 2}px`
  bgMid.style.height = `${Math.ceil(h + contentMax * MID) + 2}px`
  doors.resize(h)
  render()
}

function render() {
  const y = Math.max(0, scrollY)
  const cy = Math.min(y, contentMax)
  const p = closeZone > 0 ? clamp01((y - contentMax) / closeZone) : 0
  content.style.transform = `translate3d(0, ${-cy}px, 0)`
  bgFar.style.transform = `translate3d(0, ${-cy * FAR}px, 0)`
  bgMid.style.transform = `translate3d(0, ${-cy * MID}px, 0)`
  scrollbar.update(cy, contentMax, h)
  doors.setScrollClose(p)
}

let queued = false
addEventListener('scroll', () => {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    render()
  })
})
addEventListener('resize', measure)
new ResizeObserver(measure).observe(content)

// ---- 作品一覧・検索・メニュー ----
const view = new WorksView(content, () => {
  measure()
  if (scrollY > contentMax) window.scrollTo(0, contentMax)
})

const searchBox = qs('#search')
const searchInput = qs<HTMLInputElement>('#search-input')
qs('#search-btn').addEventListener('click', () => {
  const open = !searchBox.classList.contains('open')
  searchBox.classList.toggle('open', open)
  if (open) searchInput.focus()
  else {
    searchInput.value = ''
    view.setQuery('')
  }
})
searchInput.addEventListener('input', () => {
  view.setQuery(searchInput.value.trim())
  window.scrollTo(0, 0)
})
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchInput.value = ''
    view.setQuery('')
    searchBox.classList.remove('open')
    searchInput.blur()
  } else if (e.key === 'Enter') searchInput.blur()
})

/** メニューで作品を選んだら、その作品までスクロールする */
function revealWork(id: string) {
  if (view.ensureVisible(id)) {
    searchInput.value = ''
    searchBox.classList.remove('open')
  }
  const el = content.querySelector<HTMLElement>(`.work[data-id="${CSS.escape(id)}"]`)
  if (!el) return
  const top = clamp(el.offsetTop - h * 0.2, 0, contentMax)
  window.scrollTo({ top, behavior: 'smooth' })
  el.classList.remove('flash')
  void el.offsetWidth
  el.classList.add('flash')
}

// ---- 作品の詳細・作者について（URL の # で開く） ----
let openedInApp = false

function navigate(hash: string) {
  openedInApp = true
  location.hash = hash
}

function goHome() {
  if (openedInApp) history.back()
  else {
    history.replaceState(null, '', location.pathname + location.search)
    route()
  }
}

function route() {
  const m = location.hash.match(/^#\/works\/(.+)$/)
  const work = m && findWork(decodeURIComponent(m[1]))
  if (work) {
    document.title = `${t(work.title)} | Kaiser's Memory`
    bindDetail(openModal(detailHtml(work), goHome, 'modal-work'))
  } else if (location.hash === '#/about') {
    document.title = `${tr('about')} | Kaiser's Memory`
    const links = about.links.length
      ? `<div class="detail-links">${about.links.map((l) => `<a class="btn" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(t(l.label))}</a>`).join('')}</div>`
      : ''
    openModal(
      `<div class="about"><p class="detail-cat">PROFILE</p><h2 class="detail-title">${tr('about')}</h2>
        ${about.paragraphs.map((p) => `<p>${escapeHtml(t(p))}</p>`).join('')}${links}</div>`,
      goHome,
      'modal-about',
    )
  } else {
    document.title = "Kaiser's Memory"
    closeModal()
    openedInApp = false
  }
}

addEventListener('hashchange', () => {
  // カードのリンクなど、サイトの中から開いたかどうか
  if (location.hash) openedInApp = true
  route()
})
route()

onLangChange(() => {
  applyI18n()
  view.render()
  if (location.hash) route()
})

measure()
