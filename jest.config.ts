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
