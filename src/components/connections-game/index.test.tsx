import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { act } from 'react'

import { ConnectionsGame } from './index'
import { GameSelection } from '@components/game-selection'
import { useConnectionsGame } from '@hooks/useConnectionsGame'
import { gameId, useConnectionsGameResult, wordList } from '@test/__mocks__'

jest.mock('@hooks/useConnectionsGame')
jest.mock('@components/game-selection')

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

  it('displays game grid with words', () => {
    setup()
    expect(screen.getByText('Connections')).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'Reveal solution' })).toBeInTheDocument()
  })

  it('calls revealSolution when reveal solution button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const revealSolution = jest.fn()
    setup({ incorrectGuesses: 4, isRevealSolutionAvailable: true, revealSolution })
    await user.click(screen.getByRole('button', { name: 'Reveal solution' }))
    expect(revealSolution).toHaveBeenCalled()
  })

  it('shows incorrect guess count in stat line', () => {
    setup({ incorrectGuesses: 2 })
    expect(screen.getByText(/2 wrong/)).toBeInTheDocument()
  })

  it('renders GameSelection component', () => {
    setup()
    expect(GameSelection).toHaveBeenCalled()
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
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
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
    expect(screen.queryByRole('button', { name: 'Reveal solution' })).not.toBeInTheDocument()
    act(() => jest.advanceTimersByTime(5000))
    expect(screen.getByRole('button', { name: 'Reveal solution' })).toBeInTheDocument()
  })

  it('hides hint and solution buttons when game is complete', () => {
    setup({ incorrectGuesses: 4, isHintAvailable: true, isRevealSolutionAvailable: true, words: [] })
    expect(screen.queryByRole('button', { name: 'Get hint' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reveal solution' })).not.toBeInTheDocument()
  })

  it('shows hints count in stat line when hints have been used', () => {
    setup({ categoriesCount: 4, hintsUsed: 2 })
    expect(screen.getByText(/2 hints used/)).toBeInTheDocument()
  })

  it('omits hints count from stat line when no hints used', () => {
    setup({ categoriesCount: 4, hintsUsed: 0 })
    expect(screen.queryByText(/hints/)).not.toBeInTheDocument()
  })
})
