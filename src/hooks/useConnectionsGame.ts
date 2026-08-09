import { useCallback, useEffect, useState, useMemo } from 'react'

import { fetchConnectionsGame } from '@services/connections'
import { markSolved } from '@services/storage'
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

export type SubmitResult = 'correct' | 'duplicate' | 'one-away' | 'wrong'

export const dedupeKey = (words: string[]): string => words.toSorted().join('-')

export interface UseConnectionsGameResult {
  categories: CategoryObject
  categoriesCount: number
  clearSelectedWords: () => void
  errorMessage: string | null
  getHint: () => void
  hints: string[]
  hintsUsed: number
  incorrectGuesses: number
  isHintAvailable: boolean
  isLoading: boolean
  isRevealSolutionAvailable: boolean
  isSelectionSubmitted: boolean
  oneAwayGuesses: string[][]
  pastGuesses: Set<string>
  revealSolution: () => void
  selectedWords: string[]
  selectWord: (word: string) => void
  selectWords: (guess: string[]) => void
  solvedCategories: SolvedCategory[]
  submitWords: () => SubmitResult
  unselectWord: (word: string) => void
  words: string[]
}

export const useConnectionsGame = (gameId: string, random = Math.random): UseConnectionsGameResult => {
  const [categories, setCategories] = useState<CategoryObject>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [incorrectGuesses, setIncorrectGuesses] = useState(0)
  const [isSelectionSubmitted, setIsSelectionSubmitted] = useState(false)
  const [oneAwayGuessLog, setOneAwayGuessLog] = useState<string[][]>([])
  const [pastGuesses, setPastGuesses] = useState<Set<string>>(new Set())
  const [hintsUsed, setHintsUsed] = useState(0)
  const [revealedHints, setRevealedHints] = useState<Record<string, string>>({})
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [solvedCategories, setSolvedCategories] = useState<SolvedCategory[]>([])
  const [words, setWords] = useState<string[]>([])

  const isHintAvailable = useMemo(
    () => Object.keys(categories).length > solvedCategories.length + Object.keys(revealedHints).length,
    [categories, revealedHints, solvedCategories],
  )

  const oneAwayGuesses = useMemo(
    () => oneAwayGuessLog.filter((guess) => guess.every((word) => words.includes(word))),
    [oneAwayGuessLog, words],
  )

  const selectWord = useCallback(
    (word: string) => {
      if (selectedWords.length < 4 && !selectedWords.includes(word)) {
        setSelectedWords((prev) => [...prev, word])
        setIsSelectionSubmitted(false)
      }
    },
    [selectedWords],
  )

  const selectWords = useCallback((guess: string[]) => {
    setSelectedWords(guess.slice(0, 4))
    setIsSelectionSubmitted(false)
  }, [])

  const unselectWord = useCallback(
    (word: string) => {
      if (!selectedWords.includes(word)) return
      setSelectedWords((prev) => prev.filter((w) => w !== word))
      setIsSelectionSubmitted(false)
    },
    [selectedWords],
  )

  const clearSelectedWords = useCallback(() => {
    setSelectedWords([])
    setIsSelectionSubmitted(false)
  }, [])

  const submitWords = useCallback((): SubmitResult => {
    if (selectedWords.length !== 4) return 'wrong'

    setIsSelectionSubmitted(true)

    const key = dedupeKey(selectedWords)
    if (pastGuesses.has(key)) return 'duplicate'

    const categoryEntry = Object.entries(categories).find(([, category]) =>
      selectedWords.every((selectedWord) => category.words.includes(selectedWord)),
    )

    if (categoryEntry) {
      const [categoryName, category] = categoryEntry

      // Recorded here, in the correct-guess branch, rather than from an effect watching
      // solvedCategories. revealSolution() fills solvedCategories with every remaining
      // category, so a completed board cannot tell a win from a reveal -- but reveals
      // never run this code, and neither does a wrong, duplicate, or short submission.
      // The guard fires on the one submission that takes the last category, so
      // markSolved runs once per win rather than on every render of a finished board.
      if (solvedCategories.length + 1 === Object.keys(categories).length) {
        markSolved(gameId)
      }

      setSolvedCategories((prev) => [...prev, { description: categoryName, words: category.words.toSorted() }])
      setWords((prev) => prev.filter((w) => !category.words.includes(w)))
      setSelectedWords([])
      setIsSelectionSubmitted(false)
      setRevealedHints((prev) => {
        const { [categoryName]: _, ...rest } = prev
        return rest
      })
      return 'correct'
    } else {
      const isOneAway = Object.values(categories).some((category) => {
        const matchCount = selectedWords.filter((word) => category.words.includes(word)).length
        return matchCount === 3
      })

      setPastGuesses((prev) => new Set([...prev, key]))
      setIncorrectGuesses((prev) => prev + 1)
      if (isOneAway) {
        setOneAwayGuessLog((prev) => [...prev, selectedWords.toSorted()])
      }
      return isOneAway ? 'one-away' : 'wrong'
    }
  }, [categories, gameId, pastGuesses, selectedWords, solvedCategories])

  const getHint = useCallback(() => {
    const unsolvedCategories = Object.entries(categories).filter(
      ([categoryName]) =>
        !solvedCategories.some((solved) => solved.description === categoryName) && !revealedHints[categoryName],
    )

    if (unsolvedCategories.length > 0) {
      const randomIndex = Math.floor(random() * unsolvedCategories.length)
      const [categoryName, category] = unsolvedCategories[randomIndex]
      setRevealedHints((prev) => ({ ...prev, [categoryName]: category.hint }))
      setHintsUsed((prev) => prev + 1)
    }
  }, [categories, solvedCategories, revealedHints])

  const categoriesCount = useMemo(() => Object.keys(categories).length, [categories])
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
    setIsSelectionSubmitted(false)
    setSolvedCategories((prev) => [...prev, ...newSolved])
    setWords([])
  }, [categories, solvedCategories])

  useEffect(() => {
    setIsLoading(true)
    setErrorMessage(null)

    setCategories({})
    setHintsUsed(0)
    setIncorrectGuesses(0)
    setIsSelectionSubmitted(false)
    setOneAwayGuessLog([])
    setPastGuesses(new Set())
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
        setErrorMessage("We couldn't load this puzzle. Refresh the page to try again.")
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
    hintsUsed,
    incorrectGuesses,
    isHintAvailable,
    isLoading,
    isRevealSolutionAvailable: solvedCategories.length < 4,
    isSelectionSubmitted,
    oneAwayGuesses,
    pastGuesses,
    revealSolution,
    selectedWords,
    selectWord,
    selectWords,
    solvedCategories,
    submitWords,
    unselectWord,
    words,
  }
}
