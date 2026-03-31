# Gatsby to Next.js Migration Design

**Date:** 2026-03-30
**Project:** connections-ui
**Goal:** Migrate from Gatsby 5 to Next.js 15 (Pages Router) with static export, upgrading Node 20 → 24 and React 18 → 19. Remove all Gatsby-related content. Preserve identical S3/CloudFront deployment.

---

## Architecture

Next.js replaces Gatsby as the build tool. `output: 'export'` with `trailingSlash: true` generates an `out/` directory of static HTML shells (replacing Gatsby's `public/`). Pages Router with `_app.tsx` replaces Gatsby's `wrapPageElement` pattern from `gatsby-browser.tsx` / `gatsby-ssr.tsx`.

### Dynamic route handling

`/g/[gameId]` and `/g/[gameId]/reroll` have game IDs unknown at build time. Solution:

1. Each dynamic page exports `getStaticPaths` returning `{ paths: [], fallback: false }` and `getStaticProps` returning `{ props: {} }`.
2. Next.js generates a single HTML shell at `out/g/[gameId]/index.html` and `out/g/[gameId]/reroll/index.html` (literal bracket directories).
3. A CloudFront Function rewrites `/g/2024-03-29` → `/g/[gameId]/index.html` before the S3 lookup. The browser URL is unchanged.
4. After client-side hydration, the page reads the actual game ID via `useRouter().query.gameId`.
5. `query.gameId` is `undefined` on first render (before hydration) — pages guard with `if (!gameId) return null`.

### File rename required

Next.js cannot have both `src/pages/g/[gameId].tsx` (file) and `src/pages/g/[gameId]/` (directory containing `reroll.tsx`) simultaneously. Rename:

- `src/pages/g/[gameId].tsx` → `src/pages/g/[gameId]/index.tsx`

---

## Package Changes

### engines

```json
"node": "^24.0.0"
```

### Scripts

```json
"build": "npm run clean && next build",
"postbuild": "next-sitemap",
"clean": "rm -rf .next coverage out && npm ci --legacy-peer-deps",
"start": "next dev",
"serve": "next build && npx serve out",
"test": "jest --colors",
"lint": "prettier --write . && eslint --fix .",
"prepare": "husky",
"typecheck": "tsc --noEmit",
"update": "npx update-browserslist-db@latest && ncu --doctor --target minor --upgrade && npm audit fix --audit-level=none && npm run test && npm dedupe"
```

`--legacy-peer-deps` is required in `clean` because `react-material-ui-carousel` has not declared React 19 peer dependency support. This will emit warnings but does not break the build or tests.

### Remove from `dependencies`

- `gatsby`, `gatsby-plugin-alias-imports`, `gatsby-plugin-image`, `gatsby-plugin-sharp`, `gatsby-plugin-sitemap`, `gatsby-plugin-styled-components`, `gatsby-source-filesystem`, `gatsby-transformer-sharp`
- `graphql` (Gatsby-only)
- `@mdx-js/react` (not used in any source file)
- `ts-node` (not needed for Next.js config)
- `crypto-browserify`, `stream-browserify` — remove initially. If `next build` fails with crypto/stream errors, re-add both and add to `next.config.js`:
  ```js
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, crypto: false, stream: false }
    return config
  }
  ```

### Add to `dependencies`

- `next` ^15
- `next-sitemap`

### Update in `dependencies`

- `react` → ^19
- `react-dom` → ^19

### Remove from `devDependencies`

- `@babel/preset-typescript`, `babel-jest`, `babel-preset-gatsby`, `ts-jest`

### Update in `devDependencies`

- `@types/react` → ^19
- `@types/react-dom` → ^19
- `@types/node` → ^24
- `react-test-renderer` → ^19

---

## File Map

### Created

- `next.config.js`
- `next-sitemap.config.js`
- `src/pages/_app.tsx`
- `src/pages/_document.tsx`

### Renamed

- `src/pages/g/[gameId].tsx` → `src/pages/g/[gameId]/index.tsx`

### Modified

- `package.json` — scripts, dependencies, engines (see above)
- `tsconfig.json` — `jsx`, `moduleResolution`
- `jest.config.ts` — replace with `next/jest` wrapper
- `jest.setup-test-env.js` — remove Gatsby shim, rename env var
- `src/environment.d.ts` — rename `GATSBY_` → `NEXT_PUBLIC_` env var
- `src/services/connections.ts` — rename env var reference
- `.env.development` — rename env var
- `.env.production` — rename env var
- `src/pages/index.tsx` — `navigate` from gatsby → `useRouter().replace()`; `export const Head` → `next/head`
- `src/pages/g/[gameId]/index.tsx` — `params` prop → `router.query`; add `getStaticPaths` + `getStaticProps`; `export const Head` → `next/head`
- `src/pages/g/[gameId]/reroll.tsx` — same as above
- `src/pages/400.tsx`, `403.tsx`, `404.tsx`, `500.tsx`, `privacy-policy.tsx` — `export const Head` → `next/head`
- All corresponding test files (see Test Changes section)
- `scripts/copyToS3.sh` — `cd public` → `cd out`
- `.github/workflows/pipeline.yaml` — Node version, `NODE_ENV`, step names (see CI section)
- `template.yaml` — add `UiUrlRewriteFunction`; add `FunctionAssociations` to distribution

### Deleted

- `gatsby-config.js`
- `gatsby-node.js`
- `gatsby-browser.tsx`
- `gatsby-ssr.tsx`
- `jest.preprocess.js`
- `__mocks__/gatsby.js`

---

## New File Contents

### next.config.js

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  output: 'export',
  pageExtensions: ['ts', 'tsx'],
  trailingSlash: true,
}

module.exports = nextConfig
```

Path aliases from the old `gatsby-config.js` are already declared in `tsconfig.json` `paths` and are picked up by Next.js automatically — no additional config needed.

### next-sitemap.config.js

```js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://connections.dbowland.com',
}
```

### src/pages/\_app.tsx

```tsx
import type { AppProps } from 'next/app'
import React from 'react'

import Themed from '@components/themed'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Themed>
      <Component {...pageProps} />
    </Themed>
  )
}
```

### src/pages/\_document.tsx

```tsx
import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

---

## Modified File Details

### tsconfig.json

Key changes:

- `"jsx": "react-native"` → `"jsx": "preserve"`
- Add `"moduleResolution": "bundler"`
- Add `"plugins": [{ "name": "next" }]`

### jest.config.ts

Replace entirely with `next/jest` wrapper:

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['.*\\.d\\.ts', 'config/*', 'types.ts'],
  coverageThreshold: {
    global: { branches: 90, functions: 90, lines: 80 },
  },
  moduleNameMapper: {
    '.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
    '.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|pdf|yaml)$':
      '<rootDir>/__mocks__/file-mock.js',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@types$': '<rootDir>/src/types',
    '@fontsource/(.*)$': '<rootDir>/__mocks__/file-mock.js',
  },
  setupFiles: ['<rootDir>/jest.setup-test-env.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['node_modules', '\\.cache', '<rootDir>.*/out'],
}

export default createJestConfig(config)
```

Removed vs old config: `gatsby-page-utils` moduleNameMapper workaround, `globals: { __PATH_PREFIX__: '' }`, `transform` block, `transformIgnorePatterns` gatsby exception.

### jest.setup-test-env.js

```js
// Environment variables
process.env.NEXT_PUBLIC_CONNECTIONS_API_BASE_URL = 'http://localhost'

window.URL.createObjectURL = jest.fn()
```

Removed: `global.___loader` Gatsby shim. Renamed env var.

### src/environment.d.ts

```ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_CONNECTIONS_API_BASE_URL: string
    }
  }
}

export {}
```

### src/services/connections.ts

Change `baseURL` line:

```ts
// Before
baseURL: process.env.GATSBY_CONNECTIONS_API_BASE_URL,
// After
baseURL: process.env.NEXT_PUBLIC_CONNECTIONS_API_BASE_URL,
```

### .env.development and .env.production

```
NEXT_PUBLIC_CONNECTIONS_API_BASE_URL=https://connections-api.bowland.link/v1
```

### src/pages/index.tsx

```tsx
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const Index = (): React.ReactNode => {
  const router = useRouter()

  useEffect(() => {
    const today = new Date()
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    router.replace(`/g/${dateString}`)
  }, [])

  return (
    <>
      <Head>
        <title>Connections | dbowland.com</title>
      </Head>
    </>
  )
}

export default Index
```

### src/pages/g/[gameId]/index.tsx

```tsx
import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import Grid from '@mui/material/Grid'

import { ConnectionsGame } from '@components/connections-game'
import PrivacyLink from '@components/privacy-link'

const GamePage = (): React.ReactNode => {
  const { query } = useRouter()
  const gameId = query.gameId as string | undefined

  if (!gameId) return null

  return (
    <>
      <Head>
        <title>Connections</title>
      </Head>
      <main style={{ minHeight: '90vh' }}>
        <Grid container sx={{ padding: { sm: '50px', xs: '25px 10px' } }}>
          <Grid item sx={{ m: 'auto', maxWidth: 1200, width: '100%' }}>
            <ConnectionsGame gameId={gameId} />
            <PrivacyLink />
          </Grid>
        </Grid>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = () => ({ fallback: false, paths: [] })
export const getStaticProps: GetStaticProps = () => ({ props: {} })

export default GamePage
```

### src/pages/g/[gameId]/reroll.tsx

Same pattern as game page: remove `params` prop and `RerollPageProps` interface, use `useRouter().query.gameId`, guard with `if (!gameId) return null`, add `getStaticPaths` + `getStaticProps`, move title into `<Head>` inside JSX.

### Error/static pages (400, 403, 404, 500, privacy-policy)

Pattern for each: add `import Head from 'next/head'`, add `<Head><title>...</title></Head>` as first child of returned JSX, delete `export const Head = () => ...` export at bottom.

---

## Test Changes

### src/pages/index.test.tsx

- Mock `next/router` instead of gatsby:
  ```ts
  jest.mock('next/router', () => ({
    useRouter: jest.fn().mockReturnValue({ replace: jest.fn() }),
  }))
  ```
- Remove `{ Head }` from import; render `<Index />` directly; check `document.title`.

### src/pages/g/[gameId]/index.test.tsx (previously [gameId].test.tsx)

- Mock `next/router`:
  ```ts
  jest.mock('next/router', () => ({
    useRouter: jest.fn().mockReturnValue({ query: { gameId: '2024-01-01' } }),
  }))
  ```
- Remove `params` prop from renders; remove `{ Head }` import; check `document.title` by rendering component.

### src/pages/g/[gameId]/reroll.test.tsx

Same pattern as game page test.

### src/pages/400/403/404/500/privacy-policy tests

Remove `{ Head }` import; render component; check `document.title`.

---

## CI Changes (.github/workflows/pipeline.yaml)

1. **Node version** — Change `node-version: 20.x` → `node-version: 24.x` in all 5 jobs: `test`, `build-and-deploy-feature`, `deploy-testing`, `deploy-production`, `bump`.

2. **Remove `NODE_ENV: production`** from the build steps in `build-and-deploy-feature`, `deploy-testing`, and `deploy-production`. With `NODE_ENV: production`, npm skips devDependencies (TypeScript, ESLint, etc.) which are required by `next build`. The `test` job's `NODE_ENV: test` is fine and stays.

3. **Rename step names** — "Build Gatsby site" → "Build Next.js site" in all three build jobs.

---

## Infrastructure Changes (template.yaml)

### Add UiUrlRewriteFunction resource

```yaml
UiUrlRewriteFunction:
  Type: AWS::CloudFront::Function
  Properties:
    AutoPublish: true
    FunctionCode: |
      function handler(event) {
        var request = event.request;
        var uri = request.uri;

        if (/^\/g\/[^\/]+\/reroll(\/)?$/.test(uri)) {
          request.uri = '/g/[gameId]/reroll/index.html';
          return request;
        }

        if (/^\/g\/[^\/]+(\/)?$/.test(uri)) {
          request.uri = '/g/[gameId]/index.html';
          return request;
        }

        if (uri.endsWith('/')) {
          request.uri += 'index.html';
        } else if (!/\.[^/]+$/.test(uri)) {
          request.uri += '/index.html';
        }

        return request;
      }
    FunctionConfig:
      Comment: !Sub
        - 'URL rewrite for ${Domain} - appends index.html and rewrites dynamic game routes'
        - Domain: !FindInMap [EnvironmentMap, !Ref Environment, domain]
      Runtime: cloudfront-js-2.0
    Name: !Sub
      - '${Environment}-connections-ui-url-rewrite'
      - Environment: !Ref Environment
```

### Add FunctionAssociations to DefaultCacheBehavior

Under `UiCloudfrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior`, add:

```yaml
FunctionAssociations:
  - EventType: viewer-request
    FunctionARN: !GetAtt UiUrlRewriteFunction.FunctionARN
```

The SAM deploy step in pipeline.yaml already runs before `copyToS3.sh`, so the function is deployed before static assets are uploaded.

---

## Post-Migration Task

After all code changes and tests pass, write `docs/next-js-guide.md` with LLM instructions for upgrading similar Gatsby → Next.js + React 18 → 19 projects (see Post-Migration section in the implementation plan).

---

## Verification Checklist

- [ ] `next build` succeeds with no errors
- [ ] `out/` contains: `index.html`, `400.html`, `403.html`, `404.html`, `500.html`, `privacy-policy.html`, `g/[gameId]/index.html`, `g/[gameId]/reroll/index.html`
- [ ] `out/sitemap.xml` generated
- [ ] All Jest tests pass with coverage thresholds met (branches ≥90%, functions ≥90%, lines ≥80%)
- [ ] `next dev` at `http://localhost:3000` redirects `/` to today's game URL
- [ ] Game loads and is playable at `/g/[today's date]`
- [ ] Reroll page loads at `/g/[today's date]/reroll`
- [ ] `copyToS3.sh` uploads from `out/` successfully
- [ ] CloudFront Function rewrites `/g/2024-xx-xx` correctly in test environment
