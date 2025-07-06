import ServerErrorMessage from '@components/server-error-message'
import React from 'react'

const NotFound = (): React.ReactNode => {
  const display404 = typeof window !== 'undefined' && window.location.pathname.match(/^\/c\/[^/]+$/) === null

  if (display404) {
    return (
      <ServerErrorMessage title="404: Not Found">
        The resource you requested is unavailable. If you feel you have reached this page in error, please contact the
        webmaster.
      </ServerErrorMessage>
    )
  }
  return <></>
}

export const Head = () => <title>Connections | 404: Not Found</title>

export default NotFound
