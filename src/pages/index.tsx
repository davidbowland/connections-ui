import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const Index = (): React.ReactNode => {
  const router = useRouter()

  useEffect(() => {
    const today = new Date()
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    router.replace(`/g/${dateString}`)
  }, []) // eslint-disable-line

  return (
    <>
      <Head>
        <title>Connections | dbowland.com</title>
      </Head>
    </>
  )
}

export default Index
