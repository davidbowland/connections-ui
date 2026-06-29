import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useGameIds } from '@hooks/useGameIds'
import { GameId } from '@types'

export interface GameSelectionProps {
  gameId: GameId
}

export const GameSelection = ({ gameId }: GameSelectionProps): React.ReactNode => {
  const router = useRouter()
  const { errorMessage, gameIds, isLoading } = useGameIds()

  const formattedGameIds = useMemo(
    () =>
      gameIds.map((id) => ({
        id,
        label: new Date(id).toLocaleDateString(typeof navigator === 'undefined' ? 'en-US' : navigator.language, {
          day: 'numeric',
          month: 'numeric',
          timeZone: 'UTC',
          year: 'numeric',
        }),
      })),
    [gameIds],
  )

  return (
    <>
      {!isLoading && (
        <div>
          <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-black/22 dark:text-white/22">
            Play another date
          </p>
          <select
            aria-label="Select game"
            className="w-full appearance-none rounded-xl border border-black/8 bg-black/[0.03] px-4 py-3 text-sm text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
            onChange={(e) => router.push(`/g/${e.target.value}`)}
            value={gameId}
          >
            {formattedGameIds.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
      {errorMessage && <div role="alert">{errorMessage}</div>}
    </>
  )
}
