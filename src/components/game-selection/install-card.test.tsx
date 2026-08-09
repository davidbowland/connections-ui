import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'

import { InstallCard } from './install-card'
import { InstallMode, InstallPlatform } from '@hooks/useInstallPrompt'

describe('InstallCard', () => {
  const onDismiss = jest.fn()
  const onInstall = jest.fn()
  const onReopen = jest.fn()

  const props = {
    mode: 'card' as InstallMode,
    onDismiss,
    onInstall,
    onReopen,
    platform: 'desktop' as InstallPlatform,
  }

  // Focus can only be judged across a real transition, so this stands in for the
  // hook: dismissing collapses the card and reopening expands it, exactly as the
  // three modes do in the app.
  const Disclosure = ({
    startMode = 'card',
    platform = 'desktop',
  }: {
    platform?: InstallPlatform
    startMode?: InstallMode
  }): React.ReactNode => {
    const [mode, setMode] = useState<InstallMode>(startMode)
    return (
      <InstallCard
        mode={mode}
        onDismiss={() => setMode('link')}
        onInstall={onInstall}
        onReopen={() => setMode('card')}
        platform={platform}
      />
    )
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

  // The steps claim no position, because Share sits at the bottom on iPhone and the
  // top on iPad, and they name Safari, because Chrome, Firefox and the browsers
  // inside messaging apps all report themselves as iOS and none of them can add
  // anything to a home screen.
  it('gives iOS steps that hold on every iOS browser and both screen sizes', () => {
    render(<InstallCard {...props} platform="ios" />)

    expect(screen.getByText('Open this page in Safari.')).toBeInTheDocument()
    expect(screen.getByText('Tap Share, then Add to Home Screen.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
  })

  it('says Add to home screen on Firefox for Android, which also has a home screen', () => {
    render(<InstallCard {...props} mode="link" platform="firefox-android" />)

    expect(screen.getByRole('button', { name: 'Add to home screen' })).toBeInTheDocument()
  })

  // Firefox for Android fires no beforeinstallprompt, so a button here would be wired
  // to an event that never arrives. The steps name Install rather than Share, which
  // Firefox does not have, and rather than Add to Home screen, which in current
  // Firefox is a separate item that makes an ordinary shortcut.
  it('gives Firefox for Android the browser menu instead of a button it cannot fire', () => {
    render(<InstallCard {...props} platform="firefox-android" />)

    expect(screen.getByText('Open the Firefox menu.')).toBeInTheDocument()
    expect(screen.getByText('Tap Install. Older versions call it Add to Home screen.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to home screen' })).not.toBeInTheDocument()
  })

  it('numbers the Firefox steps, because their order matters', () => {
    render(<InstallCard {...props} platform="firefox-android" />)

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('keeps the Firefox steps off a platform that can be prompted', () => {
    render(<InstallCard {...props} platform="android" />)

    expect(screen.queryByText('Open the Firefox menu.')).not.toBeInTheDocument()
  })

  it('keeps the iOS steps off a platform that can be prompted', () => {
    render(<InstallCard {...props} />)

    expect(screen.queryByText('Open this page in Safari.')).not.toBeInTheDocument()
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

  it('renders nothing when there is no install route left to offer', () => {
    const { container } = render(<InstallCard {...props} mode="none" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('collapses to a link rather than disappearing', () => {
    render(<InstallCard {...props} mode="link" />)

    expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()
    expect(screen.queryByText('Take the week with you')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Not now' })).not.toBeInTheDocument()
  })

  // A player who turns down Add to home screen and is later offered Install has no
  // way to know it is the same offer.
  it('collapses to the label the card was offering', () => {
    render(<InstallCard {...props} mode="link" platform="android" />)

    expect(screen.getByRole('button', { name: 'Add to home screen' })).toBeInTheDocument()
  })

  it('tells a screen reader the collapsed link opens something', () => {
    render(<InstallCard {...props} mode="link" />)

    expect(screen.getByRole('button', { name: 'Install' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('reopens from the collapsed link', async () => {
    const user = userEvent.setup()
    render(<InstallCard {...props} mode="link" />)

    await user.click(screen.getByRole('button', { name: 'Install' }))

    expect(onReopen).toHaveBeenCalled()
  })

  it('keeps the collapsed link reachable on iOS, the only route to installing there', async () => {
    const user = userEvent.setup()
    render(<InstallCard {...props} mode="link" platform="ios" />)

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

  describe('focus', () => {
    it('follows the card down to the collapsed link', async () => {
      const user = userEvent.setup()
      render(<Disclosure />)

      await user.click(screen.getByRole('button', { name: 'Not now' }))

      expect(screen.getByRole('button', { name: 'Install' })).toHaveFocus()
    })

    it('follows the collapsed link back up to the install control', async () => {
      const user = userEvent.setup()
      render(<Disclosure startMode="link" />)

      await user.click(screen.getByRole('button', { name: 'Install' }))

      expect(screen.getByRole('button', { name: 'Install' })).toHaveFocus()
    })

    it('lands on the card title on iOS, which has no install control to land on', async () => {
      const user = userEvent.setup()
      render(<Disclosure platform="ios" startMode="link" />)

      await user.click(screen.getByRole('button', { name: 'Install' }))

      expect(screen.getByRole('heading', { level: 3, name: 'Take the week with you' })).toHaveFocus()
    })

    it('stays put on first render', () => {
      render(<InstallCard {...props} />)

      expect(document.body).toHaveFocus()
    })

    // The browser fires beforeinstallprompt whenever it likes. A card appearing on
    // its own must not pull the keyboard out of the puzzle.
    it('stays put when the card appears on its own', () => {
      const { rerender } = render(<InstallCard {...props} mode="none" />)

      rerender(<InstallCard {...props} mode="card" />)

      expect(document.body).toHaveFocus()
    })
  })
})
