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
