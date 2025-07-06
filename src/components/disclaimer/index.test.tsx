import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { act } from 'react'
import Cookies from 'universal-cookie'

import Disclaimer from './index'

jest.mock('universal-cookie')

describe('disclaimer component', () => {
  const mockCookieGet = jest.fn()
  const mockCookieSet = jest.fn()

  beforeAll(() => {
    jest.mocked(Cookies).mockReturnValue({
      get: mockCookieGet,
      set: mockCookieSet,
    } as unknown as Cookies)
  })

  it('loads under normal circumstances', async () => {
    render(<Disclaimer />)

    expect(await screen.findByText(/Accept & continue/i)).toBeVisible()
  })

  it('closes when button clicked', async () => {
    render(<Disclaimer />)

    const closeButton = (await screen.findByText(/Accept & continue/i, {
      selector: 'button',
    })) as HTMLButtonElement
    await act(() => userEvent.click(closeButton))

    expect(mockCookieSet).toHaveBeenCalledWith('disclaimer_accept', 'true', {
      path: '/',
      sameSite: 'strict',
      secure: true,
    })
    expect(screen.queryByText(/Cookie and Privacy Disclosure/i)).not.toBeInTheDocument()
  })

  it('loads closed when cookie is set', async () => {
    mockCookieGet.mockReturnValueOnce('true')
    render(<Disclaimer />)

    expect(mockCookieGet).toHaveBeenCalledWith('disclaimer_accept')
    expect(screen.queryByText(/Cookie and Privacy Disclosure/i)).not.toBeInTheDocument()
  })
})
