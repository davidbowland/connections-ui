import React from 'react'
import { render, screen } from '@testing-library/react'

import * as useConnectionsGameHook from '@hooks/useConnectionsGame'
import { ConnectionsGame } from './index'

jest.mock('@hooks/useConnectionsGame')

describe('ConnectionsGame', () => {
  const mockUseConnectionsGame = useConnectionsGameHook.useConnectionsGame as jest.MockedFunction<typeof useConnectionsGameHook.useConnectionsGame>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays loading state', () => {
    mockUseConnectionsGame.mockReturnValue({
      categories: {},
      words: [],
      isLoading: true,
      errorMessage: null,
    })

    render(<ConnectionsGame gameId="2024-01-15" />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('displays error state', () => {
    const errorMessage = 'Failed to load game'
    mockUseConnectionsGame.mockReturnValue({
      categories: {},
      words: [],
      isLoading: false,
      errorMessage: errorMessage,
    })

    render(<ConnectionsGame gameId="2024-01-15" />)

    expect(screen.getByText(`Error loading game: ${errorMessage}`)).toBeInTheDocument()
  })

  it('displays game grid with words', () => {
    const mockWords = [
      'word1', 'word2', 'word3', 'word4',
      'word5', 'word6', 'word7', 'word8',
      'word9', 'word10', 'word11', 'word12',
      'word13', 'word14', 'word15', 'word16'
    ]

    mockUseConnectionsGame.mockReturnValue({
      categories: {
        'Category 1': { words: ['word1', 'word2', 'word3', 'word4'] },
        'Category 2': { words: ['word5', 'word6', 'word7', 'word8'] },
        'Category 3': { words: ['word9', 'word10', 'word11', 'word12'] },
        'Category 4': { words: ['word13', 'word14', 'word15', 'word16'] },
      },
      words: mockWords,
      isLoading: false,
      errorMessage: null,
    })

    render(<ConnectionsGame gameId="2024-01-15" />)

    expect(screen.getByText('Connections')).toBeInTheDocument()
    expect(screen.getByText('2024-01-15')).toBeInTheDocument()

    // Check that all 16 words are displayed as buttons
    mockWords.forEach(word => {
      expect(screen.getByRole('button', { name: word.toUpperCase() })).toBeInTheDocument()
    })
  })
})