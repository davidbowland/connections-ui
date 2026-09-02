import Head from 'next/head'
import React, { useEffect, useState } from 'react'

import ServerErrorMessage from '@components/server-error-message'

const NotFound = (): React.ReactNode => {
  const [display404, setDisplay404] = useState(false)

  useEffect(() => {
    setDisplay404(window.location.pathname.match(/^\/c\/[^/]+$/) === null)
  }, [])

  return (
    <>
      <Head>
        <title>Common Threads | 404: Not Found</title>
        <meta content="That page doesn't exist. Head back to today's puzzle." name="description" />
        {/* See the note in `400.tsx`. */}
        <meta content="noindex, follow" name="robots" />
      </Head>
      {display404 && <ServerErrorMessage title="404: Not Found">That page doesn&apos;t exist.</ServerErrorMessage>}
    </>
  )
}

export default NotFound
