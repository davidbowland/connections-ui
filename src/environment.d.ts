declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GATSBY_CONNECTIONS_API_BASE_URL: string
      GATSBY_PINPOINT_ID: string
    }
  }
}

export {}
