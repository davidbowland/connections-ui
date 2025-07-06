import { useConnectionsGame } from '@hooks/useConnectionsGame'
import { gameId, useConnectionsGameResult, wordList } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { ConnectionsGame } from './index'

jest.mock('@hooks/useConnectionsGame')

describe('ConnectionsGame', () => {
  beforeAll(() => {
    jest.mocked(useConnectionsGame).mockReturnValue(useConnectionsGameResult)
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
    expect(screen.getByText(gameId)).toBeInTheDocument()

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
})
