import RerollPage from '@pages/g/[gameId]/reroll'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { rerollGame } from '@services/connections'

jest.mock('@services/connections')
jest.mock('next/head', () => {
  const MockHead = ({ children }: { children: React.ReactNode }) => {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'title') {
        document.title = (child.props as { children: string }).children
      }
    })
    return null
  }
  MockHead.displayName = 'MockHead'
  return MockHead
})
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({ query: { gameId: '2024-01-01' } }),
}))

describe('RerollPage', () => {
  beforeEach(() => {
    jest.mocked(rerollGame).mockResolvedValue('Game is being regenerated')
  })

  it('renders the page with gameId in heading', () => {
    render(<RerollPage />)

    expect(screen.getByText('Reroll game: 2024-01-01')).toBeInTheDocument()
  })

  it('renders a password input and submit button', () => {
    render(<RerollPage />)

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reroll/i })).toBeInTheDocument()
  })

  it('disables submit button when password is empty', () => {
    render(<RerollPage />)

    expect(screen.getByRole('button', { name: /reroll/i })).toBeDisabled()
  })

  it('calls rerollGame on submit and shows success message', async () => {
    const user = userEvent.setup()
    render(<RerollPage />)

    await user.type(screen.getByLabelText(/password/i), 'my-password')
    await user.click(screen.getByRole('button', { name: /reroll/i }))

    await waitFor(() => {
      expect(rerollGame).toHaveBeenCalledWith('2024-01-01', 'my-password')
    })
    expect(screen.getByText('Game is being regenerated')).toBeInTheDocument()
  })

  it('shows error message on failure', async () => {
    jest.mocked(rerollGame).mockRejectedValueOnce(new Error('Forbidden: wrong password'))
    const user = userEvent.setup()
    render(<RerollPage />)

    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /reroll/i }))

    await waitFor(() => {
      expect(screen.getByText('Forbidden: wrong password')).toBeInTheDocument()
    })
  })

  it('renders title in document', () => {
    render(<RerollPage />)

    expect(document.title).toEqual('Reroll Game')
  })
})
