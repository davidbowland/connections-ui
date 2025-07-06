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
  const selectWord = async (result: any, word: string) => {
    result.current.selectWord(word)
    await waitFor(() => expect(result.current.selectedWords).toContain(word))
  }

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

  it('submits correct words and solves category', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD02')
    await selectWord(result, 'WORD03')
    await selectWord(result, 'WORD04')
    expect(result.current.selectedWords).toHaveLength(4)

    const success = result.current.submitWords()
    expect(success).toBe(true)

    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(1))
    expect(result.current.solvedCategories[0]).toEqual({
      description: 'Category 1',
      words: ['WORD01', 'WORD02', 'WORD03', 'WORD04'],
    })
    expect(result.current.selectedWords).toEqual([])
    expect(result.current.words).toHaveLength(12)
  })

  it('handles incorrect submissions and tracks guesses', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD02')
    await selectWord(result, 'WORD05')
    await selectWord(result, 'WORD06')

    await waitFor(() => expect(result.current.selectedWords).toHaveLength(4))

    const success = result.current.submitWords()
    expect(success).toBe(false)

    await waitFor(() => expect(result.current.incorrectGuesses).toBe(1))
    expect(result.current.selectedWords).toEqual(['WORD01', 'WORD02', 'WORD05', 'WORD06'])
    expect(result.current.isRevealSolutionEnabled).toBe(false)
  })

  it('enables reveal solution after 4 incorrect guesses', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Make 4 incorrect guesses
    for (let i = 0; i < 4; i++) {
      await selectWord(result, 'WORD01')
      await selectWord(result, 'WORD02')
      await selectWord(result, 'WORD05')
      await selectWord(result, 'WORD06')
      await waitFor(() => expect(result.current.selectedWords).toHaveLength(4))
      result.current.submitWords()
      await waitFor(() => expect(result.current.incorrectGuesses).toBe(i + 1))
    }

    expect(result.current.isRevealSolutionEnabled).toBe(true)
  })

  it('reveals all solutions', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.revealSolution()

    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(4))
    expect(result.current.words).toEqual([])
    expect(result.current.selectedWords).toEqual([])
  })

  it('limits selection to 4 words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD02')
    await selectWord(result, 'WORD03')
    await selectWord(result, 'WORD05')
    result.current.selectWord('WORD06')

    await waitFor(() => expect(result.current.selectedWords).toHaveLength(4))
    expect(result.current.selectedWords).not.toContain('WORD06')
  })

  it('does not select already selected words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD01')

    await waitFor(() => expect(result.current.selectedWords).toEqual(['WORD01']))
  })

  it('returns false when submitting less than 4 words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')

    const success = result.current.submitWords()
    expect(success).toBe(false)
    expect(result.current.incorrectGuesses).toBe(0)
  })
})
