import '@fontsource/space-grotesk'
import type { AppProps } from 'next/app'
import React, { useEffect } from 'react'

import '@assets/css/index.css'
import Themed from '@components/themed'
import { usePrefetch } from '@hooks/usePrefetch'

export default function App({ Component, pageProps }: AppProps) {
  // Every page, not just the picker. Opening any puzzle is what fills the device for
  // the next one, and this is the only caller -- without it the whole offline
  // feature is inert.
  usePrefetch()

  useEffect(() => {
    if (!('serviceWorker' in window.navigator)) return
    // Registration failing is not worth showing anyone: the site works without a
    // worker, it just cannot open with no connection.
    window.navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('service worker registration failed', { error })
    })
  }, [])

  return (
    <Themed>
      <Component {...pageProps} />
    </Themed>
  )
}
