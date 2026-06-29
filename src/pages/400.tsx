import Head from 'next/head'
import React from 'react'

import ServerErrorMessage from '@components/server-error-message'

const BadRequest = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Connections | 400: Bad Request</title>
      </Head>
      <ServerErrorMessage title="400: Bad Request">
        Something went wrong with that link. Try going home and starting fresh.
      </ServerErrorMessage>
    </>
  )
}

export default BadRequest
