import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as gatsby from 'gatsby'
import React from 'react'

import { GameSelection } from './index'
import { useGameIds } from '@hooks/useGameIds'

jest.mock('@hooks/useGameIds')
jest.mock('gatsby')

describe('GameSelection', () => {
  const mockGameIds = ['2025-01-03', '2025-01-02', '2025-01-01']
  const defaultMockResult = {
    errorMessage: null,
    gameIds: mockGameIds,
    isLoading: false,
  }

  beforeEach(() => {
    jest.mocked(useGameIds).mockReturnValue(defaultMockResult)
    jest.mocked(gatsby.navigate).mockClear()
  })

  it('displays select with game options when not loading', () => {
    render(<GameSelection gameId="2025-01-02" />)

    expect(screen.getByLabelText('Select game')).toBeInTheDocument()
  })

  it('does not display select when loading', () => {
    jest.mocked(useGameIds).mockReturnValue({
      ...defaultMockResult,
      isLoading: true,
    })

    render(<GameSelection gameId="2025-01-02" />)

    expect(screen.queryByLabelText('Select game')).not.toBeInTheDocument()
  })

  it('displays error message when present', () => {
    const errorMessage = 'Unable to load game IDs'
    jest.mocked(useGameIds).mockReturnValue({
      ...defaultMockResult,
      errorMessage,
    })

    render(<GameSelection gameId="2025-01-02" />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('calls navigate when selection changes', async () => {
    const user = userEvent.setup()
    render(<GameSelection gameId="2025-01-02" />)

    const select = screen.getByLabelText('Select game')
    await user.click(select)
    const option = screen.getByRole('option', { name: '1/3/2025' })
    await user.click(option)

    expect(gatsby.navigate).toHaveBeenCalledWith('/g/2025-01-03')
  })

  it('displays current gameId as selected', () => {
    render(<GameSelection gameId="2025-01-02" />)

    expect(screen.getByText('1/2/2025')).toBeInTheDocument()
  })

  it('formats dates correctly', () => {
    render(<GameSelection gameId="2025-01-02" />)

    expect(screen.getByText('1/2/2025')).toBeInTheDocument()
  })

  it('displays both select and error message when error exists and not loading', () => {
    const errorMessage = 'Unable to load game IDs'
    jest.mocked(useGameIds).mockReturnValue({
      ...defaultMockResult,
      errorMessage,
    })

    render(<GameSelection gameId="2025-01-02" />)

    expect(screen.getByLabelText('Select game')).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('does not display error message when none exists', () => {
    render(<GameSelection gameId="2025-01-02" />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
