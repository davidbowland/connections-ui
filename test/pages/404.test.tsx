import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import ServerErrorMessage from '@components/server-error-message'
import NotFound from '@pages/404'

jest.mock('@components/server-error-message')

describe('404 error page', () => {
  beforeAll(() => {
    jest.mocked(ServerErrorMessage).mockReturnValue(<>ServerErrorMessage</>)
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/an-invalid-page' },
    })
  })

  it('renders ServerErrorMessage', () => {
    const expectedTitle = '404: Not Found'
    render(<NotFound />)

    expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('renders nothing for session paths', () => {
    window.location.pathname = '/c/aeiou'
    render(<NotFound />)

    expect(ServerErrorMessage).toHaveBeenCalledTimes(0)
  })

  it('renders ServerErrorMessage when the path name extends beyond sessionId', () => {
    window.location.pathname = '/c/aeiou/y'
    render(<NotFound />)
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('renders title', () => {
    window.location.pathname = '/an-invalid-page'
    render(<NotFound />)
    expect(document.title).toEqual('Common Threads | 404: Not Found')
  })

  it('keeps the error page out of an index', () => {
    window.location.pathname = '/an-invalid-page'
    render(<NotFound />)
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toEqual('noindex, follow')
  })
})
