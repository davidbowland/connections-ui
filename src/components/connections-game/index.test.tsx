import { useConnectionsGame } from '@hooks/useConnectionsGame'
import { useConnectionsGameResult, wordList } from '@test/__mocks__'
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
      categories: {},
      errorMessage: null,
      isLoading: true,
      words: [],
    })

    render(<ConnectionsGame gameId="2024-01-15" />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('displays error state', () => {
    const errorMessage = 'Failed to load game'
    jest.mocked(useConnectionsGame).mockReturnValueOnce({
      categories: {},
      errorMessage: errorMessage,
      isLoading: false,
      words: [],
    })

    render(<ConnectionsGame gameId="2024-01-15" />)

    expect(screen.getByText(`Error loading game: ${errorMessage}`)).toBeInTheDocument()
  })

  it('displays game grid with words', () => {
    render(<ConnectionsGame gameId="2024-01-15" />)

    expect(screen.getByText('Connections')).toBeInTheDocument()
    expect(screen.getByText('2024-01-15')).toBeInTheDocument()

    wordList.forEach((word) => {
      expect(screen.getByRole('button', { name: word.toUpperCase() })).toBeInTheDocument()
    })
  })
})
