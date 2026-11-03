import type { Text } from '../i18n'

/*
 * ===== 作者について =====
 * メニューの「作者について」と、カイザーの「ご主人様について」から開くページの中身。
 * paragraphs は1つ＝1段落です。
 */

export const about: {
  paragraphs: Text[]
  links: { label: Text; url: string }[]
} = {
  paragraphs: [
    {
      ja: 'ここに作者のプロフィールが入ります。（準備中）',
      en: "The creator's profile will go here. (Coming soon)",
    },
  ],
  links: [],
}
