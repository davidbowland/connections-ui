import Typography from '@mui/material/Typography'
import { Link } from 'gatsby'
import React from 'react'

const PrivacyLink = (): React.ReactNode => {
  return (
    <Typography component="div" sx={{ p: 2, textAlign: 'center' }} variant="caption">
      <Link to="/privacy-policy">Privacy policy</Link>
    </Typography>
  )
}

export default PrivacyLink
