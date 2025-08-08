import { useCallback, useEffect, useState, useMemo } from 'react'

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
  categoriesCount: number
  clearSelectedWords: () => void
  errorMessage: string | null
  getHint: () => void
  hints: string[]
  hintsReceived: number
  incorrectGuesses: number
  isHintAvailable: boolean
  isLoading: boolean
  isOneAway: boolean
  isRevealSolutionAvailable: boolean
  revealSolution: () => void
  selectedWords: string[]
  selectWord: (word: string) => void
  solvedCategories: SolvedCategory[]
  submitWords: () => boolean
  unselectWord: (word: string) => void
  words: string[]
}

export const useConnectionsGame = (gameId: string): UseConnectionsGameResult => {
  const [categories, setCategories] = useState<CategoryObject>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [incorrectGuesses, setIncorrectGuesses] = useState(0)
  const [isOneAway, setIsOneAway] = useState(false)
  const [revealedHints, setRevealedHints] = useState<Record<string, string>>({})
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [solvedCategories, setSolvedCategories] = useState<SolvedCategory[]>([])
  const [words, setWords] = useState<string[]>([])

  const selectWord = useCallback(
    (word: string) => {
      if (selectedWords.length < 4 && !selectedWords.includes(word)) {
        setSelectedWords((prev) => [...prev, word])
      }
    },
    [selectedWords],
  )

  const unselectWord = useCallback((word: string) => {
    setSelectedWords((prev) => prev.filter((w) => w !== word))
  }, [])

  const clearSelectedWords = useCallback(() => {
    setSelectedWords([])
  }, [])

  const submitWords = useCallback((): boolean => {
    if (selectedWords.length !== 4) return false

    const categoryEntry = Object.entries(categories).find(([, category]) =>
      selectedWords.every((selectedWord) => category.words.includes(selectedWord)),
    )

    if (categoryEntry) {
      const [categoryName, category] = categoryEntry
      setSolvedCategories((prev) => [...prev, { description: categoryName, words: category.words.toSorted() }])
      setWords((prev) => prev.filter((w) => !category.words.includes(w)))
      setSelectedWords([])
      setRevealedHints((prev) => {
        const { [categoryName]: _, ...rest } = prev
        return rest
      })
      return true
    } else {
      const isOneAwayResult = Object.values(categories).some((category) => {
        const matchCount = selectedWords.filter((word) => category.words.includes(word)).length
        return matchCount === 3
      })

      setIsOneAway(isOneAwayResult)
      setIncorrectGuesses((prev) => prev + 1)
      return false
    }
  }, [categories, selectedWords])

  const getHint = useCallback(() => {
    const unsolvedCategories = Object.entries(categories).filter(
      ([categoryName]) =>
        !solvedCategories.some((solved) => solved.description === categoryName) && !revealedHints[categoryName],
    )

    if (unsolvedCategories.length > 0) {
      const randomIndex = Math.floor(Math.random() * unsolvedCategories.length)
      const [categoryName, category] = unsolvedCategories[randomIndex]
      setRevealedHints((prev) => ({ ...prev, [categoryName]: category.hint }))
    }
  }, [categories, solvedCategories, revealedHints])

  const categoriesCount = useMemo(() => Object.keys(categories).length, [categories])
  const hintsReceived = useMemo(() => Object.keys(revealedHints).length, [revealedHints])

  const revealSolution = useCallback(() => {
    const remainingCategories = Object.entries(categories).filter(
      ([categoryName]) => !solvedCategories.some((solved) => solved.description === categoryName),
    )

    const newSolved = remainingCategories.map(([categoryName, category]) => ({
      description: categoryName,
      words: category.words,
    }))

    setRevealedHints({})
    setSelectedWords([])
    setSolvedCategories((prev) => [...prev, ...newSolved])
    setWords([])
  }, [categories, solvedCategories])

  useEffect(() => {
    setIsOneAway(false)
  }, [selectedWords])

  useEffect(() => {
    setIsLoading(true)
    setErrorMessage(null)

    setCategories({})
    setIncorrectGuesses(0)
    setIsOneAway(false)
    setRevealedHints({})
    setSelectedWords([])
    setSolvedCategories([])
    setWords([])

    const pollGame = async () => {
      try {
        const { data: game, isGenerating } = await fetchConnectionsGame(gameId)

        if (isGenerating) {
          setTimeout(pollGame, 10000) // Poll every 10 seconds
          return
        }

        const allWords = Object.values(game.categories).reduce(
          (acc, category) => [...acc, ...category.words],
          [] as string[],
        )
        setCategories(game.categories)
        setWords(shuffleArray(allWords))
        setIsLoading(false)
      } catch (error: unknown) {
        console.error('fetchConnectionsGame', { error })
        setErrorMessage('Failed to load game. Please refresh the page to try again.')
        setIsLoading(false)
      }
    }

    pollGame()
  }, [gameId])

  return {
    categories,
    categoriesCount,
    clearSelectedWords,
    errorMessage,
    getHint,
    hints: Object.values(revealedHints),
    hintsReceived,
    incorrectGuesses,
    isHintAvailable: Object.keys(categories).length > solvedCategories.length + Object.keys(revealedHints).length,
    isLoading,
    isOneAway,
    isRevealSolutionAvailable: solvedCategories.length < 4,
    revealSolution,
    selectedWords,
    selectWord,
    solvedCategories,
    submitWords,
    unselectWord,
    words,
  }
}
