#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const publicDir = path.join(__dirname, '..', 'public')

// Single source of truth for the "Threaded Dots" mark geometry — reused below
// for public/icon.svg (the served, theme-reactive favicon) and every raster
// rendition. Keep this in sync with the dot colors in src/config/colors.ts.
const THREAD_PATH = 'M28,28 C50,13 50,13 72,28 C87,50 87,50 72,72 C50,87 50,87 28,72 C13,50 13,50 28,28 Z'

const dots = (r) => `
  <circle cx="28" cy="28" r="${r}" fill="#ff1d58"/>
  <circle cx="72" cy="28" r="${r}" fill="#00ddff"/>
  <circle cx="72" cy="72" r="${r}" fill="#4caf50"/>
  <circle cx="28" cy="72" r="${r}" fill="#8458B3"/>
`

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Common Threads">
  <style>
    .thread { stroke: #1a1a1f; }
    @media (prefers-color-scheme: dark) {
      .thread { stroke: #e8e8ee; }
    }
  </style>
  <path class="thread" d="${THREAD_PATH}" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  ${dots(9).trim()}
</svg>
`

// sharp's SVG rasterizer doesn't evaluate `prefers-color-scheme`, so raster
// output can't reuse the theme-reactive icon.svg above — it needs a fixed,
// opaque scene instead.
const markOnDark = (strokeWidth, dotRadius) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#060608"/>
  <path d="${THREAD_PATH}" fill="none" stroke="#e8e8ee" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
  ${dots(dotRadius)}
</svg>`

const ogImage = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#060608"/>
  <g transform="translate(480,90) scale(2.4)">
    <path d="${THREAD_PATH}" fill="none" stroke="#e8e8ee" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots(9)}
  </g>
  <text x="600" y="440" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#f4f4f6" text-anchor="middle" letter-spacing="2">Common Threads</text>
  <text x="600" y="486" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#9a9aa5" text-anchor="middle">Find the common thread. A new puzzle every day.</text>
</svg>`

async function generate() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg)

  await sharp(Buffer.from(markOnDark(10, 13)))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'))
  await sharp(Buffer.from(markOnDark(12, 14)))
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'))
  await sharp(Buffer.from(markOnDark(7, 9)))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
  await sharp(Buffer.from(ogImage)).resize(1200, 630).png().toFile(path.join(publicDir, 'og-image.png'))

  console.log('✓ Generated public/icon.svg')
  console.log('✓ Generated public/favicon-32x32.png')
  console.log('✓ Generated public/favicon-16x16.png')
  console.log('✓ Generated public/apple-touch-icon.png')
  console.log('✓ Generated public/og-image.png')
}

generate().catch((error) => {
  console.error(error)
  process.exit(1)
})
