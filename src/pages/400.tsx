import ServerErrorMessage from '@components/server-error-message'
import React from 'react'

const BadRequest = (): React.ReactNode => {
  return (
    <ServerErrorMessage title="400: Bad Request">
      Your request was malformed or otherwise could not be understood by the server. Please modify your request before
      retrying.
    </ServerErrorMessage>
  )
}

export const Head = () => <title>Connections | 400: Bad Request</title>

export default BadRequest
