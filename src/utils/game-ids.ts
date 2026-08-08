import { GameId } from '@types'

// connections-api/src/handlers/get-game-ids.ts lists every date from here to today.
// It is pure date arithmetic, so the client can produce it without a network call --
// which is what lets the picker work with no connection.
const FIRST_GAME_ID: GameId = '2025-01-01'

export const toGameId = (date: Date): GameId =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const allGameIds = (now = Date.now): GameId[] => {
  const ids: GameId[] = []
  for (const cursor = new Date(now()); toGameId(cursor) >= FIRST_GAME_ID; cursor.setDate(cursor.getDate() - 1)) {
    ids.push(toGameId(cursor))
  }
  return ids
}

export const utcGameId = (now = Date.now): GameId => new Date(now()).toISOString().split('T')[0]

export interface NextUnplayedOptions {
  available?: GameId[]
  current?: GameId
  ids: GameId[]
  solved: GameId[]
}

export const nextUnplayed = ({
  available,
  current,
  ids,
  solved,
}: NextUnplayedOptions): { id: GameId; replay: boolean } => {
  const solvedSet = new Set(solved)
  const pool = available === undefined ? ids : ids.filter((id) => available.includes(id))

  const unsolved = pool.find((id) => id !== current && !solvedSet.has(id))
  if (unsolved !== undefined) return { id: unsolved, replay: false }

  // Nothing left to hand over. Offer a replay instead of refusing -- the board
  // reshuffles on load, so "same words, new order" is literally true.
  return { id: pool.find((id) => id !== current) ?? pool[0] ?? current ?? ids[0], replay: true }
}
