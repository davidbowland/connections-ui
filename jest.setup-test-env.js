// Gatsby loader shim
global.___loader = {
  enqueue: jest.fn(),
}

// Environment variables
process.env.GATSBY_CONNECTIONS_API_BASE_URL = 'http://localhost'
process.env.GATSBY_PINPOINT_ID = 'mjyuiokjhgtyujkoiuygv'

window.URL.createObjectURL = jest.fn()
