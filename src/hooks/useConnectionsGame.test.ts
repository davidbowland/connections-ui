import { connectionsGame, gameId, wordList } from '@test/__mocks__'
import { renderHook, waitFor } from '@testing-library/react'

import { useConnectionsGame } from './useConnectionsGame'
import * as connections from '@services/connections'

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
  beforeAll(() => {
    jest.mocked(connections).fetchConnectionsGame.mockResolvedValue(connectionsGame)

    console.error = jest.fn()
  })

  it('loads game data and shuffles words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(connectionsGame.categories)
    expect(result.current.errorMessage).toBeNull()
    expect(result.current.words.toSorted()).toEqual(wordList)
  })

  it('handles API errors', async () => {
    jest.mocked(connections).fetchConnectionsGame.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('Failed to load game')
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.categories).toEqual({})
    expect(result.current.words).toEqual([])
  })
})
