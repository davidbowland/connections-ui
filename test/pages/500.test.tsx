import InternalServerError from '@pages/500'
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

describe('500 error page', () => {
  beforeAll(() => {
    jest.mocked(ServerErrorMessage).mockReturnValue(<>ServerErrorMessage</>)
  })

  it('renders ServerErrorMessage', () => {
    const expectedTitle = '500: Internal Server Error'
    render(<InternalServerError />)

    expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('renders title', () => {
    render(<InternalServerError />)
    expect(document.title).toEqual('Connections | 500: Internal Server Error')
  })
})
