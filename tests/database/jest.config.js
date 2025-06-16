/**
 * Jest Configuration for Database Tests
 * Specific configuration for Prima Facie database test suite
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  
  // Test timeout (increased for database operations)
  testTimeout: 30000,
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Module paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../$1',
    '^@tests/(.*)$': '<rootDir>/$1'
  },
  
  // Global variables for tests
  globals: {
    'DATABASE_URL': process.env.DATABASE_URL,
    'SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // Verbose output
  verbose: true,
  
  // Maximum concurrent tests (reduced for database tests)
  maxConcurrency: 5,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Test results processor
  testResultsProcessor: '<rootDir>/test-results-processor.js',
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/coverage/html-report',
        filename: 'database-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Prima Facie Database Tests',
        logoImgPath: undefined,
        inlineSource: false
      }
    ]
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'json',
    'ts'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|ts)$': 'babel-jest'
  },
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],
  
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/helpers/',
    '/sql/',
    'jest.config.js',
    'jest.setup.js'
  ]
};