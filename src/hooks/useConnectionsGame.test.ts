import { renderHook, waitFor } from '@testing-library/react'

import { dedupeKey, useConnectionsGame } from './useConnectionsGame'
import * as connections from '@services/connections'
import * as storage from '@services/storage'
import { connectionsGame, gameId, wordList } from '@test/__mocks__'

jest.mock('@services/connections')
jest.mock('@services/storage')

Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr: Uint32Array) => {
      arr.fill(0)
      return arr
    }),
  },
})

describe('useConnectionsGame', () => {
  const selectWord = async (result: any, word: string) => {
    result.current.selectWord(word)
    await waitFor(() => expect(result.current.selectedWords).toContain(word))
  }

  // navigator.onLine is a defined property on the jsdom navigator, so a value set by
  // one test outlives clearMocks. Every test that cares sets it explicitly.
  const setOnline = (onLine: boolean): void => {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: onLine, writable: true })
  }

  beforeAll(() => {
    jest.mocked(connections).fetchConnectionsGame.mockResolvedValue({ data: connectionsGame, isGenerating: false })

    console.error = jest.fn()
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('loads game data and shuffles words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(connectionsGame.categories)
    expect(result.current.errorMessage).toBeNull()
    expect(result.current.words.toSorted()).toEqual(wordList)
  })

  it('handles API errors', async () => {
    setOnline(true)
    jest.mocked(connections).fetchConnectionsGame.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("We couldn't load this puzzle. Refresh the page to try again.")
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.categories).toEqual({})
    expect(result.current.words).toEqual([])
  })

  // fetchConnectionsGame answers from storage without touching the network, so a
  // failure while offline means this puzzle is not on the device. "Refresh the page" is
  // then the one instruction that cannot work -- and with the service worker installed
  // the shell reloads and fails again, so it is advice that loops.
  it('names the real problem when the device is offline', async () => {
    setOnline(false)
    jest.mocked(connections).fetchConnectionsGame.mockRejectedValueOnce(new Error('Network Error'))

    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        'You’re offline and this puzzle isn’t on this device. Play one that is, or try again when you’re online.',
      )
    })

    setOnline(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('polls when game is generating', async () => {
    jest
      .mocked(connections)
      .fetchConnectionsGame.mockResolvedValueOnce({ data: connectionsGame, isGenerating: true })
      .mockResolvedValueOnce({ data: connectionsGame, isGenerating: false })

    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    expect(result.current.isLoading).toBe(true)

    // First call returns isGenerating: true
    await waitFor(() => {
      expect(connections.fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })

    // Advance timers by 10 seconds to trigger polling
    jest.advanceTimersByTime(10000)

    // Second call should complete the loading
    await waitFor(() => {
      expect(connections.fetchConnectionsGame).toHaveBeenCalledTimes(2)
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(connectionsGame.categories)
  })

  it('selects and unselects words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

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
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD02')
    await selectWord(result, 'WORD03')
    await selectWord(result, 'WORD04')
    expect(result.current.selectedWords).toHaveLength(4)

    expect(result.current.submitWords()).toBe('correct')

    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(1))
    expect(result.current.solvedCategories[0]).toEqual({
      description: 'Category 1',
      words: ['WORD01', 'WORD02', 'WORD03', 'WORD04'],
    })
    expect(result.current.selectedWords).toEqual([])
    expect(result.current.words).toHaveLength(12)
  })

  it('handles incorrect submissions and tracks guesses', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD02')
    await selectWord(result, 'WORD05')
    await selectWord(result, 'WORD06')

    await waitFor(() => expect(result.current.selectedWords).toHaveLength(4))

    expect(result.current.submitWords()).toBe('wrong')

    await waitFor(() => expect(result.current.incorrectGuesses).toBe(1))
    expect(result.current.selectedWords).toEqual(['WORD01', 'WORD02', 'WORD05', 'WORD06'])
    expect(result.current.isRevealSolutionAvailable).toBe(true)
  })

  it('enables reveal solution after 4 incorrect guesses', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const wrongCombos = [
      ['WORD01', 'WORD02', 'WORD05', 'WORD06'],
      ['WORD01', 'WORD02', 'WORD09', 'WORD10'],
      ['WORD01', 'WORD02', 'WORD13', 'WORD14'],
      ['WORD05', 'WORD06', 'WORD09', 'WORD10'],
    ]

    for (let i = 0; i < wrongCombos.length; i++) {
      for (const word of wrongCombos[i]) {
        await selectWord(result, word)
      }
      await waitFor(() => expect(result.current.selectedWords).toHaveLength(4))
      result.current.submitWords()
      await waitFor(() => expect(result.current.incorrectGuesses).toBe(i + 1))
      result.current.clearSelectedWords()
      await waitFor(() => expect(result.current.selectedWords).toHaveLength(0))
    }

    expect(result.current.isRevealSolutionAvailable).toBe(true)
  })

  it('reveals all solutions', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.revealSolution()

    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(4))
    expect(result.current.solvedCategories).toEqual([
      { description: 'Category 1', words: ['WORD01', 'WORD02', 'WORD03', 'WORD04'] },
      { description: 'Category 2', words: ['WORD05', 'WORD06', 'WORD07', 'WORD08'] },
      { description: 'Category 3', words: ['WORD09', 'WORD10', 'WORD11', 'WORD12'] },
      { description: 'Category 4', words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] },
    ])
    expect(result.current.words).toEqual([])
    expect(result.current.selectedWords).toEqual([])
  })

  it('limits selection to 4 words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

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
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD01')

    await waitFor(() => expect(result.current.selectedWords).toEqual(['WORD01']))
  })

  it('returns wrong when submitting less than 4 words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')

    expect(result.current.submitWords()).toBe('wrong')
    expect(result.current.incorrectGuesses).toBe(0)
  })

  it('returns one-away when 3 of 4 selected words are in the same category', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD02')
    await selectWord(result, 'WORD03')
    await selectWord(result, 'WORD05')

    await waitFor(() => expect(result.current.selectedWords).toHaveLength(4))

    expect(result.current.submitWords()).toBe('one-away')
  })

  it('blocks duplicate submissions without counting as a guess', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD02')
    await selectWord(result, 'WORD05')
    await selectWord(result, 'WORD06')
    await waitFor(() => expect(result.current.selectedWords).toHaveLength(4))

    expect(result.current.submitWords()).toBe('wrong')
    await waitFor(() => expect(result.current.incorrectGuesses).toBe(1))

    expect(result.current.submitWords()).toBe('duplicate')
    expect(result.current.incorrectGuesses).toBe(1)
  })

  it('enables hints when categories are available', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isHintAvailable).toBe(true)
  })

  it('provides hints for unsolved categories', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hints).toEqual([])

    result.current.getHint()
    await waitFor(() => expect(result.current.hints).toHaveLength(1))
    expect(result.current.hints[0]).toMatch(/Hint for category/)
  })

  it('removes hints when category is solved', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.getHint()
    await waitFor(() => expect(result.current.hints).toHaveLength(1))

    // Solve Category 1
    await selectWord(result, 'WORD01')
    await selectWord(result, 'WORD02')
    await selectWord(result, 'WORD03')
    await selectWord(result, 'WORD04')
    result.current.submitWords()

    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(1))
    expect(result.current.hints).toEqual([])
  })

  it('disables hints when no more categories available', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Get hints for all categories
    for (let i = 0; i < 4; i++) {
      result.current.getHint()
      await waitFor(() => expect(result.current.hints).toHaveLength(i + 1))
    }

    expect(result.current.isHintAvailable).toBe(false)
  })

  it('tracks the number of hints received', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hintsUsed).toBe(0)

    result.current.getHint()
    await waitFor(() => expect(result.current.hintsUsed).toBe(1))

    result.current.getHint()
    await waitFor(() => expect(result.current.hintsUsed).toBe(2))
  })

  it('returns the correct categories count', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categoriesCount).toBe(4)
  })

  const selectFour = async (result: any, words: string[]) => {
    await selectWord(result, words[0])
    await selectWord(result, words[1])
    await selectWord(result, words[2])
    await selectWord(result, words[3])
    await waitFor(() => expect(result.current.selectedWords).toHaveLength(4))
  }

  it('records a one-away guess', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()

    await waitFor(() => expect(result.current.oneAwayGuesses).toEqual([['WORD01', 'WORD02', 'WORD03', 'WORD05']]))
  })

  it('does not record a guess that is not one away', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD05', 'WORD06'])
    result.current.submitWords()

    await waitFor(() => expect(result.current.incorrectGuesses).toBe(1))
    expect(result.current.oneAwayGuesses).toEqual([])
  })

  it('does not record a correct guess', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD04'])
    result.current.submitWords()

    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(1))
    expect(result.current.oneAwayGuesses).toEqual([])
  })

  it('does not record a duplicate submission twice', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.oneAwayGuesses).toHaveLength(1))

    expect(result.current.submitWords()).toBe('duplicate')

    result.current.getHint()
    await waitFor(() => expect(result.current.hintsUsed).toBe(1))

    expect(result.current.oneAwayGuesses).toHaveLength(1)
  })

  it('keeps every one-away guess without a cap', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const guesses = [
      ['WORD01', 'WORD02', 'WORD03', 'WORD05'],
      ['WORD01', 'WORD02', 'WORD03', 'WORD06'],
      ['WORD01', 'WORD02', 'WORD03', 'WORD07'],
      ['WORD01', 'WORD02', 'WORD03', 'WORD08'],
      ['WORD01', 'WORD02', 'WORD03', 'WORD09'],
      ['WORD01', 'WORD02', 'WORD03', 'WORD10'],
    ]

    for (const [index, guess] of guesses.entries()) {
      result.current.clearSelectedWords()
      await waitFor(() => expect(result.current.selectedWords).toHaveLength(0))
      await selectFour(result, guess)
      result.current.submitWords()
      await waitFor(() => expect(result.current.oneAwayGuesses).toHaveLength(index + 1))
    }

    expect(result.current.oneAwayGuesses).toHaveLength(6)
  })

  it('hides a one-away guess once its words leave the board', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.oneAwayGuesses).toHaveLength(1))

    result.current.clearSelectedWords()
    await waitFor(() => expect(result.current.selectedWords).toHaveLength(0))
    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD04'])
    result.current.submitWords()

    await waitFor(() => expect(result.current.oneAwayGuesses).toEqual([]))
  })

  it('clears recorded one-away guesses when the game changes', async () => {
    const { rerender, result } = renderHook(({ id }) => useConnectionsGame(id, () => 0), {
      initialProps: { id: gameId },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.oneAwayGuesses).toHaveLength(1))

    rerender({ id: '2025-01-16' })

    await waitFor(() => expect(result.current.words).toHaveLength(16))

    expect(result.current.oneAwayGuesses).toEqual([])
  })

  it('hides every one-away guess after revealing the solution', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.oneAwayGuesses).toHaveLength(1))

    result.current.revealSolution()

    await waitFor(() => expect(result.current.oneAwayGuesses).toEqual([]))
  })

  it('replaces the selection with selectWords', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectWord(result, 'WORD16')
    result.current.selectWords(['WORD01', 'WORD02', 'WORD03', 'WORD04'])

    await waitFor(() => expect(result.current.selectedWords).toEqual(['WORD01', 'WORD02', 'WORD03', 'WORD04']))
  })

  it('truncates selectWords input to four words', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    result.current.selectWords(['WORD01', 'WORD02', 'WORD03', 'WORD04', 'WORD05'])

    await waitFor(() => expect(result.current.selectedWords).toEqual(['WORD01', 'WORD02', 'WORD03', 'WORD04']))
  })

  it('marks the selection as submitted after submitWords', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isSelectionSubmitted).toBe(false)

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()

    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(true))
  })

  it('marks the selection as submitted after a duplicate submission', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(true))

    result.current.unselectWord('WORD05')
    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(false))
    await selectWord(result, 'WORD05')

    expect(result.current.submitWords()).toBe('duplicate')
    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(true))
  })

  it('clears the submitted flag once the selection changes after a submit', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(true))

    result.current.unselectWord('WORD05')
    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(false))

    await selectWord(result, 'WORD06')

    expect(result.current.isSelectionSubmitted).toBe(false)
    expect(result.current.selectedWords).toEqual(['WORD01', 'WORD02', 'WORD03', 'WORD06'])
  })

  it('keeps the submitted flag when a fifth word is tapped', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(true))

    result.current.selectWord('WORD06')

    result.current.getHint()
    await waitFor(() => expect(result.current.hintsUsed).toBe(1))

    expect(result.current.isSelectionSubmitted).toBe(true)
    expect(result.current.selectedWords).toEqual(['WORD01', 'WORD02', 'WORD03', 'WORD05'])
  })

  it('clears the submitted flag when a correct guess clears the selection', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD04'])
    result.current.submitWords()

    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(1))

    expect(result.current.isSelectionSubmitted).toBe(false)
    expect(result.current.selectedWords).toEqual([])
  })

  it('clears the submitted flag when the solution is revealed', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(true))

    result.current.revealSolution()

    await waitFor(() => expect(result.current.words).toHaveLength(0))

    expect(result.current.isSelectionSubmitted).toBe(false)
  })

  it('leaves an old guess ready to warn after another category is solved', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD05', 'WORD06', 'WORD09', 'WORD10'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.incorrectGuesses).toBe(1))

    result.current.clearSelectedWords()
    await waitFor(() => expect(result.current.selectedWords).toHaveLength(0))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD04'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(1))

    await selectFour(result, ['WORD05', 'WORD06', 'WORD09', 'WORD10'])

    expect(result.current.isSelectionSubmitted).toBe(false)
    expect(result.current.pastGuesses.has(dedupeKey(['WORD05', 'WORD06', 'WORD09', 'WORD10']))).toBe(true)
  })

  it('clears the submitted flag when the selection is cleared', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(true))

    result.current.clearSelectedWords()

    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(false))
  })

  it('clears the submitted flag when selectWords restores a guess', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await selectFour(result, ['WORD01', 'WORD02', 'WORD03', 'WORD05'])
    result.current.submitWords()
    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(true))

    result.current.selectWords(['WORD01', 'WORD02', 'WORD03', 'WORD05'])

    await waitFor(() => expect(result.current.isSelectionSubmitted).toBe(false))
  })

  const solveCategory = async (result: any, words: string[], solvedCount: number) => {
    await selectFour(result, words)
    expect(result.current.submitWords()).toBe('correct')
    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(solvedCount))
  }

  const CATEGORY_WORDS = [
    ['WORD01', 'WORD02', 'WORD03', 'WORD04'],
    ['WORD05', 'WORD06', 'WORD07', 'WORD08'],
    ['WORD09', 'WORD10', 'WORD11', 'WORD12'],
    ['WORD13', 'WORD14', 'WORD15', 'WORD16'],
  ]

  it('records the puzzle as solved when every category is solved by submission', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await solveCategory(result, CATEGORY_WORDS[0], 1)
    await solveCategory(result, CATEGORY_WORDS[1], 2)
    await solveCategory(result, CATEGORY_WORDS[2], 3)
    await solveCategory(result, CATEGORY_WORDS[3], 4)

    expect(storage.markSolved).toHaveBeenCalledWith(gameId)
    expect(storage.markSolved).toHaveBeenCalledTimes(1)
  })

  it('does not record the puzzle before the final category is solved', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await solveCategory(result, CATEGORY_WORDS[0], 1)
    await solveCategory(result, CATEGORY_WORDS[1], 2)
    await solveCategory(result, CATEGORY_WORDS[2], 3)

    expect(storage.markSolved).not.toHaveBeenCalled()
  })

  it('does not record the puzzle when the solution is revealed', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    result.current.revealSolution()
    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(4))

    expect(storage.markSolved).not.toHaveBeenCalled()
  })

  it('does not record the puzzle when three categories are solved and the rest revealed', async () => {
    const { result } = renderHook(() => useConnectionsGame(gameId, () => 0))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await solveCategory(result, CATEGORY_WORDS[0], 1)
    await solveCategory(result, CATEGORY_WORDS[1], 2)
    await solveCategory(result, CATEGORY_WORDS[2], 3)

    result.current.revealSolution()
    await waitFor(() => expect(result.current.solvedCategories).toHaveLength(4))
    await waitFor(() => expect(result.current.words).toEqual([]))

    expect(storage.markSolved).not.toHaveBeenCalled()
  })

  it('records the puzzle currently being played, not the one it replaced', async () => {
    const { rerender, result } = renderHook(({ id }) => useConnectionsGame(id, () => 0), {
      initialProps: { id: gameId },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await solveCategory(result, CATEGORY_WORDS[0], 1)

    rerender({ id: '2025-01-16' })
    await waitFor(() => expect(result.current.words).toHaveLength(16))

    await solveCategory(result, CATEGORY_WORDS[0], 1)
    await solveCategory(result, CATEGORY_WORDS[1], 2)
    await solveCategory(result, CATEGORY_WORDS[2], 3)
    await solveCategory(result, CATEGORY_WORDS[3], 4)

    expect(storage.markSolved).toHaveBeenCalledWith('2025-01-16')
    expect(storage.markSolved).not.toHaveBeenCalledWith(gameId)
  })

  it('does not record the next puzzle when the game id changes after a win', async () => {
    const { rerender, result } = renderHook(({ id }) => useConnectionsGame(id, () => 0), {
      initialProps: { id: gameId },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await solveCategory(result, CATEGORY_WORDS[0], 1)
    await solveCategory(result, CATEGORY_WORDS[1], 2)
    await solveCategory(result, CATEGORY_WORDS[2], 3)
    await solveCategory(result, CATEGORY_WORDS[3], 4)

    rerender({ id: '2025-01-16' })
    await waitFor(() => expect(result.current.words).toHaveLength(16))
    await waitFor(() => expect(result.current.solvedCategories).toEqual([]))

    expect(storage.markSolved).not.toHaveBeenCalledWith('2025-01-16')
    expect(storage.markSolved).toHaveBeenCalledTimes(1)
  })

  it('does not record the previous puzzle when the game id changes mid-session', async () => {
    const { rerender, result } = renderHook(({ id }) => useConnectionsGame(id, () => 0), {
      initialProps: { id: gameId },
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await solveCategory(result, CATEGORY_WORDS[0], 1)
    await solveCategory(result, CATEGORY_WORDS[1], 2)
    await solveCategory(result, CATEGORY_WORDS[2], 3)

    rerender({ id: '2025-01-16' })
    await waitFor(() => expect(result.current.words).toHaveLength(16))
    await waitFor(() => expect(result.current.solvedCategories).toEqual([]))

    expect(storage.markSolved).not.toHaveBeenCalled()
  })
})
