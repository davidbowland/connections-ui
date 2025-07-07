import { renderHook, waitFor } from '@testing-library/react'

import { useGameIds } from './useGameIds'
import * as connections from '@services/connections'

jest.mock('@services/connections')

describe('useGameIds', () => {
  const mockGameIds = ['2025-01-05', '2025-01-04', '2025-01-03']

  beforeAll(() => {
    jest.mocked(connections).fetchConnectionsGameIds.mockResolvedValue({ gameIds: mockGameIds })

    console.error = jest.fn()
  })

  it('returns game IDs from API', async () => {
    const { result } = renderHook(() => useGameIds())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.gameIds).toEqual(mockGameIds)
    expect(result.current.errorMessage).toBeNull()
  })

  it('handles API errors', async () => {
    jest.mocked(connections).fetchConnectionsGameIds.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useGameIds())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('Unable to load game IDs')
    })

    expect(result.current.gameIds).toEqual([])
  })
})
