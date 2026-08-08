import { renderHook, waitFor } from '@testing-library/react'

import { prefetchTargets, usePrefetch } from './usePrefetch'
import * as connections from '@services/connections'
import * as storage from '@services/storage'
import { connectionsGame } from '@test/__mocks__'

jest.mock('@services/connections')
jest.mock('@services/storage')

describe('usePrefetch', () => {
  // 2026-08-08T21:30:00Z -- UTC and local agree because TZ is pinned to UTC.
  const now = () => 1_786_224_600_000

  // Both installed signals are set every time. matchMedia is a module-level jest.fn
  // from jest.setup-test-env.js and navigator.standalone is a defined property, so a
  // value set by one test survives clearMocks and leaks into the next unless it is
  // overwritten explicitly.
  const setup = (displayModeStandalone: boolean, navigatorStandalone: boolean): void => {
    jest.mocked(window.matchMedia).mockReturnValue({
      addEventListener: jest.fn(),
      matches: displayModeStandalone,
      removeEventListener: jest.fn(),
    } as unknown as MediaQueryList)
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: navigatorStandalone,
      writable: true,
    })
  }

  beforeAll(() => {
    jest.mocked(connections).fetchConnectionsGame.mockResolvedValue({
      data: connectionsGame,
      isGenerating: false,
    })
    jest.mocked(storage).cachedGameIds.mockReturnValue([])
    console.error = jest.fn()
  })

  it("fetches today's puzzle when nothing is stored", async () => {
    setup(false, false)

    renderHook(() => usePrefetch(now))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledWith('2026-08-08')
    })
  })

  it("does not refetch today's puzzle when it is already stored", async () => {
    setup(false, false)
    jest.mocked(storage).cachedGameIds.mockReturnValueOnce(['2026-08-08'])

    renderHook(() => usePrefetch(now))

    // Waiting on the storage read, not on the absence of a fetch -- a negative
    // assertion passes instantly and would prove nothing.
    await waitFor(() => {
      expect(jest.mocked(storage).cachedGameIds).toHaveBeenCalled()
    })
    expect(jest.mocked(connections).fetchConnectionsGame).not.toHaveBeenCalled()
  })

  it('fetches only today when not installed', async () => {
    setup(false, false)

    renderHook(() => usePrefetch(now))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })
  })

  it('fetches the last seven days when installed', async () => {
    setup(true, false)

    renderHook(() => usePrefetch(now))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(7)
    })
    expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledWith('2026-08-02')
  })

  it('counts an iOS home-screen launch as installed', async () => {
    setup(false, true)

    renderHook(() => usePrefetch(now))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(7)
    })
  })

  it('keeps going when one puzzle fails to arrive', async () => {
    setup(true, false)
    jest.mocked(connections).fetchConnectionsGame.mockRejectedValueOnce(new Error('offline'))

    renderHook(() => usePrefetch(now))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(7)
    })
  })

  it('never polls a puzzle that is still being generated', async () => {
    setup(false, false)
    jest.mocked(connections).fetchConnectionsGame.mockResolvedValueOnce({ data: connectionsGame, isGenerating: true })

    renderHook(() => usePrefetch(now))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })
  })

  it('runs again when the connection comes back', async () => {
    setup(false, false)

    renderHook(() => usePrefetch(now))
    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })

    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(2)
    })
  })

  it('removes its listeners on unmount', () => {
    setup(false, false)
    const removeEventListener = jest.spyOn(window, 'removeEventListener')

    renderHook(() => usePrefetch(now)).unmount()

    expect(removeEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function))
  })

  // No injected clock, so the date is whatever today is. The count is the assertion,
  // not the date, which keeps it deterministic.
  it('falls back to the real clock', async () => {
    setup(false, false)

    renderHook(() => usePrefetch())

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })
  })

  describe('prefetchTargets', () => {
    it('stages tomorrow when UTC is already ahead of the local date', () => {
      expect(prefetchTargets({ installed: false, localToday: '2026-08-08', now, utcToday: '2026-08-09' })).toEqual([
        '2026-08-09',
        '2026-08-08',
      ])
    })

    it('stages tomorrow ahead of the whole installed window', () => {
      expect(prefetchTargets({ installed: true, localToday: '2026-08-08', now, utcToday: '2026-08-09' })).toEqual([
        '2026-08-09',
        '2026-08-08',
        '2026-08-07',
        '2026-08-06',
        '2026-08-05',
        '2026-08-04',
        '2026-08-03',
        '2026-08-02',
      ])
    })

    it('stages nothing east of UTC, where the local date is never behind', () => {
      expect(prefetchTargets({ installed: false, localToday: '2026-08-08', now, utcToday: '2026-08-08' })).toEqual([
        '2026-08-08',
      ])
    })
  })
})
