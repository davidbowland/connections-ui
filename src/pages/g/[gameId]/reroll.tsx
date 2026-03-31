import { Button, CardContent, CardHeader, CardRoot, CardTitle, Input, Spinner } from '@heroui/react'
import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import FeedbackMessage from '@components/feedback-message'
import { rerollGame } from '@services/connections'

const RerollPage = (): React.ReactNode => {
  const router = useRouter()
  const [gameId, setGameId] = useState<string | undefined>(undefined)
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const match = window.location.pathname.match(/\/g\/([^/]+)\/reroll/)
    if (match) {
      setGameId(match[1])
    }
  }, [router.asPath])

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
      <main className="flex min-h-[90vh] items-center justify-center px-4 py-10">
        <CardRoot className="w-full max-w-[400px]">
          <CardHeader>
            <CardTitle>Reroll Game</CardTitle>
            <p className="mt-1 font-mono text-xs tracking-widest text-gray-400 uppercase dark:text-gray-500">
              {gameId}
            </p>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <Input
                aria-label="Password"
                autoComplete="off"
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
                value={password}
                variant="secondary"
              />
              <Button isDisabled={isLoading || !password} type="submit" variant="primary">
                {isLoading ? <Spinner size="sm" /> : 'Reroll'}
              </Button>
            </form>
            {feedback && <FeedbackMessage isError={isError} message={feedback} />}
          </CardContent>
        </CardRoot>
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
