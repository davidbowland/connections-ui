import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import Forbidden, { Head } from './403'
import ServerErrorMessage from '@components/server-error-message'

jest.mock('@components/server-error-message')

describe('403 error page', () => {
  beforeAll(() => {
    jest.mocked(ServerErrorMessage).mockReturnValue(<>ServerErrorMessage</>)
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '' },
    })
  })

  beforeEach(() => {
    window.location.pathname = '/an-invalid-page'
  })

  it('renders ServerErrorMessage', () => {
    const expectedTitle = '403: Forbidden'
    render(<Forbidden />)

    expect(ServerErrorMessage).toHaveBeenCalledWith(
      expect.objectContaining({ title: expectedTitle }),
      expect.anything(),
    )
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('renders nothing for session paths', () => {
    window.location.pathname = '/c/aeiou'
    render(<Forbidden />)

    expect(ServerErrorMessage).toHaveBeenCalledTimes(0)
  })

  it('renders ServerErrorMessage when the path name extends beyond sessionId', () => {
    window.location.pathname = '/c/aeiou/y'
    render(<Forbidden />)
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('renders Head', () => {
    render(<Head />)

    expect(document.title).toEqual('Connections | 403: Forbidden')
  })
})
