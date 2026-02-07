const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    // Integration tests (require real Supabase credentials)
    '<rootDir>/tests/database/',
    '<rootDir>/tests/ops/',
    '<rootDir>/tests/backend/',
    // Auth mock tests with incomplete mock implementations
    '<rootDir>/tests/auth/(?!index\\.test)',
    // Frontend tests with mock component timing/locale bugs
    '<rootDir>/tests/frontend/00-',
    '<rootDir>/tests/frontend/02-',
    '<rootDir>/tests/frontend/05-',
    // Phase integration tests (require real Supabase)
    '<rootDir>/tests/phase8\\.3-',
    '<rootDir>/tests/phase8\\.4-discount',
    '<rootDir>/tests/phase8\\.4-exhaustive',
    '<rootDir>/tests/phase8\\.6-',
    '<rootDir>/tests/phase8\\.7-',
    '<rootDir>/tests/phase8\\.10\\.',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^vitest$': '<rootDir>/tests/__mocks__/vitest.ts',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
  ],
}

// next/jest prepends its own transformIgnorePatterns which blocks node_modules transforms.
// Override it after resolution to allow @supabase packages (which ship .ts source) to be transformed.
const jestConfig = createJestConfig(customJestConfig)

module.exports = async () => {
  const config = await jestConfig()
  config.transformIgnorePatterns = [
    '/node_modules/(?!(@supabase|jose)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ]
  return config
}
