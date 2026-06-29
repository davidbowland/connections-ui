import Head from 'next/head'
import React from 'react'

import ServerErrorMessage from '@components/server-error-message'

const InternalServerError = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Connections | 500: Internal Server Error</title>
      </Head>
      <ServerErrorMessage title="500: Internal Server Error">
        Something broke on our end. Try again in a moment.
      </ServerErrorMessage>
    </>
  )
}

export default InternalServerError
