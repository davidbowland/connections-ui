import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { ConnectionsGame } from './index'
import { GameSelection } from '@components/game-selection'
import { useConnectionsGame } from '@hooks/useConnectionsGame'
import { gameId, useConnectionsGameResult, wordList } from '@test/__mocks__'

jest.mock('@hooks/useConnectionsGame')
jest.mock('@components/game-selection')

describe('ConnectionsGame', () => {
  beforeAll(() => {
    jest.mocked(useConnectionsGame).mockReturnValue(useConnectionsGameResult)

    Math.random = jest.fn().mockReturnValue(0)
    window.HTMLElement.prototype.scrollIntoView = jest.fn() // Calling this fails if we don't mock it
  })

  it('displays loading state', () => {
    jest.mocked(useConnectionsGame).mockReturnValueOnce({
      ...useConnectionsGameResult,
      categories: {},
      isLoading: true,
      words: [],
    })

    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('displays error state', () => {
    const errorMessage = 'Failed to load game'
    jest.mocked(useConnectionsGame).mockReturnValueOnce({
      ...useConnectionsGameResult,
      errorMessage,
    })

    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.getByText(`Error loading game: ${errorMessage}`)).toBeInTheDocument()
  })

  it('displays game grid with words', () => {
    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.getByText('Connections')).toBeInTheDocument()
    expect(screen.getByText('January 15, 2025')).toBeInTheDocument()

    wordList.forEach((word) => {
      expect(screen.getByRole('button', { name: word.toUpperCase() })).toBeInTheDocument()
    })
  })

  it('displays solved categories', () => {
    const mockResult = {
      ...useConnectionsGameResult,
      solvedCategories: [
        {
          description: 'Category 1',
          words: ['WORD01', 'WORD02', 'WORD03', 'WORD04'],
        },
      ],
      words: wordList.slice(4),
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.getByText('Category 1')).toBeInTheDocument()
    expect(screen.getByText('WORD01, WORD02, WORD03, WORD04')).toBeInTheDocument()
  })

  it('calls selectWord when word is clicked', async () => {
    const user = userEvent.setup()
    const mockSelectWord = jest.fn()
    const mockResult = {
      ...useConnectionsGameResult,
      selectWord: mockSelectWord,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    const wordButton = screen.getByRole('button', { name: 'WORD01' })
    await user.click(wordButton)

    expect(mockSelectWord).toHaveBeenCalledWith('WORD01')
  })

  it('calls unselectWord when selected word is clicked', async () => {
    const user = userEvent.setup()
    const mockUnselectWord = jest.fn()
    const mockResult = {
      ...useConnectionsGameResult,
      selectedWords: ['WORD01'],
      unselectWord: mockUnselectWord,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    const wordButton = screen.getByRole('button', { name: 'WORD01' })
    await user.click(wordButton)

    expect(mockUnselectWord).toHaveBeenCalledWith('WORD01')
  })

  it('does not display submit button when fewer than 4 words selected', () => {
    const mockResult = {
      ...useConnectionsGameResult,
      selectedWords: ['WORD01', 'WORD02'],
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
  })

  it('calls submitWords when submit button is clicked', async () => {
    const user = userEvent.setup()
    const mockSubmitWords = jest.fn()
    const mockResult = {
      ...useConnectionsGameResult,
      selectedWords: ['WORD01', 'WORD02', 'WORD03', 'WORD04'],
      submitWords: mockSubmitWords,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    expect(mockSubmitWords).toHaveBeenCalled()
  })

  it('calls clearSelectedWords when clear button is clicked', async () => {
    const user = userEvent.setup()
    const mockClearSelectedWords = jest.fn()
    const mockResult = {
      ...useConnectionsGameResult,
      clearSelectedWords: mockClearSelectedWords,
      selectedWords: ['WORD01'],
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    const clearButton = screen.getByRole('button', { name: 'Clear selection' })
    await user.click(clearButton)

    expect(mockClearSelectedWords).toHaveBeenCalled()
  })

  it('displays reveal solution button when enabled', () => {
    const mockResult = {
      ...useConnectionsGameResult,
      isRevealSolutionEnabled: true,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.getByRole('button', { name: 'Reveal solution' })).toBeInTheDocument()
  })

  it('calls revealSolution when reveal solution button is clicked', async () => {
    const user = userEvent.setup()
    const mockRevealSolution = jest.fn()
    const mockResult = {
      ...useConnectionsGameResult,
      isRevealSolutionEnabled: true,
      revealSolution: mockRevealSolution,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    const revealButton = screen.getByRole('button', { name: 'Reveal solution' })
    await user.click(revealButton)

    expect(mockRevealSolution).toHaveBeenCalled()
  })

  it('displays incorrect guesses counter', () => {
    const mockResult = {
      ...useConnectionsGameResult,
      incorrectGuesses: 2,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.getByText('Incorrect guesses: 2')).toBeInTheDocument()
  })

  it('displays game selection', () => {
    render(<ConnectionsGame gameId={gameId} />)

    expect(GameSelection).toHaveBeenCalled()
  })

  it('displays One away message when isOneAway is true', () => {
    const mockResult = {
      ...useConnectionsGameResult,
      isOneAway: true,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.getByText('One away!')).toBeInTheDocument()
  })

  it('does not display One away message when isOneAway is false', () => {
    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.queryByText('One away!')).not.toBeInTheDocument()
  })

  it('displays get hint button when enabled', () => {
    const mockResult = {
      ...useConnectionsGameResult,
      isGetHintEnabled: true,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.getByRole('button', { name: 'Get hint' })).toBeInTheDocument()
  })

  it('does not display get hint button when disabled', () => {
    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.queryByRole('button', { name: 'Get hint' })).not.toBeInTheDocument()
  })

  it('calls getHint when get hint button is clicked', async () => {
    const user = userEvent.setup()
    const mockGetHint = jest.fn()
    const mockResult = {
      ...useConnectionsGameResult,
      getHint: mockGetHint,
      isGetHintEnabled: true,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    const hintButton = screen.getByRole('button', { name: 'Get hint' })
    await user.click(hintButton)

    expect(mockGetHint).toHaveBeenCalled()
  })

  it('displays hints above one away message', () => {
    const mockResult = {
      ...useConnectionsGameResult,
      hints: ['Test hint 1', 'Test hint 2'],
      isOneAway: true,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.getByText('Test hint 1')).toBeInTheDocument()
    expect(screen.getByText('Test hint 2')).toBeInTheDocument()
    expect(screen.getByText('One away!')).toBeInTheDocument()
  })

  it('does not display hints when none are available', () => {
    render(<ConnectionsGame gameId={gameId} />)

    expect(screen.queryByText(/hint/i)).not.toBeInTheDocument()
  })
})
