import { clamp, clamp01, easeInOut, lerp, prefersReducedMotion } from './util'

/*
 * 上下の大扉。
 *
 * 扉の位置は「扉のふち（段差の真ん中）が画面の上から何px か」で表す。
 *   top    … 上の扉のふち
 *   bottom … 下の扉のふち
 * ふちは左右で段差があり（左が SLANT 上、右が SLANT 下）、上下の扉はぴったりかみ合う。
 *
 * 位置は次の3つで決まる。
 *   - 取っ手で動かした位置（manual。画面の高さに対する割合。動かしていなければ null）
 *   - 一番下でのスクロール量（0 = 開いている、1 = 閉じ切った）
 *   - 開け閉めのアニメーション（extra）
 */

export const SLANT = 25
export const REST_TOP = 85
/** 下の扉のふちの、画面の下からの距離 */
export const REST_BOTTOM = 50

export type Edges = { top: number; bottom: number }
export type Manual = { top: number | null; bottom: number | null }
export type Side = keyof Edges

export function restEdges(h: number): Edges {
  return { top: REST_TOP, bottom: Math.max(REST_TOP, h - REST_BOTTOM) }
}

/** 取っ手の位置（割合）を、開いている範囲におさめた px にする */
export function baseEdges(h: number, manual: Manual): Edges {
  const rest = restEdges(h)
  const top = clamp(manual.top == null ? rest.top : manual.top * h, rest.top, rest.bottom)
  const bottom = clamp(manual.bottom == null ? rest.bottom : manual.bottom * h, top, rest.bottom)
  return { top, bottom }
}

/** close: 0 = 取っ手の位置のまま、1 = 画面の真ん中で閉じ切る */
export function doorEdges(h: number, manual: Manual, close: number): Edges {
  const rest = restEdges(h)
  const meet = (rest.top + rest.bottom) / 2
  const base = baseEdges(h, manual)
  const c = clamp01(close)
  return { top: lerp(base.top, meet, c), bottom: lerp(base.bottom, meet, c) }
}

/** 取っ手を画面の y まで動かしたときの、新しい manual の値（割合） */
export function manualFromDrag(h: number, manual: Manual, side: Side, y: number, close: number): number {
  const rest = restEdges(h)
  const meet = (rest.top + rest.bottom) / 2
  const c = clamp01(close)
  const base = baseEdges(h, manual)
  let v = c >= 1 ? base[side] : (y - meet * c) / (1 - c)
  v = side === 'top' ? clamp(v, rest.top, base.bottom) : clamp(v, base.top, rest.bottom)
  return v / h
}

export const isClosed = (e: Edges) => e.bottom - e.top < 0.5

/** このくらいまで近づけたら、ぴったり閉める */
const SNAP = 6

type Options = {
  top: HTMLElement
  bottom: HTMLElement
  reopen: HTMLButtonElement
  /** 一番下で閉じ切ったあと、六角形のボタンで開けるときに呼ぶ（ページの一番上へ戻す） */
  returnToTop(): void
  onClosedChange(closed: boolean): void
}

export class Doors {
  private h = innerHeight
  private manual: Manual = { top: null, bottom: null }
  private scrollClose = 0
  private extra = 0
  private animating = false
  private closed = false

  constructor(private o: Options) {
    for (const handle of [o.top, o.bottom].map((d) => d.querySelector<HTMLElement>('.handle'))) {
      if (handle) this.bindHandle(handle, handle.dataset.door as Side)
    }
    o.reopen.addEventListener('click', () => this.reopen())
    this.resize(innerHeight)
  }

  get isClosed() {
    return this.closed
  }

  resize(h: number) {
    this.h = h
    for (const d of [this.o.top, this.o.bottom]) d.style.height = `${h + SLANT * 2}px`
    this.render()
  }

  /** 一番下でのスクロール量（0〜1） */
  setScrollClose(p: number) {
    this.scrollClose = p
    // スクロールで閉じ切ったら、取っ手で動かした位置は忘れる（次に開くときは普段の位置へ）
    if (p >= 1 && !this.animating) this.manual = { top: null, bottom: null }
    this.render()
  }

  edges(): Edges {
    return doorEdges(this.h, this.manual, Math.max(this.scrollClose, this.extra))
  }

  private render() {
    const e = this.edges()
    const doorH = this.h + SLANT * 2
    this.o.top.style.transform = `translate3d(0, ${e.top + SLANT - doorH}px, 0)`
    this.o.bottom.style.transform = `translate3d(0, ${e.bottom - SLANT}px, 0)`

    const closed = isClosed(e)
    if (closed !== this.closed) {
      this.closed = closed
      this.o.onClosedChange(closed)
    }
    this.o.reopen.hidden = !closed || this.animating
    this.o.reopen.style.top = `${(e.top + e.bottom) / 2}px`
  }

  private reopen() {
    if (this.animating) return
    if (this.scrollClose > 0) {
      // 一番下で閉じた → 扉の裏でページの一番上に戻してから開ける
      this.manual = { top: null, bottom: null }
      this.extra = 1
      this.o.returnToTop()
      this.scrollClose = 0
      this.animate(1100, (k) => (this.extra = 1 - k))
    } else {
      // 取っ手で閉じた → スクロール位置はそのまま、普段の位置まで開ける
      const from = baseEdges(this.h, this.manual)
      const rest = restEdges(this.h)
      this.animate(
        900,
        (k) => {
          this.manual = { top: lerp(from.top, rest.top, k) / this.h, bottom: lerp(from.bottom, rest.bottom, k) / this.h }
        },
        () => (this.manual = { top: null, bottom: null }),
      )
    }
  }

  private animate(dur: number, step: (k: number) => void, done?: () => void) {
    const reduce = prefersReducedMotion()
    const delay = reduce ? 0 : 220 // ロックが外れる「間」
    if (reduce) dur = 250
    const start = performance.now()
    this.animating = true
    this.o.top.parentElement?.classList.add('doors-opening')
    const tick = (now: number) => {
      const k = clamp01((now - start - delay) / dur)
      step(easeInOut(k))
      if (k < 1) {
        this.render()
        requestAnimationFrame(tick)
      } else {
        this.animating = false
        this.o.top.parentElement?.classList.remove('doors-opening')
        done?.()
        this.render()
      }
    }
    this.render()
    requestAnimationFrame(tick)
  }

  private bindHandle(handle: HTMLElement, side: Side) {
    let offset = 0
    let dragging = false
    const canDrag = () => !this.animating && this.scrollClose < 1

    handle.addEventListener('pointerdown', (e) => {
      if (!canDrag() || e.button !== 0) return
      e.preventDefault()
      dragging = true
      offset = e.clientY - this.edges()[side]
      handle.setPointerCapture(e.pointerId)
      handle.classList.add('grabbing')
    })
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return
      this.moveTo(side, e.clientY - offset)
    })
    const end = () => {
      if (!dragging) return
      dragging = false
      handle.classList.remove('grabbing')
      this.snap(side)
    }
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)

    // キーボードでも動かせるように（上下キー）
    handle.addEventListener('keydown', (e) => {
      if (!canDrag() || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
      e.preventDefault()
      e.stopPropagation()
      this.moveTo(side, this.edges()[side] + (e.key === 'ArrowDown' ? 1 : -1) * (e.shiftKey ? 60 : 15))
      this.snap(side)
    })
  }

  private moveTo(side: Side, y: number) {
    const v = manualFromDrag(this.h, this.manual, side, y, this.scrollClose)
    this.manual = { ...this.manual, [side]: v }
    this.render()
  }

  private snap(side: Side) {
    const base = baseEdges(this.h, this.manual)
    if (base.bottom - base.top < SNAP) {
      const other = side === 'top' ? 'bottom' : 'top'
      this.manual = { ...this.manual, [side]: base[other] / this.h }
      this.render()
    }
  }
}
