const { readFileSync } = require('fs')
const { join } = require('path')

// sw.js runs in a worker scope, so it is loaded as text and evaluated with a
// minimal stub rather than imported.
const loadSw = () => {
  const source = readFileSync(join(__dirname, '..', 'public', 'sw.js'), 'utf8')
  const scope = { addEventListener: () => undefined, caches: {}, exports: {} }
  new Function('self', 'exports', source)(scope, scope.exports)
  return scope.exports
}

describe('sw indexFor', () => {
  const { indexFor } = loadSw()

  it('appends index.html to a directory URL', () => {
    expect(indexFor('/privacy-policy/')).toBe('/privacy-policy/index.html')
  })

  it('appends a whole segment to an extensionless URL', () => {
    expect(indexFor('/privacy-policy')).toBe('/privacy-policy/index.html')
  })

  it('resolves the site root', () => {
    expect(indexFor('/')).toBe('/index.html')
  })

  it('leaves a file URL alone', () => {
    expect(indexFor('/robots.txt')).toBeNull()
  })
})

describe('sw shellFor', () => {
  const { shellFor } = loadSw()

  it('maps a game route onto the exported placeholder shell', () => {
    expect(shellFor('/g/2026-08-05/')).toBe('/g/%5BgameId%5D/index.html')
  })

  it('maps a game route without a trailing slash', () => {
    expect(shellFor('/g/2026-08-05')).toBe('/g/%5BgameId%5D/index.html')
  })

  it('maps the reroll route', () => {
    expect(shellFor('/g/2026-08-05/reroll/')).toBe('/g/%5BgameId%5D/reroll/index.html')
  })

  it('maps the reroll route without a trailing slash', () => {
    expect(shellFor('/g/2026-08-05/reroll')).toBe('/g/%5BgameId%5D/reroll/index.html')
  })

  it('maps the client-side route data payload', () => {
    expect(shellFor('/_next/data/abc123/g/2026-08-05.json')).toBe('/_next/data/abc123/g/__placeholder__.json')
  })

  it('maps the reroll route data payload', () => {
    expect(shellFor('/_next/data/abc123/g/2026-08-05/reroll.json')).toBe(
      '/_next/data/abc123/g/__placeholder__/reroll.json',
    )
  })

  it('leaves ordinary routes alone', () => {
    expect(shellFor('/privacy-policy/')).toBeNull()
    expect(shellFor('/')).toBeNull()
  })

  it('leaves hashed assets alone, so they stay cache-first', () => {
    expect(shellFor('/_next/static/chunks/main-abc123.js')).toBeNull()
  })

  it('leaves the archive route alone, because CloudFront does not rewrite deeper paths', () => {
    expect(shellFor('/g/2026-08-05/extra/')).toBeNull()
  })
})
