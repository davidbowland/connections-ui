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
        Your request was malformed or otherwise could not be understood by the server. Please modify your request before
        retrying.
      </ServerErrorMessage>
    </>
  )
}

export default BadRequest
