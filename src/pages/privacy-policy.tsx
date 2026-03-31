import Head from 'next/head'
import React from 'react'

import PrivacyPolicy from '@components/privacy-policy'

const PrivacyPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Connections | Privacy Policy</title>
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
