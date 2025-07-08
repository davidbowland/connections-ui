import { navigate } from 'gatsby'
import React, { useEffect } from 'react'

const Index = (): React.ReactNode => {
  useEffect(() => {
    const today = new Date()
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    navigate(`/g/${dateString}`)
  }, [])

  return null
}

export const Head = () => <title>Connections | dbowland.com</title>

export default Index
