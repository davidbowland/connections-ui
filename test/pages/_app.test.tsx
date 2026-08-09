import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import Themed from '@components/themed'
import { usePrefetch } from '@hooks/usePrefetch'
import App from '@pages/_app'

jest.mock('@components/themed', () => jest.fn().mockImplementation(({ children }) => <>{children}</>))
jest.mock('@hooks/usePrefetch')

describe('App', () => {
  const register = jest.fn()

  const setServiceWorker = (value: unknown): void => {
    Object.defineProperty(window.navigator, 'serviceWorker', { configurable: true, value, writable: true })
  }

  // jsdom does not implement serviceWorker at all, and `'serviceWorker' in navigator`
  // is true for a property defined as undefined -- so an unsupported browser has to be
  // simulated by removing the key, not by blanking it.
  const removeServiceWorker = (): void => {
    Reflect.deleteProperty(window.navigator, 'serviceWorker')
  }

  const renderApp = () =>
    render(<App Component={() => <div>mock page</div>} pageProps={{}} router={undefined as any} />)

  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    // jsdom has no serviceWorker, so leaving one defined would leak into other files.
    removeServiceWorker()
  })

  it('renders Themed and the child component', () => {
    removeServiceWorker()
    renderApp()

    expect(Themed).toHaveBeenCalled()
    expect(screen.getByText('mock page')).toBeInTheDocument()
  })

  it('fills the device on mount', () => {
    removeServiceWorker()
    renderApp()

    expect(jest.mocked(usePrefetch)).toHaveBeenCalled()
  })

  it('registers the service worker', () => {
    register.mockResolvedValueOnce(undefined)
    setServiceWorker({ register })
    renderApp()

    expect(register).toHaveBeenCalledWith('/sw.js')
  })

  it('reports a registration failure without breaking the page', async () => {
    register.mockRejectedValueOnce(new Error('nope'))
    setServiceWorker({ register })
    renderApp()

    await Promise.resolve()

    expect(console.error).toHaveBeenCalledWith('service worker registration failed', { error: new Error('nope') })
    expect(screen.getByText('mock page')).toBeInTheDocument()
  })

  it('does nothing when the browser has no service worker support', () => {
    removeServiceWorker()
    renderApp()

    expect(register).not.toHaveBeenCalled()
    expect(screen.getByText('mock page')).toBeInTheDocument()
  })
})
