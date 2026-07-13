import GamePage, { getStaticPaths, getStaticProps } from '@pages/g/[gameId]/index'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import React from 'react'

import { ConnectionsGame } from '@components/connections-game'
import { GameSelection } from '@components/game-selection'
import PrivacyLink from '@components/privacy-link'

jest.mock('@components/connections-game')
jest.mock('@components/game-selection')
jest.mock('@components/privacy-link')
jest.mock('@heroui/react', () => ({
  Skeleton: ({ className }: { className: string }) => <div className={className} data-testid="skeleton" />,
}))
jest.mock('next/router', () => ({
  useRouter: () => ({ asPath: '/g/2024-01-01' }),
}))
jest.mock('next/head', () => {
  const MockHead = ({ children }: { children: React.ReactNode }) => {
    document.querySelectorAll('meta[data-mock-head]').forEach((el) => el.remove())
    React.Children.toArray(children).forEach((child) => {
      if (!React.isValidElement(child)) return
      if (child.type === 'title') {
        document.title = (child.props as { children: string }).children
      }
      if (child.type === 'meta') {
        const meta = document.createElement('meta')
        Object.entries(child.props as Record<string, string>).forEach(([key, value]) => meta.setAttribute(key, value))
        meta.setAttribute('data-mock-head', 'true')
        document.head.appendChild(meta)
      }
    })
    return null
  }
  MockHead.displayName = 'MockHead'
  return MockHead
})

describe('GamePage', () => {
  beforeAll(() => {
    jest.mocked(ConnectionsGame).mockReturnValue(<>ConnectionsGame</>)
    jest.mocked(GameSelection).mockReturnValue(<>GameSelection</>)
    jest.mocked(PrivacyLink).mockReturnValue(<>PrivacyLink</>)
  })

  const setup = () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/g/2024-01-01' },
      writable: true,
    })
  }

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
    setup()
    render(<GamePage />)

    act(() => {}) // flush useEffect

    expect(ConnectionsGame).toHaveBeenCalledWith({ gameId: '2024-01-01' }, undefined)
  })

  it('renders GameSelection with gameId after mount, independent of ConnectionsGame', () => {
    setup()
    render(<GamePage />)

    act(() => {}) // flush useEffect

    expect(GameSelection).toHaveBeenCalledWith({ gameId: '2024-01-01' }, undefined)
  })

  it('renders PrivacyLink', () => {
    setup()
    render(<GamePage />)

    expect(PrivacyLink).toHaveBeenCalled()
  })

  it('renders title in document', () => {
    setup()
    render(<GamePage />)

    expect(document.title).toEqual('Common Threads')
  })

  it('renders Open Graph metadata', () => {
    setup()
    render(<GamePage />)

    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute('content', 'Common Threads')
    expect(document.head.querySelector('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://connections.dbowland.com/og-image.png',
    )
    expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://connections.dbowland.com/',
    )
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
