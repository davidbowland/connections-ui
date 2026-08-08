import Head from 'next/head'
import React from 'react'

import ServerErrorMessage from '@components/server-error-message'

const InternalServerError = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Common Threads | 500: Internal Server Error</title>
        <meta content="Something broke on our end. Try again in a moment." name="description" />
      </Head>
      <ServerErrorMessage title="500: Internal Server Error">
        Something broke on our end. Try again in a moment.
      </ServerErrorMessage>
    </>
  )
}

export default InternalServerError
