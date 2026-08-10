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

    // Production only. `next dev` serves every /_next/ chunk from a stable, unhashed
    // URL marked `no-store`, but sw.js treats that whole prefix as immutable and answers
    // it cache-first forever -- an assumption that only holds for an exported build. So
    // the first dev build a worker sees is the one it keeps handing back: the next one
    // changes the bytes behind those same URLs, the webpack runtime no longer matches
    // the hash the HMR socket reports, and Next answers the failed update with
    // window.location.reload() -- which is served the same stale chunks, and reloads
    // again, without end.
    //
    // Unregistering rather than merely skipping, because `npm run serve` puts a real
    // worker on the same localhost origin as the dev server and it outlives the build
    // that installed it. A worker already controlling the page serves stale copies of
    // this file too, so the loop still has to be broken once by hand -- this keeps it
    // from forming again.
    if (process.env.NODE_ENV !== 'production') {
      window.navigator.serviceWorker.getRegistrations().then(
        (registrations) => registrations.forEach((registration) => registration.unregister()),
        (error: unknown) => console.error('service worker cleanup failed', { error }),
      )
      return
    }

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
