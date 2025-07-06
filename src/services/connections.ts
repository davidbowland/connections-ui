import axios from 'axios'

import { ConnectionsGame } from '@types'

const api = axios.create({
  baseURL: process.env.GATSBY_CONNECTIONS_API_BASE_URL,
  timeout: 35_000, // 35 seconds
})

export const fetchConnectionsGame = async (gameId: string): Promise<ConnectionsGame> => {
  // return Promise.resolve({ "categories": {
  //   "Member of a Team with the Most Championships": { words: ["CANADIEN", "CELTIC", "PACKER", "YANKEE"]},
  //   "Create Some Volume/Texture in Hair": { words: ["CRIMP", "CURL", "FEATHER", "TEASE"]},
  //   "Supplies for Macaroni Art": { words: ["GLITTER", "GLUE", "MACARONI", "PAPER"]},
  //   "Words After \"Golden\"":{ words:  ["DOODLE", "GOOSE", "PARACHUTE", "ROD"]}
  // } })
  const response = await api.get(`/games/${gameId}`)
  return response.data
}
