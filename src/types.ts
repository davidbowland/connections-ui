export { Theme } from '@mui/material/styles'

// Connections

export interface Category {
  words: string[]
}

export interface CategoryObject {
  [key: string]: Category
}

export interface ConnectionsGame {
  categories: CategoryObject
}
