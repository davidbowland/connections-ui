declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_CONNECTIONS_API_BASE_URL: string
    }
  }
}

export {}
