import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import GamePage, { Head } from './[gameId]'
import { ConnectionsGame } from '@components/connections-game'
import PrivacyLink from '@components/privacy-link'
import { gameId } from '@test/__mocks__'

jest.mock('@components/connections-game')
jest.mock('@components/privacy-link')

describe('GamePage', () => {
  beforeAll(() => {
    jest.mocked(ConnectionsGame).mockReturnValue(<>ConnectionsGame</>)
    jest.mocked(PrivacyLink).mockReturnValue(<>PrivacyLink</>)
  })

  it('renders ConnectionsGame with gameId', () => {
    render(<GamePage params={{ gameId }} />)

    expect(ConnectionsGame).toHaveBeenCalledWith({ gameId }, {})
  })

  it('renders PrivacyLink', () => {
    render(<GamePage params={{ gameId }} />)

    expect(PrivacyLink).toHaveBeenCalledTimes(1)
  })

  it('renders Head', () => {
    render(<Head />)

    expect(document.title).toEqual('Connections')
  })
})
