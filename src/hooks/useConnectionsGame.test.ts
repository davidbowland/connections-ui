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

  it('selects and unselects words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.selectWord('WORD01')
    await waitFor(() => expect(result.current.selectedWords).toEqual(['WORD01']))

    result.current.selectWord('WORD02')
    await waitFor(() => expect(result.current.selectedWords).toEqual(['WORD01', 'WORD02']))

    result.current.unselectWord('WORD01')
    await waitFor(() => expect(result.current.selectedWords).toEqual(['WORD02']))

    result.current.clearSelectedWords()
    await waitFor(() => expect(result.current.selectedWords).toEqual([]))
  })

  it('solves category when 4 correct words are selected', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.selectWord('WORD01')
    await waitFor(() => expect(result.current.selectedWords).toContain('WORD01'))
    result.current.selectWord('WORD02')
    await waitFor(() => expect(result.current.selectedWords).toContain('WORD02'))
    result.current.selectWord('WORD03')
    await waitFor(() => expect(result.current.selectedWords).toContain('WORD03'))
    result.current.selectWord('WORD04')

    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(1))
    expect(result.current.solvedCategories[0]).toEqual({
      description: 'Category 1',
      words: ['WORD01', 'WORD02', 'WORD03', 'WORD04'],
    })
    expect(result.current.selectedWords).toEqual([])
    expect(result.current.words).toHaveLength(12)
  })

  it('limits selection to 4 words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.selectWord('WORD01')
    await waitFor(() => expect(result.current.selectedWords).toContain('WORD01'))
    result.current.selectWord('WORD02')
    await waitFor(() => expect(result.current.selectedWords).toContain('WORD02'))
    result.current.selectWord('WORD03')
    await waitFor(() => expect(result.current.selectedWords).toContain('WORD03'))
    result.current.selectWord('WORD05')
    await waitFor(() => expect(result.current.selectedWords).toContain('WORD05'))
    result.current.selectWord('WORD06')

    await waitFor(() => expect(result.current.selectedWords).toHaveLength(4))
    expect(result.current.selectedWords).not.toContain('WORD06')
  })

  it('does not select already selected words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.selectWord('WORD01')
    await waitFor(() => expect(result.current.selectedWords).toContain('WORD01'))
    result.current.selectWord('WORD01')

    await waitFor(() => expect(result.current.selectedWords).toEqual(['WORD01']))
  })
})
