import Head from 'next/head'
import React from 'react'

import PrivacyPolicy from '@components/privacy-policy'

const PrivacyPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Common Threads | Privacy Policy</title>
        <meta
          content="What Common Threads collects, why we collect it, and how to reach us about it."
          name="description"
        />
      </Head>
      <main>
        <div className="mx-auto max-w-[900px] shadow-md">
          <PrivacyPolicy />
        </div>
      </main>
    </>
  )
}

export default PrivacyPage
