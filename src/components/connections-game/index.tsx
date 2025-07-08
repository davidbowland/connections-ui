import React, { useMemo, useRef, useState } from 'react'
import styled, { keyframes, css } from 'styled-components'

import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
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
}

export const ConnectionsGame = ({ gameId }: ConnectionsGameProps): React.ReactNode => {
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

  if (isLoading) {
    return (
      <Box alignItems="center" display="flex" justifyContent="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (errorMessage) {
    return (
      <Box p={2}>
        <Alert severity="error">Error loading game: {errorMessage}</Alert>
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
                  visibility: selectedWords.length > 0 ? 'visible' : 'hidden',
                  width: { md: 'auto', xs: '100%' },
                }}
                variant="outlined"
              >
                Clear selection
              </Button>
            </Box>
          )}
          {(isGetHintEnabled || isRevealSolutionEnabled) && (
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
                  visibility: isGetHintEnabled ? 'visible' : 'hidden',
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
                  visibility: isRevealSolutionEnabled ? 'visible' : 'hidden',
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

        <Box maxWidth="300px" sx={{ margin: '0 auto 3em', paddingTop: '4em' }}>
          <GameSelection gameId={gameId} />
        </Box>
      </Box>
    </Box>
  )
}
