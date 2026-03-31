import App from '@pages/_app'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import Themed from '@components/themed'

jest.mock('@components/themed', () => jest.fn().mockImplementation(({ children }) => <>{children}</>))

const MockPage = () => <div>mock page</div>

test('renders Themed and child component', () => {
  render(<App Component={MockPage} pageProps={{}} router={undefined as any} />)

  expect(Themed).toHaveBeenCalled()
  expect(screen.getByText('mock page')).toBeInTheDocument()
})
