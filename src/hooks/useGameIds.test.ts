import { renderHook } from '@testing-library/react'

import { useGameIds } from './useGameIds'

describe('useGameIds', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  beforeEach(() => {
    jest.setSystemTime(new Date('2025-01-05'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('returns game IDs from January 1, 2025 to today', () => {
    const { result } = renderHook(() => useGameIds())

    expect(result.current).toEqual(['2025-01-05', '2025-01-04', '2025-01-03', '2025-01-02', '2025-01-01'])
  })

  it('returns single game ID when today is January 1, 2025', () => {
    jest.setSystemTime(new Date('2025-01-01'))

    const { result } = renderHook(() => useGameIds())

    expect(result.current).toEqual(['2025-01-01'])
  })
})
