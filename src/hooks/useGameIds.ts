import { useMemo } from 'react'

import { GameId } from '@types'
import { allGameIds } from '@utils/game-ids'

export interface UseGameIdsResult {
  errorMessage: string | null
  gameIds: GameId[]
  isLoading: boolean
}

// The list is pure date arithmetic now, so there is nothing to await and nothing to
// fail -- which is exactly what makes the picker work with no connection.
// errorMessage and isLoading survive only so the existing caller compiles unchanged;
// the game-selection rewrite calls allGameIds() directly and deletes this hook.
export const useGameIds = (now = Date.now): UseGameIdsResult => {
  const gameIds = useMemo(() => allGameIds(now), [now])

  return { errorMessage: null, gameIds, isLoading: false }
}
