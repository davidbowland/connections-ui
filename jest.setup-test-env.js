// Environment variables
process.env.NEXT_PUBLIC_CONNECTIONS_API_BASE_URL = 'http://localhost'

window.URL.createObjectURL = jest.fn()

window.matchMedia = jest.fn().mockReturnValue({
  addEventListener: jest.fn(),
  matches: false,
  removeEventListener: jest.fn(),
})
