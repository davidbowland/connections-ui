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

// Oklch -> linear sRGB via the LMS matrices from Björn Ottosson's Oklab, then the
// sRGB transfer function. Needed because HeroUI declares --accent in oklch and the
// contrast floor has to be checkable from a test.
const gammaEncode = (channel: number): number =>
  channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055

// Valid only for colors inside or very near the sRGB gamut. Out-of-gamut channels
// are clipped independently, whereas CSS oklch() gamut-maps by reducing chroma
// until the color fits within a deltaEOK just-noticeable difference. The two agree
// on in-gamut colors and diverge sharply outside it: oklch(0.99 0.4 0) clips to
// #ff0cf1, a vivid magenta, where a browser renders a near-white #fff4fb.
export const oklchToRgb = (lightness: number, chroma: number, hueDegrees: number): Rgb => {
  const hue = (hueDegrees * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)

  const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ].map((channel) => Math.round(Math.min(1, Math.max(0, gammaEncode(channel))) * 255)) as Rgb
}
