import React, { useMemo, useState } from 'react'
import styled, { keyframes, css } from 'styled-components'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { GameSelection } from '@components/game-selection'
import { GAME_COLORS } from '@config/colors'
import { useConnectionsGame } from '@hooks/useConnectionsGame'
import { CategoryColors } from '@types'

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-4px); }
`

const StyledButton = styled(Button)<{ $isShaking?: boolean }>`
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  height: 80px;
  text-transform: uppercase;
  width: 100%;
  ${(props) =>
    props.$isShaking &&
    css`
      animation: ${shake} 0.5s ease-in-out;
    `}
`

const getRandomValue = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export interface ConnectionsGameProps {
  gameId: string
}

export const ConnectionsGame = ({ gameId }: ConnectionsGameProps): React.ReactNode => {
  const {
    categories,
    clearSelectedWords,
    errorMessage,
    incorrectGuesses,
    isLoading,
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

  const handleSubmit = () => {
    const success = submitWords()
    if (!success && shakingTimeout === undefined) {
      const timeout = setTimeout(() => setShakingTimeout(undefined), 500)
      setShakingTimeout(timeout)
    }
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
    <Box p={2}>
      <Typography align="center" component="h1" gutterBottom variant="h4">
        Connections
      </Typography>
      <Typography align="center" color="text.secondary" gutterBottom variant="subtitle1">
        {gameId}
      </Typography>

      <Box maxWidth="600px" mt={3} mx="auto">
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
              <Grid item key={index} xs={3}>
                <StyledButton
                  $isShaking={shakingTimeout && isSelected}
                  onClick={() => (isSelected ? unselectWord(word) : selectWord(word))}
                  sx={{
                    ':hover': {
                      backgroundColor: isSelected ? selectedWordColor.background + 'aa' : 'transparent',
                    },
                    backgroundColor: isSelected ? selectedWordColor.background : 'transparent',
                    color: isSelected ? selectedWordColor.text : 'text.primary',
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
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              onClick={handleSubmit}
              sx={{ minWidth: 140, visibility: selectedWords.length >= 4 ? 'visible' : 'hidden' }}
              variant="contained"
            >
              Submit
            </Button>
            <Button
              onClick={clearSelectedWords}
              sx={{ minWidth: 140, visibility: selectedWords.length > 0 ? 'visible' : 'hidden' }}
              variant="outlined"
            >
              Clear selection
            </Button>
            <Button
              color="secondary"
              onClick={revealSolution}
              sx={{ minWidth: 140, visibility: isRevealSolutionEnabled ? 'visible' : 'hidden' }}
              variant="contained"
            >
              Reveal solution
            </Button>
          </Box>
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
