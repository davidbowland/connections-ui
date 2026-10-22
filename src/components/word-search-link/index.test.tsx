import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import { searchUrl, WordSearchLink } from './index'

describe('searchUrl', () => {
  it.each([
    ['rock & roll', 'rock & roll'],
    ['who’s there?', 'who’s there?'],
    ['café crème', 'café crème'],
    ['50% #1', '50% #1'],
    ['a+b=c', 'a+b=c'],
    // A lone surrogate would make encodeURIComponent throw; it arrives as U+FFFD instead.
    ['\uD800', '\uFFFD'],
    ['bass \uDC00 fish', 'bass \uFFFD fish'],
  ])('searches for %j and nothing else', (phrase, expected) => {
    const url = new URL(searchUrl(phrase))

    expect(url.searchParams.get('q')).toBe(expected)
    expect([...url.searchParams.keys()]).toEqual(['q'])
  })

  it('builds the exact DuckDuckGo address', () => {
    expect(searchUrl('rock & roll')).toBe('https://www.duckduckgo.com/?q=rock%20%26%20roll')
  })
})

describe('WordSearchLink', () => {
  it('is a link named for the word, the phrase, and the destination', () => {
    render(<WordSearchLink phrase="bass fish" word="BASS" />)

    expect(
      screen.getByRole('link', { name: 'BASS, look up bass fish on DuckDuckGo (opens in a new tab)' }),
    ).toBeInTheDocument()
  })

  it('searches for the phrase', () => {
    render(<WordSearchLink phrase="bass fish" word="BASS" />)

    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://www.duckduckgo.com/?q=bass%20fish')
  })

  it('opens in a new tab without handing the page an opener', () => {
    render(<WordSearchLink phrase="bass fish" word="BASS" />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows the word itself', () => {
    render(<WordSearchLink phrase="bass fish" word="BASS" />)

    expect(screen.getByText('BASS')).toBeVisible()
  })
})
