import PrivacyPolicy from '@components/privacy-policy'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import PrivacyPage, { Head } from './privacy-policy'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/privacy-policy')

describe('Privacy page', () => {
  beforeAll(() => {
    jest.mocked(PrivacyPolicy).mockReturnValue(<>PrivacyPolicy</>)
  })

  it('renderes PrivacyPolicy', () => {
    render(<PrivacyPage />)

    expect(PrivacyPolicy).toHaveBeenCalledTimes(1)
  })

  it('renders Head', () => {
    render(<Head />)

    expect(document.title).toEqual('Connections | Privacy Policy')
  })
})
