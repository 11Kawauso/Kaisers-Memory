import { blinkFrames, faces } from '../content/kaiser-sprites'
import { asset } from '../util'
import { DEFAULT_FACE } from './script'

const url = (file: string) => asset(`images/kaiser/${file}`)

/**
 * カイザーのドット絵。
 * 画面の拡大率（Windows の 125% 表示など）に合わせて、ドットが必ず整数倍になる大きさで表示する。
 */
export class KaiserSprite {
  private face = DEFAULT_FACE
  private blinking = false

  constructor(
    private img: HTMLImageElement,
    /** だいたい何倍で見せたいか（右下は1、部屋は2など） */
    private scale = 1,
  ) {
    img.addEventListener('load', () => this.fit())
    addEventListener('resize', () => this.fit())
    // 先に読み込んでおき、表情を変えたときに一瞬消えないようにする
    for (const f of [...Object.values(faces), ...blinkFrames]) new Image().src = url(f)
    this.show(faces[DEFAULT_FACE])
    this.scheduleBlink()
  }

  setFace(name: string) {
    this.face = name in faces ? name : DEFAULT_FACE
    if (!this.blinking) this.show(faces[this.face])
  }

  setScale(scale: number) {
    this.scale = scale
    this.fit()
  }

  private show(file: string) {
    const src = url(file)
    if (this.img.getAttribute('src') !== src) this.img.src = src
  }

  private fit() {
    const w = this.img.naturalWidth
    if (!w) return
    const dpr = devicePixelRatio || 1
    const n = Math.max(1, Math.round(dpr * this.scale))
    this.img.style.width = `${(w * n) / dpr}px`
  }

  private scheduleBlink() {
    if (!blinkFrames.length) return
    setTimeout(() => this.blink(), 2500 + Math.random() * 3500)
  }

  private async blink() {
    if (this.face === DEFAULT_FACE && !document.hidden) {
      this.blinking = true
      for (const f of [...blinkFrames, ...blinkFrames.slice(0, -1).reverse()]) {
        this.show(f)
        await new Promise((r) => setTimeout(r, 60))
      }
      this.blinking = false
      this.show(faces[this.face])
    }
    this.scheduleBlink()
  }
}
