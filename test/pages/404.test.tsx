import NotFound from '@pages/404'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import ServerErrorMessage from '@components/server-error-message'

jest.mock('@components/server-error-message')

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

describe('404 error page', () => {
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
    expect(document.title).toEqual('Connections | 404: Not Found')
  })
})
