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
        <select
          aria-label="Select game"
          className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          onChange={(e) => router.push(`/g/${e.target.value}`)}
          value={gameId}
        >
          {formattedGameIds.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      )}
      {errorMessage && <div role="alert">{errorMessage}</div>}
    </>
  )
}
