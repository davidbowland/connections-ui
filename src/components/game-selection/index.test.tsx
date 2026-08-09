// jest-dom is imported per test file, never globally -- jest.setup-test-env.js does
// not register it. Omitting this fails every toBeInTheDocument assertion.
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/router'
import React from 'react'

import { GameSelection } from './index'
import { UseInstallPromptResult, useInstallPrompt } from '@hooks/useInstallPrompt'
import { useOnline } from '@hooks/useOnline'
import * as storage from '@services/storage'
import { connectionsGame } from '@test/__mocks__'
import { GameId } from '@types'

jest.mock('@hooks/useInstallPrompt')
jest.mock('@hooks/useOnline')
jest.mock('@services/storage')
jest.mock('next/router', () => ({ useRouter: jest.fn() }))

describe('GameSelection', () => {
  // 2026-08-08T21:30:00Z, and TZ=UTC on the jest invocation, so allGameIds() always
  // yields the same 585 days.
  const now = () => 1_786_224_600_000
  // The same clock one day earlier, for the puzzle that is on screen when an installed
  // app is put down at night and picked up the next morning.
  const yesterday = () => 1_786_138_200_000
  const today: GameId = '2026-08-08'
  const ARCHIVE_LENGTH = 585
  const AUGUST_2026_LENGTH = 8

  const mockPush = jest.fn()
  const mockReload = jest.fn()
  const mockDismiss = jest.fn()
  const mockInstall = jest.fn()
  const mockReopen = jest.fn()

  // The real module, reached past the automock, so a test can make the write the app
  // makes and let it announce itself the way it does in a browser.
  const realStorage = jest.requireActual<typeof storage>('@services/storage')

  interface SetupOptions {
    install?: Partial<UseInstallPromptResult>
    isOnline?: boolean
    onDevice?: GameId[]
    solved?: GameId[]
  }

  // Every test calls this. clearMocks is mockClear, which leaves mockReturnValue in
  // place, so a value set inside one test would otherwise leak into the next.
  const setup = ({ install, isOnline = true, onDevice, solved }: SetupOptions = {}): void => {
    jest.mocked(useRouter).mockReturnValue({ push: mockPush, reload: mockReload } as any)
    jest.mocked(useOnline).mockReturnValue(isOnline)
    jest.mocked(useInstallPrompt).mockReturnValue({
      dismiss: mockDismiss,
      install: mockInstall,
      mode: 'none',
      platform: 'desktop',
      reopen: mockReopen,
      ...install,
    })
    jest.mocked(storage).cachedGameIds.mockReturnValue(onDevice ?? ['2026-08-08', '2026-08-07'])
    jest.mocked(storage).readMeta.mockReturnValue({ installDismissed: true, solved: solved ?? [], v: 1 })
  }

  // locale is pinned so the assertions do not depend on the machine's language.
  const renderRegion = (gameId: GameId = today) => render(<GameSelection gameId={gameId} locale="en-US" now={now} />)

  const openArchive = async (user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> => {
    await user.click(screen.getByRole('button', { name: 'See every puzzle' }))
    return screen.getByRole('group', { name: 'Every puzzle, newest first' })
  }

  describe('static export', () => {
    interface FirstRender {
      html: string
      storageReads: number
    }

    // next.config.js sets output: 'export', so this component is rendered in Node at
    // build time and that render is the HTML every visitor downloads. Layout effects
    // commit before passive effects, so a sibling probe sees the DOM exactly as the
    // first render left it -- before the useEffect that fetches the date has run.
    const Probe = ({ onCommit }: { onCommit: () => void }): null => {
      // Empty deps on purpose: this must fire once, on the first commit, never again.
      React.useLayoutEffect(onCommit, [])
      return null
    }

    const captureFirstRender = (): FirstRender => {
      const captured: FirstRender = { html: '', storageReads: 0 }
      const record = () => {
        captured.html = document.body.innerHTML
        captured.storageReads =
          jest.mocked(storage).cachedGameIds.mock.calls.length + jest.mocked(storage).readMeta.mock.calls.length
      }

      render(
        <>
          <GameSelection gameId={today} locale="en-US" now={now} />
          <Probe onCommit={record} />
        </>,
      )
      return captured
    }

    it('bakes no date into the markup the build would export', () => {
      setup()

      const { html } = captureFirstRender()

      // Anchor on something positive first: the placeholder really did render.
      expect(html).toContain('aria-hidden="true"')
      expect(html).not.toMatch(/20\d\d/)
      expect(html).not.toContain('August')
      expect(html).not.toContain('puzzle')
    })

    it('reads no browser storage before the browser is there', () => {
      setup()

      expect(captureFirstRender().storageReads).toBe(0)
    })

    it('fills in the dates once the browser has mounted it', () => {
      setup()

      renderRegion()

      expect(screen.getByRole('button', { name: 'Play August 7, 2026' })).toBeInTheDocument()
      expect(storage.cachedGameIds).toHaveBeenCalled()
    })
  })

  describe('recommendation', () => {
    it('offers the most recent puzzle that is not the one on screen', () => {
      setup()

      renderRegion()

      expect(screen.getByRole('button', { name: 'Play August 7, 2026' })).toBeInTheDocument()
    })

    // Both pages resolve their gameId in an effect. Painting before it arrives prints
    // one recommendation and relabels it a frame later, and says "apart from this one"
    // about a board that is still loading.
    it('waits for the puzzle on screen instead of naming one it would replace', () => {
      setup()

      const { rerender } = render(<GameSelection locale="en-US" now={now} />)

      expect(screen.queryByRole('button', { name: /^Play / })).not.toBeInTheDocument()

      rerender(<GameSelection gameId={today} locale="en-US" now={now} />)

      expect(screen.getByRole('button', { name: 'Play August 7, 2026' })).toBeInTheDocument()
    })

    it('walks back past solved puzzles', () => {
      setup({ solved: ['2026-08-07', '2026-08-06'] })

      renderRegion()

      expect(screen.getByRole('button', { name: 'Play August 5, 2026' })).toBeInTheDocument()
    })

    it('routes to the puzzle it offered', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await user.click(screen.getByRole('button', { name: 'Play August 7, 2026' }))

      expect(mockPush).toHaveBeenCalledWith('/g/2026-08-07')
    })

    it('heads the region with what it is offering', () => {
      setup()

      renderRegion()

      expect(screen.getByRole('heading', { level: 2, name: 'Up next' })).toBeInTheDocument()
    })

    it('explains the recommendation without contradicting the page it is on', () => {
      setup()

      renderRegion()

      expect(screen.getByText('The most recent puzzle you haven’t solved, apart from this one.')).toBeInTheDocument()
    })
  })

  describe('everything solved', () => {
    const everyDay = (): GameId[] => {
      const ids: GameId[] = []
      for (
        const cursor = new Date(Date.UTC(2026, 7, 8));
        ids.length < ARCHIVE_LENGTH;
        cursor.setUTCDate(cursor.getUTCDate() - 1)
      ) {
        ids.push(cursor.toISOString().split('T')[0])
      }
      return ids
    }

    it('offers a reshuffle rather than refusing, online', () => {
      setup({ solved: everyDay() })

      renderRegion()

      expect(screen.getByRole('heading', { level: 2, name: 'All caught up' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Play August 7, 2026 again' })).toBeInTheDocument()
      expect(screen.getByText('You’ve solved all 585 puzzles. Same words, new order.')).toBeInTheDocument()
    })

    it('offers a reshuffle of what is here when offline', () => {
      setup({ isOnline: false, onDevice: ['2026-08-07'], solved: ['2026-08-07'] })

      renderRegion()

      expect(screen.getByRole('button', { name: 'Play August 7, 2026 again' })).toBeInTheDocument()
      expect(screen.getByText('You’ve solved every puzzle on this device. Same words, new order.')).toBeInTheDocument()
    })
  })

  // Reachable without solving anything: not installed, today opened while online, then
  // the connection drops. The pool is then exactly the puzzle on screen, and offering
  // it back is legitimate -- the board reshuffles on load. What is not legitimate is
  // routing to the URL already in the address bar, or explaining the offer with a
  // sentence about having solved things.
  describe('replaying the only puzzle there is', () => {
    const soleCandidate = { isOnline: false, onDevice: [today], solved: [] }

    it('reloads instead of pushing the route it is already on', async () => {
      const user = userEvent.setup()
      setup(soleCandidate)

      renderRegion()
      await user.click(screen.getByRole('button', { name: 'Play August 8, 2026 again' }))

      // push here is not merely redundant: pages/g/[gameId] keys its load on
      // router.asPath, so the same path refetches nothing and reshuffles nothing.
      expect(mockReload).toHaveBeenCalledTimes(1)
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('does not claim a clean sweep when nothing has been solved', () => {
      setup(soleCandidate)

      renderRegion()

      expect(screen.getByText('This is the only puzzle on this device. Same words, new order.')).toBeInTheDocument()
      expect(screen.queryByText(/You’ve solved/)).not.toBeInTheDocument()
    })

    // The other replay branch still has to say what it always said: there, everything
    // really has been solved and the offer is a genuine second pass.
    it('still says so when the sweep is real', () => {
      setup({ isOnline: false, onDevice: [today, '2026-08-07'], solved: [today, '2026-08-07'] })

      renderRegion()

      expect(screen.getByRole('button', { name: 'Play August 7, 2026 again' })).toBeInTheDocument()
      expect(screen.getByText('You’ve solved every puzzle on this device. Same words, new order.')).toBeInTheDocument()
    })
  })

  describe('nothing playable', () => {
    it('says so rather than naming a puzzle it cannot open', () => {
      setup({ isOnline: false, onDevice: [] })

      renderRegion()

      expect(
        screen.getByText('Nothing is on this device yet. Open a puzzle while you’re online and it stays.'),
      ).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Nothing on this device' })).toBeInTheDocument()
    })

    it('offers no call to action it could not honour', () => {
      setup({ isOnline: false, onDevice: [] })

      renderRegion()

      expect(screen.getByRole('heading', { level: 2, name: 'Nothing on this device' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Play / })).not.toBeInTheDocument()
    })
  })

  describe('on-device count', () => {
    it('reports how many puzzles are on the device', () => {
      setup()

      renderRegion()

      expect(screen.getByText('2 puzzles on this device')).toBeInTheDocument()
    })

    it('says puzzle, not puzzles, when there is one', () => {
      setup({ onDevice: ['2026-08-08'] })

      renderRegion()

      expect(screen.getByText('1 puzzle on this device')).toBeInTheDocument()
    })

    it('does not announce the inventory while online', () => {
      setup()

      renderRegion()

      expect(screen.getByText('2 puzzles on this device')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })

    // West of UTC the prefetch stores tomorrow's puzzle deliberately, hours before the
    // local date reaches it, and the archive stops at the local today. Constructed
    // rather than provoked with a clock: package.json pins TZ=UTC, the one zone where
    // the two dates never disagree.
    it('does not count a staged puzzle the archive does not list yet', () => {
      setup({ onDevice: ['2026-08-09', today] })

      renderRegion()

      expect(screen.getByText('1 puzzle on this device')).toBeInTheDocument()
    })

    it('leaves it out of the offline count as well', () => {
      setup({ isOnline: false, onDevice: ['2026-08-09', today] })

      renderRegion()

      expect(screen.getByRole('status')).toHaveTextContent('You’re offline · 1 puzzle on this device')
    })

    it('leaves it out of the offline archive summary as well', async () => {
      const user = userEvent.setup()
      setup({ isOnline: false, onDevice: ['2026-08-09', today] })

      renderRegion()
      await openArchive(user)

      expect(
        screen.getByText(
          'You haven’t solved any of these yet. 1 of them is on this device — the rest need a connection.',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('offline', () => {
    it('says it is offline without raising an alarm', () => {
      setup({ isOnline: false })

      renderRegion()

      expect(screen.getByRole('status')).toHaveTextContent('You’re offline · 2 puzzles on this device')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    // A live region is only announced when text changes inside a region the screen
    // reader is already watching. Swapping the element in with its message already in
    // place is what NVDA and JAWS miss, so the node has to survive the transition.
    it('fills the live region it already had rather than inserting one', () => {
      setup()

      const { rerender } = renderRegion()
      const status = screen.getByRole('status')

      expect(status).toBeEmptyDOMElement()

      jest.mocked(useOnline).mockReturnValue(false)
      rerender(<GameSelection gameId={today} locale="en-US" now={now} />)

      expect(status).toHaveTextContent('You’re offline · 2 puzzles on this device')
      expect(screen.getByRole('status')).toBe(status)
    })

    it('guards the plural on the offline count too', () => {
      setup({ isOnline: false, onDevice: ['2026-08-07'] })

      renderRegion()

      expect(screen.getByRole('status')).toHaveTextContent('You’re offline · 1 puzzle on this device')
    })

    it('restricts the recommendation to what is on the device', () => {
      setup({ isOnline: false, onDevice: ['2026-08-08', '2026-08-04'] })

      renderRegion()

      expect(screen.getByRole('button', { name: 'Play August 4, 2026' })).toBeInTheDocument()
    })

    it('says the recommendation came from this device', () => {
      setup({ isOnline: false })

      renderRegion()

      expect(
        screen.getByText('The most recent puzzle on this device you haven’t solved, apart from this one.'),
      ).toBeInTheDocument()
    })
  })

  describe('seven-day strip', () => {
    it('shows the last seven days as a receipt', () => {
      setup()

      renderRegion()
      const strip = screen.getByRole('group', { name: 'Last 7 days' })

      expect(within(strip).getAllByRole('button')).toHaveLength(7)
      expect(within(strip).getByText('8/2/2026')).toBeInTheDocument()
    })

    it('marks what is on the device and what is solved', () => {
      setup({ solved: ['2026-08-08'] })

      renderRegion()
      const strip = screen.getByRole('group', { name: 'Last 7 days' })

      expect(within(strip).getByRole('button', { name: '8/8/2026, Today — ✓ Solved, On device' })).toBeInTheDocument()
    })

    it('keeps every strip row reachable by Tab', () => {
      setup()

      renderRegion()
      const strip = screen.getByRole('group', { name: 'Last 7 days' })

      expect(
        within(strip)
          .getAllByRole('button')
          .filter((row) => row.tabIndex === -1),
      ).toHaveLength(0)
    })

    it('routes from a strip row', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      const strip = screen.getByRole('group', { name: 'Last 7 days' })
      await user.click(within(strip).getByText('8/3/2026'))

      expect(mockPush).toHaveBeenCalledWith('/g/2026-08-03')
    })
  })

  describe('archive', () => {
    it('keeps the full archive behind a disclosure', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()

      expect(screen.getByRole('button', { name: 'See every puzzle' })).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('group', { name: 'Every puzzle, newest first' })).not.toBeInTheDocument()

      const archive = await openArchive(user)

      expect(archive).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'See every puzzle' })).toHaveAttribute('aria-expanded', 'true')
    })

    it('lists every day back to the first puzzle', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      const archive = await openArchive(user)

      expect(within(archive).getAllByRole('button')).toHaveLength(ARCHIVE_LENGTH)
      expect(within(archive).getByText('1/1/2025')).toBeInTheDocument()
    })

    it('sections the rows by month', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      const archive = await openArchive(user)

      expect(within(archive).getByRole('heading', { level: 3, name: 'August 2026' })).toBeInTheDocument()
      expect(within(archive).getByRole('heading', { level: 3, name: 'January 2025' })).toBeInTheDocument()
      expect(within(archive).getAllByRole('heading', { level: 3 })).toHaveLength(20)
    })

    // Buttons loose in a box give a screen reader nothing to count. A list per month
    // announces "3 of 31", which is the only position information on offer here.
    it('presents each month as a list of rows', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      const archive = await openArchive(user)
      const august = within(archive).getByRole('list', { name: 'August 2026' })

      expect(within(archive).getAllByRole('list')).toHaveLength(20)
      expect(within(august).getAllByRole('listitem')).toHaveLength(AUGUST_2026_LENGTH)
    })

    it('counts solved puzzles rather than days', async () => {
      const user = userEvent.setup()
      setup({ solved: ['2026-08-07'] })

      renderRegion()
      await openArchive(user)

      expect(screen.getByText('You’ve solved 1 of 585 puzzles.')).toBeInTheDocument()
    })

    it('does not read as a rebuke before anything is solved', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openArchive(user)

      expect(screen.getByText('You haven’t solved any of these yet.')).toBeInTheDocument()
    })

    it('ignores a solved day the archive does not list', async () => {
      const user = userEvent.setup()
      setup({ solved: ['2024-12-31'] })

      renderRegion()
      await openArchive(user)

      expect(screen.getByText('You haven’t solved any of these yet.')).toBeInTheDocument()
    })

    it('names how much of the archive is reachable offline', async () => {
      const user = userEvent.setup()
      setup({ isOnline: false })

      renderRegion()
      await openArchive(user)

      expect(
        screen.getByText(
          'You haven’t solved any of these yet. 2 of them are on this device — the rest need a connection.',
        ),
      ).toBeInTheDocument()
    })

    it('guards the singular on the offline suffix', async () => {
      const user = userEvent.setup()
      setup({ isOnline: false, onDevice: ['2026-08-07'] })

      renderRegion()
      await openArchive(user)

      expect(
        screen.getByText(
          'You haven’t solved any of these yet. 1 of them is on this device — the rest need a connection.',
        ),
      ).toBeInTheDocument()
    })

    it('routes from an archive row', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      const archive = await openArchive(user)
      await user.click(within(archive).getByText('1/1/2025'))

      expect(mockPush).toHaveBeenCalledWith('/g/2025-01-01')
    })

    it('closes again', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openArchive(user)
      await user.click(screen.getByRole('button', { name: 'See every puzzle' }))

      expect(screen.queryByRole('group', { name: 'Every puzzle, newest first' })).not.toBeInTheDocument()
    })
  })

  describe('archive keyboard navigation', () => {
    // Two stops from the disclosure: the month select, then the rows. If the rows ever
    // cost more than one, this walk lands somewhere else and every test below fails.
    const openAndTabToRows = async (user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> => {
      const archive = await openArchive(user)
      await user.tab()
      await user.tab()
      return archive
    }

    it('gives the rows exactly one tab stop, on a row', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      const archive = await openArchive(user)
      const rows = within(archive).getAllByRole('button')

      expect(rows.filter((row) => row.tabIndex === 0)).toHaveLength(1)
      expect(rows.filter((row) => row.tabIndex === -1)).toHaveLength(ARCHIVE_LENGTH - 1)
      expect(archive).not.toHaveAttribute('tabindex')
    })

    it('puts Tab on the newest row rather than on the box around it', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      const archive = await openArchive(user)
      await user.tab()

      expect(document.activeElement).toBe(screen.getByLabelText('Jump to month'))

      await user.tab()

      expect(document.activeElement).toBe(within(archive).getAllByRole('button')[0])
      expect(document.activeElement).toHaveTextContent('8/8/2026')
    })

    it('walks down the rows with the down arrow', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openAndTabToRows(user)
      await user.keyboard('{ArrowDown}')

      expect(document.activeElement).toHaveTextContent('8/7/2026')

      await user.keyboard('{ArrowDown}')

      expect(document.activeElement).toHaveTextContent('8/6/2026')
    })

    it('takes the tab stop with it', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      const archive = await openAndTabToRows(user)
      await user.keyboard('{ArrowDown}')
      const rows = within(archive).getAllByRole('button')

      expect(rows.filter((row) => row.tabIndex === 0)).toHaveLength(1)
      expect(rows[1].tabIndex).toBe(0)
      expect(rows[0].tabIndex).toBe(-1)
    })

    it('walks back up and stops at the top', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openAndTabToRows(user)
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{ArrowUp}{ArrowUp}')

      expect(document.activeElement).toHaveTextContent('8/8/2026')
    })

    it('jumps to the oldest puzzle with End and back with Home', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openAndTabToRows(user)
      await user.keyboard('{End}')

      expect(document.activeElement).toHaveTextContent('1/1/2025')

      await user.keyboard('{Home}')

      expect(document.activeElement).toHaveTextContent('8/8/2026')
    })

    it('leaves other keys to the browser', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openAndTabToRows(user)
      await user.keyboard('{PageDown}')

      expect(document.activeElement).toHaveTextContent('8/8/2026')
    })

    it('opens the focused row', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openAndTabToRows(user)
      await user.keyboard('{ArrowDown}{Enter}')

      expect(mockPush).toHaveBeenCalledWith('/g/2026-08-07')
    })
  })

  describe('jump to month', () => {
    it('moves to the first puzzle of the month it names', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openArchive(user)
      await user.selectOptions(screen.getByLabelText('Jump to month'), '2025-03')

      expect(document.activeElement).toHaveTextContent('3/31/2025')
    })

    it('hands the tab stop to the row it jumped to', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      const archive = await openArchive(user)
      await user.selectOptions(screen.getByLabelText('Jump to month'), '2025-03')
      const rows = within(archive).getAllByRole('button')

      expect(rows.filter((row) => row.tabIndex === 0)).toHaveLength(1)
      expect(rows.find((row) => row.tabIndex === 0)).toHaveTextContent('3/31/2025')
    })

    it('offers one option per month', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openArchive(user)

      expect(within(screen.getByLabelText('Jump to month')).getAllByRole('option')).toHaveLength(21)
    })

    it('does nothing when the blank option is chosen', async () => {
      const user = userEvent.setup()
      setup()

      renderRegion()
      await openArchive(user)
      const select = screen.getByLabelText('Jump to month')
      await user.selectOptions(select, '2025-03')

      expect(document.activeElement).toHaveTextContent('3/31/2025')

      await user.selectOptions(select, '')

      expect(document.activeElement).toBe(select)
    })
  })

  describe('install offer', () => {
    it('renders the card the hook asks for', () => {
      setup({ install: { mode: 'card' } })

      renderRegion()

      expect(screen.getByRole('heading', { level: 3, name: 'Take the week with you' })).toBeInTheDocument()
    })

    // The single mode exists so a consumer cannot drop the collapsed link. On iOS it
    // is the only remaining route to installing after a dismissal.
    it('keeps the collapsed link after a dismissal', () => {
      setup({ install: { mode: 'link' } })

      renderRegion()

      expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()
    })

    it('shows nothing when there is nothing to offer', () => {
      setup({ install: { mode: 'none' } })

      renderRegion()

      expect(screen.getByRole('heading', { level: 2, name: 'Up next' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
    })
  })

  describe('recomputation', () => {
    // The count comes from the snapshot and nothing else, so it moves only if the
    // device was read a second time. The recommendation does not: gameId reaches it as
    // a prop, which is how the old version of this test passed without any re-read.
    it('re-reads the device when the route changes', () => {
      setup()

      const { rerender } = renderRegion()

      expect(screen.getByText('2 puzzles on this device')).toBeInTheDocument()

      jest.mocked(storage).cachedGameIds.mockReturnValue(['2026-08-08', '2026-08-07', '2026-08-06'])
      rerender(<GameSelection gameId="2026-08-06" locale="en-US" now={now} />)

      expect(screen.getByText('3 puzzles on this device')).toBeInTheDocument()
      expect(storage.cachedGameIds).toHaveBeenCalledTimes(2)
    })

    // The reproduction that made this a blocker: a cold start writes nothing, the
    // background fill lands seven puzzles, then the connection drops. Reading the
    // device only on mount and on navigation left the region refusing to play with
    // seven playable puzzles on it.
    it('offers what arrived after the first read when the connection drops', () => {
      setup({ onDevice: [] })

      const { rerender } = renderRegion()

      expect(screen.getByText('0 puzzles on this device')).toBeInTheDocument()

      jest
        .mocked(storage)
        .cachedGameIds.mockReturnValue([
          '2026-08-08',
          '2026-08-07',
          '2026-08-06',
          '2026-08-05',
          '2026-08-04',
          '2026-08-03',
          '2026-08-02',
        ])
      jest.mocked(useOnline).mockReturnValue(false)
      rerender(<GameSelection gameId={today} locale="en-US" now={now} />)

      expect(screen.getByRole('heading', { level: 2, name: 'Up next' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Play August 7, 2026' })).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('You’re offline · 7 puzzles on this device')
    })

    it('re-reads the device when the connection comes back', () => {
      setup({ onDevice: [] })

      renderRegion()

      expect(screen.getByText('0 puzzles on this device')).toBeInTheDocument()

      jest.mocked(storage).cachedGameIds.mockReturnValue(['2026-08-08'])
      fireEvent(window, new Event('online'))

      expect(screen.getByText('1 puzzle on this device')).toBeInTheDocument()
    })

    it('re-reads the device after an install fills it', () => {
      setup({ onDevice: [] })

      renderRegion()

      jest.mocked(storage).cachedGameIds.mockReturnValue(['2026-08-08', '2026-08-07'])
      fireEvent(window, new Event('appinstalled'))

      expect(screen.getByText('2 puzzles on this device')).toBeInTheDocument()
    })

    // Nothing above fires when this tab writes to storage -- the native storage event
    // is for other tabs. These two go through the real writers so the announcement is
    // the app's own, not a hand-dispatched stand-in.
    it('re-reads the device when the prefetch stores a puzzle', () => {
      setup({ onDevice: [] })
      window.localStorage.clear()
      // Set after setup, which fixes a return value; a mockImplementation set here is
      // overwritten by the next test's setup, so nothing leaks.
      jest.mocked(storage).cachedGameIds.mockImplementation(realStorage.cachedGameIds)

      renderRegion()

      expect(screen.getByText('0 puzzles on this device')).toBeInTheDocument()

      act(() => realStorage.writeGame(today, connectionsGame))

      expect(screen.getByText('1 puzzle on this device')).toBeInTheDocument()
    })

    it('marks the row solved as soon as the board records the win', () => {
      setup()
      window.localStorage.clear()
      jest.mocked(storage).readMeta.mockImplementation(realStorage.readMeta)

      renderRegion()
      const strip = screen.getByRole('group', { name: 'Last 7 days' })

      expect(within(strip).getByRole('button', { name: '8/8/2026, Today — Not solved, On device' })).toBeInTheDocument()

      act(() => realStorage.markSolved(today))

      expect(within(strip).getByRole('button', { name: '8/8/2026, Today — ✓ Solved, On device' })).toBeInTheDocument()
    })

    // An installed app resumed the next morning keeps the same JS context, so a clock
    // read once at mount leaves yesterday wearing the Today tag and today's puzzle
    // missing from the archive altogether.
    it('crosses midnight when the app is picked up again', () => {
      setup()
      let currentTime = yesterday()

      render(<GameSelection gameId="2026-08-07" locale="en-US" now={() => currentTime} />)
      const strip = screen.getByRole('group', { name: 'Last 7 days' })

      expect(within(strip).getByRole('button', { name: '8/7/2026, Today — Not solved, On device' })).toBeInTheDocument()
      expect(within(strip).queryByRole('button', { name: /^8\/8\/2026/ })).not.toBeInTheDocument()

      currentTime = now()
      fireEvent(document, new Event('visibilitychange'))

      expect(within(strip).getByRole('button', { name: '8/8/2026, Today — Not solved, On device' })).toBeInTheDocument()
      expect(within(strip).getByRole('button', { name: '8/7/2026 — Not solved, On device' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Play August 8, 2026' })).toBeInTheDocument()
    })
  })

  describe('locale', () => {
    it('falls back to the browser language when none is given', () => {
      setup()

      render(<GameSelection gameId={today} now={now} />)

      expect(screen.getByRole('button', { name: 'Play August 7, 2026' })).toBeInTheDocument()
    })

    // Node 24 always defines globalThis.navigator, so this is not the export build --
    // it is the guard that keeps one from throwing on any runtime that omits it.
    it('falls back to en-US where there is no navigator at all', () => {
      setup()
      const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator')!
      Object.defineProperty(globalThis, 'navigator', { configurable: true, value: undefined })

      render(<GameSelection gameId={today} now={now} />)
      Object.defineProperty(globalThis, 'navigator', original)

      expect(screen.getByRole('button', { name: 'Play August 7, 2026' })).toBeInTheDocument()
    })

    it('defaults to the system clock when no clock is injected', () => {
      setup({ onDevice: [] })

      render(<GameSelection gameId={today} locale="en-US" />)

      expect(screen.getByRole('heading', { level: 2, name: 'Up next' })).toBeInTheDocument()
    })
  })
})
