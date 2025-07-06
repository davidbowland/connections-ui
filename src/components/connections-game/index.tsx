import { useConnectionsGame } from '@hooks/useConnectionsGame'
import React from 'react'
import styled from 'styled-components'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

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

export interface ConnectionsGameProps {
  gameId: string
}

export const ConnectionsGame = ({ gameId }: ConnectionsGameProps): React.ReactNode => {
  const { errorMessage, isLoading, words } = useConnectionsGame(gameId)

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
        <Grid container spacing={1}>
          {words.map((word, index) => (
            <Grid item key={index} xs={3}>
              <StyledButton variant="outlined">{word}</StyledButton>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  )
}
