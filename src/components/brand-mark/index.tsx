import React from 'react'

export interface BrandMarkProps {
  className?: string
}

export const BrandMark = ({ className }: BrandMarkProps): React.ReactNode => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 100 100">
    <path
      className="stroke-black/90 dark:stroke-white/90"
      d="M28,28 C50,13 50,13 72,28 C87,50 87,50 72,72 C50,87 50,87 28,72 C13,50 13,50 28,28 Z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={7}
    />
    <circle cx="28" cy="28" fill="#ff1d58" r="9" />
    <circle cx="72" cy="28" fill="#00ddff" r="9" />
    <circle cx="72" cy="72" fill="#4caf50" r="9" />
    <circle cx="28" cy="72" fill="#8458B3" r="9" />
  </svg>
)
