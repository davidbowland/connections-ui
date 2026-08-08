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

  describe('every game color', () => {
    const themes: Theme[] = ['dark', 'light']
    const cases = GAME_COLORS.flatMap((color) => themes.map((theme): [string, Theme] => [color.background, theme]))

    it.each(cases)('meets WCAG AA on a solved card: %s in %s theme', (background, theme) => {
      const card = solvedCardBackground(background, theme)
      const ink = hexToRgb(readableInk(card))

      expect(contrastRatio(ink, card)).toBeGreaterThanOrEqual(4.5)
    })
  })
})

describe('oklchToRgb', () => {
  it('converts the HeroUI default accent to its sRGB hex', () => {
    expect(oklchToRgb(0.6204, 0.195, 253.83)).toEqual([4, 133, 247])
  })

  it('converts the corrected accent to its sRGB hex', () => {
    expect(oklchToRgb(0.568, 0.195, 253.83)).toEqual([0, 116, 229])
  })

  it('clamps channels that fall outside the sRGB gamut', () => {
    // Both directions: this magenta drives red above the gamut, this green drives
    // red and blue below it.
    expect(oklchToRgb(0.99, 0.4, 0)).toEqual([255, 12, 241])
    expect(oklchToRgb(0.7, 0.4, 145)).toEqual([0, 210, 0])
  })
})

describe('the --accent token', () => {
  const readAccent = (): [number, number, number] => {
    const css = readFileSync(join(__dirname, '..', 'assets', 'css', 'index.css'), 'utf8')
    const match = css.match(/--accent:\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/)
    return [Number(match![1]) / 100, Number(match![2]), Number(match![3])]
  }

  it('clears the WCAG AA 4.5:1 floor for white text', () => {
    const [lightness, chroma, hue] = readAccent()
    const ratio = contrastRatio([255, 255, 255], oklchToRgb(lightness, chroma, hue))

    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
})
