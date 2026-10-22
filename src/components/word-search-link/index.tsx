import React from 'react'

import { ExternalMark } from '@components/external-mark'

export interface WordSearchLinkProps {
  phrase: string
  word: string
}

// A cached puzzle is only as trustworthy as the localStorage it sits in. encodeURIComponent throws
// URIError on a lone surrogate, and a throw during render takes the whole board down, so the string
// is made well-formed first. String.prototype.toWellFormed does exactly this, but it is ES2024 and
// the TS lib here is ES2023, so the regex says it instead: a high surrogate with no low one after
// it, or a low surrogate with no high one before it, becomes U+FFFD.
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g

export const searchUrl = (phrase: string): string =>
  'https://www.duckduckgo.com/?q=' + encodeURIComponent(phrase.replace(LONE_SURROGATE, '\uFFFD'))

/**
 * One word on a solved card, as a plain link that searches DuckDuckGo for the sense the category
 * meant, in a new tab. A real anchor with no click handler: nothing is requested until the tap,
 * and the browser owns what happens after it.
 *
 * The text keeps the card's ink, which solvedCardInk already picks for at least 4.5:1 on every card
 * color, so the underline, the mark, and the outline-current focus ring all clear AA with it. The
 * underline means the link does not rely on color alone, and min-h-6 makes a 24px target.
 */
export const WordSearchLink = ({ phrase, word }: WordSearchLinkProps): React.ReactNode => (
  // The mark says "leaves the app" to the eye; the label says what and where in words, plus the new
  // tab, which screen readers do not announce for target="_blank" on their own. It starts with the
  // visible word (WCAG 2.5.3), is unique per word when a card shows four (2.4.4), and borrows lull's
  // "look up ... on DuckDuckGo" so the two apps say it one way. A comma, not a colon, because some
  // screen readers speak a colon aloud. It is
  // an aria-label rather than lull's sr-only span because an sr-only span is positioned out of flow,
  // and engines then join it to the word with a space ("BASS : search ...") or without one,
  // depending on the browser. The label reads the same everywhere.
  <a
    aria-label={`${word}, look up ${phrase} on DuckDuckGo (opens in a new tab)`}
    className="inline-flex min-h-6 min-w-6 items-center gap-0.5 rounded px-1 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
    href={searchUrl(phrase)}
    rel="noopener noreferrer"
    target="_blank"
  >
    {word}
    <ExternalMark size={10} />
  </a>
)
