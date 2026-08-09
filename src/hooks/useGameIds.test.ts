import { renderHook } from '@testing-library/react'

import { UseGameIdsResult, useGameIds } from './useGameIds'

describe('useGameIds', () => {
  // 2026-08-08T21:30:00Z. TZ is pinned to UTC in jest.setup-test-env.js.
  const now = () => 1_786_224_600_000

  it('returns every game id newest first, with no network call to fail', () => {
    const { result } = renderHook(() => useGameIds(now))

    expect(result.current.gameIds[0]).toBe('2026-08-08')
    expect(result.current.gameIds.at(-1)).toBe('2025-01-01')
    expect(result.current.errorMessage).toBeNull()
  })

  it('is done loading once the browser has it', () => {
    const { result } = renderHook(() => useGameIds(now))

    expect(result.current.isLoading).toBe(false)
  })

  // The export is prerendered in Node, and effects never run there -- so whatever the
  // first render returns is what ships in the HTML. Hand back the list and the labels
  // carry the server's locale while the count is frozen at deploy time: two guaranteed
  // hydration mismatches.
  it('hands back nothing on the first render, before effects run', () => {
    const renders: UseGameIdsResult[] = []

    renderHook(() => {
      const value = useGameIds(now)
      renders.push(value)
      return value
    })

    expect(renders[0].gameIds).toEqual([])
    expect(renders[0].isLoading).toBe(true)
  })

  // No injected clock. The first id moves with the calendar, but the last one is the
  // first puzzle ever published and never changes, so the assertion stays deterministic.
  it('falls back to the real clock', () => {
    const { result } = renderHook(() => useGameIds())

    expect(result.current.gameIds.at(-1)).toBe('2025-01-01')
  })

  it('keeps the same array across renders', () => {
    const { rerender, result } = renderHook(() => useGameIds(now))
    const first = result.current.gameIds

    rerender()

    expect(result.current.gameIds).toBe(first)
  })
})
