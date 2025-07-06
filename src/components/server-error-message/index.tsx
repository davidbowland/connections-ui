import PrivacyLink from '@components/privacy-link'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { Link } from 'gatsby'
import React from 'react'

export interface ServerErrorProps {
  children: React.ReactNode
  title: string
}

const ServerErrorMessage = ({ children, title }: ServerErrorProps): React.ReactNode => {
  return (
    <Grid container justifyContent="center">
      <Grid container direction="column" item spacing={2} sx={{ maxWidth: '900px', padding: 4 }}>
        <Grid item xs>
          <Typography variant="h1">{title}</Typography>
        </Grid>
        <Grid item xs>
          {children}
        </Grid>
        <Grid item xs>
          <Link to="/">Go home</Link>
          <PrivacyLink />
        </Grid>
      </Grid>
    </Grid>
  )
}

export default ServerErrorMessage
