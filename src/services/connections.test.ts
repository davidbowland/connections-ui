import { fetchConnectionsGame, fetchConnectionsGameIds } from './connections'
import { connectionsGame, gameId } from '@test/__mocks__'

const mockGet = jest.fn()
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: (...args: any[]) => mockGet(...args),
  })),
}))

describe('connections', () => {
  beforeAll(() => {
    mockGet.mockResolvedValue({ data: connectionsGame, status: 200 })
  })

  describe('fetchConnectionsGame', () => {
    it('fetches connections game for a date', async () => {
      const result = await fetchConnectionsGame(gameId)

      expect(mockGet).toHaveBeenCalledWith('/games/2025-01-15')
      expect(result).toEqual({ data: connectionsGame, isGenerating: false })
    })

    it('returns isGenerating true when status is 202', async () => {
      mockGet.mockResolvedValueOnce({ data: connectionsGame, status: 202 })

      const result = await fetchConnectionsGame(gameId)

      expect(result).toEqual({ data: connectionsGame, isGenerating: true })
    })
  })

  describe('fetchConnectionsGameIds', () => {
    it('fetches game IDs', async () => {
      const gameIdsResponse = { gameIds: ['2025-01-01', '2025-01-02'] }
      mockGet.mockResolvedValueOnce({ data: gameIdsResponse })

      const result = await fetchConnectionsGameIds()

      expect(mockGet).toHaveBeenCalledWith('/games')
      expect(result).toEqual(gameIdsResponse)
    })
  })
})
