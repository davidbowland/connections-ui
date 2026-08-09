import React, { useMemo } from 'react'

import { GameId } from '@types'

export interface GameSelectionRowProps {
  gameId: GameId
  isOffline: boolean
  isOnDevice: boolean
  isSolved: boolean
  isToday: boolean
  isUpNext: boolean
  locale?: string
  onSelect: (gameId: GameId) => void
  // The archive renders ~585 of these. Leaving each one in the tab order would put
  // 585 stops between the disclosure and the next control, so the archive passes -1
  // and moves focus with the arrow keys instead. The strip omits it and stays tabbable.
  tabIndex?: number
}

const defaultLocale = (): string => (typeof navigator === 'undefined' ? 'en-US' : navigator.language)

// gameId is a plain YYYY-MM-DD string. new Date() on it depends on zero-padding
// and on the runtime zone, so the parts are read out and rebuilt in UTC.
const shortDate = (gameId: GameId, locale: string): string => {
  const [year, month, day] = gameId.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
    year: 'numeric',
  })
}

export const GameSelectionRow = ({
  gameId,
  isOffline,
  isOnDevice,
  isSolved,
  isToday,
  isUpNext,
  locale = defaultLocale(),
  onSelect,
  tabIndex,
}: GameSelectionRowProps): React.ReactNode => {
  const date = shortDate(gameId, locale)

  // Offline and on-device are orthogonal facts. A row is only blocked where they
  // meet: the puzzle is not here and there is no connection to fetch it with.
  //
  // The cursor split below is only visible because the playable branch names its own:
  // Tailwind v4's preflight dropped the button { cursor: pointer } rule v3 shipped, so
  // every button in this app pointed at an arrow and cursor-default here was a no-op
  // distinguishing nothing from nothing.
  const isBlocked = isOffline && !isOnDevice

  // Online, storage is a fact with no consequence, so no marker is shown.
  const storage = isOnDevice ? 'On device' : isBlocked ? 'Not on device' : undefined
  const tag = isToday ? 'Today' : isUpNext ? 'Up next' : undefined

  // Built from the exact visible strings so speaking what is on screen matches
  // the row (WCAG 2.5.3). The offline consequence is appended as an extra
  // sentence, never as a substitute for the storage fact.
  const label = useMemo(() => {
    const parts = [isSolved ? '✓ Solved' : 'Not solved', ...(storage ? [storage] : [])]
    const consequence = isBlocked ? ". Won't open until you're back online." : ''
    return `${date}${tag ? `, ${tag}` : ''} — ${parts.join(', ')}${consequence}`
  }, [date, isBlocked, isSolved, storage, tag])

  return (
    <button
      aria-current={isToday ? 'date' : isUpNext ? 'true' : undefined}
      aria-disabled={isBlocked ? 'true' : undefined}
      aria-label={label}
      className={`flex min-h-11 w-full items-center gap-2 rounded-xl border border-black/8 px-3 text-left text-[11px] dark:border-white/8${
        isBlocked
          ? ' cursor-default text-black/60 dark:text-white/55'
          : ' cursor-pointer text-black/70 hover:border-black/18 hover:bg-black/[0.03] dark:text-white/65 dark:hover:border-white/18 dark:hover:bg-white/[0.04]'
      }`}
      onClick={() => !isBlocked && onSelect(gameId)}
      tabIndex={tabIndex}
      type="button"
    >
      <span aria-hidden="true">{date}</span>
      {isToday && (
        <span
          aria-hidden="true"
          className="text-[9px] uppercase tracking-[0.15em] text-black/[0.88] dark:text-white/90"
        >
          Today
        </span>
      )}
      {!isToday && isUpNext && (
        <span aria-hidden="true" className="text-[9px] uppercase tracking-[0.15em]">
          Up next
        </span>
      )}
      <span aria-hidden="true" className="ml-auto flex gap-2 text-[9px] uppercase tracking-[0.15em]">
        {isSolved && <span>✓ Solved</span>}
        {storage && <span>{storage}</span>}
      </span>
      {/* A date in a rounded box is a list item everywhere else on the web; nothing but
          the hover said these open a puzzle, and hover is not a thing on the phone this
          gets installed on. The same chevron the month select uses, turned a quarter, so
          it reads as this app's affordance rather than a new one. Blocked rows omit it:
          they do not open, so they must not promise to. */}
      {!isBlocked && (
        <svg
          aria-hidden="true"
          className="ml-1 h-3 w-3 shrink-0 -rotate-90 opacity-70"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 12 12"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      )}
    </button>
  )
}
