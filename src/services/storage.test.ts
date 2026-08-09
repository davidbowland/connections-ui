import {
  cachedGameIds,
  markSolved,
  readGame,
  readMeta,
  removeGame,
  setInstallDismissed,
  STORAGE_EVENT,
  writeGame,
} from './storage'
import { connectionsGame, gameId } from '@test/__mocks__'

describe('storage', () => {
  const setup = (): void => {
    window.localStorage.clear()
  }

  // onAnnounce runs inside the listener, so a test can assert what storage looked like
  // at the moment it was told rather than only that it was told. The listener is
  // detached before the assertions run: window outlives every test in this file, and
  // one left attached would keep firing for the rest of the suite.
  const announcementsDuring = (act: () => void, onAnnounce: () => void = () => undefined): jest.Mock => {
    const listener = jest.fn(onAnnounce)
    window.addEventListener(STORAGE_EVENT, listener)
    act()
    window.removeEventListener(STORAGE_EVENT, listener)
    return listener
  }

  beforeAll(() => {
    console.error = jest.fn()
  })

  describe('games', () => {
    it('round-trips a game', () => {
      setup()
      writeGame(gameId, connectionsGame)

      expect(readGame(gameId)).toEqual(connectionsGame)
    })

    it('returns null for a game that was never stored', () => {
      setup()

      expect(readGame('2025-06-01')).toBeNull()
    })

    it('returns null rather than throwing when the stored value is corrupt', () => {
      setup()
      window.localStorage.setItem('ct:game:2025-06-01', 'not json')

      expect(readGame('2025-06-01')).toBeNull()
    })

    it('removes a game', () => {
      setup()
      writeGame(gameId, connectionsGame)
      removeGame(gameId)

      expect(readGame(gameId)).toBeNull()
    })

    it('derives the cached id list from the keys themselves, newest first', () => {
      setup()
      writeGame('2025-01-15', connectionsGame)
      writeGame('2026-08-08', connectionsGame)
      writeGame('2025-06-01', connectionsGame)

      expect(cachedGameIds()).toEqual(['2026-08-08', '2025-06-01', '2025-01-15'])
    })

    it('ignores unrelated keys when deriving the cached id list', () => {
      setup()
      writeGame(gameId, connectionsGame)
      window.localStorage.setItem('unrelated', 'x')
      window.localStorage.setItem('ct:meta', '{}')

      expect(cachedGameIds()).toEqual([gameId])
    })

    it('ignores keys that carry a suffix after the game id', () => {
      setup()
      writeGame(gameId, connectionsGame)
      window.localStorage.setItem(`ct:game:${gameId}:progress`, 'x')
      window.localStorage.setItem('ct:game:not-a-date', 'x')

      expect(cachedGameIds()).toEqual([gameId])
    })

    it('does not throw when the quota is exhausted', () => {
      setup()
      jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('full', 'QuotaExceededError')
      })

      expect(() => writeGame(gameId, connectionsGame)).not.toThrow()
    })

    it('returns null when reading throws', () => {
      setup()
      jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new DOMException('denied', 'SecurityError')
      })

      expect(readGame(gameId)).toBeNull()
    })

    it('does not throw when removing throws', () => {
      setup()
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
        throw new DOMException('denied', 'SecurityError')
      })

      expect(() => removeGame(gameId)).not.toThrow()
    })

    it('returns an empty list when storage itself is unreachable', () => {
      setup()
      writeGame(gameId, connectionsGame)
      jest.spyOn(window, 'localStorage', 'get').mockImplementationOnce(() => {
        throw new DOMException('denied', 'SecurityError')
      })

      expect(cachedGameIds()).toEqual([])
    })
  })

  describe('meta', () => {
    it('returns an empty shape when nothing is stored', () => {
      setup()

      expect(readMeta()).toEqual({ installDismissed: false, solved: [], v: 1 })
    })

    it('marks a puzzle solved', () => {
      setup()
      markSolved(gameId)

      expect(readMeta().solved).toEqual([gameId])
    })

    it('does not record the same puzzle twice', () => {
      setup()
      markSolved(gameId)
      markSolved(gameId)

      expect(readMeta().solved).toEqual([gameId])
    })

    it('stores the install dismissal without disturbing the solved set', () => {
      setup()
      markSolved(gameId)
      setInstallDismissed(true)

      expect(readMeta()).toEqual({ installDismissed: true, solved: [gameId], v: 1 })
    })

    it('discards metadata written by an older version', () => {
      setup()
      window.localStorage.setItem('ct:meta', JSON.stringify({ solved: ['2025-01-01'], v: 0 }))

      expect(readMeta()).toEqual({ installDismissed: false, solved: [], v: 1 })
    })

    it('discards corrupt metadata', () => {
      setup()
      window.localStorage.setItem('ct:meta', 'not json')

      expect(readMeta()).toEqual({ installDismissed: false, solved: [], v: 1 })
    })

    it('discards a solved list that is not a list', () => {
      setup()
      window.localStorage.setItem('ct:meta', JSON.stringify({ solved: gameId, v: 1 }))

      expect(readMeta().solved).toEqual([])
    })

    it('hands every caller its own copy', () => {
      setup()
      const first = readMeta()
      first.solved.push(gameId)

      expect(readMeta().solved).toEqual([])
    })
  })

  // The native storage event fires in other tabs only, so a component rendering a count
  // off these keys learns nothing about the writes this tab makes. Everything that
  // changes what cachedGameIds or readMeta return has to say so.
  describe('announcements', () => {
    it('announces a stored puzzle, with the puzzle already stored', () => {
      setup()
      let visible: string[] = []

      const announced = announcementsDuring(
        () => writeGame(gameId, connectionsGame),
        () => {
          visible = cachedGameIds()
        },
      )

      expect(announced).toHaveBeenCalledTimes(1)
      expect(visible).toEqual([gameId])
    })

    it('announces a removed puzzle, with the puzzle already gone', () => {
      setup()
      writeGame(gameId, connectionsGame)
      let visible: string[] = [gameId]

      const announced = announcementsDuring(
        () => removeGame(gameId),
        () => {
          visible = cachedGameIds()
        },
      )

      expect(announced).toHaveBeenCalledTimes(1)
      expect(visible).toEqual([])
    })

    it('announces a win, with the win already recorded', () => {
      setup()
      let visible: string[] = []

      const announced = announcementsDuring(
        () => markSolved(gameId),
        () => {
          visible = readMeta().solved
        },
      )

      expect(announced).toHaveBeenCalledTimes(1)
      expect(visible).toEqual([gameId])
    })

    // Re-solving writes nothing, so there is nothing to tell anyone about. Announcing
    // anyway would re-read the device on every render of a finished board.
    it('stays quiet when a win changes nothing', () => {
      setup()
      markSolved(gameId)

      expect(announcementsDuring(() => markSolved(gameId))).not.toHaveBeenCalled()
    })

    // A write that could not land still moved nothing, but the listener re-reads rather
    // than trusting the announcement, so telling it is harmless -- and cheaper than
    // teaching safeWrite to report failure up through three call sites.
    it('still announces when the write itself failed', () => {
      setup()
      jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('full', 'QuotaExceededError')
      })

      expect(announcementsDuring(() => writeGame(gameId, connectionsGame))).toHaveBeenCalledTimes(1)
    })
  })
})
