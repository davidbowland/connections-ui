import { fetchConnectionsGame, fetchConnectionsGameIds, rerollGame } from './connections'
import { connectionsGame, gameId } from '@test/__mocks__'

const mockGet = jest.fn()
const mockPost = jest.fn()
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
  })),
  isAxiosError: jest.fn((e: any) => e?.isAxiosError === true),
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

  describe('rerollGame', () => {
    it('posts reroll request and returns message', async () => {
      mockPost.mockResolvedValueOnce({ data: { message: 'Game is being regenerated' } })

      const result = await rerollGame(gameId, 'test-password')

      expect(mockPost).toHaveBeenCalledWith('/games/2025-01-15/reroll', { password: 'test-password' })
      expect(result).toBe('Game is being regenerated')
    })

    it('throws on 403 forbidden', async () => {
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 403 },
      })

      await expect(rerollGame(gameId, 'wrong')).rejects.toThrow('Forbidden: wrong password')
    })

    it('throws on 400 with error message', async () => {
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400, data: { error: 'Invalid gameId' } },
      })

      await expect(rerollGame(gameId, 'pw')).rejects.toThrow('Invalid gameId')
    })

    it('throws on 400 with fallback message when no error field', async () => {
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400, data: {} },
      })

      await expect(rerollGame(gameId, 'pw')).rejects.toThrow('Bad request')
    })

    it('throws on 500 with message', async () => {
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 500, data: { message: 'Internal server error' } },
      })

      await expect(rerollGame(gameId, 'pw')).rejects.toThrow('Internal server error')
    })

    it('throws on 500 with fallback message when no message field', async () => {
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 500, data: {} },
      })

      await expect(rerollGame(gameId, 'pw')).rejects.toThrow('Internal server error')
    })

    it('throws generic error for non-axios errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('network down'))

      await expect(rerollGame(gameId, 'pw')).rejects.toThrow('An unexpected error occurred')
    })
  })
})
