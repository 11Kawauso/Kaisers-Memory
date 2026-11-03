export type Lang = 'ja' | 'en' | 'glyph'
/** 言語ごとの文章。文字列だけなら全言語で同じ文章を出す */
export type Text = string | { ja: string; en?: string }

/** 独自文字（四角五線 Font）を選べるようにするか */
export const GLYPH_READY = true

const KEY = 'km.lang'
const listeners = new Set<() => void>()
let current: Lang = initial()

function initial(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'ja' || saved === 'en' || (saved === 'glyph' && GLYPH_READY)) return saved
  } catch {
    // 保存が使えない環境では毎回ブラウザの言語から決める
  }
  const nav = typeof navigator === 'undefined' ? 'ja' : navigator.language
  return nav.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

export function lang() {
  return current
}

export function setLang(next: Lang) {
  if (next === 'glyph' && !GLYPH_READY) return
  if (next === current) return
  current = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // 保存できなくても切り替え自体はする
  }
  applyDocLang()
  listeners.forEach((f) => f())
}

export function onLangChange(f: () => void) {
  listeners.add(f)
}

export function t(text: Text): string {
  if (typeof text === 'string') return text
  return current === 'en' ? (text.en ?? text.ja) : text.ja
}

/** 検索用：全言語の文章をまとめて返す */
export function allLangs(text: Text): string {
  return typeof text === 'string' ? text : `${text.ja} ${text.en ?? ''}`
}

export function applyDocLang() {
  if (typeof document === 'undefined') return
  document.documentElement.lang = current === 'en' ? 'en' : 'ja'
  document.documentElement.classList.toggle('lang-glyph', current === 'glyph')
}

/** 画面の決まり文句 */
export const ui = {
  search: { ja: '検索', en: 'Search' },
  searchPlaceholder: { ja: '作品を検索…', en: 'Search works…' },
  menu: { ja: 'メニュー', en: 'Menu' },
  visitors: { ja: '訪問数（準備中）', en: 'Visitors (coming soon)' },
  all: { ja: 'すべて', en: 'All' },
  categories: { ja: 'カテゴリ', en: 'Categories' },
  about: { ja: '作者について', en: 'About the Creator' },
  works: { ja: '作品', en: 'Works' },
  language: { ja: '言語', en: 'Language' },
  langJa: '日本語',
  langEn: 'English',
  langGlyph: { ja: '独自文字', en: 'Kaiser Script' },
  comingSoon: { ja: '準備中', en: 'Coming soon' },
  noResults: { ja: '該当する作品が見つかりませんでした。', en: 'No works matched your search.' },
  results: { ja: '件の作品', en: ' works found' },
  close: { ja: '閉じる', en: 'Close' },
  back: { ja: '戻る', en: 'Back' },
  links: { ja: 'リンク', en: 'Links' },
  year: { ja: '制作年', en: 'Year' },
  status: { ja: '状態', en: 'Status' },
  reopen: { ja: '扉を開ける', en: 'Open the doors' },
  doorHandle: { ja: '扉の取っ手', en: 'Door handle' },
  talkToKaiser: { ja: 'カイザーに話しかける', en: 'Talk to Kaiser' },
  scrollUp: { ja: '上へ', en: 'Scroll up' },
  scrollDown: { ja: '下へ', en: 'Scroll down' },
  endOfRecords: 'END OF RECORDS',
  roomTitle: { ja: 'カイザーの部屋', en: "Kaiser's Room" },
} satisfies Record<string, Text>

export type UiKey = keyof typeof ui

export function tr(key: UiKey) {
  return t(ui[key])
}

/** data-i18n などの印が付いた要素の文字を、今の言語に入れ替える */
export function applyI18n(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = tr(el.dataset.i18n as UiKey)
  })
  root.querySelectorAll<HTMLElement>('[data-i18n-label]').forEach((el) => {
    const s = tr(el.dataset.i18nLabel as UiKey)
    el.setAttribute('aria-label', s)
    el.title = s
  })
  root.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = tr(el.dataset.i18nPlaceholder as UiKey)
  })
}
