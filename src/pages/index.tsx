import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const Index = (): React.ReactNode => {
  const router = useRouter()

  useEffect(() => {
    const today = new Date()
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    router.replace(`/g/${dateString}`)
  }, [])

  return (
    <>
      <Head>
        <title>Common Threads | dbowland.com</title>
        <meta
          content="Find the four groups of four words that belong together. A new Common Threads puzzle every day."
          name="description"
        />
        <meta content="Common Threads" property="og:title" />
        <meta content="Find the common thread. A new puzzle every day." property="og:description" />
        <meta content="https://connections.dbowland.com/og-image.png" property="og:image" />
        <meta content="website" property="og:type" />
        <meta content="https://connections.dbowland.com/" property="og:url" />
        <meta content="summary_large_image" name="twitter:card" />
        <meta content="Common Threads" name="twitter:title" />
        <meta content="Find the common thread. A new puzzle every day." name="twitter:description" />
        <meta content="https://connections.dbowland.com/og-image.png" name="twitter:image" />
      </Head>
    </>
  )
}

export default Index
