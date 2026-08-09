// API

export type GameId = string

export interface ConnectionsGame {
  categories: CategoryObject
}

// Categories

export interface Category {
  hint: string
  words: string[]
}

export interface SolvedCategory {
  description: string
  words: string[]
}

export interface CategoryObject {
  [key: string]: Category
}

// Colors

export interface GameColor {
  background: string
}

export interface CategoryColors {
  [key: string]: GameColor
}
