import { useMemo } from 'react'

export const useGameIds = (): string[] => {
  return useMemo(() => {
    const gameIds: string[] = []
    const startDate = new Date('2025-01-01')
    const today = new Date()

    for (const date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
      gameIds.push(date.toISOString().split('T')[0])
    }

    return gameIds.reverse() // Most recent first
  }, [])
}
