import './styles/base.css'
import './styles/room.css'
import scriptSrc from './content/room.txt?raw'
import { faces } from './content/kaiser-sprites'
import { applyDocLang, applyI18n, onLangChange } from './i18n'
import { Dialogue } from './kaiser/dialogue'
import { DEFAULT_FACE, parseScript } from './kaiser/script'
import { KaiserSprite } from './kaiser/sprite'
import { asset, qs } from './util'

/*
 * カイザーの部屋（準備中）。
 * 大きいホログラムと、通常サイズのドット絵のカイザー。
 */

applyDocLang()
applyI18n()
onLangChange(() => applyI18n())

// 大きいホログラムには、今はカイザーの絵を大きく映しておく（仮）
qs<HTMLImageElement>('#holo-kaiser').src = asset(`images/kaiser/${faces[DEFAULT_FACE]}`)

const sprite = new KaiserSprite(qs<HTMLImageElement>('#kaiser img'), 2)
const dialogue = new Dialogue(qs('#dialogue-root'), parseScript(scriptSrc), {
  setFace: (f) => sprite.setFace(f),
  command: (name) => {
    if (name === 'top') location.href = 'index.html'
  },
})
qs('#kaiser').addEventListener('click', () => (dialogue.isOpen ? dialogue.advance() : dialogue.open()))

setTimeout(() => dialogue.open(), 700)
