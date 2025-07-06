import React from 'react'

import Paper from '@mui/material/Paper'

import PrivacyPolicy from '@components/privacy-policy'

const PrivacyPage = (): React.ReactNode => {
  return (
    <main>
      <Paper elevation={3} sx={{ margin: 'auto', maxWidth: '900px' }}>
        <PrivacyPolicy />
      </Paper>
    </main>
  )
}

export const Head = () => <title>Connections | Privacy Policy</title>

export default PrivacyPage
