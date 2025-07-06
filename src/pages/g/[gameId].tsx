import React from 'react'

import Grid from '@mui/material/Grid'

import { ConnectionsGame } from '@components/connections-game'
import PrivacyLink from '@components/privacy-link'

export interface GamePageProps {
  params: {
    gameId: string
  }
}

const GamePage = ({ params }: GamePageProps): React.ReactNode => {
  return (
    <main style={{ minHeight: '90vh' }}>
      <Grid container sx={{ padding: { sm: '50px', xs: '25px 10px' } }}>
        <Grid item sx={{ m: 'auto', maxWidth: 1200, width: '100%' }}>
          <ConnectionsGame gameId={params.gameId} />
          <PrivacyLink />
        </Grid>
      </Grid>
    </main>
  )
}

export const Head = () => <title>Connections</title>

export default GamePage
