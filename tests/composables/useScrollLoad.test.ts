import { describe, expect, it, vi } from 'vitest'
import { isNearScrollBottom, isNearScrollTop, useScrollLoad } from '~/composables/useScrollLoad'

describe('useScrollLoad helpers', () => {
  it('detects top and bottom scroll positions', () => {
    const element = {
      scrollTop: 0,
      clientHeight: 100,
      scrollHeight: 300,
    } as HTMLElement

    expect(isNearScrollTop(element)).toBe(true)
    expect(isNearScrollBottom(element)).toBe(false)

    element.scrollTop = 200
    expect(isNearScrollTop(element)).toBe(false)
    expect(isNearScrollBottom(element)).toBe(true)
  })

  it('loads more when scroll trigger matches', async () => {
    const load = vi.fn().mockResolvedValue(undefined)
    const element = {
      scrollTop: 0,
      clientHeight: 100,
      scrollHeight: 300,
    } as HTMLElement

    const canLoad = true
    const scroll = useScrollLoad(() => element, load, {
      canLoadMore: () => canLoad,
      isScrollTrigger: isNearScrollTop,
    })

    await scroll.tryLoad(true)

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('ensureFilled loads until container is filled', async () => {
    const load = vi.fn().mockResolvedValue(undefined)
    let height = 100

    const element = {
      get scrollTop() {
        return 0
      },
      get clientHeight() {
        return 100
      },
      get scrollHeight() {
        return height
      },
    } as HTMLElement

    let loadsLeft = 2
    const scroll = useScrollLoad(
      () => element,
      async () => {
        await load()
        loadsLeft -= 1
        if (!loadsLeft) height = 200
      },
      {
        canLoadMore: () => loadsLeft > 0,
        isScrollTrigger: () => true,
      },
    )

    await scroll.ensureFilled((el) => el.scrollHeight <= el.clientHeight + 1)

    expect(load).toHaveBeenCalledTimes(2)
  })
})
