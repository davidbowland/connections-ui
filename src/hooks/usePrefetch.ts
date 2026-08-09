import { useCallback, useEffect, useRef } from 'react'

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

// Seeded from the id, not from a clock, so the window always contains the day it is
// counted back from. Parsed field by field rather than through Date(string), which
// reads a bare date as UTC midnight -- and lands on yesterday everywhere west of it.
const recentGameIds = (count: number, from: GameId): GameId[] => {
  const [year, month, day] = from.split('-').map(Number)
  const cursor = new Date(year, month - 1, day)
  const ids: GameId[] = []
  for (let index = 0; index < count; index += 1) {
    ids.push(toGameId(cursor))
    cursor.setDate(cursor.getDate() - 1)
  }
  return ids
}

export interface PrefetchTargetsOptions {
  installed: boolean
  localToday: GameId
  utcToday: GameId
}

// Pure, and exported so the staged-tomorrow branch is testable. utcToday > localToday
// is unreachable through the ambient clock on a machine in or east of UTC, so the dates
// have to be injected rather than manufactured by moving the clock around.
export const prefetchTargets = ({ installed, localToday, utcToday }: PrefetchTargetsOptions): GameId[] => {
  const wanted = installed ? recentGameIds(INSTALLED_WINDOW, localToday) : [localToday]

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
  const inFlight = useRef(false)
  const abandoned = useRef(false)

  const run = useCallback(async () => {
    // online fires on every transition, with no backoff, and a flapping connection
    // fires it for minutes. Without this, install plus a reconnect start two
    // sequences that both snapshot the cache before either writes, so both fetch
    // everything -- and a puzzle stuck at 202 gets asked again on every flap, which
    // is the polling this hook exists to avoid.
    if (inFlight.current) return

    // Offline, eight sequential requests against a 35-second timeout can hang for
    // over four minutes. onLine is only trustworthy when false, which is the
    // direction that matters here.
    if (!window.navigator.onLine) return

    inFlight.current = true
    try {
      const wanted = prefetchTargets({
        installed: isInstalled(),
        localToday: toGameId(new Date(now())),
        utcToday: utcGameId(now),
      })

      const stored = new Set(cachedGameIds())
      for (const gameId of wanted.filter((id) => !stored.has(id))) {
        // Nobody is left to receive these. Stop rather than spend the rest of the
        // window on requests for a screen that is gone.
        if (abandoned.current) return

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
    } catch (error: unknown) {
      // isInstalled, prefetchTargets and cachedGameIds all sit outside the per-puzzle
      // guard above, and matchMedia and localStorage can each throw. run is called bare
      // and registered as a listener, so neither call site has anywhere to put a
      // rejection: without this it surfaces as an unhandled rejection that names no
      // hook, and on the listener path nothing catches it at all.
      console.error('prefetch run failed', { error })
    } finally {
      inFlight.current = false
    }
  }, [now])

  useEffect(() => {
    abandoned.current = false
    run()

    // Never on a timer: a service worker cannot wake itself without push, so open,
    // reconnect, and install are the only moments this can run.
    window.addEventListener('online', run)
    window.addEventListener('appinstalled', run)
    return () => {
      abandoned.current = true
      window.removeEventListener('online', run)
      window.removeEventListener('appinstalled', run)
    }
  }, [run])
}
