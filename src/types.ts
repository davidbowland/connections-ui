export { Theme } from '@mui/material/styles'

// Connections

export interface Category {
  words: string[]
}

export interface SolvedCategory {
  description: string
  words: string[]
}

export interface CategoryObject {
  [key: string]: Category
}

export interface ConnectionsGame {
  categories: CategoryObject
}

export interface GameColor {
  background: string
  text: string
}

export interface CategoryColors {
  [key: string]: GameColor
}
