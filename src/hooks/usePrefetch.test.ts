import { renderHook, waitFor } from '@testing-library/react'

import { prefetchTargets, usePrefetch } from './usePrefetch'
import * as connections from '@services/connections'
import * as storage from '@services/storage'
import { connectionsGame } from '@test/__mocks__'
import { ConnectionsGame } from '@types'
import * as gameIds from '@utils/game-ids'

jest.mock('@services/connections')
jest.mock('@services/storage')
// Both date functions keep their real behavior and gain a seam. The staged-tomorrow
// branch only turns on when they disagree, and no ambient clock can make them disagree
// in a suite that pins one instant -- so the hook could call toGameId for both and
// every other test would still pass.
jest.mock('@utils/game-ids', () => {
  const actual = jest.requireActual('@utils/game-ids')
  return { ...actual, toGameId: jest.fn(actual.toGameId), utcGameId: jest.fn(actual.utcGameId) }
})

describe('usePrefetch', () => {
  // 2026-08-08T21:30:00Z. Late enough in the day that no time zone reads it as an
  // earlier date than UTC does, so the staged-tomorrow branch stays off unless a test
  // turns it on deliberately.
  const now = () => 1_786_224_600_000

  // Both installed signals are set every time, and so is onLine. matchMedia is a
  // module-level jest.fn from jest.setup-test-env.js and navigator.standalone is a
  // defined property, so a value set by one test survives clearMocks and leaks into
  // the next unless it is overwritten explicitly.
  const setup = (displayModeStandalone: boolean, navigatorStandalone: boolean, online = true): void => {
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
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: online,
      writable: true,
    })
  }

  // Holds the next fetch open so a second sequence can be attempted while the first
  // is still mid-flight. Returns the release.
  const deferNextFetch = (): (() => void) => {
    let release: () => void = () => undefined
    jest.mocked(connections).fetchConnectionsGame.mockReturnValueOnce(
      new Promise<{ data: ConnectionsGame; isGenerating: boolean }>((resolve) => {
        release = () => resolve({ data: connectionsGame, isGenerating: false })
      }),
    )
    return () => release()
  }

  // Runs every timer the hook could plausibly have set, then lets the awaited chain
  // settle. Any poll added to the background path lands inside this window.
  const settle = async (): Promise<void> => {
    await jest.advanceTimersByTimeAsync(60_000)
  }

  beforeAll(() => {
    jest.useFakeTimers()
    // The clock the default `now` reads. Pinned so the fallback test does not change
    // answer depending on which side of midnight UTC the suite happens to run on.
    jest.setSystemTime(now())
    jest.mocked(connections).fetchConnectionsGame.mockResolvedValue({
      data: connectionsGame,
      isGenerating: false,
    })
    jest.mocked(storage).cachedGameIds.mockReturnValue([])
  })

  afterAll(() => {
    jest.useRealTimers()
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
    await settle()

    expect(jest.mocked(connections).fetchConnectionsGame).not.toHaveBeenCalled()
  })

  it('fetches only today when not installed', async () => {
    setup(false, false)

    renderHook(() => usePrefetch(now))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })
    await settle()

    expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
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
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
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
    // The count can only grow, so waiting on it proves nothing about what comes next.
    // A minute of the clock is what makes the second assertion mean anything.
    await settle()

    expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
  })

  // Proves the wiring, not the pure function: swap utcGameId(now) for
  // toGameId(new Date(now())) at the call site and this is the only test that notices.
  it('stages tomorrow off the UTC date, not the local one', async () => {
    setup(false, false)
    jest.mocked(gameIds).toGameId.mockReturnValueOnce('2026-08-08')
    jest.mocked(gameIds).utcGameId.mockReturnValueOnce('2026-08-09')

    renderHook(() => usePrefetch(now))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(2)
    })

    expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenNthCalledWith(1, '2026-08-09')
    expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenNthCalledWith(2, '2026-08-08')
  })

  it('runs again when the connection comes back', async () => {
    setup(false, false)

    renderHook(() => usePrefetch(now))
    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })
    await settle()

    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(2)
    })
  })

  it('runs again when the app is installed', async () => {
    setup(false, false)

    renderHook(() => usePrefetch(now))
    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })
    await settle()

    window.dispatchEvent(new Event('appinstalled'))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(2)
    })
  })

  it('fetches nothing while the device is offline', async () => {
    setup(false, false, false)

    renderHook(() => usePrefetch(now))
    await settle()

    expect(jest.mocked(connections).fetchConnectionsGame).not.toHaveBeenCalled()
  })

  it('ignores a reconnect while a sequence is still running', async () => {
    setup(true, false)
    const release = deferNextFetch()

    renderHook(() => usePrefetch(now))
    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })

    window.dispatchEvent(new Event('online'))
    await settle()

    // Still one: the second sequence would have re-fetched the whole window off the
    // same stale cache snapshot.
    expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)

    release()
    await settle()

    expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(7)
  })

  it('stops fetching after unmount', async () => {
    setup(true, false)
    const release = deferNextFetch()

    const { unmount } = renderHook(() => usePrefetch(now))
    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })

    unmount()
    release()
    await settle()

    expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
  })

  it('removes the exact listeners it added on unmount', () => {
    setup(false, false)
    const addEventListener = jest.spyOn(window, 'addEventListener')
    const removeEventListener = jest.spyOn(window, 'removeEventListener')
    const prefetchCalls = (calls: unknown[][]): unknown[][] =>
      calls.filter(([type]) => type === 'online' || type === 'appinstalled')

    renderHook(() => usePrefetch(now)).unmount()

    // Compared by reference. expect.any(Function) passed for a cleanup that removed
    // some other function entirely and leaked both listeners.
    expect(prefetchCalls(addEventListener.mock.calls)).toHaveLength(2)
    expect(prefetchCalls(removeEventListener.mock.calls)).toEqual(prefetchCalls(addEventListener.mock.calls))
  })

  // isInstalled, prefetchTargets and cachedGameIds all sit outside the per-puzzle
  // try/catch, and run is registered as a listener as well as called bare -- neither
  // call site has anywhere to put a rejection.
  it('logs rather than rejecting when the device cannot be read at all', async () => {
    setup(false, false)
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    jest.mocked(storage).cachedGameIds.mockImplementationOnce(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    renderHook(() => usePrefetch(now))

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('prefetch run failed', { error: expect.any(DOMException) })
    })
    await settle()

    expect(jest.mocked(connections).fetchConnectionsGame).not.toHaveBeenCalled()
  })

  // The guard is released in a finally, so a throw must not wedge every later run.
  it('runs again after a failure', async () => {
    setup(false, false)
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    jest.mocked(storage).cachedGameIds.mockImplementationOnce(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    renderHook(() => usePrefetch(now))
    await settle()

    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })
  })

  // No injected clock, so the date is whatever today is. The count is the assertion,
  // not the date, which keeps it deterministic.
  it('falls back to the real clock', async () => {
    setup(false, false)

    renderHook(() => usePrefetch())

    await waitFor(() => {
      expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
    })
    await settle()

    expect(jest.mocked(connections).fetchConnectionsGame).toHaveBeenCalledTimes(1)
  })

  describe('prefetchTargets', () => {
    it('stages tomorrow when UTC is already ahead of the local date', () => {
      expect(prefetchTargets({ installed: false, localToday: '2026-08-08', utcToday: '2026-08-09' })).toEqual([
        '2026-08-09',
        '2026-08-08',
      ])
    })

    it('stages tomorrow ahead of the whole installed window', () => {
      expect(prefetchTargets({ installed: true, localToday: '2026-08-08', utcToday: '2026-08-09' })).toEqual([
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
      expect(prefetchTargets({ installed: false, localToday: '2026-08-08', utcToday: '2026-08-08' })).toEqual([
        '2026-08-08',
      ])
    })

    // The window is counted back from localToday, so it always contains it. Seeding it
    // from a separate clock let the two disagree and produce a window without it.
    it('counts the installed window back from the local date it was handed', () => {
      expect(prefetchTargets({ installed: true, localToday: '2026-03-02', utcToday: '2026-03-02' })).toEqual([
        '2026-03-02',
        '2026-03-01',
        '2026-02-28',
        '2026-02-27',
        '2026-02-26',
        '2026-02-25',
        '2026-02-24',
      ])
    })
  })
})
