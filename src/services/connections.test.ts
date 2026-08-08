import { fetchConnectionsGame, rerollGame } from './connections'
import * as storage from '@services/storage'
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
jest.mock('@services/storage')

describe('connections', () => {
  beforeAll(() => {
    mockGet.mockResolvedValue({ data: connectionsGame, status: 200 })
    // The auto-mock returns undefined, which is not null and would be handed back
    // as a cache hit holding no puzzle. An empty device is the honest default.
    jest.mocked(storage).readGame.mockReturnValue(null)
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

  describe('caching', () => {
    it('returns the stored puzzle without touching the network', async () => {
      jest.mocked(storage).readGame.mockReturnValueOnce(connectionsGame)

      const result = await fetchConnectionsGame(gameId)

      expect(result).toEqual({ data: connectionsGame, isGenerating: false })
      expect(mockGet).not.toHaveBeenCalled()
    })

    it('stores a puzzle it had to fetch', async () => {
      await fetchConnectionsGame(gameId)

      expect(jest.mocked(storage).writeGame).toHaveBeenCalledWith(gameId, connectionsGame)
    })

    it('never stores a puzzle that is still being generated', async () => {
      mockGet.mockResolvedValueOnce({ data: {}, status: 202 })

      await fetchConnectionsGame(gameId)

      expect(jest.mocked(storage).writeGame).not.toHaveBeenCalled()
    })

    it('falls back to the stored puzzle when the network fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('offline'))
      jest.mocked(storage).readGame.mockReturnValueOnce(null).mockReturnValueOnce(connectionsGame)

      const result = await fetchConnectionsGame(gameId)

      expect(result).toEqual({ data: connectionsGame, isGenerating: false })
    })

    it('rethrows when the network fails and nothing is stored', async () => {
      mockGet.mockRejectedValueOnce(new Error('offline'))

      await expect(fetchConnectionsGame(gameId)).rejects.toThrow('offline')
    })

    it('evicts the stored puzzle after a successful reroll', async () => {
      mockPost.mockResolvedValueOnce({ data: { message: 'Rerolled' } })

      await rerollGame(gameId, 'password')

      expect(jest.mocked(storage).removeGame).toHaveBeenCalledWith(gameId)
    })

    it('leaves the stored puzzle alone when the reroll is refused', async () => {
      mockPost.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403 } })

      await expect(rerollGame(gameId, 'wrong')).rejects.toThrow('Wrong password.')

      expect(jest.mocked(storage).removeGame).not.toHaveBeenCalled()
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

      await expect(rerollGame(gameId, 'wrong')).rejects.toThrow('Wrong password.')
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

      await expect(rerollGame(gameId, 'pw')).rejects.toThrow('Something about that request was invalid.')
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

      await expect(rerollGame(gameId, 'pw')).rejects.toThrow('Something broke on our end.')
    })

    it('throws generic error for non-axios errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('network down'))

      await expect(rerollGame(gameId, 'pw')).rejects.toThrow('Something went wrong. Try again.')
    })
  })
})
