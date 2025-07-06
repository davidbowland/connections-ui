import Themed from '@components/themed'
import '@config/amplify'
import type { GatsbyBrowser } from 'gatsby'
import React from 'react'

export const wrapPageElement: GatsbyBrowser['wrapPageElement'] = ({ element }): JSX.Element => {
  return <Themed>{element}</Themed>
}
