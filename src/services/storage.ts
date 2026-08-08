import { ConnectionsGame, GameId } from '@types'

const GAME_PREFIX = 'ct:game:'
const META_KEY = 'ct:meta'
const VERSION = 1

export interface Meta {
  installDismissed: boolean
  solved: GameId[]
  v: number
}

const EMPTY_META: Meta = { installDismissed: false, solved: [], v: VERSION }

// Every write is best-effort. Storage can be full, disabled, or partitioned, and
// none of those are worth showing the player an error over -- the app still works,
// it just forgets.
const safeWrite = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value)
  } catch (error: unknown) {
    console.error('storage write failed', { error, key })
  }
}

const safeRead = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch (error: unknown) {
    console.error('storage read failed', { error, key })
    return null
  }
}

export const readGame = (gameId: GameId): ConnectionsGame | null => {
  const raw = safeRead(`${GAME_PREFIX}${gameId}`)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as ConnectionsGame
  } catch (error: unknown) {
    console.error('storage parse failed', { error, gameId })
    return null
  }
}

export const writeGame = (gameId: GameId, game: ConnectionsGame): void =>
  safeWrite(`${GAME_PREFIX}${gameId}`, JSON.stringify(game))

export const removeGame = (gameId: GameId): void => {
  try {
    window.localStorage.removeItem(`${GAME_PREFIX}${gameId}`)
  } catch (error: unknown) {
    console.error('storage remove failed', { error, gameId })
  }
}

// Derived, never stored. A stored index drifts: iOS evicts localStorage wholesale
// after seven idle days, and a write that fails under quota pressure would leave
// the index claiming a puzzle that is gone. The keys cannot lie.
export const cachedGameIds = (): GameId[] =>
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(GAME_PREFIX))
    .map((key) => key.slice(GAME_PREFIX.length))
    .toSorted()
    .toReversed()

export const readMeta = (): Meta => {
  const raw = safeRead(META_KEY)
  if (raw === null) return EMPTY_META
  try {
    const parsed = JSON.parse(raw) as Partial<Meta>
    if (parsed.v !== VERSION) return EMPTY_META
    return {
      installDismissed: parsed.installDismissed === true,
      solved: parsed.solved ?? [],
      v: VERSION,
    }
  } catch (error: unknown) {
    console.error('storage parse failed', { error, key: META_KEY })
    return EMPTY_META
  }
}

const writeMeta = (meta: Meta): void => safeWrite(META_KEY, JSON.stringify(meta))

export const markSolved = (gameId: GameId): void => {
  const meta = readMeta()
  if (meta.solved.includes(gameId)) return
  writeMeta({ ...meta, solved: [...meta.solved, gameId] })
}

export const isSolved = (gameId: GameId): boolean => readMeta().solved.includes(gameId)

export const setInstallDismissed = (dismissed: boolean): void =>
  writeMeta({ ...readMeta(), installDismissed: dismissed })
