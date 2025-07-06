import { useConnectionsGame } from '@hooks/useConnectionsGame'
import { gameId, useConnectionsGameResult, wordList } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
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

  it('calls selectWord when word is clicked', () => {
    const mockSelectWord = jest.fn()
    const mockResult = {
      ...useConnectionsGameResult,
      selectWord: mockSelectWord,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    const wordButton = screen.getByRole('button', { name: 'WORD01' })
    wordButton.click()

    expect(mockSelectWord).toHaveBeenCalledWith('WORD01')
  })

  it('calls unselectWord when selected word is clicked', () => {
    const mockUnselectWord = jest.fn()
    const mockResult = {
      ...useConnectionsGameResult,
      selectedWords: ['WORD01'],
      unselectWord: mockUnselectWord,
    }
    jest.mocked(useConnectionsGame).mockReturnValueOnce(mockResult)

    render(<ConnectionsGame gameId={gameId} />)

    const wordButton = screen.getByRole('button', { name: 'WORD01' })
    wordButton.click()

    expect(mockUnselectWord).toHaveBeenCalledWith('WORD01')
  })
})
