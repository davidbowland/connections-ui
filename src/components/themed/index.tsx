import '@fontsource/roboto'
import React, { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import Disclaimer from '@components/disclaimer'

export interface ThemedProps {
  children: React.ReactNode | React.ReactNode[]
}

const Themed = ({ children }: ThemedProps): React.ReactNode => {
  const [prefersDarkMode, setPrefersDarkMode] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    setPrefersDarkMode(mql.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersDarkMode(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

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
