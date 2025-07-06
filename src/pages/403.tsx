import React from 'react'

import ServerErrorMessage from '@components/server-error-message'

const Forbidden = (): React.ReactNode => {
  const display403 = typeof window !== 'undefined' && window.location.pathname.match(/^\/c\/[^/]+$/) === null

  if (display403) {
    return (
      <ServerErrorMessage title="403: Forbidden">
        You are not allowed to access the resource you requested. If you feel you have reached this page in error,
        please contact the webmaster.
      </ServerErrorMessage>
    )
  }
  return <></>
}

export const Head = () => <title>Connections | 403: Forbidden</title>

export default Forbidden
