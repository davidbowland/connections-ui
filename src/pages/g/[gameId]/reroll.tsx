import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { rerollGame } from '@services/connections'

const RerollPage = (): React.ReactNode => {
  const { query } = useRouter()
  const gameId = query.gameId as string | undefined
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!gameId) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    setIsLoading(true)

    try {
      const message = await rerollGame(gameId, password)
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
    <>
      <Head>
        <title>Reroll Game</title>
      </Head>
      <main style={{ minHeight: '90vh' }}>
        <Grid container sx={{ padding: { sm: '50px', xs: '25px 10px' } }}>
          <Grid item sx={{ m: 'auto', maxWidth: 500, width: '100%' }}>
            <Typography sx={{ mb: 3 }} variant="h5">
              Reroll game: {gameId}
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
    </>
  )
}

export const getStaticPaths: GetStaticPaths = () => {
  if (process.env.NODE_ENV === 'development') {
    return { fallback: 'blocking', paths: [] }
  }
  return { fallback: false, paths: [{ params: { gameId: '__placeholder__' } }] }
}
export const getStaticProps: GetStaticProps = () => ({ props: {} })

export default RerollPage
