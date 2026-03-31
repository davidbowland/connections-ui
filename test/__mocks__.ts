/* eslint-disable sort-keys */
import { UseConnectionsGameResult } from '@hooks/useConnectionsGame'
import { CategoryObject, ConnectionsGame, GameId } from '@types'

// Connections

export const gameId: GameId = '2025-01-15'

export const categories: CategoryObject = {
  'Category 1': { words: ['WORD01', 'WORD02', 'WORD03', 'WORD04'], hint: 'Hint for category 1' },
  'Category 2': { words: ['WORD05', 'WORD06', 'WORD07', 'WORD08'], hint: 'Hint for category 2' },
  'Category 3': { words: ['WORD09', 'WORD10', 'WORD11', 'WORD12'], hint: 'Hint for category 3' },
  'Category 4': { words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'], hint: 'Hint for category 4' },
}

export const connectionsGame: ConnectionsGame = {
  categories,
}

export const wordList: string[] = [
  'WORD01',
  'WORD02',
  'WORD03',
  'WORD04',
  'WORD05',
  'WORD06',
  'WORD07',
  'WORD08',
  'WORD09',
  'WORD10',
  'WORD11',
  'WORD12',
  'WORD13',
  'WORD14',
  'WORD15',
  'WORD16',
]

// Hooks

export const useConnectionsGameResult: UseConnectionsGameResult = {
  categories,
  categoriesCount: 4,
  clearSelectedWords: jest.fn(),
  errorMessage: null,
  getHint: jest.fn(),
  hints: [],
  hintsUsed: 0,
  incorrectGuesses: 0,
  isHintAvailable: false,
  isLoading: false,
  isOneAway: false,
  isRevealSolutionAvailable: false,
  revealSolution: jest.fn(),
  selectedWords: [],
  selectWord: jest.fn(),
  solvedCategories: [],
  submitWords: jest.fn(),
  unselectWord: jest.fn(),
  words: wordList,
}
