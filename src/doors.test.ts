import { describe, expect, it } from 'vitest'
import { doorEdges, isClosed, manualFromDrag, restEdges } from './doors'

const H = 800
const none = { top: null, bottom: null }

describe('doors', () => {
  it('rests open and closes at the middle', () => {
    expect(doorEdges(H, none, 0)).toEqual(restEdges(H))
    const closed = doorEdges(H, none, 1)
    expect(closed.top).toBe(closed.bottom)
    expect(isClosed(closed)).toBe(true)
  })

  it('closes from where the handles left the doors', () => {
    const manual = { top: 0.3, bottom: null }
    expect(doorEdges(H, manual, 0).top).toBe(240)
    const half = doorEdges(H, manual, 0.5)
    expect(half.top).toBeCloseTo((240 + (85 + 750) / 2) / 2)
  })

  it('keeps the top door above the bottom door', () => {
    const v = manualFromDrag(H, { top: null, bottom: 0.5 }, 'top', 700, 0)
    expect(v * H).toBe(400)
  })

  it('cannot pull a door past its open position', () => {
    expect(manualFromDrag(H, none, 'top', 0, 0) * H).toBe(85)
    expect(manualFromDrag(H, none, 'bottom', 900, 0) * H).toBe(750)
  })

  it('follows the pointer while partly closed by scrolling', () => {
    const v = manualFromDrag(H, none, 'top', 300, 0.5)
    expect(doorEdges(H, { top: v, bottom: null }, 0.5).top).toBeCloseTo(300)
  })
})
