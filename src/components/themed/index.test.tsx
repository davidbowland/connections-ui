import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import Themed from './index'
import Disclaimer from '@components/disclaimer'

jest.mock('@components/disclaimer')

const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = jest.fn().mockReturnValue({
    addEventListener: jest.fn(),
    matches,
    removeEventListener: jest.fn(),
  })
}

describe('Themed component', () => {
  const children = <>fnord</>

  beforeAll(() => {
    jest.mocked(Disclaimer).mockReturnValue(<>Disclaimer</>)
    mockMatchMedia(false)
  })

  test('renders children', async () => {
    render(<Themed>{children}</Themed>)

    expect(await screen.findByText(/fnord/)).toBeInTheDocument()
  })

  test('renders Disclaimer', async () => {
    render(<Themed>{children}</Themed>)

    expect(Disclaimer).toHaveBeenCalled()
  })

  test('adds dark class to documentElement when prefers-color-scheme is dark', () => {
    mockMatchMedia(true)
    render(<Themed>{children}</Themed>)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  test('does not add dark class when prefers-color-scheme is light', () => {
    document.documentElement.classList.remove('dark')
    mockMatchMedia(false)
    render(<Themed>{children}</Themed>)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  test('adds dark class when media query fires dark event', () => {
    let handler: ((e: MediaQueryListEvent) => void) | undefined
    window.matchMedia = jest.fn().mockReturnValue({
      addEventListener: jest.fn((_, h) => {
        handler = h
      }),
      matches: false,
      removeEventListener: jest.fn(),
    })
    document.documentElement.classList.remove('dark')
    render(<Themed>{children}</Themed>)

    handler?.({ matches: true } as MediaQueryListEvent)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
