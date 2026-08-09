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

const headingFor = (chosen: Choice | undefined, isSweep: boolean): string => {
  // undefined means nothing is playable at all -- offline with an empty device. It is
  // a fact about this device, not about the app, and the archive below is full of
  // buttons, so "nothing to play" would be contradicted by the screen it heads.
  if (chosen === undefined) return 'Nothing on this device'
  // nextUnplayed only asks whether anything OTHER than the puzzle on screen is
  // unsolved, so it reports a replay while the board above is still unfinished.
  // "All caught up" over an unsolved puzzle is the same false claim the why-line
  // guards against, one level up.
  if (chosen.replay && isSweep) return 'All caught up'
  return 'Up next'
}

const whyLine = (
  chosen: Choice | undefined,
  isOffline: boolean,
  total: number,
  current: GameId,
  isSweep: boolean,
): string => {
  if (chosen === undefined) return 'Nothing is on this device yet. Open a puzzle while you’re online and it stays.'
  if (chosen.replay) {
    // A replay of the puzzle on screen is not the same fact as a replay of some other
    // one. nextUnplayed falls back to the current puzzle when it is the only thing in
    // the pool, and nothing need have been solved for that to happen -- "you've solved
    // every puzzle" would then be flatly false above an unfinished board. Same trap the
    // non-replay line already sidesteps with "apart from this one".
    if (chosen.id === current) return 'This is the only puzzle on this device. Same words, new order.'
    // nextUnplayed never asks whether the puzzle on screen is solved -- it only looks
    // for something OTHER than current to hand over. So a sweep claim here is false
    // whenever the board above is unfinished, which is the ordinary installed-offline
    // state: yesterday back through last week solved, today still open.
    if (!isSweep) {
      return isOffline
        ? 'Everything else on this device is solved. Same words, new order.'
        : 'Everything else is solved. Same words, new order.'
    }
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

  // The sweep claim is about the pool nextUnplayed drew from, not about the puzzle on
  // screen. nextUnplayed only ever asks whether something OTHER than current is
  // unsolved, so it reports a replay with an unfinished board sitting above -- the
  // ordinary installed-offline state, last week solved and today still open. Asking
  // the pool directly is the only thing that makes "you've solved every puzzle" true
  // when it is printed. Note current may not be in the pool at all: offline, a puzzle
  // can be on screen without being on the device.
  const isSweep = useMemo(() => {
    const pool = isOffline ? ids.filter((id) => onDeviceSet.has(id)) : ids
    return pool.every((id) => solvedSet.has(id))
  }, [ids, isOffline, onDeviceSet, solvedSet])

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
      {/* The recommendation is the one thing on this screen that is a decision rather
          than a list, so it gets the only filled panel. Without an edge of its own it
          sat in the same flat column as everything under it and the whole region read
          as one undifferentiated run of small grey type. */}
      <div className="rounded-2xl border border-black/8 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.03]">
        <h2 className="mb-2.5 text-[9px] uppercase tracking-[0.2em] text-black/60 dark:text-white/55">
          {headingFor(chosen, isSweep)}
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

        <p className="mt-3 text-[11.5px] leading-5 text-black/60 dark:text-white/55">
          {whyLine(chosen, isOffline, ids.length, gameId, isSweep)}
        </p>

        {/* Always mounted, empty while online. NVDA and JAWS announce a change of text
            inside a region they are already watching; a role="status" element inserted
            with its message already in it is routinely missed, which would make going
            offline silent -- the one transition this region exists to report. */}
        <p
          className="mt-4 text-[11px] uppercase tracking-[0.15em] text-black/60 empty:mt-0 dark:text-white/55"
          role="status"
        >
          {isOffline ? `You’re offline · ${deviceCount} on this device` : ''}
        </p>

        {/* Inventory, not news, so it is not announced: the count would otherwise be
            re-read on every navigation, which is noise rather than information. */}
        {isOnline && (
          <p className="mt-4 text-[11px] uppercase tracking-[0.15em] text-black/60 dark:text-white/55">
            {deviceCount} on this device
          </p>
        )}
      </div>

      {/* One list, two lengths. The strip and the archive used to be rendered together,
          so opening the archive printed the same seven dates a second time a few hundred
          pixels below the first -- the newest month always opens with exactly the week
          already on screen. Swapping one for the other keeps the disclosure honest and
          removes the duplicate outright. */}
      <div className="mt-6 border-t border-black/8 pt-6 dark:border-white/8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-[9px] uppercase tracking-[0.2em] text-black/60 dark:text-white/55" id="strip-heading">
            {isArchiveOpen ? 'Every puzzle' : 'Last 7 days'}
          </h3>
          {/* The label names the destination and never changes, so aria-expanded is
              left to carry the state -- a control that renames itself on press reads as
              a different control to anyone listening to it. */}
          <button
            aria-controls={isArchiveOpen ? ARCHIVE_ID : undefined}
            aria-expanded={isArchiveOpen}
            className="-mr-2 min-h-11 shrink-0 px-2 text-[10px] uppercase tracking-[0.15em] text-black/60 hover:text-black/[0.88] dark:text-white/55 dark:hover:text-white/90"
            onClick={() => setIsArchiveOpen((open) => !open)}
            type="button"
          >
            See every puzzle
          </button>
        </div>

        {isArchiveOpen ? (
          <>
            <p className="text-[11.5px] leading-5 text-black/60 dark:text-white/55">
              {solvedCount === 0
                ? 'You haven’t solved any of these yet.'
                : `You’ve solved ${solvedCount} of ${ids.length} puzzles.`}
              {isOffline &&
                ` ${listedOnDevice.length} of them ${listedOnDevice.length === 1 ? 'is' : 'are'} on this device — the rest need a connection.`}
            </p>

            <div className="mt-5">
              <label
                className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/60 dark:text-white/55"
                htmlFor="jump-to-month"
              >
                Jump to month
              </label>
              {/* appearance-none strips the platform's own arrow, so without both the
                  named placeholder and the chevron below this rendered as an empty
                  rounded box that gave no sign it was a menu at all.

                  Uncontrolled: the select keeps naming the month you jumped to, which is
                  where the scroll region now sits. */}
              <div className="relative">
                <select
                  className="min-h-11 w-full appearance-none rounded-xl border border-black/8 bg-black/[0.03] py-2 pl-3 pr-10 text-[11px] text-black/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65"
                  defaultValue=""
                  id="jump-to-month"
                  onChange={(event) => jumpToMonth(event.target.value)}
                >
                  <option value="">Pick a month</option>
                  {months.map((month) => (
                    <option key={month.key} value={month.key}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3.5 top-1/2 h-3 w-3 -translate-y-1/2 text-black/60 dark:text-white/55"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 12 12"
                >
                  <path d="M2.5 4.5 6 8l3.5-3.5" />
                </svg>
              </div>
            </div>

            {/* One tab stop for ~585 rows, and it is a row: exactly one carries
                tabIndex 0 and the arrow keys move it. Tab therefore lands on a button
                that announces itself as one, rather than on a container that gives a
                keyboard user no clue that the rows are reachable at all. */}
            <div
              aria-label="Every puzzle, newest first"
              className="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-black/8 px-3 dark:border-white/8"
              id={ARCHIVE_ID}
              onFocus={onArchiveFocus}
              onKeyDown={onArchiveKeyDown}
              role="group"
            >
              {months.map((month) => (
                <div data-month={month.key} key={month.key}>
                  {/* The month name is the only thing separating one run of near
                      identical dates from the next, so it is also the divider: a ruled
                      band that stays put while its own rows scroll under it. */}
                  <h3
                    className="sticky top-0 z-10 border-b border-black/8 bg-[#f4f4f6] pb-1.5 pt-3 text-[9px] uppercase tracking-[0.2em] text-black/[0.88] dark:border-white/8 dark:bg-[#060608] dark:text-white/90"
                    id={`archive-${month.key}`}
                  >
                    {month.label}
                  </h3>
                  {/* A real list, so a screen reader says "3 of 31" instead of leaving
                      the rows as anonymous buttons in an anonymous box. */}
                  <ul aria-labelledby={`archive-${month.key}`} className="mt-2 flex flex-col gap-2 pb-4">
                    {month.ids.map((id, index) => (
                      <li key={id}>{renderRow(id, month.start + index === activeIndex ? 0 : -1)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div aria-labelledby="strip-heading" className="flex flex-col gap-2" role="group">
            {strip.map((id) => renderRow(id))}
          </div>
        )}
      </div>

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
