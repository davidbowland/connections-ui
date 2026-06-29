import PrivacyPage from '@pages/privacy-policy'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import PrivacyPolicy from '@components/privacy-policy'

jest.mock('@components/privacy-policy')

jest.mock('next/head', () => {
  const MockHead = ({ children }: { children: React.ReactNode }) => {
    React.Children.toArray(children)
      .filter(
        (child): child is React.ReactElement<{ children: string }> =>
          React.isValidElement(child) && child.type === 'title',
      )
      .forEach((child) => {
        document.title = child.props.children
      })
    return null
  }
  MockHead.displayName = 'MockHead'
  return MockHead
})

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
    expect(document.title).toEqual('Connections | Privacy Policy')
  })
})
