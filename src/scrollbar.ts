import { tr } from './i18n'

/** 右端の独自スクロールバー */
export class Scrollbar {
  private track: HTMLElement
  private thumb: HTMLElement
  private max = 0
  private y = 0
  private thumbH = 0

  constructor(
    private root: HTMLElement,
    scrollTo: (y: number) => void,
    scrollBy: (dy: number) => void,
  ) {
    root.innerHTML = `
      <button type="button" class="sb-arrow up" data-i18n-label="scrollUp" aria-label="${tr('scrollUp')}"></button>
      <div class="sb-track"><div class="sb-thumb"></div></div>
      <button type="button" class="sb-arrow down" data-i18n-label="scrollDown" aria-label="${tr('scrollDown')}"></button>`
    this.track = root.querySelector('.sb-track')!
    this.thumb = root.querySelector('.sb-thumb')!

    root.querySelector('.up')!.addEventListener('click', () => scrollBy(-innerHeight * 0.35))
    root.querySelector('.down')!.addEventListener('click', () => scrollBy(innerHeight * 0.35))

    // つまみをドラッグ
    let startY = 0
    let startScroll = 0
    let dragging = false
    this.thumb.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      dragging = true
      startY = e.clientY
      startScroll = this.y
      this.thumb.setPointerCapture(e.pointerId)
      root.classList.add('dragging')
    })
    this.thumb.addEventListener('pointermove', (e) => {
      if (!dragging) return
      const room = this.track.clientHeight - this.thumbH
      if (room > 0) scrollTo(startScroll + ((e.clientY - startY) * this.max) / room)
    })
    const end = () => {
      dragging = false
      root.classList.remove('dragging')
    }
    this.thumb.addEventListener('pointerup', end)
    this.thumb.addEventListener('pointercancel', end)

    // 溝を押したら1画面分進む
    this.track.addEventListener('pointerdown', (e) => {
      if (e.target !== this.track) return
      const thumbTop = this.thumb.getBoundingClientRect().top
      scrollBy((e.clientY < thumbTop ? -1 : 1) * innerHeight * 0.85)
    })
  }

  update(y: number, max: number, viewH: number) {
    this.y = y
    this.max = max
    const trackH = this.track.clientHeight
    this.thumbH = Math.max(40, (trackH * viewH) / (max + viewH))
    const pos = max > 0 ? ((trackH - this.thumbH) * y) / max : 0
    this.thumb.style.height = `${this.thumbH}px`
    this.thumb.style.transform = `translateY(${pos}px)`
    this.root.classList.toggle('inactive', max <= 0)
  }
}
