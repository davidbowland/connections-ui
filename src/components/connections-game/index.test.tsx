import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { act } from 'react'

import { ConnectionsGame } from './index'
import { dedupeKey, useConnectionsGame } from '@hooks/useConnectionsGame'
import { gameId, useConnectionsGameResult, wordList } from '@test/__mocks__'

jest.mock('@hooks/useConnectionsGame')

describe('ConnectionsGame', () => {
  const setup = (overrides: Partial<ReturnType<typeof useConnectionsGame>> = {}) => {
    jest.mocked(useConnectionsGame).mockReturnValue({ ...useConnectionsGameResult, ...overrides })
    return render(<ConnectionsGame gameId={gameId} />)
  }

  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('displays loading state', () => {
    setup({ categories: {}, isLoading: true, words: [] })
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('displays error state', () => {
    const errorMessage = 'Failed to load game'
    setup({ errorMessage })
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
  })

  it('states the whole task in the instructions', () => {
    setup()
    expect(screen.getByText('Find four groups of four words that belong together.')).toBeInTheDocument()
  })

  it('displays game grid with words', () => {
    setup()
    expect(screen.getByText('Common Threads')).toBeInTheDocument()
    wordList.forEach((word) => {
      expect(screen.getByRole('button', { name: word.toUpperCase() })).toBeInTheDocument()
    })
  })

  it('displays solved category with words joined by dot separator', () => {
    setup({
      solvedCategories: [{ description: 'Category 1', words: ['WORD01', 'WORD02', 'WORD03', 'WORD04'] }],
      words: wordList.slice(4),
    })
    expect(screen.getByText('Category 1')).toBeInTheDocument()
    expect(screen.getByText('WORD01 · WORD02 · WORD03 · WORD04')).toBeInTheDocument()
  })

  it('calls selectWord when word tile is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const selectWord = jest.fn()
    setup({ selectWord })
    await user.click(screen.getByRole('button', { name: 'WORD01' }))
    expect(selectWord).toHaveBeenCalledWith('WORD01')
  })

  it('calls unselectWord when selected tile is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const unselectWord = jest.fn()
    setup({ selectedWords: ['WORD01'], unselectWord })
    await user.click(screen.getByRole('button', { name: 'WORD01' }))
    expect(unselectWord).toHaveBeenCalledWith('WORD01')
  })

  it('exposes which tiles are selected', () => {
    setup({ selectedWords: ['WORD01'] })

    expect(screen.getByRole('button', { name: 'WORD01' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'WORD02' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not show submit button with fewer than 4 words selected', () => {
    setup({ selectedWords: ['WORD01', 'WORD02'] })
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
  })

  it('calls submitWords when submit button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const submitWords = jest.fn()
    setup({ selectedWords: ['WORD01', 'WORD02', 'WORD03', 'WORD04'], submitWords })
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(submitWords).toHaveBeenCalled()
  })

  it('calls clearSelectedWords when clear button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const clearSelectedWords = jest.fn()
    setup({ clearSelectedWords, selectedWords: ['WORD01'] })
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(clearSelectedWords).toHaveBeenCalled()
  })

  it('shows reveal solution button when enough wrong guesses', () => {
    setup({ incorrectGuesses: 4, isRevealSolutionAvailable: true })
    expect(screen.getByRole('button', { name: 'Show the answers' })).toBeInTheDocument()
  })

  it('calls revealSolution when reveal solution button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const revealSolution = jest.fn()
    setup({ incorrectGuesses: 4, isRevealSolutionAvailable: true, revealSolution })
    await user.click(screen.getByRole('button', { name: 'Show the answers' }))
    expect(revealSolution).toHaveBeenCalled()
  })

  it('shows incorrect guess count in stat line', () => {
    setup({ incorrectGuesses: 2 })
    expect(screen.getByText(/2 wrong/)).toBeInTheDocument()
  })

  it('shows one away toast 450ms after submitting a one-away guess', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const submitWords = jest.fn().mockReturnValue('one-away')
    setup({ selectedWords: ['WORD01', 'WORD02', 'WORD03', 'WORD04'], submitWords })
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.queryByText('One away')).not.toBeInTheDocument()
    act(() => jest.advanceTimersByTime(500))
    expect(screen.getByText('One away')).toBeInTheDocument()
  })

  it('auto-dismisses one away toast after 4 seconds', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const submitWords = jest.fn().mockReturnValue('one-away')
    setup({ selectedWords: ['WORD01', 'WORD02', 'WORD03', 'WORD04'], submitWords })
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    act(() => jest.advanceTimersByTime(500))
    expect(screen.getByText('One away')).toBeInTheDocument()
    act(() => jest.advanceTimersByTime(4000))
    expect(screen.queryByText('One away')).not.toBeInTheDocument()
  })

  it('does not show toast when submit returns wrong', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const submitWords = jest.fn().mockReturnValue('wrong')
    setup({ selectedWords: ['WORD01', 'WORD02', 'WORD03', 'WORD04'], submitWords })
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    act(() => jest.advanceTimersByTime(500))
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })

  it('shows already tried toast when submitting a duplicate guess', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const submitWords = jest.fn().mockReturnValue('duplicate')
    setup({ selectedWords: ['WORD01', 'WORD02', 'WORD03', 'WORD04'], submitWords })
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    act(() => jest.advanceTimersByTime(500))
    expect(screen.getByText('Already tried')).toBeInTheDocument()
  })

  it('reshows already tried toast on each repeated duplicate submission', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const submitWords = jest.fn().mockReturnValue('duplicate')
    setup({ selectedWords: ['WORD01', 'WORD02', 'WORD03', 'WORD04'], submitWords })

    await user.click(screen.getByRole('button', { name: 'Submit' }))
    act(() => jest.advanceTimersByTime(500))
    expect(screen.getByText('Already tried')).toBeInTheDocument()

    act(() => jest.advanceTimersByTime(4000))
    expect(screen.queryByText('Already tried')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Submit' }))
    act(() => jest.advanceTimersByTime(500))
    expect(screen.getByText('Already tried')).toBeInTheDocument()
  })

  it('shows get hint button when hint is available and threshold reached', () => {
    setup({ incorrectGuesses: 2, isHintAvailable: true })
    expect(screen.getByRole('button', { name: 'Get hint' })).toBeInTheDocument()
  })

  it('does not show get hint button when not available', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Get hint' })).not.toBeInTheDocument()
  })

  it('calls getHint when get hint button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const getHint = jest.fn()
    setup({ getHint, incorrectGuesses: 2, isHintAvailable: true })
    await user.click(screen.getByRole('button', { name: 'Get hint' }))
    expect(getHint).toHaveBeenCalled()
  })

  it('renders hint cards when hints are available', () => {
    setup({ hints: ['Test hint 1', 'Test hint 2'] })
    expect(screen.getByText('Test hint 1')).toBeInTheDocument()
    expect(screen.getByText('Test hint 2')).toBeInTheDocument()
  })

  it('does not render hint section when no hints available', () => {
    setup()
    expect(screen.queryByText(/Test hint/)).not.toBeInTheDocument()
  })

  it('shows timer in stat line', () => {
    setup()
    expect(screen.getByText(/0:00/)).toBeInTheDocument()
  })

  it('increments timer every second', () => {
    setup()
    act(() => jest.advanceTimersByTime(5000))
    expect(screen.getByText(/0:05/)).toBeInTheDocument()
    act(() => jest.advanceTimersByTime(60000))
    expect(screen.getByText(/1:05/)).toBeInTheDocument()
  })

  it('shows get hint button after time threshold', () => {
    jest.mocked(useConnectionsGame).mockReturnValue({ ...useConnectionsGameResult, isHintAvailable: true })
    render(<ConnectionsGame gameId={gameId} secondsUntilHint={2} />)
    expect(screen.queryByRole('button', { name: 'Get hint' })).not.toBeInTheDocument()
    act(() => jest.advanceTimersByTime(5000))
    expect(screen.getByRole('button', { name: 'Get hint' })).toBeInTheDocument()
  })

  it('shows reveal solution button after time threshold', () => {
    jest.mocked(useConnectionsGame).mockReturnValue({ ...useConnectionsGameResult, isRevealSolutionAvailable: true })
    render(<ConnectionsGame gameId={gameId} secondsUntilSolution={2} />)
    expect(screen.queryByRole('button', { name: 'Show the answers' })).not.toBeInTheDocument()
    act(() => jest.advanceTimersByTime(5000))
    expect(screen.getByRole('button', { name: 'Show the answers' })).toBeInTheDocument()
  })

  it('hides hint and solution buttons when game is complete', () => {
    setup({ incorrectGuesses: 4, isHintAvailable: true, isRevealSolutionAvailable: true, words: [] })
    expect(screen.queryByRole('button', { name: 'Get hint' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show the answers' })).not.toBeInTheDocument()
  })

  it('shows hints count in stat line when hints have been used', () => {
    setup({ categoriesCount: 4, hintsUsed: 2 })
    expect(screen.getByText(/2 hints used/)).toBeInTheDocument()
  })

  it('omits hints count from stat line when no hints used', () => {
    setup({ categoriesCount: 4, hintsUsed: 0 })
    expect(screen.queryByText(/hints/)).not.toBeInTheDocument()
  })

  it('renders a row for each one-away guess', () => {
    setup({
      oneAwayGuesses: [
        ['WORD01', 'WORD02', 'WORD03', 'WORD05'],
        ['WORD01', 'WORD02', 'WORD03', 'WORD06'],
      ],
    })

    expect(screen.getByRole('button', { name: 'Select WORD01 WORD02 WORD03 WORD05 again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select WORD01 WORD02 WORD03 WORD06 again' })).toBeInTheDocument()

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('labels the one-away section for screen readers', () => {
    setup({ oneAwayGuesses: [['WORD01', 'WORD02', 'WORD03', 'WORD05']] })

    expect(screen.getByRole('region', { name: 'Guesses that were one away' })).toBeInTheDocument()
    expect(screen.getByText('Tap a row to select those words again.')).toBeInTheDocument()
  })

  it('hides the one-away section when no guess was one away', () => {
    setup({ oneAwayGuesses: [] })

    expect(screen.queryByRole('region', { name: 'Guesses that were one away' })).not.toBeInTheDocument()
  })

  it('scrolls the board into view when a one-away row is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    setup({ oneAwayGuesses: [['WORD01', 'WORD02', 'WORD03', 'WORD05']] })

    await user.click(screen.getByRole('button', { name: 'Select WORD01 WORD02 WORD03 WORD05 again' }))
    act(() => jest.advanceTimersByTime(100))

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('selects the words again when a one-away row is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const selectWords = jest.fn()
    setup({ oneAwayGuesses: [['WORD01', 'WORD02', 'WORD03', 'WORD05']], selectWords })

    await user.click(screen.getByRole('button', { name: 'Select WORD01 WORD02 WORD03 WORD05 again' }))

    expect(selectWords).toHaveBeenCalledWith(['WORD01', 'WORD02', 'WORD03', 'WORD05'])
  })

  const REPEAT = ['WORD01', 'WORD02', 'WORD03', 'WORD05']

  it('warns that a repeated selection was one away', () => {
    setup({
      isSelectionSubmitted: false,
      oneAwayGuesses: [REPEAT],
      pastGuesses: new Set([dedupeKey(REPEAT)]),
      selectedWords: REPEAT,
    })

    expect(screen.getByText('You already tried this — it was one away.')).toBeInTheDocument()
  })

  it('warns that a repeated selection was already tried', () => {
    setup({
      isSelectionSubmitted: false,
      oneAwayGuesses: [],
      pastGuesses: new Set([dedupeKey(REPEAT)]),
      selectedWords: REPEAT,
    })

    expect(screen.getByText('You already tried this.')).toBeInTheDocument()
  })

  it('does not warn about the guess that was just submitted', () => {
    setup({
      isSelectionSubmitted: true,
      oneAwayGuesses: [REPEAT],
      pastGuesses: new Set([dedupeKey(REPEAT)]),
      selectedWords: REPEAT,
    })

    expect(screen.queryByText('You already tried this — it was one away.')).not.toBeInTheDocument()
    expect(screen.queryByText('You already tried this.')).not.toBeInTheDocument()
  })

  it('does not warn about a fresh selection', () => {
    setup({
      isSelectionSubmitted: false,
      oneAwayGuesses: [],
      pastGuesses: new Set<string>(),
      selectedWords: REPEAT,
    })

    expect(screen.queryByText('You already tried this.')).not.toBeInTheDocument()
    expect(screen.queryByText('You already tried this — it was one away.')).not.toBeInTheDocument()
  })

  it('does not warn about an incomplete selection', () => {
    setup({
      isSelectionSubmitted: false,
      oneAwayGuesses: [REPEAT],
      pastGuesses: new Set([dedupeKey(REPEAT)]),
      selectedWords: ['WORD01', 'WORD02', 'WORD03'],
    })

    expect(screen.queryByText('You already tried this — it was one away.')).not.toBeInTheDocument()
  })

  it('keeps submit enabled while the guard line is shown', () => {
    setup({
      isSelectionSubmitted: false,
      oneAwayGuesses: [REPEAT],
      pastGuesses: new Set([dedupeKey(REPEAT)]),
      selectedWords: REPEAT,
    })

    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
  })

  it('reserves an empty guard line slot for a fresh four-word selection', () => {
    setup({
      isSelectionSubmitted: false,
      oneAwayGuesses: [],
      pastGuesses: new Set<string>(),
      selectedWords: ['WORD01', 'WORD02', 'WORD03', 'WORD04'],
    })

    expect(screen.queryByText('You already tried this.')).not.toBeInTheDocument()
    expect(screen.queryByText('You already tried this — it was one away.')).not.toBeInTheDocument()
    expect(screen.getByTestId('guard-line')).toBeEmptyDOMElement()
  })

  it('reserves the guard line slot as soon as one word is selected', () => {
    setup({
      isSelectionSubmitted: false,
      oneAwayGuesses: [],
      pastGuesses: new Set<string>(),
      selectedWords: ['WORD01'],
    })

    expect(screen.getByTestId('guard-line')).toBeEmptyDOMElement()
  })

  it('renders no guard line slot when nothing is selected', () => {
    setup({
      isSelectionSubmitted: false,
      oneAwayGuesses: [],
      pastGuesses: new Set<string>(),
      selectedWords: [],
    })

    expect(screen.queryByTestId('guard-line')).toBeNull()
  })

  it('announces the guard line politely', () => {
    setup({
      isSelectionSubmitted: false,
      oneAwayGuesses: [REPEAT],
      pastGuesses: new Set([dedupeKey(REPEAT)]),
      selectedWords: REPEAT,
    })

    expect(screen.getByRole('status')).toHaveTextContent('You already tried this — it was one away.')
  })

  it('keeps the one-away list below the action buttons so submit never moves', () => {
    setup({
      oneAwayGuesses: [REPEAT],
      selectedWords: REPEAT,
    })

    const list = screen.getByRole('region', { name: 'Guesses that were one away' })
    const submit = screen.getByRole('button', { name: 'Submit' })

    expect(submit.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
