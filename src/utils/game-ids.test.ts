import { allGameIds, nextUnplayed, toGameId, utcGameId } from './game-ids'

describe('game-ids', () => {
  // 2026-08-08T21:30:00Z. TZ is pinned to UTC in jest.setup-test-env.js.
  const now = () => 1_786_224_600_000

  describe('toGameId', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(toGameId(new Date(now()))).toBe('2026-08-08')
    })

    it('pads single-digit months and days', () => {
      expect(toGameId(new Date('2025-01-05T12:00:00Z'))).toBe('2025-01-05')
    })
  })

  describe('allGameIds', () => {
    it('starts at today and runs newest first', () => {
      const ids = allGameIds(now)

      expect(ids[0]).toBe('2026-08-08')
      expect(ids[1]).toBe('2026-08-07')
    })

    it('ends at the first puzzle ever published', () => {
      expect(allGameIds(now).at(-1)).toBe('2025-01-01')
    })

    it('produces one id per day with no gaps or repeats', () => {
      const ids = allGameIds(now)

      expect(ids).toHaveLength(585)
      expect(new Set(ids).size).toBe(585)
    })
  })

  describe('utcGameId', () => {
    it('returns the UTC date, which can be ahead of the local one', () => {
      expect(utcGameId(now)).toBe('2026-08-08')
    })
  })

  describe('nextUnplayed', () => {
    const ids = ['2026-08-08', '2026-08-07', '2026-08-06', '2026-08-05']

    it('returns the newest puzzle when nothing is solved', () => {
      expect(nextUnplayed({ ids, solved: [] })).toEqual({ id: '2026-08-08', replay: false })
    })

    it('walks back past solved puzzles', () => {
      expect(nextUnplayed({ ids, solved: ['2026-08-08', '2026-08-07'] })).toEqual({
        id: '2026-08-06',
        replay: false,
      })
    })

    it('skips the puzzle currently on screen', () => {
      expect(nextUnplayed({ current: '2026-08-08', ids, solved: [] })).toEqual({
        id: '2026-08-07',
        replay: false,
      })
    })

    it('restricts itself to what is on the device when available is given', () => {
      expect(nextUnplayed({ available: ['2026-08-06'], ids, solved: [] })).toEqual({
        id: '2026-08-06',
        replay: false,
      })
    })

    it('offers a replay when every puzzle is solved', () => {
      expect(nextUnplayed({ ids, solved: ids })).toEqual({ id: '2026-08-08', replay: true })
    })

    it('offers a replay from the device when everything on it is solved', () => {
      expect(nextUnplayed({ available: ['2026-08-06'], ids, solved: ids })).toEqual({
        id: '2026-08-06',
        replay: true,
      })
    })

    it('reports a replay of the current puzzle when the device holds nothing else', () => {
      expect(nextUnplayed({ available: ['2026-08-08'], current: '2026-08-08', ids, solved: ids })).toEqual({
        id: '2026-08-08',
        replay: true,
      })
    })
  })
})
