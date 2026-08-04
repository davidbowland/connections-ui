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
      setFeedback(error instanceof Error ? error.message : 'Something went wrong. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Reroll Game</title>
      </Head>
      <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
        {/* outer shell */}
        <div className="w-full max-w-[400px] rounded-3xl border border-black/6 bg-black/[0.04] p-[2px] shadow-xl dark:border-white/8 dark:bg-white/[0.04] dark:shadow-none">
          {/* inner core */}
          <div className="rounded-[22px] bg-white px-8 py-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] dark:bg-[#0a0a0c]">
            <h1 className="mb-1 text-2xl font-light uppercase tracking-[0.2em] text-black/88 dark:text-white/88">
              Reroll Game
            </h1>
            <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.25em] text-black/60 dark:text-white/55">
              {gameId}
            </p>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label
                  className="text-[10px] uppercase tracking-[0.2em] text-black/60 dark:text-white/55"
                  htmlFor="reroll-password"
                >
                  Password
                </label>
                <input
                  autoComplete="off"
                  className="w-full rounded-xl border border-black/8 bg-black/[0.03] px-4 py-3 text-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80"
                  disabled={isLoading}
                  id="reroll-password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
              <button
                className="w-full rounded-full bg-black/88 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-opacity disabled:opacity-40 dark:bg-white/95 dark:text-[#060608]"
                disabled={isLoading || !password}
                type="submit"
              >
                {isLoading ? '…' : 'Reroll'}
              </button>
            </form>

            {feedback && <FeedbackMessage isError={isError} message={feedback} />}
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

export default RerollPage
