#!/usr/bin/env node
'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const outDir = path.join(__dirname, '..', 'out')
const swPath = path.join(outDir, 'sw.js')

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const toUrl = (file) => '/' + path.relative(outDir, file).split(path.sep).map(encodeURIComponent).join('/')

// Precache the app shell plus everything it needs to boot. Both trees are versioned
// by path -- _next/static filenames carry a content hash, _next/data sits under the
// build id -- so a stale entry is impossible and the whole set can be taken in one
// addAll. The route-data payloads matter as much as the chunks: without them a
// client-side navigation to /g/<date> with no connection has nothing to read.
const assets = walk(outDir)
  .map(toUrl)
  .filter((url) => /^\/_next\/(static\/.*\.(js|css|woff2)|data\/.*\.json)$/.test(url))
  .sort()

// Every exported page, so a first offline visit to any route renders that route
// rather than falling back to the home page. '/' is listed separately because it is
// the URL the browser asks for; CloudFront resolves it to index.html at the edge and
// offline nothing does.
const shells = ['/'].concat(
  walk(outDir)
    .map(toUrl)
    .filter((url) => url.endsWith('.html'))
    .sort(),
)

// The bracketed paths are written by scripts/generate-dynamic-pages.js and are what
// public/sw.js rewrites /g/<date> onto. If they are absent the worker precaches a set
// that cannot open a single puzzle offline, so fail the build instead of shipping it.
const required = ['/g/%5BgameId%5D/index.html', '/g/%5BgameId%5D/reroll/index.html']
const missing = required.filter((url) => !shells.includes(url))
if (missing.length > 0) {
  console.error(`✗ sw.js precache is missing the game shells: ${missing.join(', ')}`)
  console.error('  Did scripts/generate-dynamic-pages.js run first?')
  process.exit(1)
}

const precache = shells.concat(assets)

// Every filename in the list is content-hashed, so hashing the list is enough to
// change the cache name on any build that changed a byte -- and to leave it alone on
// a rebuild that did not.
const version = crypto.createHash('sha1').update(precache.join('\n')).digest('hex').slice(0, 12)

const source = fs
  .readFileSync(swPath, 'utf8')
  .replace(/^var CACHE_VERSION = .*$/m, `var CACHE_VERSION = '${version}'`)
  .replace(/^var PRECACHE = .*$/m, `var PRECACHE = ${JSON.stringify(precache)}`)

fs.writeFileSync(swPath, source)

console.log(`✓ sw.js precache: ${precache.length} entries, version ${version}`)
