import { fetchConnectionsGame } from './connections'

const mockGet = jest.fn()
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: (...args: any[]) => mockGet(...args),
  })),
}))

describe('connections', () => {
  const gameId = '2024-01-15'
  const mockGame = {
    categories: {
      'Category 1': { words: ['word1', 'word2', 'word3', 'word4'] },
      'Category 2': { words: ['word5', 'word6', 'word7', 'word8'] },
    },
  }

  describe('fetchConnectionsGame', () => {
    it('fetches connections game for a date', async () => {
      mockGet.mockResolvedValueOnce({ data: mockGame })
      const result = await fetchConnectionsGame(gameId)

      expect(mockGet).toHaveBeenCalledWith('/games/2024-01-15')
      expect(result).toEqual(mockGame)
    })
  })
})
