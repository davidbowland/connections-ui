import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import PrivacyPolicy from '@components/privacy-policy'
import PrivacyPage from '@pages/privacy-policy'

jest.mock('@components/privacy-policy')

describe('Privacy page', () => {
  beforeAll(() => {
    jest.mocked(PrivacyPolicy).mockReturnValue(<>PrivacyPolicy</>)
  })

  it('renderes PrivacyPolicy', () => {
    render(<PrivacyPage />)

    expect(PrivacyPolicy).toHaveBeenCalledTimes(1)
  })

  it('renders title', () => {
    render(<PrivacyPage />)
    expect(document.title).toEqual('Common Threads | Privacy Policy')
  })

  it('names production as the canonical, so the test deploy does not compete with it', () => {
    render(<PrivacyPage />)
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toEqual(
      'https://connections.dbowland.com/privacy-policy/',
    )
  })
})
