import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useGameIds } from '@hooks/useGameIds'
import { GameId } from '@types'

export interface GameSelectionProps {
  gameId?: GameId
}

const formatGameId = (id: GameId): string =>
  new Date(id).toLocaleDateString(typeof navigator === 'undefined' ? 'en-US' : navigator.language, {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
    year: 'numeric',
  })

export const GameSelection = ({ gameId }: GameSelectionProps): React.ReactNode => {
  const router = useRouter()
  const { errorMessage, gameIds } = useGameIds()

  // Fall back to the day being played so the control keeps its space while the list loads
  const availableGameIds = useMemo(() => {
    if (gameIds.length > 0) return gameIds
    return gameId === undefined ? [] : [gameId]
  }, [gameId, gameIds])

  const formattedGameIds = useMemo(
    () => availableGameIds.map((id) => ({ id, label: formatGameId(id) })),
    [availableGameIds],
  )

  return (
    <>
      <div>
        <label
          className="mb-2 block text-[9px] uppercase tracking-[0.2em] text-black/60 dark:text-white/55"
          htmlFor="game-date"
        >
          Pick another day
        </label>
        <select
          className="w-full appearance-none rounded-xl border border-black/8 bg-black/[0.03] px-4 py-3 text-sm text-black/55 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
          disabled={formattedGameIds.length === 0}
          id="game-date"
          onChange={(e) => router.push(`/g/${e.target.value}`)}
          value={gameId ?? ''}
        >
          {gameId === undefined && <option value="" />}
          {formattedGameIds.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {errorMessage && <div role="alert">{errorMessage}</div>}
    </>
  )
}
