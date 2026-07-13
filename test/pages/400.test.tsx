import BadRequest from '@pages/400'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import ServerErrorMessage from '@components/server-error-message'

jest.mock('@components/server-error-message')

jest.mock('next/head', () => {
  const MockHead = ({ children }: { children: React.ReactNode }) => {
    React.Children.toArray(children)
      .filter(
        (child): child is React.ReactElement<{ children: string }> =>
          React.isValidElement(child) && child.type === 'title',
      )
      .forEach((child) => {
        document.title = child.props.children
      })
    return null
  }
  MockHead.displayName = 'MockHead'
  return MockHead
})

describe('400 error page', () => {
  beforeAll(() => {
    jest.mocked(ServerErrorMessage).mockReturnValue(<>ServerErrorMessage</>)
  })

  it('renders ServerErrorMessage', () => {
    const expectedTitle = '400: Bad Request'
    render(<BadRequest />)

    expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('renders title', () => {
    render(<BadRequest />)
    expect(document.title).toEqual('Common Threads | 400: Bad Request')
  })
})
