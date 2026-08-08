import axios from 'axios'

import { readGame, removeGame, writeGame } from '@services/storage'
import { ConnectionsGame } from '@types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CONNECTIONS_API_BASE_URL,
  timeout: 35_000, // 35 seconds
})

export const fetchConnectionsGame = async (
  gameId: string,
): Promise<{ data: ConnectionsGame; isGenerating: boolean }> => {
  const stored = readGame(gameId)
  if (stored !== null) {
    return { data: stored, isGenerating: false }
  }

  try {
    const response = await api.get(`/games/${gameId}`)
    const isGenerating = response.status === 202
    // A 202 body is a status message, not a puzzle. Storing it would pin the
    // player to a game that does not exist yet.
    if (!isGenerating) {
      writeGame(gameId, response.data)
    }
    return { data: response.data, isGenerating }
  } catch (error: unknown) {
    // Read again rather than reusing the miss above: the request took real time,
    // and another tab -- or the prefetch -- may have filled it meanwhile.
    const fallback = readGame(gameId)
    if (fallback !== null) {
      return { data: fallback, isGenerating: false }
    }
    throw error
  }
}

export const rerollGame = async (gameId: string, password: string): Promise<string> => {
  try {
    const response = await api.post(`/games/${gameId}/reroll`, { password })
    // The server just replaced this puzzle. Without eviction the local copy wins
    // forever, because reads are cache-first.
    removeGame(gameId)
    return response.data.message
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 403) throw new Error('Wrong password.')
      if (status === 400) throw new Error(error.response?.data?.error ?? 'Something about that request was invalid.')
      if (status === 500) throw new Error(error.response?.data?.message ?? 'Something broke on our end.')
    }
    throw new Error('Something went wrong. Try again.')
  }
}
