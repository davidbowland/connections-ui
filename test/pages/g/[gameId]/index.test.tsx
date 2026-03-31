import GamePage from '@pages/g/[gameId]/index'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import { ConnectionsGame } from '@components/connections-game'
import PrivacyLink from '@components/privacy-link'

jest.mock('@components/connections-game')
jest.mock('@components/privacy-link')
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

describe('GamePage', () => {
  beforeAll(() => {
    jest.mocked(ConnectionsGame).mockReturnValue(<>ConnectionsGame</>)
    jest.mocked(PrivacyLink).mockReturnValue(<>PrivacyLink</>)
  })

  it('renders ConnectionsGame with gameId', () => {
    render(<GamePage />)

    expect(ConnectionsGame).toHaveBeenCalledWith({ gameId: '2024-01-01' }, undefined)
  })

  it('renders PrivacyLink', () => {
    render(<GamePage />)

    expect(PrivacyLink).toHaveBeenCalledTimes(1)
  })

  it('renders title in document', () => {
    render(<GamePage />)

    expect(document.title).toEqual('Connections')
  })
})
