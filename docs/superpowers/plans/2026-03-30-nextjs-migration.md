# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate connections-ui from Gatsby 5 to Next.js 15 (Pages Router, `output: 'export'`), upgrading Node 20 → 24 and React 18 → 19, removing all Gatsby content.

**Architecture:** Next.js Pages Router with `output: 'export'` + `trailingSlash: true` generates `out/` for S3/CloudFront deployment. Dynamic game routes (`/g/[gameId]`) use a single HTML shell (`out/g/[gameId]/index.html`) served by a CloudFront Function that rewrites `/g/2024-xx-xx` → `/g/[gameId]/index.html`. Pages read the game ID from `useRouter().query.gameId` after hydration. `_app.tsx` replaces Gatsby's `wrapPageElement` pattern.

**Tech Stack:** Next.js 15, next-sitemap, React 19, Node 24, MUI v5 (unchanged), styled-components v5 (unchanged), next/jest, TypeScript 5

**Spec:** `docs/superpowers/specs/2026-03-30-nextjs-migration-design.md`

---

## File Map

**Created:**

- `next.config.js` — Next.js config (output, trailingSlash, styledComponents compiler, pageExtensions)
- `next-sitemap.config.js` — sitemap config (siteUrl)
- `src/pages/_app.tsx` — global layout wrapper (replaces gatsby-browser.tsx / gatsby-ssr.tsx)
- `src/pages/_document.tsx` — HTML shell
- `src/pages/_app.test.tsx` — smoke test for App wrapper

**Renamed:**

- `src/pages/g/[gameId].tsx` → `src/pages/g/[gameId]/index.tsx`
- `src/pages/g/[gameId].test.tsx` → `src/pages/g/[gameId]/index.test.tsx`

**Modified:**

- `package.json` — scripts, dependencies, engines
- `tsconfig.json` — jsx: preserve, moduleResolution: bundler, next plugin
- `jest.config.ts` — replaced with next/jest wrapper
- `jest.setup-test-env.js` — remove Gatsby shim, rename env var
- `src/environment.d.ts` — rename GATSBY* → NEXT_PUBLIC* env var
- `src/services/connections.ts` — rename env var
- `.env.development` — rename env var
- `.env.production` — rename env var
- `src/pages/index.tsx` + `index.test.tsx` — gatsby navigate → useRouter, Head export → next/head
- `src/pages/g/[gameId]/index.tsx` + `index.test.tsx` — params → router.query, getStaticPaths, Head → next/head
- `src/pages/g/[gameId]/reroll.tsx` + `reroll.test.tsx` — params → router.query, getStaticPaths, Head → next/head
- `src/pages/400.tsx` + `400.test.tsx` — Head export → next/head
- `src/pages/403.tsx` + `403.test.tsx` — Head export → next/head
- `src/pages/404.tsx` + `404.test.tsx` — Head export → next/head
- `src/pages/500.tsx` + `500.test.tsx` — Head export → next/head
- `src/pages/privacy-policy.tsx` + `privacy-policy.test.tsx` — Head export → next/head
- `scripts/copyToS3.sh` — cd public → cd out
- `.github/workflows/pipeline.yaml` — Node 20→24, remove NODE_ENV: production, rename step names
- `template.yaml` — add UiUrlRewriteFunction, add FunctionAssociations to CloudFront distribution

**Deleted:**

- `gatsby-config.js`, `gatsby-node.js`, `gatsby-browser.tsx`, `gatsby-ssr.tsx`
- `jest.preprocess.js`, `__mocks__/gatsby.js`

---

## Task 1: Update package.json and install dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Replace scripts block in package.json**

  Replace the entire `"scripts"` block with:

  ```json
  "scripts": {
    "build": "npm run clean && next build",
    "postbuild": "next-sitemap",
    "clean": "rm -rf .next coverage out && npm ci --legacy-peer-deps",
    "deploy": "DEVELOPMENT=true npm run build && ./scripts/deploy.sh",
    "lint": "prettier --write . && eslint --fix .",
    "prepare": "husky",
    "start": "next dev",
    "serve": "next build && npx serve out",
    "test": "jest --colors",
    "typecheck": "tsc --noEmit",
    "update": "npx update-browserslist-db@latest && ncu --doctor --target minor --upgrade && npm audit fix --audit-level=none && npm run test && npm dedupe"
  },
  ```

- [ ] **Step 2: Update engines in package.json**

  Replace:

  ```json
  "engines": {
    "node": "^20.0.0"
  },
  ```

  With:

  ```json
  "engines": {
    "node": "^24.0.0"
  },
  ```

- [ ] **Step 3: Remove Gatsby packages and unused dependencies**

  From `"dependencies"`, remove these keys entirely:
  - `"gatsby"`
  - `"gatsby-plugin-alias-imports"`
  - `"gatsby-plugin-image"`
  - `"gatsby-plugin-sharp"`
  - `"gatsby-plugin-sitemap"`
  - `"gatsby-plugin-styled-components"`
  - `"gatsby-source-filesystem"`
  - `"gatsby-transformer-sharp"`
  - `"graphql"`
  - `"@mdx-js/react"`
  - `"ts-node"`
  - `"crypto-browserify"`
  - `"stream-browserify"`

- [ ] **Step 4: Add Next.js packages to dependencies**

  In `"dependencies"`, add:

  ```json
  "next": "^15.0.0",
  "next-sitemap": "^4.2.3",
  ```

- [ ] **Step 5: Update React to v19 in dependencies**

  In `"dependencies"`, change:

  ```json
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  ```

- [ ] **Step 6: Remove Babel packages from devDependencies**

  From `"devDependencies"`, remove:
  - `"@babel/preset-typescript"`
  - `"babel-jest"`
  - `"babel-preset-gatsby"`
  - `"ts-jest"`

- [ ] **Step 7: Update type packages in devDependencies**

  In `"devDependencies"`, change:

  ```json
  "@types/node": "^24.0.0",
  "@types/react": "^19.0.0",
  "@types/react-dom": "^19.0.0",
  "react-test-renderer": "^19.0.0",
  ```

- [ ] **Step 8: Install dependencies**

  ```bash
  npm install --legacy-peer-deps
  ```

  Expected: installs successfully. You will see peer dependency warnings about `react-material-ui-carousel` not supporting React 19 — this is expected and not a blocker.

- [ ] **Step 9: Commit**

  ```bash
  git add package.json package-lock.json
  git commit -m "chore: replace gatsby with next.js, upgrade react 18→19 and node 20→24"
  ```

---

## Task 2: Update tsconfig.json

**Files:**

- Modify: `tsconfig.json`

- [ ] **Step 1: Change jsx compiler option**

  In `tsconfig.json`, change:

  ```json
  "jsx": "react-native"
  ```

  To:

  ```json
  "jsx": "preserve"
  ```

- [ ] **Step 2: Add moduleResolution and Next.js plugin**

  After the `"baseUrl": "."` line, add:

  ```json
  "moduleResolution": "bundler",
  "plugins": [{ "name": "next" }],
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add tsconfig.json
  git commit -m "chore: update tsconfig for next.js (jsx: preserve, moduleResolution: bundler)"
  ```

---

## Task 3: Replace jest.config.ts and jest.setup-test-env.js

**Files:**

- Modify: `jest.config.ts`
- Modify: `jest.setup-test-env.js`

- [ ] **Step 1: Replace jest.config.ts entirely**

  Overwrite `jest.config.ts` with:

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
      global: {
        branches: 90,
        functions: 90,
        lines: 80,
      },
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

- [ ] **Step 2: Replace jest.setup-test-env.js entirely**

  Overwrite `jest.setup-test-env.js` with:

  ```js
  // Environment variables
  process.env.NEXT_PUBLIC_CONNECTIONS_API_BASE_URL = 'http://localhost'

  window.URL.createObjectURL = jest.fn()
  ```

  Removed: `global.___loader` Gatsby shim. Renamed env var from `GATSBY_` to `NEXT_PUBLIC_`.

- [ ] **Step 3: Run the full test suite to confirm it still passes**

  ```bash
  npm test
  ```

  Expected: all tests pass. The `__mocks__/gatsby.js` file still exists so any test calling `jest.mock('gatsby')` continues to work. Coverage thresholds should be met.

  If tests fail, diagnose before continuing. Common issue: if `next/jest` is not found, verify `next` was installed in Task 1.

- [ ] **Step 4: Commit**

  ```bash
  git add jest.config.ts jest.setup-test-env.js
  git commit -m "chore: replace jest config with next/jest, remove gatsby shim from setup"
  ```

---

## Task 4: Rename environment variable

**Files:**

- Modify: `src/environment.d.ts`
- Modify: `src/services/connections.ts`
- Modify: `.env.development`
- Modify: `.env.production`

- [ ] **Step 1: Update src/environment.d.ts**

  Replace the file contents with:

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

- [ ] **Step 2: Update src/services/connections.ts**

  Change line 5 from:

  ```ts
  baseURL: process.env.GATSBY_CONNECTIONS_API_BASE_URL,
  ```

  To:

  ```ts
  baseURL: process.env.NEXT_PUBLIC_CONNECTIONS_API_BASE_URL,
  ```

- [ ] **Step 3: Update .env.development**

  Replace the file contents with:

  ```
  NEXT_PUBLIC_CONNECTIONS_API_BASE_URL=https://connections-api.bowland.link/v1
  ```

- [ ] **Step 4: Update .env.production**

  Replace the file contents with:

  ```
  NEXT_PUBLIC_CONNECTIONS_API_BASE_URL=https://connections-api.bowland.link/v1
  ```

  Note: if `.env.production` has a different URL than `.env.development`, keep the existing URL — only rename the key.

- [ ] **Step 5: Commit**

  ```bash
  git add src/environment.d.ts src/services/connections.ts .env.development .env.production
  git commit -m "chore: rename GATSBY_CONNECTIONS_API_BASE_URL to NEXT_PUBLIC_CONNECTIONS_API_BASE_URL"
  ```

---

## Task 5: Create next.config.js and next-sitemap.config.js

**Files:**

- Create: `next.config.js`
- Create: `next-sitemap.config.js`

- [ ] **Step 1: Create next.config.js**

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

  Notes:
  - `output: 'export'` generates static files in `out/` — required for S3/CloudFront deployment
  - `trailingSlash: true` generates `out/g/[gameId]/index.html` (directory structure) rather than `out/g/[gameId].html`
  - `styledComponents: true` replaces `gatsby-plugin-styled-components` via Next.js SWC compiler
  - Path aliases (`@components`, `@hooks`, etc.) are already in `tsconfig.json` and are picked up by Next.js automatically — no additional config needed
  - The webpack crypto/stream fallback from `gatsby-node.js` is intentionally omitted. If `next build` fails with "Module not found: crypto" or "stream" errors, add to `nextConfig`:
    ```js
    webpack: (config) => {
      config.resolve.fallback = { ...config.resolve.fallback, crypto: false, stream: false }
      return config
    },
    ```

- [ ] **Step 2: Create next-sitemap.config.js**

  ```js
  /** @type {import('next-sitemap').IConfig} */
  module.exports = {
    siteUrl: 'https://connections.dbowland.com',
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add next.config.js next-sitemap.config.js
  git commit -m "chore: add next.config.js and next-sitemap.config.js"
  ```

---

## Task 6: Create \_document.tsx and \_app.tsx

**Files:**

- Create: `src/pages/_document.tsx`
- Create: `src/pages/_app.tsx`
- Create: `src/pages/_app.test.tsx`

- [ ] **Step 1: Create src/pages/\_document.tsx**

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

  No tests needed — Next.js renders `_document.tsx` server-side only and it is not directly testable in jsdom.

- [ ] **Step 2: Write a failing test for \_app.tsx**

  Create `src/pages/_app.test.tsx`:

  ```tsx
  import '@testing-library/jest-dom'
  import { render, screen } from '@testing-library/react'
  import React from 'react'

  import App from './_app'

  jest.mock('@components/themed', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="themed">{children}</div>,
  }))

  const MockPage = () => <div>mock page content</div>

  describe('App', () => {
    it('renders the page component wrapped in Themed', () => {
      render(<App Component={MockPage} pageProps={{}} router={undefined as any} />)

      expect(screen.getByTestId('themed')).toBeInTheDocument()
      expect(screen.getByText('mock page content')).toBeInTheDocument()
    })
  })
  ```

- [ ] **Step 3: Run the test to confirm it fails**

  ```bash
  npx jest src/pages/_app.test.tsx --colors
  ```

  Expected: FAIL with "Cannot find module './\_app'".

- [ ] **Step 4: Create src/pages/\_app.tsx**

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

- [ ] **Step 5: Run the test to confirm it passes**

  ```bash
  npx jest src/pages/_app.test.tsx --colors
  ```

  Expected: PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/_document.tsx src/pages/_app.tsx src/pages/_app.test.tsx
  git commit -m "feat: add _document.tsx and _app.tsx (replaces gatsby-browser/gatsby-ssr)"
  ```

---

## Task 7: Migrate src/pages/index.tsx

**Files:**

- Modify: `src/pages/index.tsx`
- Modify: `src/pages/index.test.tsx`

- [ ] **Step 1: Update index.test.tsx to use next/router**

  Replace the entire contents of `src/pages/index.test.tsx` with:

  ```tsx
  import '@testing-library/jest-dom'
  import { render } from '@testing-library/react'
  import React from 'react'

  import Index from './index'

  const mockReplace = jest.fn()
  jest.mock('next/router', () => ({
    useRouter: jest.fn().mockReturnValue({ replace: mockReplace }),
  }))

  describe('Index page', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-01-15T10:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('redirects to current date game page', () => {
      render(<Index />)

      expect(mockReplace).toHaveBeenCalledWith('/g/2025-01-15')
    })

    it('renders with correct title', () => {
      render(<Index />)

      expect(document.title).toEqual('Connections | dbowland.com')
    })
  })
  ```

- [ ] **Step 2: Run the test to confirm it fails**

  ```bash
  npx jest src/pages/index.test.tsx --colors
  ```

  Expected: FAIL — the component still imports `navigate` from `'gatsby'` which is no longer installed and the test no longer sets up the gatsby mock.

- [ ] **Step 3: Replace src/pages/index.tsx**

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

- [ ] **Step 4: Run the test to confirm it passes**

  ```bash
  npx jest src/pages/index.test.tsx --colors
  ```

  Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/index.tsx src/pages/index.test.tsx
  git commit -m "feat: migrate index page to next/router and next/head"
  ```

---

## Task 8: Rename and migrate src/pages/g/[gameId]/index.tsx

**Files:**

- Rename: `src/pages/g/[gameId].tsx` → `src/pages/g/[gameId]/index.tsx`
- Rename: `src/pages/g/[gameId].test.tsx` → `src/pages/g/[gameId]/index.test.tsx`

- [ ] **Step 1: Rename both files**

  ```bash
  git mv 'src/pages/g/[gameId].tsx' 'src/pages/g/[gameId]/index.tsx'
  git mv 'src/pages/g/[gameId].test.tsx' 'src/pages/g/[gameId]/index.test.tsx'
  ```

- [ ] **Step 2: Update src/pages/g/[gameId]/index.test.tsx**

  Replace the entire contents with:

  ```tsx
  import '@testing-library/jest-dom'
  import { render } from '@testing-library/react'
  import React from 'react'

  import GamePage from './index'
  import { ConnectionsGame } from '@components/connections-game'
  import PrivacyLink from '@components/privacy-link'
  import { gameId } from '@test/__mocks__'

  jest.mock('@components/connections-game')
  jest.mock('@components/privacy-link')
  jest.mock('next/router', () => ({
    useRouter: jest.fn().mockReturnValue({ query: { gameId } }),
  }))

  describe('GamePage', () => {
    beforeAll(() => {
      jest.mocked(ConnectionsGame).mockReturnValue(<>ConnectionsGame</>)
      jest.mocked(PrivacyLink).mockReturnValue(<>PrivacyLink</>)
    })

    it('renders ConnectionsGame with gameId', () => {
      render(<GamePage />)

      expect(ConnectionsGame).toHaveBeenCalledWith({ gameId }, undefined)
    })

    it('renders PrivacyLink', () => {
      render(<GamePage />)

      expect(PrivacyLink).toHaveBeenCalledTimes(1)
    })

    it('renders with correct title', () => {
      render(<GamePage />)

      expect(document.title).toEqual('Connections')
    })
  })
  ```

- [ ] **Step 3: Run the test to confirm it fails**

  ```bash
  npx jest src/pages/g/\\[gameId\\]/index.test.tsx --colors
  ```

  Expected: FAIL — `GamePage` still uses `params` prop and `export const Head`.

- [ ] **Step 4: Replace src/pages/g/[gameId]/index.tsx**

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

- [ ] **Step 5: Run the test to confirm it passes**

  ```bash
  npx jest src/pages/g/\\[gameId\\]/index.test.tsx --colors
  ```

  Expected: PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add 'src/pages/g/[gameId]/index.tsx' 'src/pages/g/[gameId]/index.test.tsx'
  git commit -m "feat: migrate game page to next/router, next/head, and getStaticPaths"
  ```

---

## Task 9: Migrate src/pages/g/[gameId]/reroll.tsx

**Files:**

- Modify: `src/pages/g/[gameId]/reroll.tsx`
- Modify: `src/pages/g/[gameId]/reroll.test.tsx`

- [ ] **Step 1: Update reroll.test.tsx**

  Replace the entire contents of `src/pages/g/[gameId]/reroll.test.tsx` with:

  ```tsx
  import '@testing-library/jest-dom'
  import { render, screen, waitFor } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import React from 'react'

  import RerollPage from './reroll'
  import { rerollGame } from '@services/connections'
  import { gameId } from '@test/__mocks__'

  jest.mock('@services/connections')
  jest.mock('next/router', () => ({
    useRouter: jest.fn().mockReturnValue({ query: { gameId } }),
  }))

  describe('RerollPage', () => {
    beforeEach(() => {
      jest.mocked(rerollGame).mockResolvedValue('Game is being regenerated')
    })

    it('renders the page with gameId in heading', () => {
      render(<RerollPage />)

      expect(screen.getByText(`Reroll game: ${gameId}`)).toBeInTheDocument()
    })

    it('renders a password input and submit button', () => {
      render(<RerollPage />)

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reroll/i })).toBeInTheDocument()
    })

    it('disables submit button when password is empty', () => {
      render(<RerollPage />)

      expect(screen.getByRole('button', { name: /reroll/i })).toBeDisabled()
    })

    it('calls rerollGame on submit and shows success message', async () => {
      const user = userEvent.setup()
      render(<RerollPage />)

      await user.type(screen.getByLabelText(/password/i), 'my-password')
      await user.click(screen.getByRole('button', { name: /reroll/i }))

      await waitFor(() => {
        expect(rerollGame).toHaveBeenCalledWith(gameId, 'my-password')
      })
      expect(screen.getByText('Game is being regenerated')).toBeInTheDocument()
    })

    it('shows error message on failure', async () => {
      jest.mocked(rerollGame).mockRejectedValueOnce(new Error('Forbidden: wrong password'))
      const user = userEvent.setup()
      render(<RerollPage />)

      await user.type(screen.getByLabelText(/password/i), 'wrong')
      await user.click(screen.getByRole('button', { name: /reroll/i }))

      await waitFor(() => {
        expect(screen.getByText('Forbidden: wrong password')).toBeInTheDocument()
      })
    })

    it('renders with correct title', () => {
      render(<RerollPage />)

      expect(document.title).toEqual('Reroll Game')
    })
  })
  ```

- [ ] **Step 2: Run the test to confirm it fails**

  ```bash
  npx jest src/pages/g/\\[gameId\\]/reroll.test.tsx --colors
  ```

  Expected: FAIL — component still uses `params` prop.

- [ ] **Step 3: Replace src/pages/g/[gameId]/reroll.tsx**

  ```tsx
  import type { GetStaticPaths, GetStaticProps } from 'next'
  import Head from 'next/head'
  import { useRouter } from 'next/router'
  import React, { useState } from 'react'

  import Box from '@mui/material/Box'
  import Button from '@mui/material/Button'
  import CircularProgress from '@mui/material/CircularProgress'
  import Grid from '@mui/material/Grid'
  import TextField from '@mui/material/TextField'
  import Typography from '@mui/material/Typography'

  import { rerollGame } from '@services/connections'

  const RerollPage = (): React.ReactNode => {
    const { query } = useRouter()
    const gameId = query.gameId as string | undefined
    const [password, setPassword] = useState('')
    const [feedback, setFeedback] = useState<string | null>(null)
    const [isError, setIsError] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!gameId) return
      setFeedback(null)
      setIsLoading(true)

      try {
        const message = await rerollGame(gameId, password)
        setIsError(false)
        setFeedback(message)
      } catch (error: unknown) {
        setIsError(true)
        setFeedback(error instanceof Error ? error.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    if (!gameId) return null

    return (
      <>
        <Head>
          <title>Reroll Game</title>
        </Head>
        <main style={{ minHeight: '90vh' }}>
          <Grid container sx={{ padding: { sm: '50px', xs: '25px 10px' } }}>
            <Grid item sx={{ m: 'auto', maxWidth: 500, width: '100%' }}>
              <Typography sx={{ mb: 3 }} variant="h5">
                Reroll game: {gameId}
              </Typography>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  autoComplete="off"
                  disabled={isLoading}
                  fullWidth
                  label="Password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  value={password}
                />
                <Button disabled={isLoading || !password} type="submit" variant="contained">
                  {isLoading ? <CircularProgress size={24} /> : 'Reroll'}
                </Button>
              </Box>
              {feedback && (
                <Typography color={isError ? 'error' : 'success.main'} sx={{ mt: 2 }}>
                  {feedback}
                </Typography>
              )}
            </Grid>
          </Grid>
        </main>
      </>
    )
  }

  export const getStaticPaths: GetStaticPaths = () => ({ fallback: false, paths: [] })
  export const getStaticProps: GetStaticProps = () => ({ props: {} })

  export default RerollPage
  ```

- [ ] **Step 4: Run the test to confirm it passes**

  ```bash
  npx jest src/pages/g/\\[gameId\\]/reroll.test.tsx --colors
  ```

  Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add 'src/pages/g/[gameId]/reroll.tsx' 'src/pages/g/[gameId]/reroll.test.tsx'
  git commit -m "feat: migrate reroll page to next/router, next/head, and getStaticPaths"
  ```

---

## Task 10: Migrate error and static pages

**Files:**

- Modify: `src/pages/400.tsx` + `src/pages/400.test.tsx`
- Modify: `src/pages/403.tsx` + `src/pages/403.test.tsx`
- Modify: `src/pages/404.tsx` + `src/pages/404.test.tsx`
- Modify: `src/pages/500.tsx` + `src/pages/500.test.tsx`
- Modify: `src/pages/privacy-policy.tsx` + `src/pages/privacy-policy.test.tsx`

All five pages follow the same pattern: remove `export const Head`, add `import Head from 'next/head'`, move the title inside the component JSX. All five tests follow the same pattern: remove `{ Head }` from the import, render the page component, check `document.title`.

- [ ] **Step 1: Update src/pages/400.test.tsx**

  Replace the entire file:

  ```tsx
  import '@testing-library/jest-dom'
  import { render } from '@testing-library/react'
  import React from 'react'

  import BadRequest from './400'
  import ServerErrorMessage from '@components/server-error-message'

  jest.mock('@components/server-error-message')

  describe('400 error page', () => {
    beforeAll(() => {
      jest.mocked(ServerErrorMessage).mockReturnValue(<>ServerErrorMessage</>)
    })

    it('renders ServerErrorMessage', () => {
      const expectedTitle = '400: Bad Request'
      render(<BadRequest />)

      expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
      expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
    })

    it('renders with correct title', () => {
      render(<BadRequest />)

      expect(document.title).toEqual('Connections | 400: Bad Request')
    })
  })
  ```

- [ ] **Step 2: Update src/pages/400.tsx**

  Replace the entire file:

  ```tsx
  import Head from 'next/head'
  import React from 'react'

  import ServerErrorMessage from '@components/server-error-message'

  const BadRequest = (): React.ReactNode => {
    return (
      <>
        <Head>
          <title>Connections | 400: Bad Request</title>
        </Head>
        <ServerErrorMessage title="400: Bad Request">
          Your request was malformed or otherwise could not be understood by the server. Please modify your request
          before retrying.
        </ServerErrorMessage>
      </>
    )
  }

  export default BadRequest
  ```

- [ ] **Step 3: Run the 400 test to confirm it passes**

  ```bash
  npx jest src/pages/400.test.tsx --colors
  ```

  Expected: PASS.

- [ ] **Step 4: Update src/pages/403.test.tsx**

  Replace the entire file:

  ```tsx
  import '@testing-library/jest-dom'
  import { render } from '@testing-library/react'
  import React from 'react'

  import Forbidden from './403'
  import ServerErrorMessage from '@components/server-error-message'

  jest.mock('@components/server-error-message')

  describe('403 error page', () => {
    beforeAll(() => {
      jest.mocked(ServerErrorMessage).mockReturnValue(<>ServerErrorMessage</>)
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { pathname: '' },
      })
    })

    beforeEach(() => {
      window.location.pathname = '/an-invalid-page'
    })

    it('renders ServerErrorMessage', () => {
      const expectedTitle = '403: Forbidden'
      render(<Forbidden />)

      expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
      expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
    })

    it('renders nothing for session paths', () => {
      window.location.pathname = '/c/aeiou'
      render(<Forbidden />)

      expect(ServerErrorMessage).toHaveBeenCalledTimes(0)
    })

    it('renders ServerErrorMessage when the path name extends beyond sessionId', () => {
      window.location.pathname = '/c/aeiou/y'
      render(<Forbidden />)

      expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
    })

    it('renders with correct title', () => {
      render(<Forbidden />)

      expect(document.title).toEqual('Connections | 403: Forbidden')
    })
  })
  ```

- [ ] **Step 5: Update src/pages/403.tsx**

  ```tsx
  import Head from 'next/head'
  import React from 'react'

  import ServerErrorMessage from '@components/server-error-message'

  const Forbidden = (): React.ReactNode => {
    const display403 = typeof window !== 'undefined' && window.location.pathname.match(/^\/c\/[^/]+$/) === null

    if (display403) {
      return (
        <>
          <Head>
            <title>Connections | 403: Forbidden</title>
          </Head>
          <ServerErrorMessage title="403: Forbidden">
            You are not allowed to access the resource you requested. If you feel you have reached this page in error,
            please contact the webmaster.
          </ServerErrorMessage>
        </>
      )
    }
    return <></>
  }

  export default Forbidden
  ```

- [ ] **Step 6: Run the 403 test to confirm it passes**

  ```bash
  npx jest src/pages/403.test.tsx --colors
  ```

  Expected: PASS.

- [ ] **Step 7: Update src/pages/404.test.tsx**

  Replace the entire file:

  ```tsx
  import '@testing-library/jest-dom'
  import { render } from '@testing-library/react'
  import React from 'react'

  import NotFound from './404'
  import ServerErrorMessage from '@components/server-error-message'

  jest.mock('@components/server-error-message')

  describe('404 error page', () => {
    beforeAll(() => {
      jest.mocked(ServerErrorMessage).mockReturnValue(<>ServerErrorMessage</>)
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { pathname: '' },
      })
    })

    beforeEach(() => {
      window.location.pathname = '/an-invalid-page'
    })

    it('renders ServerErrorMessage', () => {
      const expectedTitle = '404: Not Found'
      render(<NotFound />)

      expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
      expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
    })

    it('renders nothing for session paths', () => {
      window.location.pathname = '/c/aeiou'
      render(<NotFound />)

      expect(ServerErrorMessage).toHaveBeenCalledTimes(0)
    })

    it('renders ServerErrorMessage when the path name extends beyond sessionId', () => {
      window.location.pathname = '/c/aeiou/y'
      render(<NotFound />)

      expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
    })

    it('renders with correct title', () => {
      render(<NotFound />)

      expect(document.title).toEqual('Connections | 404: Not Found')
    })
  })
  ```

- [ ] **Step 8: Update src/pages/404.tsx**

  ```tsx
  import Head from 'next/head'
  import React from 'react'

  import ServerErrorMessage from '@components/server-error-message'

  const NotFound = (): React.ReactNode => {
    const display404 = typeof window !== 'undefined' && window.location.pathname.match(/^\/c\/[^/]+$/) === null

    if (display404) {
      return (
        <>
          <Head>
            <title>Connections | 404: Not Found</title>
          </Head>
          <ServerErrorMessage title="404: Not Found">
            The resource you requested is unavailable. If you feel you have reached this page in error, please contact
            the webmaster.
          </ServerErrorMessage>
        </>
      )
    }
    return <></>
  }

  export default NotFound
  ```

- [ ] **Step 9: Run the 404 test to confirm it passes**

  ```bash
  npx jest src/pages/404.test.tsx --colors
  ```

  Expected: PASS.

- [ ] **Step 10: Update src/pages/500.test.tsx**

  Replace the entire file:

  ```tsx
  import '@testing-library/jest-dom'
  import { render } from '@testing-library/react'
  import React from 'react'

  import InternalServerError from './500'
  import ServerErrorMessage from '@components/server-error-message'

  jest.mock('@components/server-error-message')

  describe('500 error page', () => {
    beforeAll(() => {
      jest.mocked(ServerErrorMessage).mockReturnValue(<>ServerErrorMessage</>)
    })

    it('renders ServerErrorMessage', () => {
      const expectedTitle = '500: Internal Server Error'
      render(<InternalServerError />)

      expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
      expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
    })

    it('renders with correct title', () => {
      render(<InternalServerError />)

      expect(document.title).toEqual('Connections | 500: Internal Server Error')
    })
  })
  ```

- [ ] **Step 11: Update src/pages/500.tsx**

  ```tsx
  import Head from 'next/head'
  import React from 'react'

  import ServerErrorMessage from '@components/server-error-message'

  const InternalServerError = (): React.ReactNode => {
    return (
      <>
        <Head>
          <title>Connections | 500: Internal Server Error</title>
        </Head>
        <ServerErrorMessage title="500: Internal Server Error">
          An internal server error has occurred trying to serve your request. If you continue to experience this error,
          please contact the webmaster.
        </ServerErrorMessage>
      </>
    )
  }

  export default InternalServerError
  ```

- [ ] **Step 12: Run the 500 test to confirm it passes**

  ```bash
  npx jest src/pages/500.test.tsx --colors
  ```

  Expected: PASS.

- [ ] **Step 13: Update src/pages/privacy-policy.test.tsx**

  Replace the entire file:

  ```tsx
  import '@testing-library/jest-dom'
  import { render } from '@testing-library/react'
  import React from 'react'

  import PrivacyPage from './privacy-policy'
  import PrivacyPolicy from '@components/privacy-policy'

  jest.mock('@components/privacy-policy')

  describe('Privacy page', () => {
    beforeAll(() => {
      jest.mocked(PrivacyPolicy).mockReturnValue(<>PrivacyPolicy</>)
    })

    it('renders PrivacyPolicy', () => {
      render(<PrivacyPage />)

      expect(PrivacyPolicy).toHaveBeenCalledTimes(1)
    })

    it('renders with correct title', () => {
      render(<PrivacyPage />)

      expect(document.title).toEqual('Connections | Privacy Policy')
    })
  })
  ```

- [ ] **Step 14: Update src/pages/privacy-policy.tsx**

  ```tsx
  import Head from 'next/head'
  import React from 'react'

  import Paper from '@mui/material/Paper'

  import PrivacyPolicy from '@components/privacy-policy'

  const PrivacyPage = (): React.ReactNode => {
    return (
      <>
        <Head>
          <title>Connections | Privacy Policy</title>
        </Head>
        <main>
          <Paper elevation={3} sx={{ margin: 'auto', maxWidth: '900px' }}>
            <PrivacyPolicy />
          </Paper>
        </main>
      </>
    )
  }

  export default PrivacyPage
  ```

- [ ] **Step 15: Run the privacy-policy test to confirm it passes**

  ```bash
  npx jest src/pages/privacy-policy.test.tsx --colors
  ```

  Expected: PASS.

- [ ] **Step 16: Commit all error and static page changes**

  ```bash
  git add src/pages/400.tsx src/pages/400.test.tsx \
    src/pages/403.tsx src/pages/403.test.tsx \
    src/pages/404.tsx src/pages/404.test.tsx \
    src/pages/500.tsx src/pages/500.test.tsx \
    src/pages/privacy-policy.tsx src/pages/privacy-policy.test.tsx
  git commit -m "feat: migrate error and static pages to next/head"
  ```

---

## Task 11: Update scripts/copyToS3.sh

**Files:**

- Modify: `scripts/copyToS3.sh:13`

- [ ] **Step 1: Change output directory from public to out**

  On line 13 of `scripts/copyToS3.sh`, change:

  ```bash
  cd public
  ```

  To:

  ```bash
  cd out
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add scripts/copyToS3.sh
  git commit -m "chore: update copyToS3.sh to use out/ directory (next.js output)"
  ```

---

## Task 12: Update .github/workflows/pipeline.yaml

**Files:**

- Modify: `.github/workflows/pipeline.yaml`

- [ ] **Step 1: Update Node version in all 5 jobs**

  Change every occurrence of `node-version: 20.x` to `node-version: 24.x`. There are 5 occurrences across these jobs: `test` (line 36), `build-and-deploy-feature` (line 56), `deploy-testing` (line 104), `deploy-production` (line 153), `bump` (line 201).

- [ ] **Step 2: Remove NODE_ENV: production from the three build steps**

  In `build-and-deploy-feature` (around line 61), `deploy-testing` (around line 111), and `deploy-production` (around line 160), the build step has:

  ```yaml
  - name: Build Gatsby site
    run: npm run build
    env:
      DEVELOPMENT: true
      NODE_ENV: production
  ```

  For `build-and-deploy-feature` and `deploy-testing`, change to:

  ```yaml
  - name: Build Next.js site
    run: npm run build
    env:
      DEVELOPMENT: true
  ```

  For `deploy-production` (no `DEVELOPMENT` env var), change to:

  ```yaml
  - name: Build Next.js site
    run: npm run build
  ```

  Reason: `NODE_ENV: production` causes `npm ci` (inside `npm run clean`) to skip devDependencies. Next.js requires TypeScript, ESLint, and other devDependencies at build time.

- [ ] **Step 3: Commit**

  ```bash
  git add .github/workflows/pipeline.yaml
  git commit -m "chore: update pipeline for next.js (node 24, remove NODE_ENV: production, rename steps)"
  ```

---

## Task 13: Update template.yaml

**Files:**

- Modify: `template.yaml`

- [ ] **Step 1: Add UiUrlRewriteFunction resource**

  Add the following resource to `template.yaml` under `Resources:`, before `UiBucket:`:

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

- [ ] **Step 2: Add FunctionAssociations to DefaultCacheBehavior**

  In `UiCloudfrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior`, add after `ViewerProtocolPolicy`:

  ```yaml
  FunctionAssociations:
    - EventType: viewer-request
      FunctionARN: !GetAtt UiUrlRewriteFunction.FunctionARN
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add template.yaml
  git commit -m "feat: add CloudFront URL rewrite function for next.js static export"
  ```

---

## Task 14: Delete Gatsby files and run full test suite

**Files:**

- Delete: `gatsby-config.js`
- Delete: `gatsby-node.js`
- Delete: `gatsby-browser.tsx`
- Delete: `gatsby-ssr.tsx`
- Delete: `jest.preprocess.js`
- Delete: `__mocks__/gatsby.js`

- [ ] **Step 1: Delete Gatsby files**

  ```bash
  git rm gatsby-config.js gatsby-node.js gatsby-browser.tsx gatsby-ssr.tsx jest.preprocess.js __mocks__/gatsby.js
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npm test
  ```

  Expected: all tests pass with coverage thresholds met (branches ≥90%, functions ≥90%, lines ≥80%).

  If tests fail with "Cannot find module 'gatsby'": a file still imports from gatsby. Find it:

  ```bash
  grep -r "from 'gatsby'" src/
  ```

  Migrate that file following the same pattern as Task 7.

  If coverage thresholds fail: check which file dropped below threshold and add a test for the uncovered branch.

- [ ] **Step 3: Commit**

  ```bash
  git add -A
  git commit -m "chore: delete gatsby-config, gatsby-node, gatsby-browser, gatsby-ssr, jest.preprocess, gatsby mock"
  ```

---

## Task 15: Build verification

- [ ] **Step 1: Run next build**

  ```bash
  npm run build
  ```

  Expected: builds successfully, `out/` directory is created, `next-sitemap` runs via `postbuild`.

  If build fails with "crypto" or "stream" module errors: add to `next.config.js`:

  ```js
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, crypto: false, stream: false }
    return config
  },
  ```

  Then re-add `crypto-browserify` and `stream-browserify` to `dependencies` in `package.json` and run `npm install --legacy-peer-deps`.

- [ ] **Step 2: Verify output directory contents**

  ```bash
  ls out/
  ls 'out/g/[gameId]/'
  ```

  Expected `out/` to contain: `index.html`, `400.html`, `403.html`, `404.html`, `500.html`, `privacy-policy.html`, `sitemap.xml`, and directory `g/[gameId]/` with `index.html` and `reroll/index.html`.

- [ ] **Step 3: Smoke test with dev server**

  ```bash
  npm start
  ```

  Open `http://localhost:3000` and verify:
  - `/` redirects to `/g/[today's date]`
  - `/g/[today's date]` loads the game (shows loading spinner while fetching)
  - `/g/[today's date]/reroll` loads the reroll form
  - `/privacy-policy` loads the privacy policy page
  - Dark mode responds to system preference

  Stop the dev server with Ctrl+C.

- [ ] **Step 4: Commit any build fixes if needed**

  If build-time fixes were required (webpack fallbacks, etc.):

  ```bash
  git add -A
  git commit -m "fix: resolve next build issues"
  ```

---

## Task 16: Write docs/next-js-guide.md

**Files:**

- Create: `docs/next-js-guide.md`

- [ ] **Step 1: Create the guide**

  Create `docs/next-js-guide.md` with the following content:

  ````markdown
  # LLM Guide: Migrating a Gatsby Project to Next.js (Pages Router) + React 18 → 19

  This guide is written for an LLM agent performing a Gatsby → Next.js migration on a static site deployed to S3/CloudFront. It covers every pattern that appears in a typical Gatsby + React 18 project and how to replace each one.

  ## Prerequisites

  Before starting, read the full codebase and identify:

  1. All files that import from `gatsby` or `gatsby-plugin-*`
  2. Whether the project uses `gatsby-plugin-image` / `StaticImage` (see Image section below)
  3. Whether there are dynamic routes (`src/pages/[param].tsx`) and whether the IDs are known at build time
  4. The S3/CloudFront deploy script to find the output directory name

  ---

  ## Package Changes

  ### Remove from dependencies

  - All `gatsby` and `gatsby-plugin-*` packages
  - `graphql` (Gatsby-only)
  - `@mdx-js/react` (Gatsby MDX plugin dep — only remove if not used directly)
  - `ts-node` (Gatsby config uses it; Next.js config is plain JS)
  - `crypto-browserify`, `stream-browserify` (Gatsby webpack shims — try without first)

  ### Add to dependencies

  - `next` ^15 (React 19 compatible)
  - `next-sitemap` (replaces `gatsby-plugin-sitemap`)
  - `next-export-optimize-images` — **only if the project uses images** (replaces `gatsby-plugin-image`). See Image section below.

  ### Update versions

  - `react` → ^19, `react-dom` → ^19
  - `@types/react` → ^19, `@types/react-dom` → ^19, `@types/node` → ^24
  - `react-test-renderer` → ^19

  ### Remove from devDependencies

  - `@babel/preset-typescript`, `babel-jest`, `babel-preset-gatsby`, `ts-jest`

  ### Scripts

  ```json
  "build": "npm run clean && next build",
  "postbuild": "next-sitemap",
  "clean": "rm -rf .next coverage out && npm ci --legacy-peer-deps",
  "start": "next dev",
  "serve": "next build && npx serve out"
  ```

  Use `--legacy-peer-deps` in the clean script when any dependency hasn't declared React 19 peer dep support.

  ---

  ## Configuration Files

  ### Delete

  - `gatsby-config.js`
  - `gatsby-node.js`
  - `gatsby-browser.tsx`
  - `gatsby-ssr.tsx`
  - `jest.preprocess.js`
  - `__mocks__/gatsby.js`

  ### Create: next.config.js

  ```js
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    compiler: {
      styledComponents: true, // replaces gatsby-plugin-styled-components
    },
    output: 'export', // static site generation for S3
    pageExtensions: ['ts', 'tsx'],
    trailingSlash: true, // generates /page/index.html instead of /page.html
  }
  module.exports = nextConfig
  ```

  If the project uses images with `next-export-optimize-images`:

  ```js
  const withExportImages = require('next-export-optimize-images')
  module.exports = withExportImages(nextConfig)
  ```

  Path aliases from `gatsby-plugin-alias-imports` don't need a Next.js equivalent — Next.js reads `tsconfig.json` `paths` automatically.

  ### Create: next-sitemap.config.js

  ```js
  module.exports = { siteUrl: 'https://your-domain.com' }
  ```

  ### tsconfig.json changes

  - `"jsx": "react-native"` → `"jsx": "preserve"`
  - Add `"moduleResolution": "bundler"`
  - Add `"plugins": [{ "name": "next" }]`

  ---

  ## jest.config.ts

  Replace Gatsby/Babel jest config with next/jest:

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
      // keep your existing path alias mappings
      // keep your file mock for images/fonts
      // REMOVE: gatsby-page-utils workaround
      // REMOVE: gatsby transform ignore pattern
    },
    setupFiles: ['<rootDir>/jest.setup-test-env.js'],
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['node_modules', '\\.cache', '<rootDir>.*/out'],
    // REMOVE: transform block (next/jest handles this)
    // REMOVE: transformIgnorePatterns with gatsby exception
    // REMOVE: globals: { __PATH_PREFIX__: '' }
  }

  export default createJestConfig(config)
  ```

  ### jest.setup-test-env.js

  Remove `global.___loader` Gatsby shim. Rename any `GATSBY_*` env vars to `NEXT_PUBLIC_*`.

  ---

  ## New Files: \_app.tsx and \_document.tsx

  ### src/pages/\_app.tsx

  Replaces `gatsby-browser.tsx` / `gatsby-ssr.tsx` (`wrapPageElement`):

  ```tsx
  import type { AppProps } from 'next/app'
  import React from 'react'

  import Themed from '@components/themed'

  // or whatever your layout wrapper is

  export default function App({ Component, pageProps }: AppProps) {
    return (
      <Themed>
        <Component {...pageProps} />
      </Themed>
    )
  }
  ```

  ### src/pages/\_document.tsx

  Standard Next.js document — no customization needed unless the Gatsby project had a custom HTML template:

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

  ## Replacing Gatsby-Specific Patterns

  ### navigate (gatsby) → useRouter (next/router)

  ```tsx
  // Before
  import { navigate } from 'gatsby'
  // After
  import { useRouter } from 'next/router'

  navigate('/some/path')

  const router = useRouter()
  router.replace('/some/path') // or router.push()
  ```

  In tests, replace `jest.mock('gatsby')` with:

  ```ts
  jest.mock('next/router', () => ({
    useRouter: jest.fn().mockReturnValue({ replace: jest.fn() }),
  }))
  ```

  ### Link (gatsby) → Link (next/link)

  ```tsx
  // Before
  import { Link } from 'gatsby'
  <Link to="/path">text</Link>

  // After
  import Link from 'next/link'
  <Link href="/path">text</Link>
  ```

  ### export const Head → next/head

  ```tsx
  // Before (Gatsby Head API)
  export const Head = () => <title>My Page</title>

  // After (Next.js Pages Router)
  import Head from 'next/head'
  const MyPage = () => (
    <>
      <Head><title>My Page</title></Head>
      {/* rest of JSX */}
    </>
  )
  ```

  In tests, remove `{ Head }` from the import and render the page component directly:

  ```ts
  // Before
  import MyPage, { Head } from './my-page'
  render(<Head />)
  expect(document.title).toEqual('My Page')

  // After
  import MyPage from './my-page'
  render(<MyPage />)
  expect(document.title).toEqual('My Page')
  ```

  ### Environment variables

  Gatsby's `GATSBY_` prefix → Next.js `NEXT_PUBLIC_` prefix for client-exposed env vars:

  ```
  GATSBY_API_BASE_URL=...  →  NEXT_PUBLIC_API_BASE_URL=...
  ```

  Update in: `src/environment.d.ts`, every service/hook that reads the var, `.env.development`, `.env.production`.

  ---

  ## Dynamic Routes (IDs Unknown at Build Time)

  This is the most complex part of the migration when deploying to S3/CloudFront.

  ### The Problem

  With `output: 'export'`, Next.js requires `getStaticPaths` for any dynamic page. If you don't know the IDs at build time (e.g., game IDs, user IDs fetched at runtime), you can't enumerate them.

  ### The Solution: Single HTML Shell + CloudFront Rewrite

  1. Export `getStaticPaths` returning empty paths:

     ```tsx
     export const getStaticPaths: GetStaticPaths = () => ({ fallback: false, paths: [] })
     export const getStaticProps: GetStaticProps = () => ({ props: {} })
     ```

     Next.js generates a single shell file at `out/[param]/index.html` (with literal brackets, due to `trailingSlash: true`).

  2. Read the param from `useRouter().query` after hydration:

     ```tsx
     const { query } = useRouter()
     const id = query.param as string | undefined
     if (!id) return null  // guard during static generation
     ```

  3. Add a CloudFront Function to rewrite incoming URLs to the shell file:

     ```js
     function handler(event) {
       var request = event.request
       var uri = request.uri

       // Rewrite /items/123 → /items/[param]/index.html
       if (/^\/items\/[^\/]+(\/)?$/.test(uri)) {
         request.uri = '/items/[param]/index.html'
         return request
       }

       // Standard trailing-slash handling for other routes
       if (uri.endsWith('/')) {
         request.uri += 'index.html'
       } else if (!/\.[^/]+$/.test(uri)) {
         request.uri += '/index.html'
       }
       return request
     }
     ```

     Replace the route pattern regex and shell path to match your project's URL structure.

  4. Associate the function with the CloudFront distribution's `DefaultCacheBehavior` at `viewer-request`:
     ```yaml
     FunctionAssociations:
       - EventType: viewer-request
         FunctionARN: !GetAtt UiUrlRewriteFunction.FunctionARN
     ```

  ### File Rename Required for Nested Dynamic Routes

  Next.js cannot have both `pages/g/[id].tsx` (file) and `pages/g/[id]/` (directory) simultaneously.

  If your project has both `pages/g/[id].tsx` AND `pages/g/[id]/subpage.tsx`, rename:

  - `pages/g/[id].tsx` → `pages/g/[id]/index.tsx`
  - `pages/g/[id].test.tsx` → `pages/g/[id]/index.test.tsx`

  Update the import in the test from `'./[id]'` to `'./index'`.

  ---

  ## Images (Projects Using gatsby-plugin-image)

  > **Note:** Projects with no images can skip this section entirely.

  Add `next-export-optimize-images` to dependencies (NOT this project — connections-ui has no images):

  ```bash
  npm install next-export-optimize-images --legacy-peer-deps
  ```

  Wrap `next.config.js`:

  ```js
  const withExportImages = require('next-export-optimize-images')
  module.exports = withExportImages(nextConfig)
  ```

  Add `next-export-optimize-images` to the `postbuild` script:

  ```json
  "postbuild": "next-export-optimize-images && next-sitemap"
  ```

  Replace `gatsby-plugin-image` usage:

  ```tsx
  // Before
  import { StaticImage } from 'gatsby-plugin-image'
  <StaticImage src="../../assets/images/photo.jpg" alt="..." />

  // After
  import Image from 'next-export-optimize-images/image'
  import photo from '@assets/images/photo.jpg'
  <Image src={photo} alt="..." />
  ```

  ---

  ## CI Pipeline (GitHub Actions)

  1. Update `node-version` from `20.x` to `24.x` in all jobs.
  2. **Remove `NODE_ENV: production`** from build steps. Next.js needs devDependencies (TypeScript, ESLint) at build time. With `NODE_ENV: production`, `npm ci` skips them.
  3. Rename "Build Gatsby site" step names to "Build Next.js site".

  ---

  ## Deploy Script

  Change the output directory from `public` to `out`:

  ```bash
  # Before
  cd public
  # After
  cd out
  ```

  ---

  ## Verification Checklist

  - [ ] `npm test` passes with all coverage thresholds met
  - [ ] `next build` succeeds with no errors
  - [ ] `out/` contains all expected HTML files
  - [ ] `out/sitemap.xml` exists
  - [ ] `next dev` at `localhost:3000` — pages render correctly
  - [ ] Dynamic routes load and display data fetched at runtime
  - [ ] CloudFront Function deployed (via SAM/CDK) and rewriting dynamic URLs correctly
  - [ ] Deploy script uploads from `out/`
  ````

- [ ] **Step 2: Commit**

  ```bash
  git add docs/next-js-guide.md
  git commit -m "docs: add LLM guide for gatsby to next.js migration"
  ```
