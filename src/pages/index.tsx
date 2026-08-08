import Head from 'next/head'
import React from 'react'

import { ConnectionsGame } from '@components/connections-game'
import { GameSelectionWrapper, LoadingState } from '@components/connections-game/elements'
import { GameSelection } from '@components/game-selection'
import PrivacyLink from '@components/privacy-link'

const toGameId = (now: () => number): string => {
  const today = new Date(now())
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const Index = ({ now = Date.now }: { now?: () => number }): React.ReactNode => {
  const [gameId, setGameId] = React.useState<string | undefined>(undefined)

  // Resolved after mount so the statically exported HTML carries no build-time date
  React.useEffect(() => {
    setGameId(toGameId(now))
  }, [now])

  return (
    <>
      <Head>
        <title>Common Threads | dbowland.com</title>
        <meta
          content="Find the four groups of four words that belong together. A new Common Threads puzzle every day."
          name="description"
        />
        <link href="https://connections.dbowland.com/" rel="canonical" />
        <meta content="Common Threads" property="og:title" />
        <meta content="Find the common thread. A new puzzle every day." property="og:description" />
        <meta content="https://connections.dbowland.com/og-image.png" property="og:image" />
        <meta content="website" property="og:type" />
        <meta content="https://connections.dbowland.com/" property="og:url" />
        <meta content="summary_large_image" name="twitter:card" />
        <meta content="Common Threads" name="twitter:title" />
        <meta content="Find the common thread. A new puzzle every day." name="twitter:description" />
        <meta content="https://connections.dbowland.com/og-image.png" name="twitter:image" />
      </Head>
      <main style={{ minHeight: '90vh' }}>
        <div className="px-[10px] py-[25px] sm:p-[50px]">
          <div className="mx-auto max-w-[1200px] w-full">
            {gameId ? <ConnectionsGame gameId={gameId} /> : <LoadingState />}
            <GameSelectionWrapper>
              <GameSelection gameId={gameId} />
            </GameSelectionWrapper>
            <PrivacyLink />
          </div>
        </div>
      </main>
    </>
  )
}

export default Index
