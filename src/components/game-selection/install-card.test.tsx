import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { InstallCard } from './install-card'

describe('InstallCard', () => {
  const onDismiss = jest.fn()
  const onInstall = jest.fn()
  const onReopen = jest.fn()

  const props = {
    isDismissed: false,
    onDismiss,
    onInstall,
    onReopen,
    platform: 'desktop' as const,
  }

  it('states what installing actually does', () => {
    render(<InstallCard {...props} />)

    expect(
      screen.getByText(
        'Only the puzzles you open stay on this device. Install Common Threads and the last seven days stay too — no connection needed.',
      ),
    ).toBeInTheDocument()
  })

  it('titles the card at a level below the region heading', () => {
    render(<InstallCard {...props} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Take the week with you' })).toBeInTheDocument()
  })

  it('says Install on desktop, where there is no home screen', () => {
    render(<InstallCard {...props} />)

    expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()
  })

  it('says Add to home screen on android', () => {
    render(<InstallCard {...props} platform="android" />)

    expect(screen.getByRole('button', { name: 'Add to home screen' })).toBeInTheDocument()
  })

  it('gives iOS manual steps instead of a button that cannot work', () => {
    render(<InstallCard {...props} platform="ios" />)

    expect(screen.getByText('Tap Share at the bottom of Safari.')).toBeInTheDocument()
    expect(screen.getByText('Tap Add to Home Screen.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
  })

  it('keeps the iOS steps off a platform that can be prompted', () => {
    render(<InstallCard {...props} />)

    expect(screen.queryByText('Tap Share at the bottom of Safari.')).not.toBeInTheDocument()
  })

  it('numbers the iOS steps, because their order matters', () => {
    render(<InstallCard {...props} platform="ios" />)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('triggers the browser prompt', async () => {
    const user = userEvent.setup()
    render(<InstallCard {...props} />)

    await user.click(screen.getByRole('button', { name: 'Install' }))

    expect(onInstall).toHaveBeenCalled()
  })

  it('dismisses', async () => {
    const user = userEvent.setup()
    render(<InstallCard {...props} />)

    await user.click(screen.getByRole('button', { name: 'Not now' }))

    expect(onDismiss).toHaveBeenCalled()
  })

  it('collapses to a link rather than disappearing', () => {
    render(<InstallCard {...props} isDismissed={true} />)

    expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()
    expect(screen.queryByText('Take the week with you')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Not now' })).not.toBeInTheDocument()
  })

  it('reopens from the collapsed link', async () => {
    const user = userEvent.setup()
    render(<InstallCard {...props} isDismissed={true} />)

    await user.click(screen.getByRole('button', { name: 'Install' }))

    expect(onReopen).toHaveBeenCalled()
  })

  it('keeps the collapsed link reachable on iOS, the only route to installing there', async () => {
    const user = userEvent.setup()
    render(<InstallCard {...props} isDismissed={true} platform="ios" />)

    await user.click(screen.getByRole('button', { name: 'Install' }))

    expect(onReopen).toHaveBeenCalled()
  })

  it('reaches every control by keyboard alone', async () => {
    const user = userEvent.setup()
    render(<InstallCard {...props} />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Install' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Not now' })).toHaveFocus()
  })
})
