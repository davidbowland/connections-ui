import Head from 'next/head'
import React, { useEffect, useState } from 'react'

import ServerErrorMessage from '@components/server-error-message'

const NotFound = (): React.ReactNode => {
  const [display404, setDisplay404] = useState(false)

  useEffect(() => {
    setDisplay404(window.location.pathname.match(/^\/c\/[^/]+$/) === null)
  }, [])

  if (!display404) return <></>

  return (
    <>
      <Head>
        <title>Common Threads | 404: Not Found</title>
      </Head>
      <ServerErrorMessage title="404: Not Found">That page doesn&apos;t exist.</ServerErrorMessage>
    </>
  )
}

export default NotFound
