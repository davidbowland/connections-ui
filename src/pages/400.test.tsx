import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import BadRequest, { Head } from './400'
import ServerErrorMessage from '@components/server-error-message'

jest.mock('@components/server-error-message')

describe('400 error page', () => {
  beforeAll(() => {
    jest.mocked(ServerErrorMessage).mockReturnValue(<>ServerErrorMessage</>)
  })

  it('renders ServerErrorMessage', () => {
    const expectedTitle = '400: Bad Request'
    render(<BadRequest />)

    expect(ServerErrorMessage).toHaveBeenCalledWith(
      expect.objectContaining({ title: expectedTitle }),
      expect.anything(),
    )
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('renders Head', () => {
    render(<Head />)

    expect(document.title).toEqual('Connections | 400: Bad Request')
  })
})
