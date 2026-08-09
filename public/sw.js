/* eslint-disable no-undef */
'use strict'

// CACHE_VERSION and PRECACHE are rewritten by scripts/generate-sw-manifest.js at
// postbuild, so the cache name changes whenever the build does. The literals below
// are only what a dev server sees; nothing ships with them.
var CACHE_VERSION = 'dev'
var PRECACHE = ['/', '/g/%5BgameId%5D/index.html']

var CACHE_NAME = 'common-threads-' + CACHE_VERSION

// IMPORTANT: this mirrors UiUrlRewriteFunction in template.yaml. CloudFront runs
// that rewrite at the edge, and offline there is no edge -- so /g/<date> would miss
// the cache entirely without it. The exported shells are written to literal
// out/g/[gameId]/ paths by scripts/generate-dynamic-pages.js, which is why the URLs
// here carry the percent-encoded brackets. Change one and you must change the other.
function shellFor(pathname) {
  var dataMatch = pathname.match(/^(\/_next\/data\/[^/]+)\/g\/[^/]+(\/reroll)?\.json$/)
  if (dataMatch) {
    return dataMatch[1] + '/g/__placeholder__' + (dataMatch[2] || '') + '.json'
  }
  if (/^\/g\/[^/]+\/reroll\/?$/.test(pathname)) {
    return '/g/%5BgameId%5D/reroll/index.html'
  }
  if (/^\/g\/[^/]+\/?$/.test(pathname)) {
    return '/g/%5BgameId%5D/index.html'
  }
  return null
}

// The fourth rule in UiUrlRewriteFunction: a directory URL gets index.html appended.
// Only needed on the offline path -- online, the edge has already done it, and the
// response comes back keyed by the URL the browser actually asked for.
function indexFor(pathname) {
  if (pathname.slice(-1) === '/') return pathname + 'index.html'
  if (/\.[^/]+$/.test(pathname)) return null
  return pathname + '/index.html'
}

// cache.put rejects on a partial response and happily stores an error page. Storing
// a 404 for the app shell would survive the deploy that fixed it, so only a real
// answer is ever written.
function isStorable(response) {
  return Boolean(response) && response.ok && response.status !== 206
}

// Returns a promise so the caller can hand it to event.waitUntil -- a worker may be
// killed the moment respondWith settles, which would drop the write. The catch is
// load-bearing too: cache.put rejects on a full quota or an unsupported scheme, and an
// unhandled rejection in a worker is both noisy and useless. The response is already
// on its way to the page, so a lost write costs one re-fetch and nothing else.
function putInCache(key, response) {
  if (!isStorable(response)) return Promise.resolve()
  var copy = response.clone()
  return caches
    .open(CACHE_NAME)
    .then(function (cache) {
      return cache.put(key, copy)
    })
    .catch(function () {
      return undefined
    })
}

// The document wording is what a reader actually sees. A failed subresource never
// renders its body -- but a *wrong* one would, which is the whole point of the guard
// below.
function offlineResponse(noun) {
  return new Response('You are offline and this ' + noun + ' is not saved on your device.', {
    headers: { 'Content-Type': 'text/plain' },
    status: 503,
    statusText: 'Offline',
  })
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE)
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE_NAME
            })
            .map(function (key) {
              return caches.delete(key)
            }),
        )
      })
      // Inside waitUntil and after the deletion, so a page adopted by this worker
      // never sees the moment where the old caches are still around.
      .then(function () {
        return self.clients.claim()
      }),
  )
})

self.addEventListener('fetch', function (event) {
  var request = event.request
  if (request.method !== 'GET') return

  var url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  var shell = shellFor(url.pathname)

  // Everything under _next/ is content-hashed and ships immutable (see
  // scripts/copyToS3.sh), so the bytes behind a URL can never change and cache-first
  // is safe forever. The rewritten data payloads are the exception -- they resolve to
  // a shared placeholder and are handled below.
  if (url.pathname.indexOf('/_next/') === 0 && shell === null) {
    event.respondWith(
      caches.match(request).then(function (hit) {
        return (
          hit ||
          fetch(request).then(function (response) {
            event.waitUntil(putInCache(request, response))
            return response
          })
        )
      }),
    )
    return
  }

  // Everything else ships `public, no-cache`, and CloudFront invalidation on deploy
  // was deliberately reverted (9514bd2) -- so network-first. A cache-first shell
  // would pin every installed player to the build they first opened.
  event.respondWith(
    // Two-argument then, not .then().catch(): a trailing catch also swallows anything
    // the success handler throws, which would quietly answer a live request with a
    // stale cached copy and look exactly like being offline.
    fetch(request).then(
      function (response) {
        event.waitUntil(putInCache(shell || request, response))
        return response
      },
      function () {
        // In order: the exact URL (or its rewritten shell), the directory index the
        // edge would have appended, then -- for a document only -- the home page.
        // Falling straight to the home page would answer /privacy-policy/ with the
        // puzzle board.
        return caches
          .match(shell || request)
          .then(function (hit) {
            return hit || caches.match(indexFor(url.pathname) || url.pathname)
          })
          .then(function (hit) {
            if (hit) return hit
            // The home page is a last resort for a *document*. Handing its HTML to a
            // subresource is worse than failing: /_next/data/<buildId>/g/<date>.json
            // from a build this worker has not cached would resolve with 200 and an
            // HTML body, and Next's route loader would throw on res.json(). Same for
            // /site.webmanifest, the icons, robots.txt -- none of them precached.
            // Without a worker each is a clean network error; keep it that way.
            if (request.mode !== 'navigate') return offlineResponse('file')
            return caches.match('/')
          })
          .then(function (hit) {
            return hit || offlineResponse('page')
          })
      },
    ),
  )
})

// Exported for test only; harmless in a worker scope, which has no `exports`.
if (typeof exports !== 'undefined') {
  exports.indexFor = indexFor
  exports.shellFor = shellFor
}
