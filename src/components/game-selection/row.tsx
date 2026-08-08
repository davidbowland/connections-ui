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
}: GameSelectionRowProps): React.ReactNode => {
  const date = shortDate(gameId, locale)

  // Offline and on-device are orthogonal facts. A row is only blocked where they
  // meet: the puzzle is not here and there is no connection to fetch it with.
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
          : ' text-black/70 hover:border-black/18 hover:bg-black/[0.03] dark:text-white/65 dark:hover:border-white/18 dark:hover:bg-white/[0.04]'
      }`}
      onClick={() => !isBlocked && onSelect(gameId)}
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
    </button>
  )
}
