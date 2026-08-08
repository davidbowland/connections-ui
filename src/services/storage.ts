import { ConnectionsGame, GameId } from '@types'

const GAME_PREFIX = 'ct:game:'
const GAME_ID_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const META_KEY = 'ct:meta'
const VERSION = 1

export interface Meta {
  installDismissed: boolean
  solved: GameId[]
  v: number
}

// A factory, not a constant. Handing out one shared object means the first caller
// to push onto meta.solved corrupts every later read for the life of the page.
const emptyMeta = (): Meta => ({ installDismissed: false, solved: [], v: VERSION })

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
export const cachedGameIds = (): GameId[] => {
  // The window.localStorage getter itself throws SecurityError when cookies are
  // blocked, so the property access has to sit inside the try. This runs during
  // render with no error boundary above it -- an escaping throw white-screens the app.
  try {
    return Object.keys(window.localStorage)
      .filter((key) => key.startsWith(GAME_PREFIX))
      .map((key) => key.slice(GAME_PREFIX.length))
      .filter((id) => GAME_ID_PATTERN.test(id))
      .toSorted()
      .toReversed()
  } catch (error: unknown) {
    console.error('storage list failed', { error })
    return []
  }
}

export const readMeta = (): Meta => {
  const raw = safeRead(META_KEY)
  if (raw === null) return emptyMeta()
  try {
    const parsed = JSON.parse(raw) as Partial<Meta>
    if (parsed.v !== VERSION) return emptyMeta()
    return {
      installDismissed: parsed.installDismissed === true,
      // Anything JSON can hold reaches this. A bare string would satisfy both
      // includes() and the spread in markSolved, silently and wrongly.
      solved: Array.isArray(parsed.solved) ? parsed.solved : [],
      v: VERSION,
    }
  } catch (error: unknown) {
    console.error('storage parse failed', { error, key: META_KEY })
    return emptyMeta()
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
