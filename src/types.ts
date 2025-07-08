export { Theme } from '@mui/material/styles'

// API

export type GameId = string

export interface ConnectionsGame {
  categories: CategoryObject
}

export interface GameIdsResponse {
  gameIds: GameId[]
}

// Categories

export interface Category {
  hint: string
  words: string[]
}

export interface CategoryObject {
  [key: string]: Category
}

export interface SolvedCategory {
  description: string
  words: string[]
}

// Colors

export interface GameColor {
  background: string
  text: string
}

export interface CategoryColors {
  [key: string]: GameColor
}
