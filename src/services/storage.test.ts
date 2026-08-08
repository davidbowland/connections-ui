import {
  cachedGameIds,
  isSolved,
  markSolved,
  readGame,
  readMeta,
  removeGame,
  setInstallDismissed,
  writeGame,
} from './storage'
import { connectionsGame, gameId } from '@test/__mocks__'

describe('storage', () => {
  const setup = (): void => {
    window.localStorage.clear()
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

    it('does not throw when the quota is exhausted', () => {
      setup()
      jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('full', 'QuotaExceededError')
      })

      expect(() => writeGame(gameId, connectionsGame)).not.toThrow()
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

      expect(isSolved(gameId)).toBe(true)
      expect(isSolved('2025-06-01')).toBe(false)
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
  })
})
