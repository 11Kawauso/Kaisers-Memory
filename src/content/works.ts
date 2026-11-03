import type { Text } from '../i18n'

/*
 * ===== 作品の一覧 =====
 * ここに1件書き足すと、サイトに作品が増えます。
 *
 * - 画像は public/images/works/ に入れて、images にファイル名を書きます（1枚目が表紙）。
 *   images を書かなければ、仮の画像が出ます。
 * - 日本語だけ書いておけばOK。英語（en）は Claude が書き足します。
 * - 上にあるものほど、サイトでも上に並びます。
 *
 * ※ 今入っている説明文は仮です。
 */

export type CategoryId = 'game' | 'site' | 'illust' | 'manga' | 'other'

export type Work = {
  /** URL に使う名前（半角英数字とハイフンだけ） */
  id: string
  title: Text
  category: CategoryId
  tags: Text[]
  /** 一覧に出る短い説明 */
  summary: Text
  /** 詳しく見たときの説明（改行できます） */
  description: Text
  images?: string[]
  year?: string
  status?: Text
  links?: { label: Text; url: string }[]
}

/** カテゴリ。作品が1つもないカテゴリは表示されません */
export const categories: { id: CategoryId; label: Text }[] = [
  { id: 'game', label: { ja: 'ゲーム', en: 'Games' } },
  { id: 'site', label: { ja: 'サイト', en: 'Websites' } },
  { id: 'illust', label: { ja: 'イラスト', en: 'Illustrations' } },
  { id: 'manga', label: { ja: '漫画', en: 'Manga' } },
  { id: 'other', label: { ja: 'その他', en: 'Others' } },
]

const inDev: Text = { ja: '制作中', en: 'In development' }
const open: Text = { ja: '開く', en: 'Open' }

export const works: Work[] = [
  {
    id: 'kaisers-memory',
    title: "Kaiser's Memory",
    category: 'site',
    tags: ['TypeScript', 'Web'],
    summary: { ja: 'このサイト。ご主人様の作品を保管する記録庫。', en: "This very site — an archive of my Master's works." },
    description: {
      ja: 'このサイトです。作品をまとめて見られる記録庫で、案内役のカイザーが常駐しています。',
      en: 'This very site. An archive for browsing the works, with Kaiser on duty as your guide.',
    },
    year: '2026',
    status: inDev,
  },
  {
    id: 'celestia',
    title: 'Celestia',
    category: 'game',
    tags: ['Unity', 'C#'],
    summary: { ja: 'Unity 6 で制作中のゲーム。', en: 'A game in development with Unity 6.' },
    description: { ja: 'Unity 6 で制作中のゲームです。', en: 'A game currently in development with Unity 6.' },
    year: '2026',
    status: inDev,
  },
  {
    id: 'rhythm-26keys',
    title: { ja: '26キー・リズムゲーム', en: '26-Key Rhythm Game' },
    category: 'game',
    tags: ['Unity', { ja: 'リズムゲーム', en: 'Rhythm game' }],
    summary: { ja: 'キーボードの26個のキーを使って遊ぶリズムゲーム。', en: 'A rhythm game played with all 26 letter keys.' },
    description: {
      ja: 'キーボードのアルファベット26キーを使って遊ぶリズムゲームです。',
      en: 'A rhythm game that uses all 26 alphabet keys on the keyboard.',
    },
    year: '2026',
    status: inDev,
  },
  {
    id: 'fontcreate-yui',
    title: { ja: 'フォントクリエイト・結', en: 'FontCreate YUI' },
    category: 'site',
    tags: ['TypeScript', 'Web', { ja: 'フォント', en: 'Fonts' }],
    summary: {
      ja: '点と点をつないで文字を描き、自分だけのフォントを作れるWebツール。',
      en: 'A web tool for drawing letters dot by dot and turning them into your own font.',
    },
    description: {
      ja: '点をクリックしてつなぐだけで文字が描けるWebツールです。\n描いた文字は PNG や .otf フォントとして書き出せます。',
      en: 'A web tool where you draw letters simply by clicking and connecting dots.\nYour letters can be exported as PNG images or as an .otf font.',
    },
    year: '2026',
    links: [{ label: open, url: 'https://11kawauso.github.io/FontCreate-YUI/' }],
  },
  {
    id: 'homedeko',
    title: 'Homedeko',
    category: 'site',
    tags: ['Web', 'iPhone'],
    summary: { ja: 'iPhoneのホーム画面を飾るためのページ。', en: 'A page for decorating your iPhone home screen.' },
    description: {
      ja: 'iPhoneのホーム画面を飾るためのページです。',
      en: 'A page for decorating your iPhone home screen.',
    },
    year: '2026',
    links: [{ label: open, url: 'https://11kawauso.github.io/homedeko/' }],
  },
  {
    id: 'noveru',
    title: 'noveru',
    category: 'site',
    tags: ['Web', { ja: '小説', en: 'Novels' }],
    summary: { ja: '小説サイト。', en: 'A novel website.' },
    description: { ja: '小説サイトです。', en: 'A website for novels.' },
    year: '2026',
  },
  {
    id: 'sanmenzu',
    title: { ja: '三面図テンプレート', en: 'Three-View Template' },
    category: 'other',
    tags: ['HTML', { ja: 'ツール', en: 'Tool' }],
    summary: { ja: '三面図を作るためのツール。', en: 'A tool for making three-view drawings.' },
    description: { ja: '三面図を作るためのツールです。', en: 'A tool for making three-view (front, side, back) drawings.' },
  },
]
