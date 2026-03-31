import Index from '@pages/index'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { useRouter } from 'next/router'
import React from 'react'

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({ replace: jest.fn() }),
}))

jest.mock('next/head', () => {
  const MockHead = ({ children }: { children: React.ReactNode }) => {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'title') {
        document.title = (child.props as { children: string }).children
      }
    })
    return null
  }
  MockHead.displayName = 'MockHead'
  return MockHead
})

describe('Index page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock current date to ensure consistent test results
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-15T10:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders title correctly', () => {
    render(<Index />)
    expect(document.title).toEqual('Connections | dbowland.com')
  })

  it('redirects to current date game page', () => {
    const mockReplace = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace })

    render(<Index />)

    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/\/g\/\d{4}-\d{2}-\d{2}/))
  })
})
