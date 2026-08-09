import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { GameSelectionRow } from './row'

describe('GameSelectionRow', () => {
  const onSelect = jest.fn()

  const props = {
    gameId: '2026-08-05',
    isOffline: false,
    isOnDevice: true,
    isSolved: false,
    isToday: false,
    isUpNext: false,
    locale: 'en-US',
    onSelect,
  }

  it('shows the date', () => {
    render(<GameSelectionRow {...props} />)

    expect(screen.getByText('8/5/2026')).toBeInTheDocument()
  })

  it('reads the date in the requested locale', () => {
    render(<GameSelectionRow {...props} locale="en-GB" />)

    expect(screen.getByText('05/08/2026')).toBeInTheDocument()
  })

  it('falls back to the browser locale when none is given', () => {
    const { unmount } = render(<GameSelectionRow {...props} locale={navigator.language} />)
    const browserName = screen.getByRole('button').getAttribute('aria-label') ?? ''
    unmount()

    render(<GameSelectionRow {...props} locale={undefined} />)

    expect(screen.getByRole('button')).toHaveAccessibleName(browserName)
  })

  it('shows the same day whatever the runtime time zone', () => {
    render(<GameSelectionRow {...props} gameId="2026-8-5" />)

    expect(screen.getByText('8/5/2026')).toBeInTheDocument()
  })

  it('marks a solved puzzle with a glyph and a word', () => {
    render(<GameSelectionRow {...props} isSolved={true} />)

    expect(screen.getByText('✓ Solved')).toBeInTheDocument()
  })

  it('says when a puzzle is on the device', () => {
    render(<GameSelectionRow {...props} />)

    expect(screen.getByText('On device')).toBeInTheDocument()
  })

  it('says when an offline puzzle is missing from the device', () => {
    render(<GameSelectionRow {...props} isOffline={true} isOnDevice={false} />)

    expect(screen.getByText('Not on device')).toBeInTheDocument()
  })

  it('shows no storage marker when online and the puzzle is not on the device', () => {
    render(<GameSelectionRow {...props} isOnDevice={false} />)

    expect(screen.queryByText('Not on device')).not.toBeInTheDocument()
    expect(screen.queryByText('On device')).not.toBeInTheDocument()
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

  it("points at today's puzzle rather than the recommended one", () => {
    render(<GameSelectionRow {...props} isToday={true} isUpNext={true} />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'date')
  })

  it('points at the recommended puzzle when it is not today', () => {
    render(<GameSelectionRow {...props} isUpNext={true} />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true')
  })

  it('points at nothing when the puzzle is neither today nor recommended', () => {
    render(<GameSelectionRow {...props} />)

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current')
  })

  it('spells the whole state out for a screen reader', () => {
    render(<GameSelectionRow {...props} isSolved={true} isToday={true} />)

    expect(screen.getByRole('button')).toHaveAccessibleName('8/5/2026, Today — ✓ Solved, On device')
  })

  it('explains what a blocked row costs', () => {
    render(<GameSelectionRow {...props} isOffline={true} isOnDevice={false} isUpNext={true} />)

    expect(screen.getByRole('button')).toHaveAccessibleName(
      "8/5/2026, Up next — Not solved, Not on device. Won't open until you're back online.",
    )
  })

  it.each([
    [false, false, false, '8/5/2026 — Not solved'],
    [true, false, false, '8/5/2026 — ✓ Solved'],
    [false, true, false, '8/5/2026 — Not solved, On device'],
    [true, true, false, '8/5/2026 — ✓ Solved, On device'],
    [false, true, true, '8/5/2026 — Not solved, On device'],
    [true, true, true, '8/5/2026 — ✓ Solved, On device'],
    [false, false, true, "8/5/2026 — Not solved, Not on device. Won't open until you're back online."],
    [true, false, true, "8/5/2026 — ✓ Solved, Not on device. Won't open until you're back online."],
  ])(
    'names the row for solved=%s, onDevice=%s, offline=%s',
    (isSolved: boolean, isOnDevice: boolean, isOffline: boolean, expected: string) => {
      render(<GameSelectionRow {...props} isOffline={isOffline} isOnDevice={isOnDevice} isSolved={isSolved} />)

      expect(screen.getByRole('button')).toHaveAccessibleName(expected)
    },
  )

  it('repeats every visible marker in the accessible name', () => {
    render(<GameSelectionRow {...props} isOffline={true} isOnDevice={false} isSolved={true} isToday={true} />)

    const name = screen.getByRole('button').getAttribute('aria-label') ?? ''

    expect(name).toContain('Today')
    expect(name).toContain('✓ Solved')
    expect(name).toContain('Not on device')
  })

  it('selects the puzzle when pressed', async () => {
    const user = userEvent.setup()
    render(<GameSelectionRow {...props} />)

    await user.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith('2026-08-05')
  })

  it('selects a puzzle that is on the device while offline', async () => {
    const user = userEvent.setup()
    render(<GameSelectionRow {...props} isOffline={true} isOnDevice={true} />)

    await user.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith('2026-08-05')
  })

  it('selects a puzzle that is off the device while online', async () => {
    const user = userEvent.setup()
    render(<GameSelectionRow {...props} isOffline={false} isOnDevice={false} />)

    await user.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith('2026-08-05')
  })

  it('does not select a blocked puzzle', async () => {
    const user = userEvent.setup()
    render(<GameSelectionRow {...props} isOffline={true} isOnDevice={false} />)

    await user.click(screen.getByRole('button'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('tells assistive technology a blocked row will not act', () => {
    render(<GameSelectionRow {...props} isOffline={true} isOnDevice={false} />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  })

  it('keeps a blocked row reachable by keyboard', async () => {
    const user = userEvent.setup()
    render(<GameSelectionRow {...props} isOffline={true} isOnDevice={false} />)

    await user.tab()

    expect(screen.getByRole('button')).toHaveFocus()
  })

  it('is a tab stop by default', async () => {
    const user = userEvent.setup()
    render(<GameSelectionRow {...props} />)

    await user.tab()

    expect(screen.getByRole('button')).toHaveFocus()
  })

  // The archive renders ~585 rows and lifts them out of the tab order, walking them
  // with the arrow keys instead. They stay focusable, just not by Tab.
  it('leaves the tab order when the caller asks it to', async () => {
    const user = userEvent.setup()
    render(<GameSelectionRow {...props} tabIndex={-1} />)

    await user.tab()

    expect(screen.getByRole('button')).not.toHaveFocus()

    screen.getByRole('button').focus()

    expect(screen.getByRole('button')).toHaveFocus()
  })
})
