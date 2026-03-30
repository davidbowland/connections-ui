import React, { useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { rerollGame } from '@services/connections'
import { GameId } from '@types'

export interface RerollPageProps {
  params: {
    gameId: GameId
  }
}

const RerollPage = ({ params }: RerollPageProps): React.ReactNode => {
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    setIsLoading(true)

    try {
      const message = await rerollGame(params.gameId, password)
      setIsError(false)
      setFeedback(message)
    } catch (error: unknown) {
      setIsError(true)
      setFeedback(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '90vh' }}>
      <Grid container sx={{ padding: { sm: '50px', xs: '25px 10px' } }}>
        <Grid item sx={{ m: 'auto', maxWidth: 500, width: '100%' }}>
          <Typography sx={{ mb: 3 }} variant="h5">
            Reroll game: {params.gameId}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoComplete="off"
              disabled={isLoading}
              fullWidth
              label="Password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
            <Button disabled={isLoading || !password} type="submit" variant="contained">
              {isLoading ? <CircularProgress size={24} /> : 'Reroll'}
            </Button>
          </Box>
          {feedback && (
            <Typography color={isError ? 'error' : 'success.main'} sx={{ mt: 2 }}>
              {feedback}
            </Typography>
          )}
        </Grid>
      </Grid>
    </main>
  )
}

export const Head = () => <title>Reroll Game</title>

export default RerollPage
