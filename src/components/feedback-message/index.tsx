import React from 'react'

export interface FeedbackMessageProps {
  isError: boolean
  message: string
}

const FeedbackMessage = ({ isError, message }: FeedbackMessageProps): React.ReactNode => (
  <div
    className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
      isError
        ? 'border-red-400/25 bg-red-500/[0.07] text-red-700 dark:text-red-300/85'
        : 'border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300/85'
    }`}
    role="alert"
  >
    <span aria-hidden="true" className="flex-shrink-0 text-base leading-none">
      {isError ? '✕' : '✓'}
    </span>
    <span>{message}</span>
  </div>
)

export default FeedbackMessage
