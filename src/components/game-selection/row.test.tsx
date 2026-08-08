import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { GameSelectionRow } from './row'

describe('GameSelectionRow', () => {
  const onSelect = jest.fn()

  const props = {
    gameId: '2026-08-05',
    isBlocked: false,
    isOnDevice: true,
    isSolved: false,
    isToday: false,
    isUpNext: false,
    onSelect,
  }

  it('shows the date', () => {
    render(<GameSelectionRow {...props} />)

    expect(screen.getByText('8/5/2026')).toBeInTheDocument()
  })

  it('marks a solved puzzle with a glyph and a word, never colour alone', () => {
    render(<GameSelectionRow {...props} isSolved={true} />)

    expect(screen.getByText('✓ Solved')).toBeInTheDocument()
  })

  it('says when a puzzle is on the device', () => {
    render(<GameSelectionRow {...props} />)

    expect(screen.getByText('On device')).toBeInTheDocument()
  })

  it('says when a puzzle is not on the device', () => {
    render(<GameSelectionRow {...props} isBlocked={true} isOnDevice={false} />)

    expect(screen.getByText('Not on device')).toBeInTheDocument()
  })

  it('prefers Today over Up next when both apply', () => {
    render(<GameSelectionRow {...props} isToday={true} isUpNext={true} />)

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.queryByText('Up next')).not.toBeInTheDocument()
  })

  it('tags the recommended puzzle when it is not today', () => {
    render(<GameSelectionRow {...props} isUpNext={true} />)

    expect(screen.getByText('Up next')).toBeInTheDocument()
  })

  it('spells the whole state out for a screen reader', () => {
    render(<GameSelectionRow {...props} isSolved={true} isToday={true} />)

    expect(screen.getByRole('button')).toHaveAccessibleName('8/5/2026, today — solved, on this device')
  })

  it('explains what a blocked row costs', () => {
    render(<GameSelectionRow {...props} isBlocked={true} isOnDevice={false} />)

    expect(screen.getByRole('button')).toHaveAccessibleName(
      "8/5/2026 — not solved, not on this device, so it won't open while you're offline",
    )
  })

  it('selects the puzzle when pressed', async () => {
    const user = userEvent.setup()
    render(<GameSelectionRow {...props} />)

    await user.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith('2026-08-05')
  })

  it('does not select a blocked puzzle', async () => {
    const user = userEvent.setup()
    render(<GameSelectionRow {...props} isBlocked={true} isOnDevice={false} />)

    await user.click(screen.getByRole('button'))

    expect(onSelect).not.toHaveBeenCalled()
  })
})
