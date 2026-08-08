import { act, renderHook } from '@testing-library/react'

import { useOnline } from './useOnline'

describe('useOnline', () => {
  const setNavigatorOnLine = (value: boolean): void => {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value, writable: true })
  }

  beforeAll(() => {
    setNavigatorOnLine(true)
  })

  it('reports the initial navigator state', () => {
    const { result } = renderHook(() => useOnline())

    expect(result.current).toBe(true)
  })

  it('reports false once an offline event fires', () => {
    const { result } = renderHook(() => useOnline())

    act(() => {
      setNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('reports true again once an online event fires', () => {
    const { result } = renderHook(() => useOnline())

    act(() => {
      setNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })
    act(() => {
      setNavigatorOnLine(true)
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })

  it('removes its listeners on unmount', () => {
    const removeEventListener = jest.spyOn(window, 'removeEventListener')

    renderHook(() => useOnline()).unmount()

    expect(removeEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })
})
