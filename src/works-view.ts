import { categories, works, type CategoryId, type Work } from './content/works'
import { allLangs, t, tr, type Text } from './i18n'
import { asset, escapeHtml, multiline } from './util'

export type Filter = { category: CategoryId | 'all'; query: string }

const norm = (s: string) => s.normalize('NFKC').toLowerCase()

export function matches(work: Work, f: Filter): boolean {
  if (f.category !== 'all' && work.category !== f.category) return false
  const words = norm(f.query).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const cat = categories.find((c) => c.id === work.category)
  const hay = norm(
    [work.title, work.summary, work.description, ...work.tags, cat?.label ?? '']
      .map((x: Text) => allLangs(x))
      .join(' '),
  )
  return words.every((w) => hay.includes(w))
}

export const findWork = (id: string) => works.find((w) => w.id === id)
export const categoryLabel = (id: CategoryId) => t(categories.find((c) => c.id === id)?.label ?? id)

/** 画像がまだない作品の仮画像 */
export function placeholderImage(title: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
<defs>
<pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="rgba(120,255,245,0.13)"/></pattern>
<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d3b3b"/><stop offset="1" stop-color="#051c1c"/></linearGradient>
</defs>
<rect width="640" height="360" fill="url(#b)"/><rect width="640" height="360" fill="url(#g)"/>
<text x="320" y="178" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="700" fill="#c4fbf5">${escapeHtml(title)}</text>
<text x="320" y="224" text-anchor="middle" font-family="monospace" font-size="16" letter-spacing="6" fill="rgba(160,255,245,0.55)">NO IMAGE</text>
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

export const imageUrl = (work: Work, file = work.images?.[0]) =>
  file ? asset(`images/works/${file}`) : placeholderImage(t(work.title))

const tagsHtml = (work: Work) => work.tags.map((tag) => `<span class="tag">#${escapeHtml(t(tag))}</span>`).join('')

function cardHtml(work: Work, i: number) {
  const title = escapeHtml(t(work.title))
  return `
  <article class="work" data-id="${escapeHtml(work.id)}" style="--d:${-((i * 2.3) % 7).toFixed(1)}s">
    <a class="work-link" href="#/works/${encodeURIComponent(work.id)}">
      <div class="holo">
        <div class="holo-inner"><img src="${imageUrl(work)}" alt="${title}" draggable="false" /></div>
        <span class="holo-scan" aria-hidden="true"></span>
      </div>
      <div class="emitter" aria-hidden="true"></div>
    </a>
    <div class="work-info">
      <h2 class="work-title">${title}</h2>
      <div class="work-meta"><span class="chip">${escapeHtml(categoryLabel(work.category))}</span>${tagsHtml(work)}</div>
      <p class="work-summary">${escapeHtml(t(work.summary))}</p>
    </div>
  </article>`
}

/** 作品の詳細（窓の中身） */
export function detailHtml(work: Work) {
  const images = work.images?.length ? work.images : [undefined]
  const thumbs =
    images.length > 1
      ? `<div class="thumbs">${images
          .map((f, i) => `<button type="button" class="thumb${i ? '' : ' on'}" data-src="${imageUrl(work, f)}"><img src="${imageUrl(work, f)}" alt="" /></button>`)
          .join('')}</div>`
      : ''
  const meta = [
    work.year ? `<div><dt>${tr('year')}</dt><dd>${escapeHtml(work.year)}</dd></div>` : '',
    work.status ? `<div><dt>${tr('status')}</dt><dd>${escapeHtml(t(work.status))}</dd></div>` : '',
  ].join('')
  const links = work.links?.length
    ? `<div class="detail-links">${work.links
        .map((l) => `<a class="btn" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(t(l.label))}</a>`)
        .join('')}</div>`
    : ''
  return `
  <div class="detail">
    <div class="holo holo-lg">
      <div class="holo-inner"><img class="detail-img" src="${imageUrl(work)}" alt="${escapeHtml(t(work.title))}" /></div>
      <span class="holo-scan" aria-hidden="true"></span>
    </div>
    ${thumbs}
    <div class="detail-body">
      <p class="detail-cat">${escapeHtml(categoryLabel(work.category))}</p>
      <h2 class="detail-title">${escapeHtml(t(work.title))}</h2>
      <div class="work-meta">${tagsHtml(work)}</div>
      <p class="detail-desc">${multiline(t(work.description))}</p>
      ${meta ? `<dl class="detail-meta">${meta}</dl>` : ''}
      ${links}
    </div>
  </div>`
}

/** 詳細の窓で、小さい画像を押したら大きい画像を切り替える */
export function bindDetail(el: HTMLElement) {
  el.addEventListener('click', (e) => {
    const thumb = (e.target as HTMLElement).closest<HTMLButtonElement>('.thumb')
    if (!thumb) return
    el.querySelector<HTMLImageElement>('.detail-img')!.src = thumb.dataset.src!
    el.querySelectorAll('.thumb').forEach((b) => b.classList.toggle('on', b === thumb))
  })
}

/** トップページの中身（カテゴリ・作品一覧） */
export class WorksView {
  filter: Filter = { category: 'all', query: '' }

  constructor(
    private root: HTMLElement,
    private onRender: () => void,
  ) {
    root.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.cat-btn')
      if (btn) this.setCategory(btn.dataset.cat as Filter['category'])
    })
    this.render()
  }

  setCategory(category: Filter['category']) {
    if (category === this.filter.category) return
    this.filter = { ...this.filter, category }
    this.render()
  }

  setQuery(query: string) {
    if (query === this.filter.query) return
    this.filter = { ...this.filter, query }
    this.render()
  }

  /** 作品が絞り込みで隠れていたら、絞り込みを外す */
  ensureVisible(id: string) {
    const work = findWork(id)
    if (work && !matches(work, this.filter)) {
      this.filter = { category: 'all', query: '' }
      this.render()
      return true
    }
    return false
  }

  render() {
    const list = works.filter((w) => matches(w, this.filter))
    const used = categories.filter((c) => works.some((w) => w.category === c.id))
    const catBtn = (id: Filter['category'], label: string, count: number) =>
      `<button type="button" class="cat-btn${this.filter.category === id ? ' on' : ''}" data-cat="${id}" aria-pressed="${this.filter.category === id}">
        <span>${escapeHtml(label)}</span><small>${count}</small></button>`

    this.root.innerHTML = `
      <nav class="categories" aria-label="${tr('categories')}">
        ${catBtn('all', tr('all'), works.length)}
        ${used.map((c) => catBtn(c.id, t(c.label), works.filter((w) => w.category === c.id).length)).join('')}
      </nav>
      ${this.filter.query ? `<p class="results">${list.length}${tr('results')}</p>` : ''}
      <div class="works${list.length % 2 === 0 && list.length ? ' even' : ''}">${list.map(cardHtml).join('')}</div>
      ${list.length ? '' : `<p class="empty">${tr('noResults')}</p>`}
      <div class="records-end" aria-hidden="true"><span>${tr('endOfRecords')}</span></div>`
    this.onRender()
  }
}
