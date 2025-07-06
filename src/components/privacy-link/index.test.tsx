import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import PrivacyLink from './index'

describe('privacy-link component', () => {
  it('renders the privacy link', async () => {
    render(<PrivacyLink />)

    expect(await screen.findByText(/privacy policy/i)).toBeInTheDocument()
  })
})
