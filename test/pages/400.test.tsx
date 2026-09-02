import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import ServerErrorMessage from '@components/server-error-message'
import BadRequest from '@pages/400'

jest.mock('@components/server-error-message')

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

  it('keeps the error page out of an index', () => {
    render(<BadRequest />)
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toEqual('noindex, follow')
  })
})
