import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import RerollPage, { Head } from './reroll'
import { rerollGame } from '@services/connections'
import { gameId } from '@test/__mocks__'

jest.mock('@services/connections')

describe('RerollPage', () => {
  beforeEach(() => {
    jest.mocked(rerollGame).mockResolvedValue('Game is being regenerated')
  })

  it('renders the page with gameId in heading', () => {
    render(<RerollPage params={{ gameId }} />)

    expect(screen.getByText(`Reroll game: ${gameId}`)).toBeInTheDocument()
  })

  it('renders a password input and submit button', () => {
    render(<RerollPage params={{ gameId }} />)

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reroll/i })).toBeInTheDocument()
  })

  it('disables submit button when password is empty', () => {
    render(<RerollPage params={{ gameId }} />)

    expect(screen.getByRole('button', { name: /reroll/i })).toBeDisabled()
  })

  it('calls rerollGame on submit and shows success message', async () => {
    const user = userEvent.setup()
    render(<RerollPage params={{ gameId }} />)

    await user.type(screen.getByLabelText(/password/i), 'my-password')
    await user.click(screen.getByRole('button', { name: /reroll/i }))

    await waitFor(() => {
      expect(rerollGame).toHaveBeenCalledWith(gameId, 'my-password')
    })
    expect(screen.getByText('Game is being regenerated')).toBeInTheDocument()
  })

  it('shows error message on failure', async () => {
    jest.mocked(rerollGame).mockRejectedValueOnce(new Error('Forbidden: wrong password'))
    const user = userEvent.setup()
    render(<RerollPage params={{ gameId }} />)

    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /reroll/i }))

    await waitFor(() => {
      expect(screen.getByText('Forbidden: wrong password')).toBeInTheDocument()
    })
  })

  it('renders Head with correct title', () => {
    render(<Head />)

    expect(document.title).toEqual('Reroll Game')
  })
})
