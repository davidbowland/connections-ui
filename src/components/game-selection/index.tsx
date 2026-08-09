import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { InstallCard } from './install-card'
import { GameSelectionRow } from './row'
import { useInstallPrompt } from '@hooks/useInstallPrompt'
import { useOnline } from '@hooks/useOnline'
import { cachedGameIds, readMeta, STORAGE_EVENT } from '@services/storage'
import { GameId } from '@types'
import { allGameIds, nextUnplayed } from '@utils/game-ids'

const STRIP_LENGTH = 7

// The scroll region is addressed by id rather than by ref so the month select, which
// sits outside it, can reach a row without threading a ref through the tree.
const ARCHIVE_ID = 'game-archive'

export interface GameSelectionProps {
  gameId?: GameId
  locale?: string
  now?: () => number
}

// Node 24 defines globalThis.navigator, so the export build reads the build machine's
// ICU default rather than throwing. That is still the wrong language for everyone
// else, which is why nothing formatted here survives the first render.
const defaultLocale = (): string => globalThis.navigator?.language ?? 'en-US'

// A gameId is a plain YYYY-MM-DD string. new Date() on one depends on zero-padding and
// on the runtime zone, so the parts are read out and rebuilt in UTC -- the same
// treatment row.tsx gives the short form, so the two can never name different days.
const longDate = (gameId: GameId, locale: string): string => {
  const [year, month, day] = gameId.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  })
}

const monthLabel = (monthKey: string, locale: string): string => {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  })
}

interface MonthSection {
  ids: GameId[]
  key: string
  label: string
  // Position of this month's first row in the flat list, so the roving tab stop can be
  // compared without searching all 585 ids for every row.
  start: number
}

// ids arrive newest-first and contiguous, so a single pass is enough; no map, no sort.
const groupByMonth = (ids: GameId[], locale: string): MonthSection[] =>
  ids.reduce<MonthSection[]>((sections, id, index) => {
    const key = id.slice(0, 7)
    const open = sections.at(-1)
    if (open?.key === key) {
      open.ids.push(id)
      return sections
    }
    return [...sections, { ids: [id], key, label: monthLabel(key, locale), start: index }]
  }, [])

const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`

interface Choice {
  id: GameId
  replay: boolean
}

const headingFor = (chosen: Choice | undefined): string => {
  // undefined means nothing is playable at all -- offline with an empty device. It is
  // a fact about this device, not about the app, and the archive below is full of
  // buttons, so "nothing to play" would be contradicted by the screen it heads.
  if (chosen === undefined) return 'Nothing on this device'
  if (chosen.replay) return 'All caught up'
  return 'Up next'
}

const whyLine = (chosen: Choice | undefined, isOffline: boolean, total: number, current: GameId): string => {
  if (chosen === undefined) return 'Nothing is on this device yet. Open a puzzle while you’re online and it stays.'
  if (chosen.replay) {
    // A replay of the puzzle on screen is not the same fact as a replay of some other
    // one. nextUnplayed falls back to the current puzzle when it is the only thing in
    // the pool, and nothing need have been solved for that to happen -- "you've solved
    // every puzzle" would then be flatly false above an unfinished board. Same trap the
    // non-replay line already sidesteps with "apart from this one".
    if (chosen.id === current) return 'This is the only puzzle on this device. Same words, new order.'
    return isOffline
      ? 'You’ve solved every puzzle on this device. Same words, new order.'
      : `You’ve solved all ${total} puzzles. Same words, new order.`
  }
  // nextUnplayed skips the puzzle on screen, so without "apart from this one" this line
  // contradicts the board printed directly above it -- on the app's most-seen screen,
  // where landing on today unsolved recommends yesterday. The clause is only ever
  // printed because the region waits for a puzzle to be on screen before it renders.
  return isOffline
    ? 'The most recent puzzle on this device you haven’t solved, apart from this one.'
    : 'The most recent puzzle you haven’t solved, apart from this one.'
}

// Arrow keys, not Tab. Returns undefined for every other key so the handler can leave
// the event alone -- typing must never be swallowed by a list.
const targetIndex = (key: string, from: number, length: number): number | undefined => {
  if (key === 'Home') return 0
  if (key === 'End') return length - 1
  if (key === 'ArrowDown') return Math.min(from + 1, length - 1)
  if (key === 'ArrowUp') return Math.max(from - 1, 0)
  return undefined
}

interface Snapshot {
  ids: GameId[]
  onDevice: GameId[]
  solved: GameId[]
}

interface RegionProps {
  // Required, unlike the prop on GameSelection: the region names the puzzle it is not
  // offering ("apart from this one"), so it cannot be painted before that is known.
  gameId: GameId
  isOnline: boolean
  locale: string
  snapshot: Snapshot
}

const GameSelectionRegion = ({ gameId, isOnline, locale, snapshot }: RegionProps): React.ReactNode => {
  const router = useRouter()
  const { dismiss, install, mode, platform, reopen } = useInstallPrompt()
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  // The archive's single tab stop. Roving: whichever row was last focused keeps it, so
  // Tab returns a keyboard user to where they were rather than to the top.
  const [activeRow, setActiveRow] = useState(0)

  const { ids, onDevice, solved } = snapshot
  const isOffline = !isOnline

  const onDeviceSet = useMemo(() => new Set(onDevice), [onDevice])
  const solvedSet = useMemo(() => new Set(solved), [solved])

  // Offline the pool is what the device holds; online it is every day that exists.
  // Returns undefined when neither leaves anything playable.
  const chosen = useMemo(
    () => nextUnplayed({ available: isOffline ? onDevice : undefined, current: gameId, ids, solved }),
    [gameId, ids, isOffline, onDevice, solved],
  )

  // Counted over ids, not over solved: ct:meta can hold a day the archive no longer
  // lists, and "138 of 585" has to be a subset of the 585 on screen.
  const solvedCount = useMemo(() => ids.filter((id) => solvedSet.has(id)).length, [ids, solvedSet])

  // The same drift, in the other direction. West of UTC the prefetch stages tomorrow's
  // puzzle hours before the local date reaches it, deliberately -- but ids stops at the
  // local today, so the raw length counts a puzzle this region will not list, will not
  // offer, and will not open. Every US evening it read one too many.
  const listedOnDevice = useMemo(() => ids.filter((id) => onDeviceSet.has(id)), [ids, onDeviceSet])
  const strip = useMemo(() => ids.slice(0, STRIP_LENGTH), [ids])
  const months = useMemo(() => groupByMonth(ids, locale), [ids, locale])

  // A day can drop off the end of the archive while a row is focused -- the list is
  // rebuilt whenever the app resumes -- so the stored index is clamped, never trusted.
  const activeIndex = Math.min(activeRow, ids.length - 1)

  // Pushing the route already on screen does nothing at all: pages/g/[gameId] keys its
  // load on router.asPath, which does not change, so the board neither refetches nor
  // reshuffles. That makes "Play <date> again" -- the one CTA that always names the
  // current puzzle -- a dead button. A reload is what "same words, new order" costs.
  const goTo = useCallback(
    (id: GameId) => {
      if (id === gameId) {
        router.reload()
        return
      }
      void router.push(`/g/${id}`)
    },
    [gameId, router],
  )

  // Delegated: keydown bubbles from the focused row up to the region, so one handler
  // serves all 585 without 585 listeners.
  const onArchiveKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const rows = Array.from(event.currentTarget.querySelectorAll('button'))
    const index = targetIndex(event.key, rows.indexOf(document.activeElement as HTMLButtonElement), rows.length)
    if (index === undefined) return
    // Arrow keys would otherwise scroll the region out from under the focused row.
    event.preventDefault()
    rows[index].focus()
  }

  // React's onFocus is focusin, which bubbles, so the tab stop follows focus however it
  // got there -- arrow key, month jump, or mouse. Rows are the only focusable things in
  // here, so the lookup cannot miss.
  const onArchiveFocus = (event: React.FocusEvent<HTMLDivElement>): void => {
    const rows = Array.from(event.currentTarget.querySelectorAll('button'))
    setActiveRow(Math.max(0, rows.indexOf(document.activeElement as HTMLButtonElement)))
  }

  // Focus, not just scroll: focusing the month's first row puts a keyboard user where
  // the jump claimed to take them, and the browser scrolls to it for free.
  const jumpToMonth = (key: string): void =>
    document.querySelector<HTMLButtonElement>(`#${ARCHIVE_ID} [data-month="${key}"] button`)?.focus()

  const renderRow = (id: GameId, tabIndex?: number): React.ReactNode => (
    <GameSelectionRow
      gameId={id}
      isOffline={isOffline}
      isOnDevice={onDeviceSet.has(id)}
      isSolved={solvedSet.has(id)}
      isToday={id === ids[0]}
      isUpNext={id === chosen?.id}
      key={id}
      locale={locale}
      onSelect={goTo}
      tabIndex={tabIndex}
    />
  )

  const deviceCount = pluralize(listedOnDevice.length, 'puzzle', 'puzzles')

  return (
    <section aria-label="Puzzles">
      <h2 className="mb-2 text-[9px] uppercase tracking-[0.2em] text-black/60 dark:text-white/55">
        {headingFor(chosen)}
      </h2>

      {chosen && (
        <button
          className="min-h-11 w-full rounded-full bg-[var(--accent)] px-4 text-[11px] uppercase tracking-[0.15em] text-white hover:bg-[var(--accent-hover)]"
          onClick={() => goTo(chosen.id)}
          type="button"
        >
          {chosen.replay ? `Play ${longDate(chosen.id, locale)} again` : `Play ${longDate(chosen.id, locale)}`}
        </button>
      )}

      <p className="mt-2 text-[11.5px] leading-5 text-black/60 dark:text-white/55">
        {whyLine(chosen, isOffline, ids.length, gameId)}
      </p>

      {/* Always mounted, empty while online. NVDA and JAWS announce a change of text
          inside a region they are already watching; a role="status" element inserted
          with its message already in it is routinely missed, which would make going
          offline silent -- the one transition this region exists to report. */}
      <p
        className="mt-1 text-[11px] uppercase tracking-[0.15em] text-black/60 empty:mt-0 dark:text-white/55"
        role="status"
      >
        {isOffline ? `You’re offline · ${deviceCount} on this device` : ''}
      </p>

      {/* Inventory, not news, so it is not announced: the count would otherwise be
          re-read on every navigation, which is noise rather than information. */}
      {isOnline && (
        <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-black/60 dark:text-white/55">
          {deviceCount} on this device
        </p>
      )}

      <div aria-labelledby="strip-heading" className="mt-4" role="group">
        <h3 className="text-[9px] uppercase tracking-[0.2em] text-black/60 dark:text-white/55" id="strip-heading">
          Last 7 days
        </h3>
        <div className="mt-1.5 flex flex-col gap-1.5">{strip.map((id) => renderRow(id))}</div>
      </div>

      <button
        aria-controls={isArchiveOpen ? ARCHIVE_ID : undefined}
        aria-expanded={isArchiveOpen}
        className="mt-3 min-h-11 text-[10px] uppercase tracking-[0.15em] text-black/60 hover:text-black/[0.88] dark:text-white/55 dark:hover:text-white/90"
        onClick={() => setIsArchiveOpen((open) => !open)}
        type="button"
      >
        See every puzzle
      </button>

      {isArchiveOpen && (
        <>
          <p className="mt-1 text-[11.5px] leading-5 text-black/60 dark:text-white/55">
            {solvedCount === 0
              ? 'You haven’t solved any of these yet.'
              : `You’ve solved ${solvedCount} of ${ids.length} puzzles.`}
            {isOffline &&
              ` ${listedOnDevice.length} of them ${listedOnDevice.length === 1 ? 'is' : 'are'} on this device — the rest need a connection.`}
          </p>

          <div className="mt-2">
            <label
              className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-black/60 dark:text-white/55"
              htmlFor="jump-to-month"
            >
              Jump to month
            </label>
            {/* Uncontrolled: the select keeps naming the month you jumped to, which is
                where the scroll region now sits. */}
            <select
              className="w-full appearance-none rounded-xl border border-black/8 bg-black/[0.03] px-3 py-2 text-[11px] text-black/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65"
              defaultValue=""
              id="jump-to-month"
              onChange={(event) => jumpToMonth(event.target.value)}
            >
              <option value="" />
              {months.map((month) => (
                <option key={month.key} value={month.key}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* One tab stop for ~585 rows, and it is a row: exactly one carries
              tabIndex 0 and the arrow keys move it. Tab therefore lands on a button
              that announces itself as one, rather than on a container that gives a
              keyboard user no clue that the rows are reachable at all. */}
          <div
            aria-label="Every puzzle, newest first"
            className="mt-2 max-h-[420px] overflow-y-auto"
            id={ARCHIVE_ID}
            onFocus={onArchiveFocus}
            onKeyDown={onArchiveKeyDown}
            role="group"
          >
            {months.map((month) => (
              <div data-month={month.key} key={month.key}>
                <h3
                  className="sticky top-0 bg-[#f4f4f6] py-1 text-[9px] uppercase tracking-[0.2em] text-black/60 dark:bg-[#060608] dark:text-white/55"
                  id={`archive-${month.key}`}
                >
                  {month.label}
                </h3>
                {/* A real list, so a screen reader says "3 of 31" instead of leaving
                    the rows as anonymous buttons in an anonymous box. */}
                <ul aria-labelledby={`archive-${month.key}`} className="flex flex-col gap-1.5 pb-1.5">
                  {month.ids.map((id, index) => (
                    <li key={id}>{renderRow(id, month.start + index === activeIndex ? 0 : -1)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <InstallCard mode={mode} onDismiss={dismiss} onInstall={install} onReopen={reopen} platform={platform} />
    </section>
  )
}

export const GameSelection = ({
  gameId,
  locale = defaultLocale(),
  now = Date.now,
}: GameSelectionProps): React.ReactNode => {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const isOnline = useOnline()
  // Frozen at mount on purpose. Depending on the now prop directly would re-run the
  // effect for any caller that passes an inline arrow, and since the effect sets state
  // that would spin forever.
  const [clock] = useState(() => now)

  useEffect(() => {
    const read = (): void =>
      setSnapshot({ ids: allGameIds(clock), onDevice: cachedGameIds(), solved: readMeta().solved })
    read()

    // Route changes are not the only thing that moves these facts, and reading only on
    // them is what made this region refuse to play with a full device: usePrefetch
    // stores seven puzzles after mount and again on every reconnect and install, and
    // useConnectionsGame stores the puzzle on screen. None of that touches gameId, so
    // the region has to listen to the same signals the writes do.
    //
    // ct:storage is the write itself, and it is the only one of these that fires when
    // the device fills. online/appinstalled fire *before* the prefetch they start
    // finishes, so on a first visit the count sat at "0 puzzles on this device" for the
    // whole session, and a win did not reach the strip until a navigation.
    window.addEventListener(STORAGE_EVENT, read)
    window.addEventListener('online', read)
    window.addEventListener('appinstalled', read)
    // Resume, not merely visibility. An installed PWA keeps its JS context across
    // days, so without this the archive still calls yesterday "Today" the next
    // morning, hides today's puzzle entirely, and offers a day already finished.
    document.addEventListener('visibilitychange', read)
    return () => {
      window.removeEventListener(STORAGE_EVENT, read)
      window.removeEventListener('online', read)
      window.removeEventListener('appinstalled', read)
      document.removeEventListener('visibilitychange', read)
    }
    // isOnline is a dependency, not a convenience: dropping the connection changes
    // which puzzles count as playable, and the answer is read from the device here.
  }, [clock, gameId, isOnline])

  // Nothing above this line may depend on the date, the clock, or the browser.
  // next.config.js sets output: 'export', so this component is rendered in Node at
  // build time and its output is shipped as HTML to everyone. allGameIds() there
  // freezes the archive at the moment of deploy -- one day later every count is wrong
  // -- and toLocaleDateString() there formats all 585 labels in the build machine's
  // language, so every player outside it hydrates onto 585 mismatched labels.
  // Rendering nothing until the browser has the facts is the only version that is
  // correct for more than a day. The placeholder holds the height so the page does not
  // jump when it fills, and it also waits for the puzzle on screen: both callers
  // resolve gameId in an effect, so painting first would print a recommendation and
  // then visibly relabel it a frame later.
  if (snapshot === null || gameId === undefined) return <div aria-hidden="true" className="min-h-[560px]" />

  return <GameSelectionRegion gameId={gameId} isOnline={isOnline} locale={locale} snapshot={snapshot} />
}
