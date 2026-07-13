import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import { BrandMark } from './index'

describe('BrandMark', () => {
  it('is decorative and hidden from the accessibility tree', () => {
    const { container } = render(<BrandMark />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies the given className to the root svg', () => {
    const { container } = render(<BrandMark className="h-8 w-8" />)
    expect(container.querySelector('svg')).toHaveClass('h-8 w-8')
  })
})
