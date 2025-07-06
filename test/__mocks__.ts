/* eslint-disable sort-keys */
import { UseConnectionsGameResult } from '@hooks/useConnectionsGame'

import { CategoryObject, ConnectionsGame } from '@types'

// Connections

export const gameId = '2024-01-15'

export const categories: CategoryObject = {
  'Category 1': { words: ['WORD01', 'WORD02', 'WORD03', 'WORD04'] },
  'Category 2': { words: ['WORD05', 'WORD06', 'WORD07', 'WORD08'] },
  'Category 3': { words: ['WORD09', 'WORD10', 'WORD11', 'WORD12'] },
  'Category 4': { words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] },
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
  clearSelectedWords: jest.fn(),
  errorMessage: null,
  incorrectGuesses: 0,
  isLoading: false,
  isRevealSolutionEnabled: false,
  revealSolution: jest.fn(),
  selectedWords: [],
  selectWord: jest.fn(),
  solvedCategories: [],
  submitWords: jest.fn(),
  unselectWord: jest.fn(),
  words: wordList,
}
