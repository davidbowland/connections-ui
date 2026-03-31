import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
  ActionButton,
  ActionRow,
  ActionsContainer,
  BoardContainer,
  GameSelectionWrapper,
  GameSubtitle,
  GameTitle,
  GameWrapper,
  HintCard,
  HintsContainer,
  LoadingState,
  OneAwayMessage,
  SolvedCategoryCard,
  StatLine,
  WordGrid,
  WordTile,
} from './elements'
import { GameSelection } from '@components/game-selection'
import { GAME_COLORS } from '@config/colors'
import { useConnectionsGame } from '@hooks/useConnectionsGame'
import { CategoryColors, GameId } from '@types'

const getRandomValue = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

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
    categoriesCount,
    clearSelectedWords,
    errorMessage,
    getHint,
    hints,
    hintsUsed,
    incorrectGuesses,
    isHintAvailable,
    isLoading,
    isOneAway,
    isRevealSolutionAvailable,
    revealSolution,
    selectedWords,
    selectWord,
    solvedCategories,
    submitWords,
    unselectWord,
    words,
  } = useConnectionsGame(gameId)

  const [shakingTimeout, setShakingTimeout] = useState<NodeJS.Timeout>()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const boardRef = useRef<HTMLDivElement>(null)
  const hintsRef = useRef<HTMLDivElement>(null)
  const oneAwayRef = useRef<HTMLDivElement>(null)

  const scrollToBoard = () => {
    setTimeout(() => boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }
  const scrollToHints = () => {
    setTimeout(() => hintsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }
  const scrollToOneAway = () => {
    setTimeout(() => {
      if (oneAwayRef.current) {
        oneAwayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
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

  const handleSubmit = () => {
    const success = submitWords()
    if (!success && shakingTimeout === undefined) {
      const timeout = setTimeout(() => setShakingTimeout(undefined), 500)
      setShakingTimeout(timeout)
    }
    if (success) {
      scrollToBoard()
    } else {
      scrollToOneAway()
    }
  }

  const handleGetHint = () => {
    getHint()
    scrollToHints()
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

      <BoardContainer ref={boardRef}>
        <HintsContainer ref={hintsRef}>
          {hints.map((hint, index) => (
            <HintCard hint={hint} key={index} />
          ))}
        </HintsContainer>

        {isOneAway && <OneAwayMessage ref={oneAwayRef} />}

        {solvedCategories.map((category, index) => (
          <SolvedCategoryCard
            color={categoryColors[category.description]}
            description={category.description}
            key={index}
            words={category.words}
          />
        ))}

        <WordGrid>
          {words.map((word, index) => {
            const isSelected = selectedWords.includes(word)
            return (
              <WordTile
                isSelected={isSelected}
                isShaking={!!shakingTimeout && isSelected}
                key={index}
                onPress={() => (isSelected ? unselectWord(word) : selectWord(word))}
                selectedColor={selectedWordColor}
                word={word}
              />
            )
          })}
        </WordGrid>

        <ActionsContainer>
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
                <ActionButton onPress={handleGetHint} variant="outline">
                  Get hint
                </ActionButton>
              )}
              {isSolutionEnabled && (
                <ActionButton onPress={handleRevealSolution} variant="primary">
                  Reveal solution
                </ActionButton>
              )}
            </ActionRow>
          )}
        </ActionsContainer>

        <StatLine first>Incorrect guesses: {incorrectGuesses.toLocaleString()}</StatLine>
        {hintsUsed > 0 && (
          <StatLine>
            Hints received: {hintsUsed}/{categoriesCount}
          </StatLine>
        )}
        <StatLine>Time: {formatTime(elapsedSeconds)}</StatLine>

        <GameSelectionWrapper>
          <GameSelection gameId={gameId} />
        </GameSelectionWrapper>
      </BoardContainer>
    </GameWrapper>
  )
}
