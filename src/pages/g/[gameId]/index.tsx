import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import Grid from '@mui/material/Grid'

import { ConnectionsGame } from '@components/connections-game'
import PrivacyLink from '@components/privacy-link'

const GamePage = (): React.ReactNode => {
  const { query } = useRouter()
  const gameId = query.gameId as string | undefined

  if (!gameId) return null

  return (
    <>
      <Head>
        <title>Connections</title>
      </Head>
      <main style={{ minHeight: '90vh' }}>
        <Grid container sx={{ padding: { sm: '50px', xs: '25px 10px' } }}>
          <Grid item sx={{ m: 'auto', maxWidth: 1200, width: '100%' }}>
            <ConnectionsGame gameId={gameId} />
            <PrivacyLink />
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

export default GamePage
