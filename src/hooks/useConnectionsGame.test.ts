import { renderHook, waitFor } from '@testing-library/react'

import * as connections from '@services/connections'
import { useConnectionsGame } from './useConnectionsGame'

jest.mock('@services/connections')

// Mock crypto.getRandomValues
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr: Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 0xffffffff)
      }
      return arr
    }),
  },
})

describe('useConnectionsGame', () => {
  const gameId = '2024-01-15'
  const mockGame = {
    categories: {
      'Category 1': { words: ['word01', 'word02', 'word03', 'word04'] },
      'Category 2': { words: ['word05', 'word06', 'word07', 'word08'] },
      'Category 3': { words: ['word09', 'word10', 'word11', 'word12'] },
      'Category 4': { words: ['word13', 'word14', 'word15', 'word16'] },
    },
  }

  beforeAll(() => {
    jest.mocked(connections).fetchConnectionsGame.mockResolvedValue(mockGame)
  })

  it('loads game data and shuffles words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(mockGame.categories)
    expect(result.current.errorMessage).toBeNull()
    expect(result.current.words.toSorted()).toEqual(['word01', 'word02', 'word03', 'word04', 'word05', 'word06', 'word07', 'word08', 'word09', 'word10', 'word11', 'word12', 'word13', 'word14', 'word15', 'word16'])
  })

  it('handles API errors', async () => {
    const errorMessage = 'API Error'
    jest.mocked(connections).fetchConnectionsGame.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.errorMessage).toBe(errorMessage)
    expect(result.current.categories).toEqual({})
    expect(result.current.words).toEqual([])
  })
})