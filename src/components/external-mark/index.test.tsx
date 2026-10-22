import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import { ExternalMark } from './index'

describe('ExternalMark', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<ExternalMark />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws at 12 by default', () => {
    const { container } = render(<ExternalMark />)

    expect(container.querySelector('svg')).toHaveAttribute('width', '12')
    expect(container.querySelector('svg')).toHaveAttribute('height', '12')
  })

  it('draws at the size it is given', () => {
    const { container } = render(<ExternalMark size={10} />)

    expect(container.querySelector('svg')).toHaveAttribute('width', '10')
    expect(container.querySelector('svg')).toHaveAttribute('height', '10')
  })
})
