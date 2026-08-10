import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
  ActionButton,
  ActionRow,
  ActionsContainer,
  BoardContainer,
  GameInstructions,
  GameSubtitle,
  GameTitle,
  GameWrapper,
  GuardLine,
  HintCard,
  HintsContainer,
  LoadingState,
  OneAwayList,
  SolvedCategoryCard,
  StatLine,
  Toast,
  WordGrid,
  WordTile,
} from './elements'
import { GAME_COLORS } from '@config/colors'
import { dedupeKey, useConnectionsGame } from '@hooks/useConnectionsGame'
import { CategoryColors, GameId } from '@types'

const ease = [0.32, 0.72, 0, 1] as const

const getRandomValue = <T,>(arr: T[], random = Math.random): T => arr[Math.floor(random() * arr.length)]

// scrollIntoView's `behavior` option beats the stylesheet, so the reduced-motion rule in
// index.css cannot reach these scrolls. The preference has to be read here instead.
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

export interface ConnectionsGameProps {
  gameId: GameId
  incorrectGuessesUntilHint?: number
  incorrectGuessesUntilSolution?: number
  secondsUntilHint?: number
  secondsUntilSolution?: number
}

export const ConnectionsGame = ({
  gameId,
  incorrectGuessesUntilHint = 2,
  incorrectGuessesUntilSolution = 4,
  secondsUntilHint = 60,
  secondsUntilSolution = 180,
}: ConnectionsGameProps): React.ReactNode => {
  const {
    categories,
    clearSelectedWords,
    errorMessage,
    getHint,
    hints,
    hintsUsed,
    incorrectGuesses,
    isHintAvailable,
    isLoading,
    isRevealSolutionAvailable,
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
  } = useConnectionsGame(gameId)

  const [shakingTimeout, setShakingTimeout] = useState<NodeJS.Timeout>()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [toast, setToast] = useState<{ key: number; message: string } | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)
  const newestHintRef = useRef<HTMLDivElement>(null)
  // Seeded from the first render, so mounting a game that already has hints never scrolls
  const previousHintCount = useRef(hints.length)
  const toastDelayTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const toastTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  const scrollToBoard = () => {
    setTimeout(() => boardRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }), 100)
  }

  const displayGameId = useMemo(() => {
    const language = typeof navigator === 'undefined' ? 'en-US' : navigator.language
    return new Date(gameId).toLocaleDateString(language, {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
      year: 'numeric',
    })
  }, [gameId])

  const { categoryColors, selectedWordColor } = useMemo(() => {
    const availableColors = new Set(GAME_COLORS)
    const categoryColors = Object.keys(categories).reduce((acc: CategoryColors, value: string) => {
      const color = getRandomValue(Array.from(availableColors))
      availableColors.delete(color)
      return { ...acc, [value]: color }
    }, {})
    const selectedWordColor = getRandomValue(Array.from(availableColors))

    return { categoryColors, selectedWordColor }
  }, [gameId, categories])

  const isHintEnabled =
    isHintAvailable && (incorrectGuesses >= incorrectGuessesUntilHint || elapsedSeconds >= secondsUntilHint)
  const isSolutionEnabled =
    isRevealSolutionAvailable &&
    (incorrectGuesses >= incorrectGuessesUntilSolution || elapsedSeconds >= secondsUntilSolution)
  const isGameComplete = words.length === 0

  const selectionKey = selectedWords.length === 4 ? dedupeKey(selectedWords) : null
  const isRepeatSelection = selectionKey !== null && !isSelectionSubmitted && pastGuesses.has(selectionKey)
  const wasRepeatOneAway = isRepeatSelection && oneAwayGuesses.some((guess) => dedupeKey(guess) === selectionKey)

  useEffect(() => {
    if (isLoading || isGameComplete) return

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isLoading, isGameComplete])

  useEffect(() => {
    if (!isLoading) {
      setElapsedSeconds(0)
    }
  }, [gameId, isLoading])

  // A new hint is inserted directly above the button that asked for it, so it usually
  // needs no scroll at all: `nearest` moves the minimum distance and does nothing when the
  // card is already visible, which keeps the board on screen. Anchoring the hints
  // container with `start` instead pinned the *oldest* hint to the top of the viewport and
  // pushed the grid off it every time.
  useEffect(() => {
    if (hints.length > previousHintCount.current) {
      newestHintRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' })
    }
    previousHintCount.current = hints.length
  }, [hints.length])

  const showToastMessage = (message: string) => {
    clearTimeout(toastDelayTimer.current)
    clearTimeout(toastTimer.current)
    toastDelayTimer.current = setTimeout(() => {
      setToast((prev) => ({ key: (prev?.key ?? 0) + 1, message }))
      toastTimer.current = setTimeout(() => setToast(null), 4000)
    }, 450)
  }

  const handleSubmit = () => {
    const result = submitWords()
    if (result === 'correct') {
      scrollToBoard()
    } else {
      if (shakingTimeout === undefined) {
        const timeout = setTimeout(() => setShakingTimeout(undefined), 500)
        setShakingTimeout(timeout)
      }
      if (result === 'one-away') showToastMessage('One away')
      if (result === 'duplicate') showToastMessage('Already tried')
    }
  }

  const handleSelectOneAway = (guess: string[]) => {
    selectWords(guess)
    scrollToBoard()
  }

  const handleRevealSolution = () => {
    revealSolution()
    scrollToBoard()
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (errorMessage) {
    return <div role="alert">{errorMessage}</div>
  }

  if (isLoading) {
    return <LoadingState displayGameId={displayGameId} />
  }

  return (
    <GameWrapper>
      <GameTitle />
      <GameSubtitle>{displayGameId}</GameSubtitle>
      <GameInstructions />

      <BoardContainer ref={boardRef}>
        <AnimatePresence initial={false}>
          {solvedCategories.map((category) => (
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.32, ease } }}
              initial={{ opacity: 0, scale: 0.97, y: -16 }}
              key={category.description}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              <SolvedCategoryCard
                color={categoryColors[category.description]}
                description={category.description}
                words={category.words}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <WordGrid>
          <AnimatePresence>
            {words.map((word) => {
              const isSelected = selectedWords.includes(word)
              return (
                <WordTile
                  isSelected={isSelected}
                  isShaking={!!shakingTimeout && isSelected}
                  key={word}
                  onPress={() => (isSelected ? unselectWord(word) : selectWord(word))}
                  selectedColor={selectedWordColor}
                  word={word}
                />
              )
            })}
          </AnimatePresence>
        </WordGrid>

        <HintsContainer>
          {hints.map((hint, index) => (
            <HintCard hint={hint} key={index} ref={index === hints.length - 1 ? newestHintRef : undefined} />
          ))}
        </HintsContainer>

        <ActionsContainer>
          {selectedWords.length > 0 && (
            <GuardLine>
              {isRepeatSelection
                ? wasRepeatOneAway
                  ? 'You already tried this — it was one away.'
                  : 'You already tried this.'
                : null}
            </GuardLine>
          )}
          {selectedWords.length > 0 && (
            <ActionRow>
              {selectedWords.length >= 4 && (
                <ActionButton onPress={handleSubmit} variant="primary">
                  Submit
                </ActionButton>
              )}
              <ActionButton onPress={clearSelectedWords} variant="outline">
                Clear selection
              </ActionButton>
            </ActionRow>
          )}
          {!isGameComplete && (isHintEnabled || isSolutionEnabled) && (
            <ActionRow>
              {isHintEnabled && (
                <ActionButton onPress={getHint} variant="outline">
                  Get hint
                </ActionButton>
              )}
              {isSolutionEnabled && (
                <ActionButton onPress={handleRevealSolution} variant="primary">
                  Show the answers
                </ActionButton>
              )}
            </ActionRow>
          )}
        </ActionsContainer>

        {oneAwayGuesses.length > 0 && <OneAwayList guesses={oneAwayGuesses} onSelect={handleSelectOneAway} />}

        <StatLine>
          {`${incorrectGuesses} wrong${hintsUsed > 0 ? ` · ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'} used` : ''} · ${formatTime(elapsedSeconds)}`}
        </StatLine>
      </BoardContainer>

      <AnimatePresence>
        {toast && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: -8 }}
            key={toast.key}
            transition={{ duration: 0.3, ease }}
          >
            <Toast message={toast.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </GameWrapper>
  )
}
