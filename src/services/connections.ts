import axios from 'axios'

import { ConnectionsGame, GameIdsResponse } from '@types'

const api = axios.create({
  baseURL: process.env.GATSBY_CONNECTIONS_API_BASE_URL,
  timeout: 35_000, // 35 seconds
})

export const fetchConnectionsGame = async (
  gameId: string,
): Promise<{ data: ConnectionsGame; isGenerating: boolean }> => {
  const response = await api.get(`/games/${gameId}`)
  return {
    data: response.data,
    isGenerating: response.status === 202,
  }
}

export const fetchConnectionsGameIds = async (): Promise<GameIdsResponse> => {
  const response = await api.get('/games')
  return response.data
}

export const rerollGame = async (gameId: string, password: string): Promise<string> => {
  try {
    const response = await api.post(`/games/${gameId}/reroll`, { password })
    return response.data.message
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 403) throw new Error('Forbidden: wrong password')
      if (status === 400) throw new Error(error.response?.data?.error ?? 'Bad request')
      if (status === 500) throw new Error(error.response?.data?.message ?? 'Internal server error')
    }
    throw new Error('An unexpected error occurred')
  }
}
