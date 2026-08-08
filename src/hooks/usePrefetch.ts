import { useCallback, useEffect } from 'react'

import { fetchConnectionsGame } from '@services/connections'
import { cachedGameIds } from '@services/storage'
import { GameId } from '@types'
import { toGameId, utcGameId } from '@utils/game-ids'

// Installing stores the most recent seven days. Fixed, not configurable.
const INSTALLED_WINDOW = 7

// Checked on every open rather than latched at install time. iOS fires no
// appinstalled event at all, and it evicts localStorage after seven idle days, so a
// one-shot fill is undone before the flight it was meant for.
export const isInstalled = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true

const recentGameIds = (count: number, now: () => number): GameId[] => {
  const ids: GameId[] = []
  const cursor = new Date(now())
  for (let index = 0; index < count; index += 1) {
    ids.push(toGameId(cursor))
    cursor.setDate(cursor.getDate() - 1)
  }
  return ids
}

export interface PrefetchTargetsOptions {
  installed: boolean
  localToday: GameId
  now: () => number
  utcToday: GameId
}

// Pure, and exported so the staged-tomorrow branch is testable. Tests pin TZ to UTC,
// which makes utcToday > localToday unreachable through the ambient clock -- the dates
// have to be injected rather than manufactured by moving the clock around.
export const prefetchTargets = ({ installed, localToday, now, utcToday }: PrefetchTargetsOptions): GameId[] => {
  const wanted = installed ? recentGameIds(INSTALLED_WINDOW, now) : [localToday]

  // West of UTC, the puzzle for tomorrow's local date already exists: the generator
  // runs at 03:33 UTC on the day before, roughly 20 hours before /games mentions it.
  // Store it now so it is on the device before midnight. The UI still renders
  // localToday, so nothing reveals early. East of UTC this is never true.
  if (utcToday > localToday) {
    wanted.unshift(utcToday)
  }

  return wanted
}

export const usePrefetch = (now = Date.now): void => {
  const run = useCallback(async () => {
    const wanted = prefetchTargets({
      installed: isInstalled(),
      localToday: toGameId(new Date(now())),
      now,
      utcToday: utcGameId(now),
    })

    const stored = new Set(cachedGameIds())
    for (const gameId of wanted.filter((id) => !stored.has(id))) {
      try {
        // A background fill never polls a 202. The foreground load in
        // useConnectionsGame still does, which is right when someone is watching a
        // loading board and wrong for a silent fill -- nobody is waiting, and the
        // next open will ask again. It is also why lower environments need no
        // special casing: with scheduled generation off they answer 202 and this
        // quietly does nothing.
        await fetchConnectionsGame(gameId)
      } catch (error: unknown) {
        console.error('prefetch failed', { error, gameId })
      }
    }
  }, [now])

  useEffect(() => {
    run()

    // Never on a timer: a service worker cannot wake itself without push, so open,
    // reconnect, and install are the only moments this can run.
    window.addEventListener('online', run)
    window.addEventListener('appinstalled', run)
    return () => {
      window.removeEventListener('online', run)
      window.removeEventListener('appinstalled', run)
    }
  }, [run])
}
