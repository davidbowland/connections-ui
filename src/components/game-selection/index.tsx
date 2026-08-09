import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { InstallCard } from './install-card'
import { GameSelectionRow } from './row'
import { useInstallPrompt } from '@hooks/useInstallPrompt'
import { useOnline } from '@hooks/useOnline'
import { cachedGameIds, readMeta } from '@services/storage'
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

const defaultLocale = (): string => (typeof navigator === 'undefined' ? 'en-US' : navigator.language)

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
}

// ids arrive newest-first and contiguous, so a single pass is enough; no map, no sort.
const groupByMonth = (ids: GameId[], locale: string): MonthSection[] =>
  ids.reduce<MonthSection[]>((sections, id) => {
    const key = id.slice(0, 7)
    const open = sections.at(-1)
    if (open?.key === key) {
      open.ids.push(id)
      return sections
    }
    return [...sections, { ids: [id], key, label: monthLabel(key, locale) }]
  }, [])

const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`

interface Choice {
  id: GameId
  replay: boolean
}

const headingFor = (chosen: Choice | undefined): string => {
  // undefined means nothing is playable at all -- offline with an empty device. It is
  // neither "up next" nor "caught up", and promising either would be a lie the CTA
  // cannot back up, because there is no CTA to render.
  if (chosen === undefined) return 'Nothing to play'
  if (chosen.replay) return 'All caught up'
  return 'Up next'
}

const whyLine = (chosen: Choice | undefined, isOffline: boolean, total: number): string => {
  if (chosen === undefined) return 'Nothing is on this device yet. Open a puzzle while you’re online and it stays.'
  if (chosen.replay) {
    return isOffline
      ? 'You’ve solved every puzzle on this device. Same words, new order.'
      : `You’ve solved all ${total} puzzles. Same words, new order.`
  }
  // nextUnplayed skips the puzzle on screen, so without "apart from this one" this line
  // contradicts the board printed directly above it -- on the app's most-seen screen,
  // where landing on today unsolved recommends yesterday.
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
  gameId?: GameId
  locale: string
  snapshot: Snapshot
}

const GameSelectionRegion = ({ gameId, locale, snapshot }: RegionProps): React.ReactNode => {
  const router = useRouter()
  const isOnline = useOnline()
  const { dismiss, install, mode, platform, reopen } = useInstallPrompt()
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

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
  const strip = useMemo(() => ids.slice(0, STRIP_LENGTH), [ids])
  const months = useMemo(() => groupByMonth(ids, locale), [ids, locale])

  const goTo = useCallback((id: GameId) => void router.push(`/g/${id}`), [router])

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

  const deviceCount = pluralize(onDevice.length, 'puzzle', 'puzzles')

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
        {whyLine(chosen, isOffline, ids.length)}
      </p>

      {isOffline ? (
        <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-black/60 dark:text-white/55" role="status">
          You’re offline · {deviceCount} on this device
        </p>
      ) : (
        // Inventory, not news. A live region here would re-announce the same count on
        // every navigation, which is noise rather than information.
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
            {isOffline && ` ${pluralize(onDevice.length, 'is', 'are')} on this device — the rest need a connection.`}
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

          {/* One tab stop for ~585 rows. The rows are still reachable and still
              operable -- the arrow keys walk them -- but they no longer sit between
              the disclosure and everything below it. */}
          <div
            aria-label="Every puzzle, newest first"
            className="mt-2 max-h-[420px] overflow-y-auto"
            id={ARCHIVE_ID}
            onKeyDown={onArchiveKeyDown}
            role="group"
            tabIndex={0}
          >
            {months.map((month) => (
              <div data-month={month.key} key={month.key}>
                <h3 className="sticky top-0 bg-[#f4f4f6] py-1 text-[9px] uppercase tracking-[0.2em] text-black/60 dark:bg-[#060608] dark:text-white/55">
                  {month.label}
                </h3>
                <div className="flex flex-col gap-1.5 pb-1.5">{month.ids.map((id) => renderRow(id, -1))}</div>
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
  // Frozen at mount on purpose. Depending on the now prop directly would re-run the
  // effect for any caller that passes an inline arrow, and since the effect sets state
  // that would spin forever.
  const [clock] = useState(() => now)

  // Re-read on navigation as well as on mount: solving a puzzle rewrites ct:meta and
  // opening one adds a ct:game: key, so the region has to recompute when the route
  // changes or it keeps recommending a day the player just finished.
  useEffect(() => {
    setSnapshot({ ids: allGameIds(clock), onDevice: cachedGameIds(), solved: readMeta().solved })
  }, [clock, gameId])

  // Nothing above this line may depend on the date, the clock, or the browser.
  // next.config.js sets output: 'export', so this component is rendered in Node at
  // build time and its output is shipped as HTML to everyone. allGameIds() there
  // freezes the archive at the moment of deploy -- one day later every count is wrong
  // -- and toLocaleDateString() there formats all 585 labels as en-US, because
  // navigator does not exist in Node, so every player outside en-US hydrates onto 585
  // mismatched labels. Rendering nothing until the browser has the facts is the only
  // version that is correct for more than a day. The placeholder holds the height so
  // the page does not jump when it fills.
  if (snapshot === null) return <div aria-hidden="true" className="min-h-[560px]" />

  return <GameSelectionRegion gameId={gameId} locale={locale} snapshot={snapshot} />
}
