import Head from 'next/head'
import React, { useEffect, useState } from 'react'

import ServerErrorMessage from '@components/server-error-message'

const Forbidden = (): React.ReactNode => {
  const [display403, setDisplay403] = useState(false)

  useEffect(() => {
    setDisplay403(window.location.pathname.match(/^\/c\/[^/]+$/) === null)
  }, [])

  return (
    <>
      <Head>
        <title>Common Threads | 403: Forbidden</title>
        <meta content="You don't have permission to view that page." name="description" />
      </Head>
      {display403 && (
        <ServerErrorMessage title="403: Forbidden">
          You don&apos;t have permission to view that page.
        </ServerErrorMessage>
      )}
    </>
  )
}

export default Forbidden
