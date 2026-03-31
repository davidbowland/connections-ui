import React, { useEffect } from 'react'

import Disclaimer from '@components/disclaimer'

export interface ThemedProps {
  children: React.ReactNode | React.ReactNode[]
}

const Themed = ({ children }: ThemedProps): React.ReactNode => {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    document.documentElement.classList.toggle('dark', mq.matches)
    const handler = (e: MediaQueryListEvent) => document.documentElement.classList.toggle('dark', e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <>
      {children}
      <Disclaimer />
    </>
  )
}

export default Themed
