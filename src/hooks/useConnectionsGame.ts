import { useEffect, useState } from 'react'

import { fetchConnectionsGame } from '@services/connections'
import { CategoryObject } from '@types'

// Cryptographically secure random shuffle using Fisher-Yates algorithm
const shuffleArray = (array: string[]): string[] => {
  const shuffled = [...array]
  const crypto = window.crypto || (window as any).msCrypto

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomBytes = new Uint32Array(1)
    crypto.getRandomValues(randomBytes)
    const j = Math.floor((randomBytes[0] / (0xffffffff + 1)) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

export interface UseConnectionsGameResult {
  categories: CategoryObject
  words: string[]
  isLoading: boolean
  errorMessage: string | null
}

export const useConnectionsGame = (gameId: string): UseConnectionsGameResult => {
  const [categories, setCategories] = useState<CategoryObject>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [words, setWords] = useState<string[]>([])

  useEffect(() => {
    setIsLoading(true)
    setErrorMessage(null)

    fetchConnectionsGame(gameId)
      .then((game) => {
        const allWords = Object.values(game.categories).reduce(
          (acc, category) => [...acc, ...category.words],
          [] as string[],
        )
        setCategories(game.categories)
        setWords(shuffleArray(allWords))
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        console.error('fetchConnectionsGame', { error })
        setErrorMessage('Failed to load game')
      })
  }, [gameId])

  return { categories, errorMessage, isLoading, words }
}
