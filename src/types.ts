// API

export type GameId = string

export interface ConnectionsGame {
  categories: CategoryObject
}

// Categories

export interface Category {
  hint: string
  // Word (as it appears in words) -> the web-search phrase for the sense this category uses.
  // Optional because puzzles generated before phrases existed have none.
  searches?: Record<string, string>
  words: string[]
}

export interface SolvedCategory {
  description: string
  searches?: Record<string, string>
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
