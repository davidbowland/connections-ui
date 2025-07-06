import { useConnectionsGame } from '@hooks/useConnectionsGame'
import React, { useMemo } from 'react'
import styled from 'styled-components'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { GAME_COLORS } from '@config/colors'
import { CategoryColors } from '@types'

const StyledButton = styled(Button)`
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  height: 80px;
  text-transform: uppercase;
  width: 100%;

  &:hover {
    background-color: 'background.secondary';
    color: 'text.primary';
  }
`

const getRandomValue = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export interface ConnectionsGameProps {
  gameId: string
}

export const ConnectionsGame = ({ gameId }: ConnectionsGameProps): React.ReactNode => {
  const { categories, errorMessage, isLoading, selectedWords, selectWord, solvedCategories, unselectWord, words } =
    useConnectionsGame(gameId)

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
              mb={2}
              p={2}
              sx={{
                backgroundColor: color.background,
                borderRadius: 2,
                color: color.text,
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
                  onClick={() => (isSelected ? unselectWord(word) : selectWord(word))}
                  sx={{
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
      </Box>
    </Box>
  )
}
