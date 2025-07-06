import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as gastby from 'gatsby'
import React from 'react'

import { GameSelection } from './index'
import { useGameIds } from '@hooks/useGameIds'

jest.mock('@hooks/useGameIds')
jest.mock('gatsby')

describe('GameSelection', () => {
  const mockGameIds = ['2025-01-03', '2025-01-02', '2025-01-01']

  beforeAll(() => {
    jest.mocked(useGameIds).mockReturnValue(mockGameIds)
  })

  it('displays select with game options', () => {
    render(<GameSelection gameId="2025-01-02" />)

    expect(screen.getByLabelText('Select game')).toBeInTheDocument()
  })

  it('calls navigate when selection changes', async () => {
    const user = userEvent.setup()
    render(<GameSelection gameId="2025-01-02" />)

    const select = screen.getByLabelText('Select game')
    await user.click(select)
    const option = screen.getByRole('option', { name: '1/3/2025' })
    await user.click(option)

    expect(gastby.navigate).toHaveBeenCalledWith('/g/2025-01-03')
  })

  it('displays current gameId as selected', () => {
    render(<GameSelection gameId="2025-01-02" />)

    expect(screen.getByText('1/2/2025')).toBeInTheDocument()
  })
})
