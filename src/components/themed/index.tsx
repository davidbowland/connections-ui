import Disclaimer from '@components/disclaimer'
import '@config/amplify'
import '@fontsource/roboto'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import React, { useMemo } from 'react'

export interface ThemedProps {
  children: React.ReactNode | React.ReactNode[]
}

const Themed = ({ children }: ThemedProps): React.ReactNode => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          background: {
            default: prefersDarkMode ? '#121212' : '#ededed',
            paper: prefersDarkMode ? '#121212' : '#fff',
          },
          mode: prefersDarkMode ? 'dark' : 'light',
          text: {
            primary: prefersDarkMode ? '#fff' : '#000',
          },
        },
      }),
    [prefersDarkMode],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ backgroundColor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>{children}</Box>
      <Disclaimer />
    </ThemeProvider>
  )
}

export default Themed
