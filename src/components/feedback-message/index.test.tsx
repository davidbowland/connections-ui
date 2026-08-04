import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import FeedbackMessage from './index'

describe('FeedbackMessage', () => {
  it('announces an error assertively', () => {
    render(<FeedbackMessage isError={true} message="Wrong password." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Wrong password.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('announces a success politely', () => {
    render(<FeedbackMessage isError={false} message="Game rerolled." />)

    expect(screen.getByRole('status')).toHaveTextContent('Game rerolled.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
