import RerollPage, { getStaticPaths, getStaticProps } from '@pages/g/[gameId]/reroll'
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
const mockUseRouter = jest.fn().mockReturnValue({ asPath: '/g/2024-01-01/reroll' })
jest.mock('next/router', () => ({
  useRouter: (...args: any[]) => mockUseRouter(...args),
}))

describe('RerollPage', () => {
  beforeEach(() => {
    jest.mocked(rerollGame).mockResolvedValue('Game is being regenerated')
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/g/2024-01-01/reroll' },
      writable: true,
    })
  })

  it('returns null when gameId is undefined', () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/reroll' },
      writable: true,
    })
    const { container } = render(<RerollPage />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the page with title and gameId', () => {
    render(<RerollPage />)

    expect(screen.getByText('Reroll Game')).toBeInTheDocument()
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
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

  it('shows generic error message on non-Error rejection', async () => {
    jest.mocked(rerollGame).mockRejectedValueOnce('string error')
    const user = userEvent.setup()
    render(<RerollPage />)

    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /reroll/i }))

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    })
  })

  it('renders title in document', () => {
    render(<RerollPage />)

    expect(document.title).toEqual('Reroll Game')
  })

  describe('getStaticPaths', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv })
    })

    it('returns blocking fallback in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development' })
      const result = getStaticPaths({} as any)
      expect(result).toEqual({ fallback: 'blocking', paths: [] })
    })

    it('returns false fallback in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' })
      const result = getStaticPaths({} as any)
      expect(result).toEqual({ fallback: false, paths: [{ params: { gameId: '__placeholder__' } }] })
    })
  })

  describe('getStaticProps', () => {
    it('returns empty props', () => {
      const result = (getStaticProps as any)({})
      expect(result).toEqual({ props: {} })
    })
  })
})
