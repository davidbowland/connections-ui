import { navigate } from 'gatsby'
import React, { useEffect } from 'react'

const Index = (): React.ReactNode => {
  useEffect(() => {
    const dateString = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    navigate(`/g/${dateString}`)
  }, [])

  return null
}

export const Head = () => <title>Connections | dbowland.com</title>

export default Index
