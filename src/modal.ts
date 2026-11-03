import { tr } from './i18n'

let current: { el: HTMLElement; onKey: (e: KeyboardEvent) => void } | null = null

/** ホログラム風の大きな窓（作品の詳細・作者について） */
export function openModal(html: string, onRequestClose: () => void, className = '') {
  closeModal()
  const root = document.getElementById('modal-root')!
  const el = document.createElement('div')
  el.className = 'modal-backdrop'
  el.innerHTML = `
    <div class="modal holo-panel ${className}" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" aria-label="${tr('close')}" title="${tr('close')}"></button>
      <div class="modal-body">${html}</div>
    </div>`
  el.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target === el || target.closest('.modal-close')) onRequestClose()
  })
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onRequestClose()
  }
  addEventListener('keydown', onKey)
  root.append(el)
  document.documentElement.classList.add('modal-open')
  el.querySelector<HTMLElement>('.modal-close')!.focus({ preventScroll: true })
  current = { el, onKey }
  return el
}

export function closeModal() {
  if (!current) return
  removeEventListener('keydown', current.onKey)
  current.el.remove()
  current = null
  document.documentElement.classList.remove('modal-open')
}
