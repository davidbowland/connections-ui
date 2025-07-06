import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { navigate } from 'gatsby'
import React from 'react'

import Index, { Head } from './index'

jest.mock('gatsby')

describe('Index page', () => {
  const mockNavigate = navigate as jest.MockedFunction<typeof navigate>

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock current date to ensure consistent test results
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('redirects to current date game page', () => {
    render(<Index />)

    expect(mockNavigate).toHaveBeenCalledWith('/g/2024-01-15')
  })

  it('renders Head with correct title', () => {
    render(<Head />)
    expect(document.title).toEqual('Connections | dbowland.com')
  })
})
