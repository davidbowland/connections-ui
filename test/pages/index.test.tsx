import '@testing-library/jest-dom'
import { act, render } from '@testing-library/react'
import { useRouter } from 'next/router'
import React from 'react'

import { ConnectionsGame } from '@components/connections-game'
import { GameSelection } from '@components/game-selection'
import PrivacyLink from '@components/privacy-link'
import Index from '@pages/index'

jest.mock('@components/connections-game')
jest.mock('@components/game-selection')
jest.mock('@components/privacy-link')
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), replace: jest.fn() }),
}))

jest.mock('next/head', () => {
  const MockHead = ({ children }: { children: React.ReactNode }) => {
    document.querySelectorAll('[data-mock-head]').forEach((el) => el.remove())
    React.Children.toArray(children).forEach((child) => {
      if (!React.isValidElement(child)) return
      if (child.type === 'title') {
        document.title = (child.props as { children: string }).children
      }
      if (child.type === 'meta' || child.type === 'link') {
        const element = document.createElement(child.type)
        Object.entries(child.props as Record<string, string>).forEach(([key, value]) =>
          element.setAttribute(key, value),
        )
        element.setAttribute('data-mock-head', 'true')
        document.head.appendChild(element)
      }
    })
    return null
  }
  MockHead.displayName = 'MockHead'
  return MockHead
})

describe('Index page', () => {
  // 2025-01-15T10:00:00Z
  const noon = () => Date.UTC(2025, 0, 15, 10)

  beforeAll(() => {
    jest.mocked(ConnectionsGame).mockReturnValue(<>ConnectionsGame</>)
    jest.mocked(GameSelection).mockReturnValue(<>GameSelection</>)
    jest.mocked(PrivacyLink).mockReturnValue(<>PrivacyLink</>)
  })

  it('renders title correctly', () => {
    render(<Index now={noon} />)
    expect(document.title).toEqual('Common Threads | dbowland.com')
  })

  it('renders Open Graph metadata', () => {
    render(<Index now={noon} />)
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

  it('declares the site root as its own canonical URL', () => {
    render(<Index now={noon} />)
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://connections.dbowland.com/',
    )
  })

  it('does not mark itself noindex, so crawlers index the root', () => {
    render(<Index now={noon} />)
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })

  it("renders today's puzzle in place instead of navigating away", () => {
    const mockReplace = jest.fn()
    const mockPush = jest.fn()
    jest.mocked(useRouter).mockReturnValueOnce({ push: mockPush, replace: mockReplace } as any)

    render(<Index now={noon} />)
    act(() => {})

    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("renders ConnectionsGame with the viewer's local date", () => {
    render(<Index now={noon} />)

    act(() => {})

    expect(ConnectionsGame).toHaveBeenCalledWith({ gameId: '2025-01-15' }, undefined)
  })

  it('defaults to the system clock when no clock is injected', () => {
    render(<Index />)

    act(() => {})

    expect(ConnectionsGame).toHaveBeenCalledWith({ gameId: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }, undefined)
  })

  it('zero-pads single-digit months and days', () => {
    render(<Index now={() => Date.UTC(2025, 8, 5, 10)} />)

    act(() => {})

    expect(ConnectionsGame).toHaveBeenCalledWith({ gameId: '2025-09-05' }, undefined)
  })

  it('uses the local date late in the day, not the following one', () => {
    render(<Index now={() => Date.UTC(2025, 0, 15, 23, 59, 59)} />)

    act(() => {})

    expect(ConnectionsGame).toHaveBeenCalledWith({ gameId: '2025-01-15' }, undefined)
  })

  it("renders GameSelection with the viewer's local date", () => {
    render(<Index now={noon} />)

    act(() => {})

    expect(GameSelection).toHaveBeenCalledWith({ gameId: '2025-01-15' }, undefined)
  })

  it('renders PrivacyLink', () => {
    render(<Index now={noon} />)

    expect(PrivacyLink).toHaveBeenCalled()
  })

  it('bakes no date into the first render, so the static export is date-free', () => {
    render(<Index now={noon} />)

    act(() => {})

    expect(GameSelection).toHaveBeenNthCalledWith(1, { gameId: undefined }, undefined)
  })
})
