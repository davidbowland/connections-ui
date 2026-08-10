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
  const unregister = jest.fn()
  const getRegistrations = jest.fn()
  const nodeEnv = process.env.NODE_ENV

  const setServiceWorker = (value: unknown): void => {
    Object.defineProperty(window.navigator, 'serviceWorker', { configurable: true, value, writable: true })
  }

  // Jest runs with NODE_ENV=test, so the production branch is only reachable by saying
  // so. defineProperty rather than assignment: Next types the key as readonly.
  const setNodeEnv = (value: string): void => {
    Object.defineProperty(process.env, 'NODE_ENV', { configurable: true, value, writable: true })
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
    setNodeEnv(nodeEnv as string)
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
    setNodeEnv('production')
    register.mockResolvedValueOnce(undefined)
    setServiceWorker({ getRegistrations, register })
    renderApp()

    expect(register).toHaveBeenCalledWith('/sw.js')
  })

  it('reports a registration failure without breaking the page', async () => {
    setNodeEnv('production')
    register.mockRejectedValueOnce(new Error('nope'))
    setServiceWorker({ getRegistrations, register })
    renderApp()

    await Promise.resolve()

    expect(console.error).toHaveBeenCalledWith('service worker registration failed', { error: new Error('nope') })
    expect(screen.getByText('mock page')).toBeInTheDocument()
  })

  // `next dev` serves every /_next/ chunk from a stable URL, so a worker that has
  // cached one build hands it back after the next one is compiled and Next answers the
  // hash mismatch with a full reload -- which is served the same stale chunks again.
  it('never registers a worker outside production', () => {
    setNodeEnv('development')
    getRegistrations.mockResolvedValueOnce([])
    setServiceWorker({ getRegistrations, register })
    renderApp()

    expect(register).not.toHaveBeenCalled()
    expect(screen.getByText('mock page')).toBeInTheDocument()
  })

  // Skipping registration is not enough on its own: `npm run serve` puts a real worker
  // on the same localhost origin, and it keeps controlling the page long after that
  // build is gone.
  it('unregisters a worker left behind on this origin', async () => {
    setNodeEnv('development')
    unregister.mockResolvedValueOnce(true)
    getRegistrations.mockResolvedValueOnce([{ unregister }])
    setServiceWorker({ getRegistrations, register })
    renderApp()

    await Promise.resolve()
    await Promise.resolve()

    expect(unregister).toHaveBeenCalled()
  })

  it('reports a cleanup failure without breaking the page', async () => {
    setNodeEnv('development')
    getRegistrations.mockRejectedValueOnce(new Error('denied'))
    setServiceWorker({ getRegistrations, register })
    renderApp()

    await Promise.resolve()

    expect(console.error).toHaveBeenCalledWith('service worker cleanup failed', { error: new Error('denied') })
    expect(screen.getByText('mock page')).toBeInTheDocument()
  })

  it('does nothing when the browser has no service worker support', () => {
    setNodeEnv('production')
    removeServiceWorker()
    renderApp()

    expect(register).not.toHaveBeenCalled()
    expect(screen.getByText('mock page')).toBeInTheDocument()
  })
})
