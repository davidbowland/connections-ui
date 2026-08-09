import { useEffect, useMemo, useState } from 'react'

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
//
// The list is still withheld until after mount. next.config.js sets output: 'export',
// so a synchronous list would be computed in Node at build time and baked into the
// HTML -- where both halves of it are wrong. The labels are formatted with
// navigator.language, which is en-US on the server and something else for most of the
// world, and the count grows by one every day the deploy stays live. Rendering nothing
// on the server and everything on the client is the only version that hydrates.
export const useGameIds = (now = Date.now): UseGameIdsResult => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const gameIds = useMemo(() => (mounted ? allGameIds(now) : []), [mounted, now])

  return { errorMessage: null, gameIds, isLoading: !mounted }
}
