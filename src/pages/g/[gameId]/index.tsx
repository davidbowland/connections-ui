import { Skeleton } from '@heroui/react'
import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { ConnectionsGame } from '@components/connections-game'
import PrivacyLink from '@components/privacy-link'

const LoadingSkeleton = (): React.ReactNode => (
  <div className="p-2 md:p-4" data-testid="page-loading-skeleton">
    <div className="mx-auto mt-4 max-w-[600px] md:mt-6">
      <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
        {Array.from({ length: 16 }).map((_, index) => (
          <Skeleton className="h-[60px] rounded md:h-[80px]" key={index} />
        ))}
      </div>
    </div>
  </div>
)

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
        <title>Connections</title>
      </Head>
      <main style={{ minHeight: '90vh' }}>
        <div className="px-[10px] py-[25px] sm:p-[50px]">
          <div className="mx-auto max-w-[1200px] w-full">
            {gameId ? <ConnectionsGame gameId={gameId} /> : <LoadingSkeleton />}
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
