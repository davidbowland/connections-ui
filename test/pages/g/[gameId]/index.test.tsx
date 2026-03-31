import GamePage, { getStaticPaths, getStaticProps } from '@pages/g/[gameId]/index'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import React from 'react'

import { ConnectionsGame } from '@components/connections-game'
import PrivacyLink from '@components/privacy-link'

jest.mock('@components/connections-game')
jest.mock('@components/privacy-link')
jest.mock('@heroui/react', () => ({
  Skeleton: ({ className }: { className: string }) => <div className={className} data-testid="skeleton" />,
}))
jest.mock('next/router', () => ({
  useRouter: () => ({ asPath: '/g/2024-01-01' }),
}))
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

describe('GamePage', () => {
  beforeEach(() => {
    jest.mocked(ConnectionsGame).mockReturnValue(<>ConnectionsGame</>)
    jest.mocked(PrivacyLink).mockReturnValue(<>PrivacyLink</>)
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/g/2024-01-01' },
      writable: true,
    })
  })

  it('shows loading skeleton before effect fires', () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/' },
      writable: true,
    })
    render(<GamePage />)
    act(() => {})
    expect(screen.getByTestId('page-loading-skeleton')).toBeInTheDocument()
  })

  it('renders ConnectionsGame with gameId after mount', () => {
    render(<GamePage />)

    act(() => {}) // flush useEffect

    expect(ConnectionsGame).toHaveBeenCalledWith({ gameId: '2024-01-01' }, undefined)
  })

  it('renders PrivacyLink', () => {
    render(<GamePage />)

    expect(PrivacyLink).toHaveBeenCalled()
  })

  it('renders title in document', () => {
    render(<GamePage />)

    expect(document.title).toEqual('Connections')
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
