import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import ServerErrorMessage from '@components/server-error-message'
import InternalServerError from '@pages/500'

jest.mock('@components/server-error-message')

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
    expect(document.title).toEqual('Common Threads | 500: Internal Server Error')
  })

  it('keeps the error page out of an index', () => {
    render(<InternalServerError />)
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toEqual('noindex, follow')
  })
})
