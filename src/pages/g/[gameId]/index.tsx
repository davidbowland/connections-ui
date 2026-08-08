import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { ConnectionsGame } from '@components/connections-game'
import { GameSelectionWrapper, LoadingState } from '@components/connections-game/elements'
import { GameSelection } from '@components/game-selection'
import PrivacyLink from '@components/privacy-link'

const GamePage = (): React.ReactNode => {
  const router = useRouter()
  const [gameId, setGameId] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    const match = window.location.pathname.match(/\/g\/([^/]+)/)
    if (match) {
      setGameId(match[1])
    }
  }, [router.asPath])

  return (
    <>
      <Head>
        <title>Common Threads</title>
        <meta
          content="Find the four groups of four words that belong together. A new Common Threads puzzle every day."
          name="description"
        />
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

export const getStaticPaths: GetStaticPaths = () => {
  if (process.env.NODE_ENV === 'development') {
    return { fallback: 'blocking', paths: [] }
  }
  return { fallback: false, paths: [{ params: { gameId: '__placeholder__' } }] }
}
export const getStaticProps: GetStaticProps = () => ({ props: {} })

export default GamePage
