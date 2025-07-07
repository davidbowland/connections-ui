import { useEffect, useState } from 'react'

import { fetchConnectionsGameIds } from '@services/connections'
import { GameId } from '@types'

export interface UseGameIdsResult {
  errorMessage: string | null
  gameIds: GameId[]
  isLoading: boolean
}

export const useGameIds = (): UseGameIdsResult => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [gameIds, setGameIds] = useState<GameId[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchConnectionsGameIds()
      .then((response) => {
        setGameIds(response.gameIds)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        console.error('fetchConnectionsGameIds', { error })
        setErrorMessage('Unable to load game IDs')
      })
  }, [])

  return { errorMessage, gameIds, isLoading }
}
