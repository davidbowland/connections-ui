import { readFileSync } from 'fs'
import { join } from 'path'

import { GAME_COLORS } from './colors'
import {
  compositeOver,
  contrastRatio,
  hexToRgb,
  oklchToRgb,
  readableInk,
  relativeLuminance,
  Rgb,
  solvedCardBackground,
  solvedCardInk,
  Theme,
} from './contrast'

const BLACK: Rgb = [0, 0, 0]
const WHITE: Rgb = [255, 255, 255]

describe('contrast', () => {
  describe('hexToRgb', () => {
    it('reads each channel', () => {
      expect(hexToRgb('#ff1d58')).toEqual([255, 29, 88])
    })

    it('reads black and white', () => {
      expect(hexToRgb('#000000')).toEqual([0, 0, 0])
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
    })
  })

  describe('compositeOver', () => {
    it('returns the ground when the ink is fully transparent', () => {
      expect(compositeOver(WHITE, 0, BLACK)).toEqual([0, 0, 0])
    })

    it('returns the ink when it is fully opaque', () => {
      expect(compositeOver(WHITE, 1, BLACK)).toEqual([255, 255, 255])
    })

    it('blends halfway at half alpha', () => {
      expect(compositeOver(WHITE, 0.5, BLACK)).toEqual([128, 128, 128])
    })
  })

  describe('relativeLuminance', () => {
    it('is 0 for black and 1 for white', () => {
      expect(relativeLuminance(BLACK)).toBeCloseTo(0, 5)
      expect(relativeLuminance(WHITE)).toBeCloseTo(1, 5)
    })

    it('uses the low-end linear segment for very dark channels', () => {
      expect(relativeLuminance([10, 10, 10])).toBeCloseTo(0.0030352, 6)
    })
  })

  describe('contrastRatio', () => {
    it('is 21 for black against white', () => {
      expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5)
    })

    it('is 1 for a color against itself', () => {
      expect(contrastRatio(BLACK, BLACK)).toBeCloseTo(1, 5)
    })

    it('does not depend on argument order', () => {
      expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(contrastRatio(WHITE, BLACK), 5)
    })
  })

  describe('readableInk', () => {
    it('picks black on a light background', () => {
      expect(readableInk(WHITE)).toBe('#000000')
    })

    it('picks white on a dark background', () => {
      expect(readableInk(BLACK)).toBe('#ffffff')
    })
  })

  describe('solvedCardInk', () => {
    it('picks black for yellow in both themes, because it composites light either way', () => {
      expect(solvedCardInk('#fff685')).toEqual({ dark: '#000000', light: '#000000' })
    })

    it('picks white for blue in dark and black in light', () => {
      expect(solvedCardInk('#0049b7')).toEqual({ dark: '#ffffff', light: '#000000' })
    })
  })

  // A floor assertion here would certify nothing. readableInk returns whichever of
  // black and white contrasts *more*, and contrast(black, c) x contrast(white, c) = 21
  // for every sRGB color, so the winner is always at least sqrt(21) = 4.583 -- above AA
  // for normal text no matter what the palette or the layer alphas become. AA on a
  // solved card is a property of the rule, proved by the readableInk cases above; what
  // can actually regress is which ink each color gets, so that is what is pinned.
  describe('every game color', () => {
    it('gets the ink the app has to paint on it, in both themes', () => {
      const inks = Object.fromEntries(GAME_COLORS.map(({ background }) => [background, solvedCardInk(background)]))

      expect(inks).toEqual({
        '#0049b7': { dark: '#ffffff', light: '#000000' },
        '#00ddff': { dark: '#000000', light: '#000000' },
        '#494d5f': { dark: '#ffffff', light: '#000000' },
        '#4caf50': { dark: '#000000', light: '#000000' },
        '#8458B3': { dark: '#ffffff', light: '#000000' },
        '#ff1d58': { dark: '#ffffff', light: '#000000' },
        '#ff6f00': { dark: '#000000', light: '#000000' },
        '#fff685': { dark: '#000000', light: '#000000' },
      })
    })

    // The tightest pair in the palette is orange in dark theme at 4.94:1. Naming the
    // real margin is the only measurement here that a palette change can fail: drop
    // below this and the card is still above AA, but it has stopped being comfortable.
    it('keeps a margin over the AA floor even at its tightest', () => {
      const themes: Theme[] = ['dark', 'light']
      const ratios = GAME_COLORS.flatMap(({ background }) =>
        themes.map((theme) => {
          const card = solvedCardBackground(background, theme)
          return contrastRatio(hexToRgb(readableInk(card)), card)
        }),
      )

      expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.9)
    })
  })
})

describe('oklchToRgb', () => {
  it('converts the HeroUI default accent to its sRGB hex', () => {
    expect(oklchToRgb(0.6204, 0.195, 253.83)).toEqual([4, 133, 247])
  })

  it('converts the corrected accent to its sRGB hex', () => {
    expect(oklchToRgb(0.5625, 0.195, 253.83)).toEqual([0, 114, 227])
  })

  it('clips channels that fall outside the sRGB gamut', () => {
    // Both directions: this magenta drives red above the gamut, this green drives
    // red and blue below it. Clipping is not what CSS does — it gamut-maps by
    // reducing chroma — so these are the helper's own answers, not a browser's.
    expect(oklchToRgb(0.99, 0.4, 0)).toEqual([255, 12, 241])
    expect(oklchToRgb(0.7, 0.4, 145)).toEqual([0, 210, 0])
  })
})

describe('the accent tokens in index.css', () => {
  // .button--primary paints --accent-foreground on --accent, and that resolves to
  // --snow = oklch(0.9911 0 0) = #fcfcfc. Measuring against pure white would
  // certify a color pair the app never renders.
  const ACCENT_FOREGROUND = oklchToRgb(0.9911, 0, 0)
  const AA_NORMAL_TEXT = 4.5

  // Comments are stripped first. A comment that quotes the token the natural way
  // — "--accent: oklch(...)" — would otherwise win the match and let someone
  // lighten the real declaration while this file stays green.
  const stylesheet = readFileSync(join(__dirname, '..', 'assets', 'css', 'index.css'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  )

  // matchAll, so a later theme override (html.dark { --accent: ... }) is checked
  // too rather than silently skipped.
  const accents = [...stylesheet.matchAll(/--accent:\s*oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)/g)].map(
    ([, lightness, chroma, hue]) => ({ chroma: Number(chroma), hue: Number(hue), lightness: Number(lightness) / 100 }),
  )
  const hoverMixes = [
    ...stylesheet.matchAll(/--accent-hover:\s*color-mix\(\s*in oklab,\s*var\(--accent\)\s+([\d.]+)%,\s*black\s/g),
  ].map(([, share]) => Number(share) / 100)

  it('declares --accent as an oklch triple', () => {
    expect(accents).not.toHaveLength(0)
  })

  it('derives --accent-hover by mixing the accent toward black, so hover is darker than rest', () => {
    expect(hoverMixes).not.toHaveLength(0)
  })

  it('clears the WCAG AA 4.5:1 floor at rest, for every accent declared', () => {
    expect(accents).not.toHaveLength(0)

    accents.forEach(({ chroma, hue, lightness }) => {
      const rest = oklchToRgb(lightness, chroma, hue)

      expect(contrastRatio(ACCENT_FOREGROUND, rest)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    })
  })

  it('clears the WCAG AA 4.5:1 floor on hover and pressed, for every accent declared', () => {
    expect(accents).not.toHaveLength(0)
    expect(hoverMixes).not.toHaveLength(0)

    // Black is the origin in oklab, so mixing the accent at share% with black
    // scales lightness and chroma by share and leaves the hue alone. Every mix is
    // checked against every accent, since either could gain a theme override.
    hoverMixes.forEach((share) =>
      accents.forEach(({ chroma, hue, lightness }) => {
        const hover = oklchToRgb(lightness * share, chroma * share, hue)

        expect(contrastRatio(ACCENT_FOREGROUND, hover)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      }),
    )
  })
})
