import { act, renderHook } from '@testing-library/react'

import { useInstallPrompt } from './useInstallPrompt'
import * as storage from '@services/storage'

jest.mock('@services/storage')

const ANDROID = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36'
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Safari'
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36'

describe('useInstallPrompt', () => {
  interface SetupOptions {
    displayMode?: boolean
    installDismissed?: boolean
    maxTouchPoints?: number
    navigatorStandalone?: boolean
    userAgent?: string
  }

  // Named arrangement, called explicitly by every test, and the only place in this
  // file that stubs anything. Every fact the hook reads is written on every call, so
  // the order the tests run in cannot change an outcome.
  //
  // Once, never mockReturnValue, for both stubs. clearMocks is mockClear, which
  // leaves return values in place, so a plain mockReturnValue here would outlive the
  // test that set it and surface as a failure in some later, unrelated test. Each
  // queued value is consumed by the single mount its test performs: the hook reads
  // readMeta and matchMedia exactly once each, in the mount effect.
  const setup = ({
    displayMode = false,
    installDismissed = false,
    maxTouchPoints = 0,
    navigatorStandalone = false,
    userAgent = MAC,
  }: SetupOptions = {}): void => {
    Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, value: maxTouchPoints })
    Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: navigatorStandalone })
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: userAgent })
    jest.mocked(storage).readMeta.mockReturnValueOnce({ installDismissed, solved: [], v: 1 })
    jest.mocked(window.matchMedia).mockReturnValueOnce({ matches: displayMode } as MediaQueryList)
  }

  const firePrompt = (): Event & { prompt: jest.Mock } => {
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: jest.fn() })
    act(() => {
      window.dispatchEvent(event)
    })
    return event
  }

  // The shared default. An auto-mocked readMeta returns undefined rather than a
  // Meta, and the hook reads a property straight off it, so without this a test that
  // forgot setup() would die on a TypeError instead of reporting what it checked.
  beforeAll(() => {
    jest.mocked(storage).readMeta.mockReturnValue({ installDismissed: false, solved: [], v: 1 })
  })

  describe('offerability', () => {
    it('is not offerable until the browser says it can be installed', () => {
      setup()

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.isOfferable).toBe(false)
    })

    it('becomes offerable once beforeinstallprompt fires', () => {
      setup()

      const { result } = renderHook(() => useInstallPrompt())
      firePrompt()

      expect(result.current.isOfferable).toBe(true)
    })

    it('is offerable on iOS without any prompt event', () => {
      setup({ userAgent: IPHONE })

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.isOfferable).toBe(true)
    })

    it('keeps the browser from showing its own banner', () => {
      setup()

      renderHook(() => useInstallPrompt())

      expect(firePrompt().defaultPrevented).toBe(true)
    })

    it('offers nothing to a display-mode standalone window', () => {
      setup({ displayMode: true, userAgent: IPHONE })

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.isOfferable).toBe(false)
    })

    it('offers nothing to an installed iOS app, which reports itself on navigator', () => {
      setup({ navigatorStandalone: true, userAgent: IPHONE })

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.isOfferable).toBe(false)
    })

    it('stops offering once the app reports itself installed', () => {
      setup()

      const { result } = renderHook(() => useInstallPrompt())
      firePrompt()
      act(() => {
        window.dispatchEvent(new Event('appinstalled'))
      })

      expect(result.current.isOfferable).toBe(false)
    })
  })

  describe('platform', () => {
    it('reports desktop for a machine with no touch screen', () => {
      setup()

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.platform).toBe('desktop')
    })

    it('reports android when the user agent is android', () => {
      setup({ userAgent: ANDROID })

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.platform).toBe('android')
    })

    it('reports ios for an iPhone', () => {
      setup({ userAgent: IPHONE })

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.platform).toBe('ios')
    })

    it('reports ios for an iPad, which sends the desktop Safari user agent', () => {
      setup({ maxTouchPoints: 5, userAgent: IPAD })

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.platform).toBe('ios')
    })
  })

  describe('install', () => {
    it('calls the stored prompt when install is pressed', () => {
      setup()

      const { result } = renderHook(() => useInstallPrompt())
      const event = firePrompt()
      act(() => {
        result.current.install()
      })

      expect(event.prompt).toHaveBeenCalled()
    })

    it('does nothing when there is no stored prompt to call', () => {
      setup({ userAgent: IPHONE })

      const { result } = renderHook(() => useInstallPrompt())

      expect(() =>
        act(() => {
          result.current.install()
        }),
      ).not.toThrow()
    })
  })

  describe('dismissal', () => {
    it('records a dismissal and reports it', () => {
      setup()

      const { result } = renderHook(() => useInstallPrompt())
      act(() => {
        result.current.dismiss()
      })

      expect(jest.mocked(storage).setInstallDismissed).toHaveBeenCalledWith(true)
      expect(result.current.isDismissed).toBe(true)
    })

    it('reads a dismissal recorded on an earlier visit', () => {
      setup({ installDismissed: true })

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.isDismissed).toBe(true)
    })

    it('reopens after a dismissal, because the card is never destroyed', () => {
      setup({ installDismissed: true })

      const { result } = renderHook(() => useInstallPrompt())
      act(() => {
        result.current.reopen()
      })

      expect(jest.mocked(storage).setInstallDismissed).toHaveBeenCalledWith(false)
      expect(result.current.isDismissed).toBe(false)
    })

    it('still offers a dismissed iOS card, the only route to installing there', () => {
      setup({ installDismissed: true, userAgent: IPHONE })

      const { result } = renderHook(() => useInstallPrompt())

      expect(result.current.isOfferable).toBe(true)
      expect(result.current.isDismissed).toBe(true)
    })
  })

  // Asserting expect.any(Function) here would pass even if the cleanup removed a
  // different function and leaked the real one on every mount. Comparing the
  // listeners actually handed to addEventListener against the ones handed to
  // removeEventListener is what makes leaking detectable.
  it.each(['appinstalled', 'beforeinstallprompt'])('stops listening for %s after unmount', (type: string) => {
    setup()
    const addEventListener = jest.spyOn(window, 'addEventListener')
    const removeEventListener = jest.spyOn(window, 'removeEventListener')

    renderHook(() => useInstallPrompt()).unmount()

    const added = addEventListener.mock.calls.filter(([name]) => name === type).map(([, listener]) => listener)
    const removed = removeEventListener.mock.calls.filter(([name]) => name === type).map(([, listener]) => listener)

    expect(added).toHaveLength(1)
    expect(removed).toEqual(added)
  })
})
