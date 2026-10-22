import React from 'react'

// A link-out mark: an arrow leaving its corner, drawn in the link's own ink. Hidden from the name,
// which already says where the link goes. Drawn rather than typed because a font's "↗" changes
// weight, size and baseline from one system face to the next. Adapted from lull-ui's ExternalMark,
// with a size prop so it can sit beside the solved card's 12px words at 10.
export const ExternalMark = ({ size = 12 }: { size?: number }): React.ReactNode => (
  <svg
    aria-hidden="true"
    className="shrink-0"
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.75"
    viewBox="0 0 16 16"
    width={size}
  >
    <path d="M6 4h6v6M12 4 4 12" />
  </svg>
)
