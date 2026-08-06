export type Rgb = [number, number, number]

export type Theme = 'dark' | 'light'

// These must stay in step with src/assets/css/index.css: the page color set on
// html, and --card-bg-outer-a / --card-bg-inner-a. A solved category card paints
// its color twice at partial alpha, so the ink that reads against it depends on
// what those layers composite to, not on the color at full strength.
const SOLVED_CARD_LAYERS: Record<Theme, { ground: string; inner: number; outer: number }> = {
  dark: { ground: '#060608', inner: 0.44, outer: 0.62 },
  light: { ground: '#f4f4f6', inner: 0.24, outer: 0.38 },
}

const BLACK: Rgb = [0, 0, 0]
const WHITE: Rgb = [255, 255, 255]

export const hexToRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb

export const compositeOver = (ink: Rgb, alpha: number, ground: Rgb): Rgb =>
  ink.map((channel, index) => Math.round(alpha * channel + (1 - alpha) * ground[index])) as Rgb

export const relativeLuminance = ([red, green, blue]: Rgb): number => {
  const channel = (value: number): number => {
    const ratio = value / 255
    return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
}

export const contrastRatio = (first: Rgb, second: Rgb): number => {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].toSorted((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

export const readableInk = (background: Rgb): string =>
  contrastRatio(BLACK, background) >= contrastRatio(WHITE, background) ? '#000000' : '#ffffff'

export const solvedCardBackground = (background: string, theme: Theme): Rgb => {
  const { ground, inner, outer } = SOLVED_CARD_LAYERS[theme]
  const color = hexToRgb(background)
  return compositeOver(color, inner, compositeOver(color, outer, hexToRgb(ground)))
}

export const solvedCardInk = (background: string): Record<Theme, string> => ({
  dark: readableInk(solvedCardBackground(background, 'dark')),
  light: readableInk(solvedCardBackground(background, 'light')),
})
