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
    document.querySelectorAll('meta[data-mock-head]').forEach((el) => el.remove())
    React.Children.toArray(children).forEach((child) => {
      if (!React.isValidElement(child)) return
      if (child.type === 'title') {
        document.title = (child.props as { children: string }).children
      }
      if (child.type === 'meta') {
        const meta = document.createElement('meta')
        Object.entries(child.props as Record<string, string>).forEach(([key, value]) => meta.setAttribute(key, value))
        meta.setAttribute('data-mock-head', 'true')
        document.head.appendChild(meta)
      }
    })
    return null
  }
  MockHead.displayName = 'MockHead'
  return MockHead
})

describe('Index page', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-15T10:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('renders title correctly', () => {
    render(<Index />)
    expect(document.title).toEqual('Common Threads | dbowland.com')
  })

  it('renders Open Graph metadata', () => {
    render(<Index />)
    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute('content', 'Common Threads')
    expect(document.head.querySelector('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://connections.dbowland.com/og-image.png',
    )
    expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://connections.dbowland.com/',
    )
  })

  it('redirects to current date game page', () => {
    const mockReplace = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValueOnce({ replace: mockReplace })

    render(<Index />)

    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/\/g\/\d{4}-\d{2}-\d{2}/))
  })
})
