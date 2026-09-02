import Head from 'next/head'
import React from 'react'

import ServerErrorMessage from '@components/server-error-message'

const BadRequest = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Common Threads | 400: Bad Request</title>
        <meta content="Something went wrong with that link. Head back to today's puzzle." name="description" />
        {/*
          An error message is not a search result. `next-sitemap.config.js` already excludes this
          route on the assumption this tag is here -- but a sitemap only withdraws an invitation,
          and the tag is what actually keeps the page out of an index. `follow`, not `nofollow`:
          the way out of here is worth crawling.
        */}
        <meta content="noindex, follow" name="robots" />
      </Head>
      <ServerErrorMessage title="400: Bad Request">
        Something went wrong with that link. Try going home and starting fresh.
      </ServerErrorMessage>
    </>
  )
}

export default BadRequest
