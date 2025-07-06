import { connectionsGame, gameId } from '@test/__mocks__'

import { fetchConnectionsGame } from './connections'

const mockGet = jest.fn()
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: (...args: any[]) => mockGet(...args),
  })),
}))

describe('connections', () => {
  beforeAll(() => {
    mockGet.mockResolvedValue({ data: connectionsGame })
  })

  describe('fetchConnectionsGame', () => {
    it('fetches connections game for a date', async () => {
      const result = await fetchConnectionsGame(gameId)

      expect(mockGet).toHaveBeenCalledWith('/games/2024-01-15')
      expect(result).toEqual(connectionsGame)
    })
  })
})
