import Head from 'next/head'
import React, { useEffect, useState } from 'react'

import ServerErrorMessage from '@components/server-error-message'

const Forbidden = (): React.ReactNode => {
  const [display403, setDisplay403] = useState(false)

  useEffect(() => {
    setDisplay403(window.location.pathname.match(/^\/c\/[^/]+$/) === null)
  }, [])

  if (!display403) return <></>

  return (
    <>
      <Head>
        <title>Connections | 403: Forbidden</title>
      </Head>
      <ServerErrorMessage title="403: Forbidden">
        You are not allowed to access the resource you requested. If you feel you have reached this page in error,
        please contact the webmaster.
      </ServerErrorMessage>
    </>
  )
}

export default Forbidden
