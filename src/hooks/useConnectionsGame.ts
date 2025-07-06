import { useEffect, useState } from 'react'

import { fetchConnectionsGame } from '@services/connections'
import { CategoryObject, SolvedCategory } from '@types'

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
  clearSelectedWords: () => void
  errorMessage: string | null
  isLoading: boolean
  selectedWords: string[]
  selectWord: (word: string) => void
  solvedCategories: SolvedCategory[]
  unselectWord: (word: string) => void
  words: string[]
}

export const useConnectionsGame = (gameId: string): UseConnectionsGameResult => {
  const [categories, setCategories] = useState<CategoryObject>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [solvedCategories, setSolvedCategories] = useState<SolvedCategory[]>([])
  const [words, setWords] = useState<string[]>([])

  const selectWord = (word: string) => {
    if (selectedWords.length < 4 && !selectedWords.includes(word)) {
      const newSelected = [...selectedWords, word]
      setSelectedWords(newSelected)

      if (newSelected.length === 4) {
        // Check if all 4 words belong to the same category
        const categoryEntry = Object.entries(categories).find(([, category]) =>
          newSelected.every((selectedWord) => category.words.includes(selectedWord)),
        )

        if (categoryEntry) {
          const [categoryName, category] = categoryEntry
          setSolvedCategories((prev) => [...prev, { description: categoryName, words: category.words }])
          setWords((prev) => prev.filter((w) => !category.words.includes(w)))
          setSelectedWords([])
        }
      }
    }
  }

  const unselectWord = (word: string) => {
    setSelectedWords((prev) => prev.filter((w) => w !== word))
  }

  const clearSelectedWords = () => {
    setSelectedWords([])
  }

  useEffect(() => {
    setIsLoading(true)
    setErrorMessage(null)

    setCategories({})
    setSelectedWords([])
    setWords([])

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

  return {
    categories,
    clearSelectedWords,
    errorMessage,
    isLoading,
    selectedWords,
    selectWord,
    solvedCategories,
    unselectWord,
    words,
  }
}
