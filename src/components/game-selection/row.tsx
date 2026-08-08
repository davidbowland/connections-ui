import React, { useMemo } from 'react'

import { GameId } from '@types'

export interface GameSelectionRowProps {
  gameId: GameId
  isBlocked: boolean
  isOnDevice: boolean
  isSolved: boolean
  isToday: boolean
  isUpNext: boolean
  onSelect: (gameId: GameId) => void
}

const shortDate = (gameId: GameId): string =>
  new Date(gameId).toLocaleDateString(typeof navigator === 'undefined' ? 'en-US' : navigator.language, {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
    year: 'numeric',
  })

export const GameSelectionRow = ({
  gameId,
  isBlocked,
  isOnDevice,
  isSolved,
  isToday,
  isUpNext,
  onSelect,
}: GameSelectionRowProps): React.ReactNode => {
  const date = shortDate(gameId)

  // The visible markers are glyph-plus-word so nothing is signalled by colour
  // alone; this spells the same facts out in full, including what a blocked row
  // costs, which the markers cannot say in the space available.
  const label = useMemo(() => {
    const parts = [isSolved ? 'solved' : 'not solved']
    if (isOnDevice) parts.push('on this device')
    else if (isBlocked) parts.push("not on this device, so it won't open while you're offline")
    return `${date}${isToday ? ', today' : ''}${isUpNext && !isToday ? ', up next' : ''} — ${parts.join(', ')}`
  }, [date, isBlocked, isOnDevice, isSolved, isToday, isUpNext])

  return (
    <button
      aria-current={isUpNext ? 'true' : undefined}
      aria-disabled={isBlocked ? 'true' : undefined}
      aria-label={label}
      className={`flex min-h-11 w-full items-center gap-2 rounded-xl border border-black/8 px-3 text-left text-[11px] text-black/70 hover:border-black/18 hover:bg-black/[0.03] dark:border-white/8 dark:text-white/65 dark:hover:border-white/18 dark:hover:bg-white/[0.04]${isBlocked ? ' line-through' : ''}`}
      onClick={() => !isBlocked && onSelect(gameId)}
      type="button"
    >
      <span aria-hidden="true">{date}</span>
      {isToday && (
        <span aria-hidden="true" className="text-[9px] uppercase tracking-[0.15em]">
          Today
        </span>
      )}
      {!isToday && isUpNext && (
        <span
          aria-hidden="true"
          className="text-[9px] uppercase tracking-[0.15em] text-black/[0.88] dark:text-white/90"
        >
          Up next
        </span>
      )}
      <span aria-hidden="true" className="ml-auto flex gap-2 text-[9px] uppercase tracking-[0.12em]">
        {isSolved && <span>✓ Solved</span>}
        {isBlocked ? <span>Not on device</span> : isOnDevice && <span>On device</span>}
      </span>
    </button>
  )
}
