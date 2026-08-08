import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['.*\\.d\\.ts', 'config/*', 'types.ts', '_app.tsx', '_document.tsx'],
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
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@heroui/react$': '<rootDir>/__mocks__/@heroui/react.js',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@types$': '<rootDir>/src/types',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '@fontsource/(.*)$': '<rootDir>/__mocks__/file-mock.js',
    '^framer-motion$': '<rootDir>/__mocks__/framer-motion.js',
  },
  // clearMocks alone leaves jest.spyOn installed on the prototype for the rest of
  // the file. restoreMocks puts the original back after every test.
  restoreMocks: true,
  setupFiles: ['<rootDir>/jest.setup-test-env.js'],
  testEnvironment: 'jsdom',
  // <rootDir>/.claude/ holds agent worktrees — full checkouts of this repo. Without
  // this the suite discovers every worktree's copy of every test and reports failures
  // from whatever commit that worktree happens to sit on.
  testPathIgnorePatterns: ['node_modules', '\\.cache', '<rootDir>.*/out/', '<rootDir>/\\.claude/'],
}

export default createJestConfig(config)
