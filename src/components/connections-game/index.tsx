import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled, { keyframes, css } from 'styled-components'

import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

import { GameSelection } from '@components/game-selection'
import { GAME_COLORS } from '@config/colors'
import { useConnectionsGame } from '@hooks/useConnectionsGame'
import { CategoryColors, GameId } from '@types'

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-4px); }
`

const StyledButton = styled(Button)<{ $isShaking?: boolean }>`
  border-radius: 8px;
  font-variant: small-caps;
  font-weight: bold;
  text-transform: none;
  width: 100%;

  ${(props) =>
    props.$isShaking &&
    css`
      animation: ${shake} 0.5s ease-in-out;
    `}
`

const getRandomValue = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export interface ConnectionsGameProps {
  gameId: GameId
  secondsUntilHint?: number
  secondsUntilSolution?: number
}

export const ConnectionsGame = ({
  gameId,
  secondsUntilHint = 60,
  secondsUntilSolution = 180,
}: ConnectionsGameProps): React.ReactNode => {
  const {
    categories,
    clearSelectedWords,
    errorMessage,
    getHint,
    hints,
    incorrectGuesses,
    isGetHintEnabled,
    isLoading,
    isOneAway,
    isRevealSolutionEnabled,
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

  const displayGameId = useMemo(() => {
    const language = typeof navigator === 'undefined' ? 'en-US' : navigator.language
    return new Date(gameId).toLocaleDateString(language, {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
      year: 'numeric',
    })
  }, [gameId])

  const handleSubmit = () => {
    const success = submitWords()
    if (!success && shakingTimeout === undefined) {
      const timeout = setTimeout(() => setShakingTimeout(undefined), 500)
      setShakingTimeout(timeout)
    }
    boardRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleGetHint = () => {
    getHint()
    boardRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleRevealSolution = () => {
    revealSolution()
    boardRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isHintAvailable = isGetHintEnabled || elapsedSeconds >= secondsUntilHint
  const isSolutionAvailable = isRevealSolutionEnabled || elapsedSeconds >= secondsUntilSolution
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

  if (errorMessage) {
    return (
      <Box maxWidth="600px" mt={{ md: 3, xs: 2 }} mx="auto" p={2}>
        <Alert severity="error">{errorMessage}</Alert>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box data-testid="loading-skeleton" p={{ md: 2, xs: 1 }}>
        <Typography align="center" component="h1" gutterBottom variant="h4">
          Connections
        </Typography>
        <Typography align="center" color="text.secondary" gutterBottom variant="subtitle1">
          {displayGameId}
        </Typography>

        <Box maxWidth="600px" mt={{ md: 3, xs: 2 }} mx="auto">
          <Grid container spacing={1}>
            {Array.from({ length: 16 }).map((_, index) => (
              <Grid item key={index} sm={3} xs={6}>
                <Skeleton sx={{ borderRadius: 1, height: { md: 80, xs: 60 } }} variant="rectangular" />
              </Grid>
            ))}
          </Grid>

          <Box display="flex" flexDirection="column" gap={2} mt={3}>
            <Box
              alignItems={{ md: 'flex-start', xs: 'center' }}
              display="flex"
              flexDirection={{ md: 'row', xs: 'column' }}
              gap={2}
              justifyContent="center"
            >
              <Skeleton
                height={36}
                sx={{
                  borderRadius: 1,
                  maxWidth: { md: 'none', xs: '280px' },
                  minWidth: 140,
                  width: { md: 'auto', xs: '100%' },
                }}
                variant="rectangular"
              />
              <Skeleton
                height={36}
                sx={{
                  borderRadius: 1,
                  maxWidth: { md: 'none', xs: '280px' },
                  minWidth: 140,
                  width: { md: 'auto', xs: '100%' },
                }}
                variant="rectangular"
              />
            </Box>
          </Box>

          <Skeleton sx={{ fontSize: '0.875rem', mt: 4, mx: 'auto', width: '150px' }} variant="text" />
          <Skeleton sx={{ fontSize: '0.875rem', mx: 'auto', width: '150px' }} variant="text" />
        </Box>
      </Box>
    )
  }

  return (
    <Box p={{ md: 2, xs: 1 }}>
      <Typography align="center" component="h1" gutterBottom variant="h4">
        Connections
      </Typography>
      <Typography align="center" color="text.secondary" gutterBottom variant="subtitle1">
        {displayGameId}
      </Typography>

      <Box maxWidth="600px" mt={{ md: 3, xs: 2 }} mx="auto" pt={1} ref={boardRef}>
        {hints.map((hint, index) => (
          <Alert icon={<HelpOutlineIcon />} key={index} severity="info" sx={{ marginBottom: '1em' }} variant="outlined">
            {hint}
          </Alert>
        ))}

        {isOneAway && (
          <Typography align="center" color="warning.main" sx={{ marginBottom: '1em' }} variant="h6">
            One away!
          </Typography>
        )}

        {solvedCategories.map((category, index) => {
          const color = categoryColors[category.description]
          return (
            <Box
              key={index}
              sx={{
                backgroundColor: color.background,
                borderRadius: 2,
                color: color.text,
                marginBottom: '2em',
                padding: '2em',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6">{category.description}</Typography>
              <Typography variant="body2">{category.words.join(', ')}</Typography>
            </Box>
          )
        })}

        <Grid container spacing={1}>
          {words.map((word, index) => {
            const isSelected = selectedWords.includes(word)
            return (
              <Grid item key={index} sm={3} xs={6}>
                <StyledButton
                  $isShaking={shakingTimeout && isSelected}
                  onClick={() => (isSelected ? unselectWord(word) : selectWord(word))}
                  sx={{
                    ':hover': {
                      backgroundColor: isSelected ? selectedWordColor.background + 'aa' : 'transparent',
                    },
                    backgroundColor: isSelected ? selectedWordColor.background : 'transparent',
                    color: isSelected ? selectedWordColor.text : 'text.primary',
                    fontSize: { md: 14, xs: 12 },
                    height: { md: 80, xs: 60 },
                  }}
                  variant="outlined"
                >
                  {word}
                </StyledButton>
              </Grid>
            )
          })}
        </Grid>

        <Box display="flex" flexDirection="column" gap={2} mt={3}>
          {selectedWords.length > 0 && (
            <Box
              alignItems={{ md: 'flex-start', xs: 'center' }}
              display="flex"
              flexDirection={{ md: 'row', xs: 'column' }}
              gap={2}
              justifyContent="center"
            >
              <Button
                onClick={handleSubmit}
                sx={{
                  maxWidth: { md: 'none', xs: '280px' },
                  minWidth: 140,
                  visibility: selectedWords.length >= 4 ? 'visible' : 'hidden',
                  width: { md: 'auto', xs: '100%' },
                }}
                variant="contained"
              >
                Submit
              </Button>
              <Button
                onClick={clearSelectedWords}
                sx={{
                  maxWidth: { md: 'none', xs: '280px' },
                  minWidth: 140,
                  width: { md: 'auto', xs: '100%' },
                }}
                variant="outlined"
              >
                Clear selection
              </Button>
            </Box>
          )}
          {!isGameComplete && (isHintAvailable || isSolutionAvailable) && (
            <Box
              alignItems={{ md: 'flex-start', xs: 'center' }}
              display="flex"
              flexDirection={{ md: 'row', xs: 'column' }}
              gap={2}
              justifyContent="center"
            >
              <Button
                onClick={handleGetHint}
                sx={{
                  maxWidth: { md: 'none', xs: '280px' },
                  minWidth: 140,
                  visibility: isHintAvailable ? 'visible' : 'hidden',
                  width: { md: 'auto', xs: '100%' },
                }}
                variant="outlined"
              >
                Get hint
              </Button>
              <Button
                color="secondary"
                onClick={handleRevealSolution}
                sx={{
                  maxWidth: { md: 'none', xs: '280px' },
                  minWidth: 140,
                  visibility: isSolutionAvailable ? 'visible' : 'hidden',
                  width: { md: 'auto', xs: '100%' },
                }}
                variant="contained"
              >
                Reveal solution
              </Button>
            </Box>
          )}
        </Box>

        <Typography align="center" color="text.secondary" sx={{ marginTop: '2em' }} variant="body2">
          Incorrect guesses: {incorrectGuesses}
        </Typography>

        <Typography align="center" color="text.secondary" sx={{ marginTop: '0.5em' }} variant="body2">
          Time: {formatTime(elapsedSeconds)}
        </Typography>

        <Box maxWidth="300px" sx={{ margin: '0 auto 3em', paddingTop: '4em' }}>
          <GameSelection gameId={gameId} />
        </Box>
      </Box>
    </Box>
  )
}
