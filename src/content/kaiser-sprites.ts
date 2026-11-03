/*
 * ===== カイザーの絵 =====
 * ファイルは public/images/kaiser/ に置きます（×1 の透明PNG、同じ種類はキャンバスの大きさをそろえる）。
 *
 * faces … 表情の名前とファイル名。セリフの台本で [困り] のように書くと、その表情になります。
 *         まだ描いていない表情を台本で使っても、「通常」が出るだけなので大丈夫です。
 * blinkFrames … 瞬きのコマ。描けたらファイル名を順番に並べます（空なら瞬きしません）。
 */

export const faces: Record<string, string> = {
  通常: 'idle.png',
  // 困り: 'trouble.png',
  // 笑顔: 'smile.png',
}

export const blinkFrames: string[] = [
  // 'blink1.png',
  // 'blink2.png',
]
