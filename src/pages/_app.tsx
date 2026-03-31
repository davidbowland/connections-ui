import type { AppProps } from 'next/app'
import React from 'react'

import Themed from '@components/themed'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Themed>
      <Component {...pageProps} />
    </Themed>
  )
}
