const { readFileSync } = require('fs')
const { join } = require('path')

const ORIGIN = 'https://connections.dbowland.com'
const CACHE = 'common-threads-dev'

// Minimal stand-ins for the two Response shapes the worker sees: one it gets back from
// fetch or the cache, and one it builds itself with `new Response(...)`.
const createResponse = (body, { status = 200 } = {}) => ({
  body,
  clone: () => createResponse(body, { status }),
  ok: status >= 200 && status < 300,
  status,
})

class FakeResponse {
  constructor(body, init = {}) {
    this.body = body
    this.headers = init.headers ?? {}
    this.status = init.status ?? 200
    this.statusText = init.statusText ?? ''
    this.ok = this.status >= 200 && this.status < 300
  }
}

// CacheStorage with just the surface public/sw.js touches. Keys are normalized to an
// absolute URL the way a real Cache does, so `caches.match('/')` and
// `cache.put(request, ...)` can find each other.
const createCacheStorage = () => {
  const stores = new Map()
  const keyOf = (key) => new URL(typeof key === 'string' ? key : key.url, ORIGIN).href
  const entriesFor = (name) => {
    const existing = stores.get(name) ?? new Map()
    stores.set(name, existing)
    return existing
  }
  const openCache = (name) => {
    const entries = entriesFor(name)
    return {
      addAll: jest.fn((urls) => {
        urls.forEach((url) => entries.set(keyOf(url), createResponse(url)))
        return Promise.resolve()
      }),
      put: jest.fn((key, response) => {
        entries.set(keyOf(key), response)
        return Promise.resolve()
      }),
    }
  }
  return {
    delete: jest.fn((name) => Promise.resolve(stores.delete(name))),
    keys: jest.fn(() => Promise.resolve([...stores.keys()])),
    match: jest.fn((key) =>
      Promise.resolve(
        [...stores.values()].map((entries) => entries.get(keyOf(key))).find((entry) => entry !== undefined),
      ),
    ),
    open: jest.fn((name) => Promise.resolve(openCache(name))),
    seed: (name, bodies) => {
      const entries = entriesFor(name)
      Object.entries(bodies).forEach(([url, body]) => entries.set(keyOf(url), createResponse(body)))
    },
    stores,
  }
}

// sw.js runs in a worker scope, so it is loaded as text and evaluated. The scope
// globals it reaches for come in as parameters, and every handler it registers is kept
// so the tests can drive real events through the real code.
const loadSw = () => {
  const source = readFileSync(join(__dirname, '..', 'public', 'sw.js'), 'utf8')
  const handlers = {}
  const caches = createCacheStorage()
  const fetchMock = jest.fn()
  const self = {
    addEventListener: (type, handler) => {
      handlers[type] = handler
    },
    clients: { claim: jest.fn(() => Promise.resolve()) },
    location: { origin: ORIGIN },
    skipWaiting: jest.fn(),
  }
  const swExports = {}
  new Function('self', 'exports', 'caches', 'fetch', 'Response', source)(
    self,
    swExports,
    caches,
    fetchMock,
    FakeResponse,
  )
  return { caches, exports: swExports, fetchMock, handlers, self }
}

// The network is down unless a test says otherwise, which is the interesting half of
// the worker. Online tests override with fetchMock.mockResolvedValueOnce.
const setup = (seeded = {}) => {
  const sw = loadSw()
  sw.caches.seed(CACHE, seeded)
  sw.fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
  return sw
}

const createFetchEvent = (url, { method = 'GET', mode = 'no-cors' } = {}) => {
  const waited = []
  const event = {
    request: { method, mode, url: new URL(url, ORIGIN).href },
    responded: undefined,
    respondWith: (promise) => {
      event.responded = promise
    },
    waited,
    // `.then` rather than a bare push: the real waitUntil throws on anything that is
    // not a promise, and a cache write that is not a promise is a cache write nobody
    // is holding the worker open for.
    waitUntil: jest.fn((promise) => {
      waited.push(promise.then((value) => value))
    }),
  }
  return event
}

const dispatchFetch = async (sw, url, init) => {
  const event = createFetchEvent(url, init)
  sw.handlers.fetch(event)
  const response = await event.responded
  await Promise.all(event.waited)
  return { event, response }
}

const dispatchLifecycle = async (sw, type) => {
  const waited = []
  sw.handlers[type]({
    waitUntil: (promise) => {
      waited.push(promise)
    },
  })
  await Promise.all(waited)
}

const cachedBody = async (sw, url) => (await sw.caches.match(url))?.body

describe('sw indexFor', () => {
  const { indexFor } = loadSw().exports

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
  const { shellFor } = loadSw().exports

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

  // CloudFront's game-route rules match a single segment after /g/, so a deeper path
  // falls through to its fourth rule and picks up index.html -- which is indexFor's
  // job here, not shellFor's.
  it('leaves a deeper game path to indexFor', () => {
    expect(shellFor('/g/2026-08-05/extra/')).toBeNull()
  })
})

describe('sw install', () => {
  it('precaches the app shell and the game route', async () => {
    const sw = setup()

    await dispatchLifecycle(sw, 'install')

    expect([...sw.caches.stores.get(CACHE).keys()]).toEqual([`${ORIGIN}/`, `${ORIGIN}/g/%5BgameId%5D/index.html`])
  })

  it('takes over from the previous worker immediately', async () => {
    const sw = setup()

    await dispatchLifecycle(sw, 'install')

    expect(sw.self.skipWaiting).toHaveBeenCalled()
  })
})

describe('sw activate', () => {
  it('deletes caches from earlier builds and keeps the current one', async () => {
    const sw = setup()
    sw.caches.seed('common-threads-older', { '/': 'stale home page' })

    await dispatchLifecycle(sw, 'activate')

    expect([...sw.caches.stores.keys()]).toEqual([CACHE])
  })

  it('claims open clients only after the stale caches are gone', async () => {
    const sw = setup()
    sw.caches.seed('common-threads-older', { '/': 'stale home page' })

    await dispatchLifecycle(sw, 'activate')

    expect(sw.caches.delete.mock.invocationCallOrder[0]).toBeLessThan(sw.self.clients.claim.mock.invocationCallOrder[0])
  })
})

describe('sw fetch', () => {
  it('leaves a non-GET request to the network', async () => {
    const sw = setup()

    const { event } = await dispatchFetch(sw, '/', { method: 'POST' })

    expect(event.responded).toBeUndefined()
  })

  it('leaves a cross-origin request to the network', async () => {
    const sw = setup()

    const { event } = await dispatchFetch(sw, 'https://api.example.com/games')

    expect(event.responded).toBeUndefined()
  })
})

describe('sw fetch of hashed assets', () => {
  it('answers from the cache without touching the network', async () => {
    const sw = setup({ '/_next/static/chunks/main-abc123.js': 'cached chunk' })

    const { response } = await dispatchFetch(sw, '/_next/static/chunks/main-abc123.js')

    expect(response.body).toBe('cached chunk')
    expect(sw.fetchMock).not.toHaveBeenCalled()
  })

  it('stores an asset the first time it is fetched', async () => {
    const sw = setup()
    sw.fetchMock.mockResolvedValueOnce(createResponse('fresh chunk'))

    const { response } = await dispatchFetch(sw, '/_next/static/chunks/main-abc123.js')

    expect(response.body).toBe('fresh chunk')
    await expect(cachedBody(sw, '/_next/static/chunks/main-abc123.js')).resolves.toBe('fresh chunk')
  })

  // Without waitUntil the browser may kill the worker the moment respondWith settles
  // and the write is simply lost.
  it('holds the worker open until the asset is written', async () => {
    const sw = setup()
    sw.fetchMock.mockResolvedValueOnce(createResponse('fresh chunk'))

    const { event } = await dispatchFetch(sw, '/_next/static/chunks/main-abc123.js')

    expect(event.waitUntil).toHaveBeenCalledTimes(1)
  })

  // A full quota rejects cache.put. The response is already on its way to the page, so
  // the only thing a rejection should produce is one lost write.
  it('still serves the response when the write fails', async () => {
    const sw = setup()
    sw.fetchMock.mockResolvedValueOnce(createResponse('fresh chunk'))
    sw.caches.open.mockRejectedValueOnce(new Error('QuotaExceededError'))

    const { response } = await dispatchFetch(sw, '/_next/static/chunks/main-abc123.js')

    expect(response.body).toBe('fresh chunk')
  })

  it('never stores an error page', async () => {
    const sw = setup()
    sw.fetchMock.mockResolvedValueOnce(createResponse('not found', { status: 404 }))

    const { response } = await dispatchFetch(sw, '/_next/static/chunks/main-abc123.js')

    expect(response.body).toBe('not found')
    await expect(cachedBody(sw, '/_next/static/chunks/main-abc123.js')).resolves.toBeUndefined()
  })
})

describe('sw fetch of documents', () => {
  it('prefers the network even when a copy is cached', async () => {
    const sw = setup({ '/privacy-policy/': 'stale page' })
    sw.fetchMock.mockResolvedValueOnce(createResponse('fresh page'))

    const { response } = await dispatchFetch(sw, '/privacy-policy/', { mode: 'navigate' })

    expect(response.body).toBe('fresh page')
  })

  it('replaces the cached copy with the network copy', async () => {
    const sw = setup({ '/privacy-policy/': 'stale page' })
    sw.fetchMock.mockResolvedValueOnce(createResponse('fresh page'))

    await dispatchFetch(sw, '/privacy-policy/', { mode: 'navigate' })

    await expect(cachedBody(sw, '/privacy-policy/')).resolves.toBe('fresh page')
  })

  it('holds the worker open until the document is written', async () => {
    const sw = setup()
    sw.fetchMock.mockResolvedValueOnce(createResponse('fresh page'))

    const { event } = await dispatchFetch(sw, '/privacy-policy/', { mode: 'navigate' })

    expect(event.waitUntil).toHaveBeenCalledTimes(1)
  })

  it('stores a game route under its placeholder shell', async () => {
    const sw = setup()
    sw.fetchMock.mockResolvedValueOnce(createResponse('game shell'))

    await dispatchFetch(sw, '/g/2026-08-05', { mode: 'navigate' })

    await expect(cachedBody(sw, '/g/%5BgameId%5D/index.html')).resolves.toBe('game shell')
  })

  it('falls back to the cached copy when the network fails', async () => {
    const sw = setup({ '/': 'home page', '/privacy-policy/': 'cached page' })

    const { response } = await dispatchFetch(sw, '/privacy-policy/', { mode: 'navigate' })

    expect(response.body).toBe('cached page')
  })

  // The precache stores /privacy-policy/index.html, because that is the file the
  // export writes; the browser asks for /privacy-policy/. Without this step the home
  // page would answer, and the puzzle board would render as the privacy policy.
  it('falls back to the exported index.html for a directory URL', async () => {
    const sw = setup({ '/': 'home page', '/privacy-policy/index.html': 'privacy page' })

    const { response } = await dispatchFetch(sw, '/privacy-policy/', { mode: 'navigate' })

    expect(response.body).toBe('privacy page')
  })

  it('falls back to the home page for a document it has never seen', async () => {
    const sw = setup({ '/': 'home page' })

    const { response } = await dispatchFetch(sw, '/some-new-route/', { mode: 'navigate' })

    expect(response.body).toBe('home page')
  })

  it('explains itself when nothing at all is cached', async () => {
    const sw = setup()

    const { response } = await dispatchFetch(sw, '/some-new-route/', { mode: 'navigate' })

    expect(response.status).toBe(503)
  })
})

describe('sw fetch of offline subresources', () => {
  // The home page is HTML. Handing it to Next's route loader resolves with 200 and an
  // HTML body, and res.json() throws SyntaxError; a plain network error would have let
  // the router fall back to a full navigation.
  it('fails route data from an uncached build rather than answering with HTML', async () => {
    const sw = setup({ '/': 'home page' })

    const { response } = await dispatchFetch(sw, '/_next/data/build-42/g/2026-08-09.json', { mode: 'cors' })

    expect(response.status).toBe(503)
  })

  it('fails an uncached asset rather than answering with HTML', async () => {
    const sw = setup({ '/': 'home page' })

    const { response } = await dispatchFetch(sw, '/site.webmanifest', { mode: 'cors' })

    expect(response.body).not.toBe('home page')
  })
})
