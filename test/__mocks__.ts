/* eslint-disable sort-keys */
import { UseConnectionsGameResult } from '@hooks/useConnectionsGame'
import { CategoryObject, ConnectionsGame, GameId, Theme } from '@types'

// Connections

export const gameId: GameId = '2025-01-15'

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
  isOneAway: false,
  isRevealSolutionEnabled: false,
  revealSolution: jest.fn(),
  selectedWords: [],
  selectWord: jest.fn(),
  solvedCategories: [],
  submitWords: jest.fn(),
  unselectWord: jest.fn(),
  words: wordList,
}

// Themes

export const theme: Theme = {
  breakpoints: {
    keys: ['xs', 'sm', 'md', 'lg', 'xl'],
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    unit: 'px',
  },
  direction: 'ltr',
  components: {},
  palette: {
    mode: 'dark',
    common: { black: '#000', white: '#fff' },
    primary: { main: '#90caf9', light: '#e3f2fd', dark: '#42a5f5', contrastText: 'rgba(0, 0, 0, 0.87)' },
    secondary: { main: '#ce93d8', light: '#f3e5f5', dark: '#ab47bc', contrastText: 'rgba(0, 0, 0, 0.87)' },
    error: { main: '#f44336', light: '#e57373', dark: '#d32f2f', contrastText: '#fff' },
    warning: { main: '#ffa726', light: '#ffb74d', dark: '#f57c00', contrastText: 'rgba(0, 0, 0, 0.87)' },
    info: { main: '#29b6f6', light: '#4fc3f7', dark: '#0288d1', contrastText: 'rgba(0, 0, 0, 0.87)' },
    success: { main: '#66bb6a', light: '#81c784', dark: '#388e3c', contrastText: 'rgba(0, 0, 0, 0.87)' },
    grey: {
      '50': '#fafafa',
      '100': '#f5f5f5',
      '200': '#eeeeee',
      '300': '#e0e0e0',
      '400': '#bdbdbd',
      '500': '#9e9e9e',
      '600': '#757575',
      '700': '#616161',
      '800': '#424242',
      '900': '#212121',
      A100: '#f5f5f5',
      A200: '#eeeeee',
      A400: '#bdbdbd',
      A700: '#616161',
    },
    contrastThreshold: 3,
    tonalOffset: 0.2,
    text: {
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
      icon: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    background: { paper: '#121212', default: '#121212' },
    action: {
      active: '#fff',
      hover: 'rgba(255, 255, 255, 0.08)',
      hoverOpacity: 0.08,
      selected: 'rgba(255, 255, 255, 0.16)',
      selectedOpacity: 0.16,
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
      disabledOpacity: 0.38,
      focus: 'rgba(255, 255, 255, 0.12)',
      focusOpacity: 0.12,
      activatedOpacity: 0.24,
    },
  },
  shape: { borderRadius: 4 },
  mixins: {
    toolbar: {
      minHeight: 56,
      '@media (min-width:0px) and (orientation: landscape)': { minHeight: 48 },
      '@media (min-width:600px)': { minHeight: 64 },
    },
  },
} as unknown as Theme
